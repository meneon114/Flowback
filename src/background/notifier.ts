import { Task } from '../shared/types';
import { updateTaskState } from './taskRegistry';

/**
 * Plays a sweet synthesized audio alert and conditionally displays the reactive screen overlay on the active tab.
 */
export function showNotification(task: Task, needsOverlay: boolean): void {
  // If overlay is needed, transition the task state to NOTIFIED in storage
  if (needsOverlay) {
    updateTaskState(task.id, 'NOTIFIED');
  }

  chrome.storage.local.get(['flowback_sound', 'flowback_volume', 'flowback_theme'], (settings) => {
    const sound = settings.flowback_sound || 'chime';
    const volume = typeof settings.flowback_volume === 'number' ? settings.flowback_volume : 0.5;
    const theme = settings.flowback_theme || 'cyberpunk';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id !== undefined && activeTab.url) {
        const isRestricted = 
          activeTab.url.startsWith('chrome://') || 
          activeTab.url.startsWith('chrome-extension://') || 
          activeTab.url.startsWith('edge://') || 
          activeTab.url.startsWith('about:');
          
        if (!isRestricted) {
          // 1. Play chime with settings on the active tab
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: playChimeWithSettings,
            args: [sound, volume]
          }, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.warn('[Flowback SW] Sound playback injection failed:', err.message);
            }
          });

          // 2. Inject/show overlay on active tab if required
          if (needsOverlay) {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: showOverlayModal,
              args: [theme]
            }, () => {
              const err = chrome.runtime.lastError;
              if (err) {
                console.warn('[Flowback SW] Screen overlay injection failed:', err.message);
              }
            });
          }
        }
      }
    });
  });
}

/**
 * Self-contained synthesizer function executed on host pages.
 * Plays a sweet C-major arpeggio (C5 -> E5 -> G5 -> C6).
 */
function playChimeWithSettings(sound: string, volume: number) {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', localVolMultiplier = 1.0) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      const peakGain = 0.15 * volume * localVolMultiplier;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    if (sound === 'chime') {
      playTone(523.25, now, 0.45);        // C5
      playTone(659.25, now + 0.08, 0.5);   // E5
      playTone(783.99, now + 0.16, 0.55);  // G5
      playTone(1046.50, now + 0.24, 0.65); // C6
    } else if (sound === 'retro') {
      playTone(987.77, now, 0.08, 'triangle'); // B5
      playTone(1318.51, now + 0.08, 0.25, 'square', 0.5); // E6
    } else if (sound === 'bell') {
      playTone(440.0, now, 1.5, 'sine', 1.0); // A4 fundamental
      playTone(880.0, now, 1.2, 'sine', 0.5); // Overtones
      playTone(1320.0, now, 0.8, 'sine', 0.2);
    } else if (sound === 'success') {
      playTone(523.25, now, 0.6, 'sine', 0.5); // C5
      playTone(659.25, now, 0.6, 'sine', 0.5); // E5
      playTone(783.99, now, 0.6, 'sine', 0.5); // G5
      playTone(1046.50, now + 0.1, 0.8, 'sine', 0.5); // C6
    } else if (sound === 'breeze') {
      playTone(659.25, now, 0.8, 'sine', 0.5); // E5
      playTone(880.0, now + 0.15, 0.8, 'sine', 0.5); // A5
      playTone(987.77, now + 0.3, 0.8, 'sine', 0.5); // B5
      playTone(1318.51, now + 0.45, 1.0, 'sine', 0.5); // E6
    } else if (sound === 'laser') {
      // Laser sweep
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
      const peakGain = 0.12 * volume;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (sound === 'synthwave') {
      // Synthwave detuned minor 7th chord D3, A3, C4, F4
      const playDetuned = (freq: number, localVolMultiplier = 1.0) => {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq - 1.5, now);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq + 1.5, now);
        const peakGain = 0.08 * volume * localVolMultiplier;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      };
      playDetuned(146.83, 1.0);  // D3
      playDetuned(220.00, 0.8);  // A3
      playDetuned(261.63, 0.8);  // C4
      playDetuned(349.23, 0.7);  // F4
    } else if (sound === 'crystal') {
      // Digital crystal waterfall cascade
      playTone(1318.51, now, 0.35, 'sine', 0.6);        // E6
      playTone(1567.98, now + 0.08, 0.35, 'sine', 0.5); // G6
      playTone(1975.53, now + 0.16, 0.35, 'sine', 0.4); // B6
      playTone(2637.02, now + 0.24, 0.5, 'sine', 0.3);  // E7
    }
  } catch (e) {
    console.warn('[Flowback Chime] Sound playback failed:', e);
  }
}

/**
 * Self-contained overlay script executed on host pages.
 * Renders a single unified retro-minimalist list of all ready/completed tasks.
 */
function showOverlayModal(themeKey: string) {
  if (document.getElementById('flowback-overlay-host')) {
    // If the overlay is already present, just let it reactively re-render from storage changes.
    return;
  }

  const THEMES: Record<string, any> = {
    cyberpunk: { bg: '#0f0b21', text: '#e9d5ff', border: '#4c1d95', cardBg: '#150d3c', accent: '#10b981', title: '#ffffff', shadow: 'rgba(139, 92, 246, 0.35)' },
    indigo: { bg: '#0a0f1d', text: '#cbd5e1', border: '#1e3a8a', cardBg: '#111827', accent: '#06b6d4', title: '#38bdf8', shadow: 'rgba(6, 182, 212, 0.35)' },
    emerald: { bg: '#061c15', text: '#d1fae5', border: '#064e3b', cardBg: '#062f21', accent: '#10b981', title: '#6ee7b7', shadow: 'rgba(16, 185, 129, 0.35)' },
    sunset: { bg: '#1c0a10', text: '#fce7f3', border: '#881337', cardBg: '#31101d', accent: '#f59e0b', title: '#fda4af', shadow: 'rgba(244, 63, 94, 0.35)' },
    terminal: { bg: '#000000', text: '#f97316', border: '#ea580c', cardBg: '#110b06', accent: '#f97316', title: '#fdba74', shadow: 'rgba(234, 88, 12, 0.35)' },
    ocean: { bg: '#02182b', text: '#e2e8f0', border: '#004e64', cardBg: '#003547', accent: '#00b4d8', title: '#90e0ef', shadow: 'rgba(0, 180, 216, 0.35)' },
    solarized: { bg: '#fdf6e3', text: '#657b83', border: '#93a1a1', cardBg: '#eee8d5', accent: '#b58900', title: '#586e75', shadow: 'rgba(147, 161, 161, 0.35)' },
    dracula: { bg: '#282a36', text: '#f8f8f2', border: '#44475a', cardBg: '#1e1f29', accent: '#50fa7b', title: '#ff79c6', shadow: 'rgba(255, 121, 198, 0.35)' }
  };

  const t = THEMES[themeKey] || THEMES.cyberpunk;

  const host = document.createElement('div');
  host.id = 'flowback-overlay-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // CSS for minimalist retro card overlay
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

    .overlay-container {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(15, 11, 33, 0.75);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 2147483647;
      font-family: 'Space Mono', monospace;
      animation: flowbackFadeIn 0.2s ease-out;
      color: ${t.text};
    }

    .modal-card {
      width: 300px;
      padding: 24px;
      background: ${t.bg};
      border: 2px solid ${t.border};
      box-shadow: 4px 4px 0px 0px ${t.shadow};
      text-align: center;
      animation: flowbackScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0 0 16px 0;
      color: ${t.title};
      border-bottom: 1px solid ${t.border};
      padding-bottom: 8px;
    }

    .subtitle {
      font-size: 9px;
      color: ${t.accent};
      text-transform: uppercase;
      margin-bottom: 16px;
      letter-spacing: 1.5px;
      font-weight: 700;
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      max-height: 180px;
      overflow-y: auto;
    }

    .btn-link {
      display: block;
      width: 100%;
      padding: 9px 12px;
      background: ${t.cardBg};
      color: ${t.text};
      border: 1px solid ${t.border};
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: all 0.1s ease;
    }

    .btn-link:hover {
      background: ${t.accent};
      color: ${t.bg};
      border-color: ${t.accent};
    }

    .btn-dismiss-all {
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background: transparent;
      color: ${t.accent};
      border: none;
      cursor: pointer;
      text-decoration: underline;
      outline: none;
    }

    .btn-dismiss-all:hover {
      color: #f43f5e;
    }

    @keyframes flowbackFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes flowbackScaleIn {
      from { transform: scale(0.97); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'overlay-container';

  const card = document.createElement('div');
  card.className = 'modal-card';

  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = 'Flowback';
  card.appendChild(titleEl);

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'subtitle';
  subtitleEl.textContent = 'Completed Streams';
  card.appendChild(subtitleEl);

  const listContainer = document.createElement('div');
  listContainer.className = 'task-list';
  card.appendChild(listContainer);

  const dismissAllBtn = document.createElement('button');
  dismissAllBtn.className = 'btn-dismiss-all';
  dismissAllBtn.textContent = '[ Dismiss All ]';
  card.appendChild(dismissAllBtn);

  container.appendChild(card);
  shadow.appendChild(container);

  const renderTasks = (tasks: any[]) => {
    listContainer.innerHTML = '';
    
    tasks.forEach((task) => {
      const btn = document.createElement('button');
      btn.className = 'btn-link';
      btn.textContent = `• Return to ${task.platform.toUpperCase()}`;
      btn.onclick = () => {
        try {
          const p = chrome.runtime.sendMessage({ type: 'RETURN_TO_TAB', payload: { taskId: task.id } });
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      };
      listContainer.appendChild(btn);
    });
  };

  const updateTasksList = () => {
    chrome.storage.local.get(['flowback_tasks'], (result) => {
      const tasks = result.flowback_tasks || [];
      const readyTasks = tasks.filter((t: any) => t.state === 'FINISHED' || t.state === 'NOTIFIED');
      if (readyTasks.length === 0) {
        cleanupAndRemove();
        return;
      }
      renderTasks(readyTasks);
    });
  };

  dismissAllBtn.onclick = () => {
    chrome.storage.local.get(['flowback_tasks'], (result) => {
      const tasks = result.flowback_tasks || [];
      const readyTasks = tasks.filter((t: any) => t.state === 'FINISHED' || t.state === 'NOTIFIED');
      readyTasks.forEach((task: any) => {
        try {
          const p = chrome.runtime.sendMessage({ type: 'DISMISS_TASK', payload: { taskId: task.id } });
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      });
    });
  };

  const storageListener = (changes: any, areaName: string) => {
    if (areaName === 'local' && changes.flowback_tasks) {
      updateTasksList();
    }
  };

  const cleanupAndRemove = () => {
    try {
      chrome.storage.onChanged.removeListener(storageListener);
    } catch (e) {}
    host.remove();
  };

  // Register listener for reactive updates
  chrome.storage.onChanged.addListener(storageListener);

  // Initial load
  updateTasksList();
}
