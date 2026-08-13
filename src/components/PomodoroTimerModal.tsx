import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Settings,
  Flame,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { TaskItem, PomodoroSettings } from '../types';

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onNotify?: (title: string, message: string) => void;
}

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onNotify,
}) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [settings, setSettings] = useState<PomodoroSettings>({
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    soundEnabled: true,
  });

  const [timeLeft, setTimeLeft] = useState<number>(settings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Sync timer when mode changes
  const resetTimerForMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'focus') setTimeLeft(settings.focusMinutes * 60);
    else if (newMode === 'shortBreak') setTimeLeft(settings.shortBreakMinutes * 60);
    else setTimeLeft(settings.longBreakMinutes * 60);
  };

  // Play audio chime
  const playChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio context restricted
    }
  };

  // Timer Tick Engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();

            if (mode === 'focus') {
              const newCount = completedSessions + 1;
              setCompletedSessions(newCount);
              onNotify?.('Pomodoro Focus Completed! 🎉', 'Time for a well-deserved 5-minute break.');
              if (newCount % 4 === 0) {
                resetTimerForMode('longBreak');
              } else {
                resetTimerForMode('shortBreak');
              }
            } else {
              onNotify?.('Break Time Over! ⚡', 'Ready to dive into your next focus block?');
              resetTimerForMode('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedSessions, settings]);

  const toggleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    resetTimerForMode(mode);
  };

  const handleSkip = () => {
    if (mode === 'focus') resetTimerForMode('shortBreak');
    else resetTimerForMode('focus');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTimeForCurrentMode =
    mode === 'focus'
      ? settings.focusMinutes * 60
      : mode === 'shortBreak'
      ? settings.shortBreakMinutes * 60
      : settings.longBreakMinutes * 60;

  const progressPct = ((totalTimeForCurrentMode - timeLeft) / totalTimeForCurrentMode) * 100;

  if (!isOpen) return null;

  const openTasks = tasks.filter((t) => t.status !== 'Completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Pomodoro Focus Timer</h3>
              <p className="text-[10px] text-slate-400 font-mono">Deep work & interval booster</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              title="Customize Intervals"
              className={`p-1.5 rounded-lg border transition-colors ${
                isCustomizing
                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => resetTimerForMode('focus')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'focus' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Focus ({settings.focusMinutes}m)
          </button>
          <button
            onClick={() => resetTimerForMode('shortBreak')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ☕ Short Break ({settings.shortBreakMinutes}m)
          </button>
          <button
            onClick={() => resetTimerForMode('longBreak')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'longBreak' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🏖️ Long ({settings.longBreakMinutes}m)
          </button>
        </div>

        {/* Customization Panel Drawer */}
        {isCustomizing && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
            <span className="text-slate-300 font-bold block">Adjust Durations (Minutes)</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Focus</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.focusMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 25;
                    setSettings({ ...settings, focusMinutes: val });
                    if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Short Break</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.shortBreakMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 5;
                    setSettings({ ...settings, shortBreakMinutes: val });
                    if (mode === 'shortBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Long Break</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.longBreakMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 15;
                    setSettings({ ...settings, longBreakMinutes: val });
                    if (mode === 'longBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="rounded bg-slate-950 text-rose-500"
                />
                <span>Chime sound on completion</span>
              </label>
            </div>
          </div>
        )}

        {/* Large Timer Display */}
        <div className="flex flex-col items-center justify-center py-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 relative overflow-hidden">
          {/* Background Radial Glow */}
          <div
            className={`absolute inset-0 opacity-10 transition-colors ${
              mode === 'focus' ? 'bg-rose-500' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}
          />

          <span className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-white mb-2 z-10">
            {formatTime(timeLeft)}
          </span>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 z-10">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{completedSessions} Pomodoros completed today</span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-slate-800 absolute bottom-0 left-0">
            <div
              className={`h-full transition-all duration-1000 ${
                mode === 'focus' ? 'bg-rose-500' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Linked Task Selector */}
        {openTasks.length > 0 && (
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Link to Task:</span>
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- No specific task linked --</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.priority}] {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleReset}
            title="Reset Timer"
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleStartPause}
            className={`px-8 py-3 rounded-2xl font-mono text-sm font-bold flex items-center gap-2 transition-all shadow-xl ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white glow-amber'
                : 'bg-rose-600 hover:bg-rose-500 text-white glow-rose'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            title="Skip to Next Interval"
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all shadow"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
