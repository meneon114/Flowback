import { Task, ExtensionMessage, TaskState } from '../shared/types';
import { getTasks, addTask, completeTask, updateTaskState, dismissTask, clearTasks, saveTasks } from './taskRegistry';
import { showNotification } from './notifier';
import { shouldNotifyUser } from '../core/attentionEngine';

/**
 * Updates the extension badge showing count of completed tasks waiting for attention.
 */
async function updateBadge(): Promise<void> {
  try {
    const enabledResult = await new Promise<any>((resolve) => {
      chrome.storage.local.get(['flowback_enabled'], (result) => resolve(result));
    });
    if (enabledResult.flowback_enabled === false) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    const tasks = await getTasks();
    const pendingCount = tasks.filter((t) => t.state === 'FINISHED' || t.state === 'NOTIFIED').length;
    
    if (pendingCount > 0) {
      chrome.action.setBadgeText({ text: pendingCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6' }); // Brand purple
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('[Flowback SW] Error updating badge:', err);
  }
}

/**
 * Broadcasts task list updates to any active popup/extension views.
 */
async function broadcastTasks(tasksList?: Task[]): Promise<void> {
  try {
    const tasks = tasksList || await getTasks();
    const p = chrome.runtime.sendMessage({ type: 'TASKS_UPDATED', payload: tasks });
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Ignore errors if popup is closed
      });
    }
  } catch (err) {
    console.error('[Flowback SW] Broadcast failed:', err);
  }
}

// Set up runtime listeners
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'CHECK_ACTIVE_TASK') {
    if (tabId !== undefined) {
      getTasks().then((tasks) => {
        const hasActiveTask = tasks.some(t => t.tabId === tabId && t.state === 'WORKING');
        sendResponse({ hasActiveTask });
      });
    } else {
      sendResponse({ hasActiveTask: false });
    }
    return true; // Keep channel open for async response
  }

  if (message.type === 'TASK_STARTED') {
    if (tabId !== undefined) {
      addTask(tabId, message.payload.platform).then(async (task) => {
        console.log('[Flowback SW] Task registered:', task.id);
        await updateBadge();
        await broadcastTasks();
        sendResponse({ success: true, taskId: task.id });
      });
    }
    return true; // Keep channel open for async response
  }

  if (message.type === 'TASK_FINISHED') {
    if (tabId !== undefined) {
      completeTask(tabId, message.payload.platform).then(async (task) => {
        if (task) {
          console.log('[Flowback SW] Task finished:', task.id);
          
          // Decide if user needs notification (Attention Engine check)
          const needsNotify = await shouldNotifyUser(task.tabId, task.notified);
          if (needsNotify) {
            showNotification(task, true);
          } else {
            // Already viewing tab, transition directly to USER_RETURNED
            await updateTaskState(task.id, 'USER_RETURNED');
          }
          
          await updateBadge();
          await broadcastTasks();
        }
        sendResponse({ success: true });
      });
    }
    return true;
  }

  if (message.type === 'GET_TASKS') {
    getTasks().then((tasks) => {
      sendResponse(tasks);
    });
    return true;
  }

  if (message.type === 'CLEAR_TASKS') {
    clearTasks().then(async () => {
      await updateBadge();
      await broadcastTasks();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'DISMISS_TASK') {
    dismissTask(message.payload.taskId).then(async () => {
      await updateBadge();
      await broadcastTasks();
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'RETURN_TO_TAB') {
    getTasks().then((tasks) => {
      const task = tasks.find((t) => t.id === message.payload.taskId);
      if (task) {
        chrome.tabs.update(task.tabId, { active: true }, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            console.warn(`[Flowback SW] Tab ${task.tabId} not found.`);
            return;
          }
          chrome.windows.update(tab.windowId, { focused: true });
        });
        updateTaskState(task.id, 'USER_RETURNED').then(async () => {
          await updateBadge();
          await broadcastTasks();
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  }
});

// Watch tab activation to detect manual return
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tasks = await getTasks();
  let changed = false;
  
  const updatedTasks = tasks.map((t) => {
    // If user returns to tab that has a completed/notified task, transition state
    if (t.tabId === activeInfo.tabId && (t.state === 'FINISHED' || t.state === 'NOTIFIED')) {
      changed = true;
      return { ...t, state: 'USER_RETURNED' as TaskState };
    }
    return t;
  });
  
  if (changed) {
    await saveTasks(updatedTasks);
    await updateBadge();
    await broadcastTasks(updatedTasks);
  }
});

// Watch window focus to check active tab return
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  
  chrome.tabs.query({ active: true, windowId }, async (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || activeTab.id === undefined) return;
    
    const tasks = await getTasks();
    let changed = false;
    
    const updatedTasks = tasks.map((t) => {
      if (t.tabId === activeTab.id && (t.state === 'FINISHED' || t.state === 'NOTIFIED')) {
        changed = true;
        return { ...t, state: 'USER_RETURNED' as TaskState };
      }
      return t;
    });
    
    if (changed) {
      await saveTasks(updatedTasks);
      await updateBadge();
      await broadcastTasks(updatedTasks);
    }
  });
});

// Archive tasks when their tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tasks = await getTasks();
  let changed = false;
  
  const updatedTasks = tasks.map((t) => {
    if (t.tabId === tabId && t.state !== 'ARCHIVED') {
      changed = true;
      return { ...t, state: 'ARCHIVED' as TaskState };
    }
    return t;
  });
  
  if (changed) {
    await saveTasks(updatedTasks);
    await updateBadge();
    await broadcastTasks(updatedTasks);
  }
});

// On extension startup, initialize badge
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Flowback SW] Installed.');
  await updateBadge();
});

// Watch for toggle state changes
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.flowback_enabled) {
    const enabled = changes.flowback_enabled.newValue !== false;
    if (!enabled) {
      // Clear badge, clear active network requests, and clear active tasks
      chrome.action.setBadgeText({ text: '' });
      await saveActiveRequests({});
      await clearTasks();
      await broadcastTasks();
    } else {
      await updateBadge();
    }
  }
});

// --- Network Graph Request Monitoring ---

interface ActiveRequest {
  taskId: string;
  tabId: number;
  platform: string;
  url: string;
}

// Storage-backed request persistence to survive service worker shutdowns
async function getActiveRequests(): Promise<Record<string, ActiveRequest>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['active_requests'], (result) => {
      resolve(result.active_requests || {});
    });
  });
}

async function saveActiveRequests(requests: Record<string, ActiveRequest>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ active_requests: requests }, () => {
      resolve();
    });
  });
}

function getPlatformFromUrl(url: string): string | null {
  if (url.includes('gemini.google.com') && (url.includes('BardFrontendService') || url.includes('StreamGenerate'))) {
    return 'Gemini';
  }
  if (url.includes('claude.ai/api') && url.includes('completion')) {
    return 'Claude';
  }
  if (url.includes('perplexity.ai/api/answer') || url.includes('perplexity.ai/api/query')) {
    return 'Perplexity';
  }
  if (url.includes('grok.com') && (url.includes('responses') || url.includes('conversation'))) {
    return 'Grok';
  }
  return null;
}

// Intercept starting streaming network calls
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId === -1) return; // Ignore non-tab requests
    if (details.method !== 'POST') return; // Generation calls are always POST

    const platform = getPlatformFromUrl(details.url);
    if (!platform) return;

    chrome.storage.local.get(['flowback_enabled'], (result) => {
      const enabled = result.flowback_enabled !== false;
      if (!enabled) return;

      console.log(`[Flowback SW Network] Generation request started on tab ${details.tabId}. Request ID: ${details.requestId}`);

      // Register task as WORKING
      addTask(details.tabId, platform).then(async (task) => {
        const requests = await getActiveRequests();
        requests[details.requestId] = {
          taskId: task.id,
          tabId: details.tabId,
          platform,
          url: details.url
        };
        await saveActiveRequests(requests);
        await updateBadge();
        await broadcastTasks();

        // Notify content script to synchronize state
        chrome.tabs.sendMessage(details.tabId, { type: 'BACKGROUND_TASK_STARTED', payload: { platform } }, () => {
          if (chrome.runtime.lastError) {
            // Ignore error
          }
        });
      });
    });
  },
  { urls: ["<all_urls>"] }
);

// Intercept successful completion of streaming network calls
chrome.webRequest.onCompleted.addListener(
  (details) => {
    handleRequestEnd(details.requestId);
  },
  { urls: ["<all_urls>"] }
);

// Intercept failed/cancelled completion of streaming network calls
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    handleRequestEnd(details.requestId);
  },
  { urls: ["<all_urls>"] }
);

async function handleRequestEnd(requestId: string) {
  const requests = await getActiveRequests();
  const req = requests[requestId];
  if (!req) return;

  delete requests[requestId];
  await saveActiveRequests(requests);
  
  console.log(`[Flowback SW Network] Request ended for ${req.platform} on tab ${req.tabId}`);

  // Complete the corresponding task in our registry
  const task = await completeTask(req.tabId, req.platform);
  if (task) {
    console.log('[Flowback SW] Task completed via Network event:', task.id);

    // Attention check: notify only if they are on another tab/window
    const needsNotify = await shouldNotifyUser(task.tabId, task.notified);
    if (needsNotify) {
      showNotification(task, true);
    } else {
      // User is looking at the tab, mark resolved directly
      await updateTaskState(task.id, 'USER_RETURNED');
    }

    await updateBadge();
    await broadcastTasks();

    // Notify content script to synchronize state
    chrome.tabs.sendMessage(req.tabId, { type: 'BACKGROUND_TASK_FINISHED', payload: { platform: req.platform } }, () => {
      if (chrome.runtime.lastError) {
        // Ignore error
      }
    });
  }
}

