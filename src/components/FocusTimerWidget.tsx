import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, Coffee, Zap, BellRing } from 'lucide-react';

interface FocusTimerWidgetProps {
  onSessionComplete?: () => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const modeDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (mode === 'focus') {
        setCompletedSessions((prev) => prev + 1);
        if (onSessionComplete) onSessionComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onSessionComplete]);

  const switchMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(modeDurations[newMode]);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modeDurations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const totalDuration = modeDurations[mode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">Focus Engine</h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-black/40 text-cyan-300 border border-cyan-500/30">
            {completedSessions} Sessions Completed
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 mb-4 text-xs font-mono">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'focus'
                ? 'bg-cyan-600 text-white glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white glow-emerald'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5m Rest
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'longBreak'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            15m Break
          </button>
        </div>

        {/* Big Timer Display */}
        <div className="relative flex flex-col items-center justify-center py-4 glass-panel glow-cyan rounded-2xl border border-white/10 mb-4">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            {formattedTime}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
            {mode === 'focus' ? 'Deep Work Cycle' : mode === 'shortBreak' ? 'Short Rest Interval' : 'Long Rest Interval'}
          </p>

          <div className="w-4/5 h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                mode === 'focus'
                  ? 'bg-cyan-400'
                  : mode === 'shortBreak'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            isActive
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white glow-cyan'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isActive ? 'Pause Timer' : 'Start Cycle'}</span>
        </button>
        <button
          onClick={resetTimer}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
