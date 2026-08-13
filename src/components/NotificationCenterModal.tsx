import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  X,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onUpdateNotifications: (updater: (prev: AppNotification[]) => AppNotification[]) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onUpdateNotifications,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'tasks' | 'pomodoro' | 'system'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleMarkAllAsRead = () => {
    onUpdateNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkAsRead = (id: string) => {
    onUpdateNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    onUpdateNotifications(() => []);
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Personal OS Notifications Active', {
          body: 'You will now receive system and focus alerts.',
        });
      }
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'tasks') return n.category === 'tasks';
    if (filter === 'pomodoro') return n.category === 'pomodoro';
    if (filter === 'system') return n.category === 'system';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Notification Center</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Push Permission */}
        <div className="p-2.5 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-full ${
                filter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2 py-0.5 rounded-full ${
                filter === 'unread' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('tasks')}
              className={`px-2 py-0.5 rounded-full ${
                filter === 'tasks' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilter('pomodoro')}
              className={`px-2 py-0.5 rounded-full ${
                filter === 'pomodoro' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Focus
            </button>
          </div>

          <button
            onClick={requestBrowserPermission}
            title="Enable Desktop Push Notifications"
            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <BellRing className="w-3 h-3" />
            <span>Browser Push</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[260px] max-h-[420px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No notifications in this view.
            </div>
          ) : (
            filtered.map((item) => {
              const getIcon = () => {
                if (item.type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                if (item.type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-400" />;
                if (item.type === 'error') return <AlertCircle className="w-4 h-4 text-rose-400" />;
                return <Info className="w-4 h-4 text-cyan-400" />;
              };

              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    !item.read
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getIcon()}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold font-mono text-slate-200 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs font-sans text-slate-400 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {item.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Total: {notifications.length} notifications</span>
            <button
              onClick={handleClearAll}
              className="text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
