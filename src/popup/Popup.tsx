import { useState, useEffect } from 'react';
import { Task } from '../shared/types';
import { Settings, Eye } from 'lucide-react';

interface ThemeColors {
  name: string;
  bg: string;
  text: string;
  border: string;
  cardBg: string;
  accent: string;
  accentHover: string;
  titleColor: string;
  muted: string;
  shadow: string;
}

const THEMES: Record<string, ThemeColors> = {
  cyberpunk: {
    name: 'Cyberpunk (Default)',
    bg: '#0f0b21',
    text: '#e9d5ff',
    border: '#4c1d95',
    cardBg: '#150d3c',
    accent: '#10b981',
    accentHover: '#34d399',
    titleColor: '#ffffff',
    muted: '#64748b',
    shadow: '#8b5cf6'
  },
  indigo: {
    name: 'Midnight Indigo',
    bg: '#0a0f1d',
    text: '#cbd5e1',
    border: '#1e3a8a',
    cardBg: '#111827',
    accent: '#06b6d4',
    accentHover: '#22d3ee',
    titleColor: '#38bdf8',
    muted: '#64748b',
    shadow: '#0284c7'
  },
  emerald: {
    name: 'Emerald Forest',
    bg: '#061c15',
    text: '#d1fae5',
    border: '#064e3b',
    cardBg: '#062f21',
    accent: '#10b981',
    accentHover: '#34d399',
    titleColor: '#6ee7b7',
    muted: '#4b5563',
    shadow: '#059669'
  },
  sunset: {
    name: 'Sunset Rose',
    bg: '#1c0a10',
    text: '#fce7f3',
    border: '#881337',
    cardBg: '#31101d',
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    titleColor: '#fda4af',
    muted: '#be123c',
    shadow: '#f43f5e'
  },
  terminal: {
    name: 'Retro Terminal',
    bg: '#000000',
    text: '#f97316',
    border: '#ea580c',
    cardBg: '#110b06',
    accent: '#f97316',
    accentHover: '#fb923c',
    titleColor: '#fdba74',
    muted: '#ea580c',
    shadow: '#ea580c'
  },
  ocean: {
    name: 'Ocean Deep',
    bg: '#02182b',
    text: '#e2e8f0',
    border: '#004e64',
    cardBg: '#003547',
    accent: '#00b4d8',
    accentHover: '#90e0ef',
    titleColor: '#90e0ef',
    muted: '#457b9d',
    shadow: '#0077b6'
  },
  solarized: {
    name: 'Solarized Light',
    bg: '#fdf6e3',
    text: '#657b83',
    border: '#93a1a1',
    cardBg: '#eee8d5',
    accent: '#b58900',
    accentHover: '#cb4b16',
    titleColor: '#586e75',
    muted: '#93a1a1',
    shadow: '#586e75'
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    text: '#f8f8f2',
    border: '#44475a',
    cardBg: '#1e1f29',
    accent: '#50fa7b',
    accentHover: '#8be9fd',
    titleColor: '#ff79c6',
    muted: '#6272a4',
    shadow: '#bd93f9'
  }
};

export default function Popup() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  
  // Custom Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('cyberpunk');
  const [sound, setSound] = useState<string>('chime');
  const [volume, setVolume] = useState<number>(0.5);

  // Fetch initial state & tasks
  useEffect(() => {
    chrome.storage.local.get(
      ['flowback_enabled', 'flowback_theme', 'flowback_sound', 'flowback_volume'], 
      (result) => {
        setEnabled(result.flowback_enabled !== false);
        if (result.flowback_theme && THEMES[result.flowback_theme]) {
          setTheme(result.flowback_theme);
        }
        if (result.flowback_sound) {
          setSound(result.flowback_sound);
        }
        if (typeof result.flowback_volume === 'number') {
          setVolume(result.flowback_volume);
        }
      }
    );

    chrome.runtime.sendMessage({ type: 'GET_TASKS' }, (response: Task[]) => {
      if (chrome.runtime.lastError) {
        console.warn('Could not fetch initial tasks:', chrome.runtime.lastError.message);
      } else if (response) {
        setTasks(response);
      }
    });

    // Listen for runtime updates
    const listener = (message: any) => {
      if (message.type === 'TASKS_UPDATED' && message.payload) {
        setTasks(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleReturn = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'RETURN_TO_TAB', payload: { taskId } });
  };

  const handleDismiss = (taskId: string) => {
    chrome.runtime.sendMessage({ type: 'DISMISS_TASK', payload: { taskId } });
  };

  const handleClearAll = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_TASKS' });
  };

  const toggleEnabled = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    chrome.storage.local.set({ flowback_enabled: nextState });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    chrome.storage.local.set({ flowback_theme: newTheme });
  };

  const handleSoundChange = (newSound: string) => {
    setSound(newSound);
    chrome.storage.local.set({ flowback_sound: newSound });
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    chrome.storage.local.set({ flowback_volume: newVol });
  };

  const testSound = () => {
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
      console.warn('Sound test failed:', e);
    }
  };

  // Group tasks
  const workingTasks = tasks.filter(t => t.state === 'WORKING' || t.state === 'TASK_STARTED');
  const readyTasks = tasks.filter(t => t.state === 'FINISHED' || t.state === 'NOTIFIED');

  const tc = THEMES[theme] || THEMES.cyberpunk;

  return (
    <div 
      className="flex flex-col w-[312px] min-h-[200px] max-h-[370px] font-mono select-none p-4 border-2 transition-all duration-300 overflow-y-auto m-[4px] box-border"
      style={{
        backgroundColor: tc.bg,
        color: tc.text,
        borderColor: tc.border,
        boxShadow: `4px 4px 0px 0px ${tc.border}55`
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-3">
        <h1 
          className="text-[12px] font-bold uppercase tracking-[3px] transition-colors duration-300"
          style={{ color: tc.titleColor }}
        >
          Flowback
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-center p-1 border transition-all duration-200"
            style={{
              backgroundColor: tc.cardBg,
              borderColor: tc.border,
              color: tc.text
            }}
            title={showSettings ? 'View Tasks' : 'Settings'}
          >
            {showSettings ? <Eye size={12} /> : <Settings size={12} />}
          </button>
          <button
            onClick={toggleEnabled}
            className="px-2.5 py-0.5 text-[9px] font-bold border transition-all duration-200"
            style={{
              backgroundColor: tc.cardBg,
              borderColor: enabled ? tc.accent : tc.muted,
              color: enabled ? tc.accent : tc.muted
            }}
          >
            {enabled ? '[ ON ]' : '[ OFF ]'}
          </button>
        </div>
      </header>

      {/* Divider */}
      <div 
        className="border-t mb-3 transition-colors duration-300"
        style={{ borderColor: `${tc.border}66` }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-2">
        {!enabled ? (
          <div 
            className="text-[10px] text-center py-6 tracking-[1.5px] uppercase font-bold"
            style={{ color: tc.muted }}
          >
            sys_standby
          </div>
        ) : showSettings ? (
          /* Settings Panel */
          <div className="flex flex-col gap-3 text-[10px]">
            {/* Theme Selector */}
            <div className="flex flex-col gap-1.5">
              <label 
                className="uppercase tracking-[1px] text-[8px] font-bold"
                style={{ color: tc.muted }}
              >
                Theme System
              </label>
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full border text-[9px] px-2 py-1 outline-none font-bold uppercase"
                style={{
                  backgroundColor: tc.cardBg,
                  borderColor: tc.border,
                  color: tc.text
                }}
              >
                {Object.entries(THEMES).map(([key, value]) => (
                  <option key={key} value={key} style={{ backgroundColor: tc.bg, color: tc.text }}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sound Selector */}
            <div className="flex flex-col gap-1.5">
              <label 
                className="uppercase tracking-[1px] text-[8px] font-bold"
                style={{ color: tc.muted }}
              >
                Alert Tone
              </label>
              <div className="flex gap-2">
                <select
                  value={sound}
                  onChange={(e) => handleSoundChange(e.target.value)}
                  className="flex-1 border text-[9px] px-2 py-1 outline-none font-bold uppercase"
                  style={{
                    backgroundColor: tc.cardBg,
                    borderColor: tc.border,
                    color: tc.text
                  }}
                >
                   <option value="chime" style={{ backgroundColor: tc.bg, color: tc.text }}>C-Major Chime</option>
                  <option value="retro" style={{ backgroundColor: tc.bg, color: tc.text }}>8-Bit Retro</option>
                  <option value="bell" style={{ backgroundColor: tc.bg, color: tc.text }}>Resonant Bell</option>
                  <option value="success" style={{ backgroundColor: tc.bg, color: tc.text }}>Success Triad</option>
                  <option value="breeze" style={{ backgroundColor: tc.bg, color: tc.text }}>Soft Breeze</option>
                  <option value="laser" style={{ backgroundColor: tc.bg, color: tc.text }}>Sci-Fi Laser</option>
                  <option value="synthwave" style={{ backgroundColor: tc.bg, color: tc.text }}>Synthwave Chord</option>
                  <option value="crystal" style={{ backgroundColor: tc.bg, color: tc.text }}>Digital Crystal</option>
                </select>
                <button
                  onClick={testSound}
                  className="px-2.5 py-1 border text-[9px] font-bold uppercase transition-all duration-200"
                  style={{
                    backgroundColor: tc.cardBg,
                    borderColor: tc.accent,
                    color: tc.accent
                  }}
                >
                  TEST
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[8px] font-bold">
                <span className="uppercase tracking-[1px]" style={{ color: tc.muted }}>Volume</span>
                <span style={{ color: tc.text }}>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full cursor-pointer h-1 rounded-lg appearance-none bg-slate-800"
                style={{
                  accentColor: tc.accent
                }}
              />
            </div>
          </div>
        ) : (
          /* Task List */
          <>
            {workingTasks.length === 0 && readyTasks.length === 0 && (
              <div 
                className="text-[9px] text-center py-6 tracking-[1px] uppercase font-bold"
                style={{ color: `${tc.text}55` }}
              >
                no active streams
              </div>
            )}

            {/* List active streams */}
            {workingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between text-[10px] py-1.5 border-b"
                style={{ borderColor: `${tc.border}22` }}
              >
                <span style={{ color: tc.text }} className="uppercase">• {task.platform}</span>
                <span 
                  className="animate-pulse text-[8px] font-bold tracking-[1px]"
                  style={{ color: tc.accent }}
                >
                  [STREAMING...]
                </span>
              </div>
            ))}

            {/* List ready streams */}
            {readyTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between text-[10px] py-1.5 border-b"
                style={{ borderColor: `${tc.border}22` }}
              >
                <span className="font-bold uppercase" style={{ color: tc.accent }}>• {task.platform}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReturn(task.id)}
                    className="hover:underline font-bold text-[9px] uppercase transition-all"
                    style={{ color: tc.titleColor }}
                  >
                    [Return]
                  </button>
                  <button
                    onClick={() => handleDismiss(task.id)}
                    className="hover:opacity-70 font-bold text-[9px] uppercase transition-all"
                    style={{ color: '#f43f5e' }}
                    title="Dismiss"
                  >
                    [X]
                  </button>
                </div>
              </div>
            ))}

            {/* Clear Action */}
            {readyTasks.length > 0 && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleClearAll}
                  className="text-[9px] hover:underline uppercase font-bold transition-all"
                  style={{ color: tc.text }}
                >
                  [ Clear All ]
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
