import React from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Trash2,
  X,
  Play,
  HardDrive,
  Calendar,
  Sparkles,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { OfflineSyncItem, BackgroundTask } from '../types';

interface BackgroundTaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  syncQueue: OfflineSyncItem[];
  backgroundTasks: BackgroundTask[];
  onForceSync: () => void;
  onClearCompletedTasks: () => void;
}

export const BackgroundTaskManager: React.FC<BackgroundTaskManagerProps> = ({
  isOpen,
  onClose,
  isOnline,
  syncQueue,
  backgroundTasks,
  onForceSync,
  onClearCompletedTasks,
}) => {
  if (!isOpen) return null;

  const pendingSyncCount = syncQueue.filter((i) => i.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090d1a] border border-cyan-500/40 rounded-3xl shadow-2xl p-6 space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-sans uppercase tracking-wider flex items-center gap-2">
                BACKGROUND_TASK_ENGINE <span className="text-xs text-cyan-400 font-mono font-normal">& Sync Queue</span>
              </h2>
              <p className="text-xs text-slate-400">
                Monitor background processes, offline storage caches, and automatic connectivity sync.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Section 1: Connection & Offline Sync Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 text-xs font-mono">
                    <Wifi className="w-4 h-4" /> Internet Online
                  </span>
                ) : (
                  <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 text-xs font-mono animate-pulse">
                    <WifiOff className="w-4 h-4" /> Offline Mode
                  </span>
                )}

                <span className="text-xs font-mono text-slate-300">
                  Pending Sync Items: <strong className="text-cyan-300">{pendingSyncCount}</strong>
                </span>
              </div>

              <button
                onClick={onForceSync}
                disabled={!isOnline || pendingSyncCount === 0}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-extrabold flex items-center gap-2 transition-all ${
                  isOnline && pendingSyncCount > 0
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md glow-cyan'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOnline && pendingSyncCount > 0 ? 'animate-spin' : ''}`} />
                Force Sync Queue
              </button>
            </div>

            {/* Sync Queue List */}
            {syncQueue.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-2">
                ✅ Offline queue empty. All local edits & files are synced.
              </p>
            ) : (
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Cached Pending Sync Queue
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {syncQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-black/40 border border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <div>
                          <span className="font-bold text-white capitalize">{item.type.replace('_', ' ')}</span>: {item.action}
                          <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Active Background Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Active System Background Tasks
              </h3>

              <button
                onClick={onClearCompletedTasks}
                className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Done
              </button>
            </div>

            <div className="space-y-2">
              {backgroundTasks.length === 0 ? (
                <div className="p-6 text-center border border-slate-800 rounded-2xl bg-black/30 text-xs font-mono text-slate-500">
                  No active background tasks running.
                </div>
              ) : (
                backgroundTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-2">
                        {task.status === 'running' && (
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        )}
                        {task.status === 'completed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {task.title}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                          task.status === 'running'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : task.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status.toUpperCase()} ({task.progress}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {task.details && (
                      <p className="text-[10px] text-slate-400 truncate">{task.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Personal OS Background Core Engine Active
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
