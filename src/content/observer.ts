import { getAdapterForUrl } from '../core/adapterManager';
import { MessageBridge } from './bridge';
import { DOM_STABILITY_MS } from '../shared/constants';

let currentAdapter = getAdapterForUrl(window.location.href);
let isWorking = false;
let stabilityTimeout: number | null = null;
let idleCheckInterval: number | null = null;
let lastMutationTime = 0;
let lastSubmitTime = 0;

let observer: MutationObserver | null = null;
let keydownListener: ((e: KeyboardEvent) => void) | null = null;
let clickListener: ((e: MouseEvent) => void) | null = null;
let spaInterval: number | null = null;

function log(...args: any[]) {
  console.log('[Flowback Observer]', ...args);
}

/**
 * Checks if the extension context is still valid.
 */
function isContextValid(): boolean {
  try {
    // Calling chrome.runtime.getURL will throw if context is invalidated
    return !!(chrome.runtime && chrome.runtime.getURL);
  } catch (e) {
    return false;
  }
}

/**
 * Validates context and performs clean up if it has been invalidated.
 * Returns true if context is valid, false otherwise.
 */
function checkContextAndCleanup(): boolean {
  if (!isContextValid()) {
    log('Extension context invalidated. Cleaning up observer...');
    cleanup();
    return false;
  }
  return true;
}

/**
 * Disconnects observers, removes event listeners, and clears intervals/timeouts.
 */
function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener, true);
    keydownListener = null;
  }
  if (clickListener) {
    window.removeEventListener('click', clickListener, true);
    clickListener = null;
  }
  if (spaInterval) {
    clearInterval(spaInterval);
    spaInterval = null;
  }
  stopIdleCheck();
  if (stabilityTimeout) {
    clearTimeout(stabilityTimeout);
    stabilityTimeout = null;
  }
}

/**
 * Checks if the page is currently in an idle state (AI is not generating or thinking).
 */
function isGenerationActive(): boolean {
  // 1. Check for visible stop buttons
  const stopButton = document.querySelector([
    'button[aria-label*="Stop"]',
    'button[aria-label*="Cancel"]',
    'button[aria-label*="pause"]',
    'button:has(svg rect)',
    'button:has(rect)',
    '[class*="stop-button"]'
  ].join(','));
  if (stopButton) return true;

  // 2. Check for active typing indicators or streaming text
  const streamingEl = document.querySelector([
    '.typing-indicator',
    '.result-streaming',
    '[class*="typing-indicator"]',
    '[class*="result-streaming"]',
    '.streaming'
  ].join(','));
  if (streamingEl) return true;

  return false;
}

function isPageIdle(): boolean {
  if (isGenerationActive()) return false;

  // Check if the input textarea is disabled
  const textarea = document.querySelector('textarea');
  if (textarea && textarea.hasAttribute('disabled')) {
    return false;
  }

  return true;
}

function handleTaskStarted() {
  if (isWorking) return;
  isWorking = true;
  lastMutationTime = Date.now();
  log(`Task detected as STARTED on platform: ${currentAdapter.platform}`);
  
  MessageBridge.send({
    type: 'TASK_STARTED',
    payload: {
      platform: currentAdapter.platform,
      conversationId: currentAdapter.getConversationId()
    }
  });

  // Start the safety periodic check
  startIdleCheck();
}

function handleTaskFinished() {
  if (!isWorking) return;
  isWorking = false;
  log(`Task detected as FINISHED on platform: ${currentAdapter.platform}`);
  
  MessageBridge.send({
    type: 'TASK_FINISHED',
    payload: {
      platform: currentAdapter.platform,
      conversationId: currentAdapter.getConversationId()
    }
  });
  
  if (stabilityTimeout) {
    clearTimeout(stabilityTimeout);
    stabilityTimeout = null;
  }

  stopIdleCheck();
}

/**
 * Periodically checks if the page has returned to idle.
 * Acts as a fallback if mutations stop but page is still generating,
 * and handles final completion detection.
 */
function startIdleCheck() {
  if (idleCheckInterval) return;
  
  idleCheckInterval = window.setInterval(() => {
    if (!checkContextAndCleanup()) return;

    if (!isWorking) {
      stopIdleCheck();
      return;
    }
    
    const timeSinceLastMutation = Date.now() - lastMutationTime;
    const idle = isPageIdle();
    
    // We complete the task only if the page has been stable (no mutations) 
    // for the threshold AND all indicators confirm the AI is idle.
    if (timeSinceLastMutation >= DOM_STABILITY_MS && idle) {
      handleTaskFinished();
    }
  }, 1000);
}

function stopIdleCheck() {
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
    idleCheckInterval = null;
  }
}

function setupObserver() {
  const target = document.documentElement;

  observer = new MutationObserver((mutations) => {
    if (!checkContextAndCleanup()) return;

    // 1. If not working, check if a task has started
    if (!isWorking) {
      const isRunning = isGenerationActive();
      const justSubmitted = (Date.now() - lastSubmitTime) < 2000;
      
      let hasSignificantMutation = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0 || m.type === 'characterData') {
          hasSignificantMutation = true;
          break;
        }
      }

      if (isRunning || (justSubmitted && hasSignificantMutation)) {
        handleTaskStarted();
      }
      return;
    }

    // 2. If working, reset stability timer
    lastMutationTime = Date.now();
    
    if (stabilityTimeout) {
      clearTimeout(stabilityTimeout);
    }
    
    // Check if the page is currently idle immediately
    if (isPageIdle()) {
      stabilityTimeout = window.setTimeout(() => {
        if (!checkContextAndCleanup()) return;
        if (isPageIdle()) {
          handleTaskFinished();
        }
      }, DOM_STABILITY_MS);
    }
  });

  // Observe attribute changes too, to catch when "disabled" status is toggled on inputs
  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['disabled', 'class']
  });
  
  log('MutationObserver successfully attached to documentElement.');
}

function setupInputListeners() {
  // 1. Keydown listener (detect Enter key prompt submission)
  keydownListener = (e: KeyboardEvent) => {
    if (!checkContextAndCleanup()) return;

    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]') !== null)) {
      if (e.key === 'Enter' && !e.shiftKey) {
        lastSubmitTime = Date.now();
        log('Enter key submission detected');
        
        setTimeout(() => {
          if (!checkContextAndCleanup()) return;
          if (!isPageIdle()) {
            handleTaskStarted();
          }
        }, 150);
      }
    }
  };
  window.addEventListener('keydown', keydownListener, true);

  // 2. Click listener (detect Send button clicks)
  clickListener = (e: MouseEvent) => {
    if (!checkContextAndCleanup()) return;

    const target = e.target as HTMLElement;
    const btn = target.closest('button, [role="button"], input[type="submit"]');
    
    if (btn) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      const text = (btn.textContent || '').toLowerCase();
      const testId = (btn.getAttribute('data-testid') || '').toLowerCase();
      const id = (btn.getAttribute('id') || '').toLowerCase();
      const classes = (btn.getAttribute('class') || '').toLowerCase();
      const type = (btn.getAttribute('type') || '').toLowerCase();
      
      const isSubmit = 
        /send|submit|ask|prompt|generate|run/i.test(label + ' ' + text + ' ' + testId + ' ' + id + ' ' + classes) || 
        type === 'submit';
      
      if (isSubmit) {
        lastSubmitTime = Date.now();
        log('Submit button click detected');
        
        setTimeout(() => {
          if (!checkContextAndCleanup()) return;
          if (!isPageIdle()) {
            handleTaskStarted();
          }
        }, 150);
      }
    }
  };
  window.addEventListener('click', clickListener, true);
}

// Periodically check if URL changed due to SPA navigation
let lastUrl = window.location.href;
spaInterval = window.setInterval(() => {
  if (!checkContextAndCleanup()) return;

  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    currentAdapter = getAdapterForUrl(lastUrl);
    log(`SPA Navigated. Active adapter: ${currentAdapter.platform}`);
  }
}, 1000);

// Listen for task start/finish events from the background script
try {
  chrome.runtime.onMessage.addListener((message) => {
    if (!checkContextAndCleanup()) return;

    if (message.type === 'BACKGROUND_TASK_STARTED') {
      log('Task started event received from background script');
      handleTaskStarted();
    } else if (message.type === 'BACKGROUND_TASK_FINISHED') {
      log('Task finished event received from background script');
      handleTaskFinished();
    }
  });
} catch (e) {
  // Ignore listener registration errors if context invalidated
}

function init() {
  if (!checkContextAndCleanup()) return;

  chrome.storage.local.get(['flowback_enabled'], (result) => {
    if (!checkContextAndCleanup()) return;

    const enabled = result.flowback_enabled !== false;
    if (enabled) {
      log('Initializing Flowback Content Observer...');
      if (!observer) {
        setupObserver();
        setupInputListeners();
      }

      // If page loaded while a task is already running, check with background script and resume tracking
      setTimeout(() => {
        if (!checkContextAndCleanup()) return;
        chrome.storage.local.get(['flowback_enabled'], (res2) => {
          if (!checkContextAndCleanup()) return;
          if (res2.flowback_enabled !== false) {
            MessageBridge.send({ type: 'CHECK_ACTIVE_TASK' }).then((res) => {
              if (!checkContextAndCleanup()) return;
              if (res && res.hasActiveTask) {
                log('Task was already running on this tab, resuming tracking...');
                handleTaskStarted();
              }
            });
          }
        });
      }, 1000);
    } else {
      log('Flowback is disabled. Standby mode.');
    }
  });
}

// Watch for toggle state changes
try {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (!checkContextAndCleanup()) return;

    if (areaName === 'local' && changes.flowback_enabled) {
      const enabled = changes.flowback_enabled.newValue !== false;
      if (enabled) {
        if (!observer) {
          log('Extension enabled. Starting observer...');
          setupObserver();
          setupInputListeners();
          
          MessageBridge.send({ type: 'CHECK_ACTIVE_TASK' }).then((res) => {
            if (!checkContextAndCleanup()) return;
            if (res && res.hasActiveTask) {
              handleTaskStarted();
            }
          });
        }
      } else {
        log('Extension disabled. Stopping observer...');
        cleanup();
      }
    }
  });
} catch (e) {
  // Ignore listener registration errors if context invalidated
}

init();
