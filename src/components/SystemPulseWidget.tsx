import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Zap, Flame, Shield, Activity, RefreshCw } from 'lucide-react';
import { SystemState } from '../types';

interface SystemPulseWidgetProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
}

export const SystemPulseWidget: React.FC<SystemPulseWidgetProps> = ({
  systemState,
  setSystemState,
}) => {
  // Simulate subtle real-time fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemState((prev) => ({
        ...prev,
        cpuUsage: Math.min(95, Math.max(8, prev.cpuUsage + Math.floor(Math.random() * 7 - 3))),
        memoryUsage: Math.min(90, Math.max(25, prev.memoryUsage + Math.floor(Math.random() * 5 - 2))),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [setSystemState]);

  const toggleFocusMode = () => {
    setSystemState((prev) => ({
      ...prev,
      activeFocusMode: !prev.activeFocusMode,
      focusScore: !prev.activeFocusMode ? Math.min(100, prev.focusScore + 5) : prev.focusScore,
    }));
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">
            System Diagnostics
          </h2>
        </div>

        {/* Focus mode switch */}
        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
            systemState.activeFocusMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/40'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <Flame
            className={`w-3.5 h-3.5 ${
              systemState.activeFocusMode ? 'text-amber-400 animate-bounce' : 'text-slate-500'
            }`}
          />
          <span>{systemState.activeFocusMode ? 'Focus Shield ON' : 'Normal OS Mode'}</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Focus Score */}
        <div className="glass-panel p-3 rounded-xl glow-purple flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
            <span>Focus Score</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {systemState.focusScore}
            </span>
            <span className="text-xs text-purple-400 ml-1">/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${systemState.focusScore}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
            <span>Daily Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {systemState.streakDays}
            </span>
            <span className="text-xs text-amber-400 ml-1">days</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Top 5% Consistency</p>
        </div>

        {/* CPU Usage */}
        <div className="glass-panel p-3 rounded-xl glow-cyan flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
            <span>CPU Load</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {systemState.cpuUsage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${systemState.cpuUsage}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="glass-panel p-3 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono uppercase tracking-wider">
            <span>Memory</span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {systemState.memoryUsage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${systemState.memoryUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Telemetry Status Line */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" /> Ingress Node: 0.0.0.0:3000
        </span>
        <span className="text-slate-500 hidden sm:inline">Vite HMR Disabled • Cloud Run Active</span>
      </div>
    </div>
  );
};
