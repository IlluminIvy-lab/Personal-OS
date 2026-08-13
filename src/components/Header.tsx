import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
  RefreshCw,
  Zap,
  Download,
  FileJson,
  Check,
  User,
  Wifi,
  WifiOff,
  Layers,
  Menu,
  Search,
  Database,
  Cloud,
  PlaySquare,
  Globe,
  FileText,
  Timer,
  Camera,
  Bell,
  StickyNote,
} from 'lucide-react';
import { TaskItem, ObjectiveItem, UserProfile, CloudflareMcpConfig } from '../types';

interface HeaderProps {
  onToggleAiChat: () => void;
  isAiChatOpen: boolean;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
  apiKeyStatus: 'loading' | 'valid' | 'missing';
  checkHealth: () => void;
  unreadAiMessages?: boolean;
  tasks?: TaskItem[];
  objectives?: ObjectiveItem[];
  scratchpad?: string;
  profile?: UserProfile;
  onOpenProfile?: () => void;
  isOnline?: boolean;
  pendingSyncCount?: number;
  onOpenBackgroundTasks?: () => void;
  onOpenSideDrawer?: () => void;
  onOpenSearch?: () => void;
  onOpenBackupModal?: () => void;
  cloudflareConfig?: CloudflareMcpConfig;
  onOpenCloudflareModal?: () => void;
  onOpenVoiceMeetingRecorder?: () => void;
  onOpenMediaPlayer?: () => void;
  onOpenBrowser?: () => void;
  onOpenDocs?: () => void;
  onOpenPomodoro?: () => void;
  onOpenScreenshot?: () => void;
  onOpenNotifications?: () => void;
  onOpenQuickNotes?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleAiChat,
  isAiChatOpen,
  isMobileFrame,
  setIsMobileFrame,
  apiKeyStatus,
  checkHealth,
  tasks = [],
  objectives = [],
  scratchpad = '',
  profile,
  onOpenProfile,
  isOnline = true,
  pendingSyncCount = 0,
  onOpenBackgroundTasks,
  onOpenSideDrawer,
  onOpenSearch,
  onOpenBackupModal,
  cloudflareConfig,
  onOpenCloudflareModal,
  onOpenVoiceMeetingRecorder,
  onOpenMediaPlayer,
  onOpenBrowser,
  onOpenDocs,
  onOpenPomodoro,
  onOpenScreenshot,
  onOpenNotifications,
  onOpenQuickNotes,
  unreadNotificationsCount = 0,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [exportedBackup, setExportedBackup] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDownloadHtml = () => {
    const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Personal OS Hub</title>
  </head>
  <body>
    <h1>Personal OS Hub Snapshot</h1>
    <p>Exported: ${new Date().toISOString()}</p>
  </body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_os_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.0.4',
      exportDate: new Date().toISOString(),
      tasks,
      objectives,
      scratchpad,
      profile,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_os_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedBackup(true);
    setTimeout(() => setExportedBackup(false), 2500);
  };

  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        {/* Left: Brand, Title, Time & Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenSideDrawer && (
            <button
              onClick={onOpenSideDrawer}
              title="Open Navigation Menu"
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950/50 glow-cyan hidden sm:flex">
            <Zap className="w-5 h-5 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-white font-mono leading-none">
                PERSONAL_OS <span className="text-cyan-400 font-light text-xs ml-1 hidden xs:inline">v2.1</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 hidden sm:block">
              {date} • {time}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Quick Floating Notes */}
          {onOpenQuickNotes && (
            <button
              onClick={onOpenQuickNotes}
              title="Floating Voice & Text Quick Notes"
              className="p-2 rounded-lg text-xs font-mono bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 transition-all shadow-sm flex items-center gap-1"
            >
              <StickyNote className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Quick Notes</span>
            </button>
          )}

          {/* Pomodoro Timer Trigger */}
          {onOpenPomodoro && (
            <button
              onClick={onOpenPomodoro}
              title="Open Pomodoro Focus Timer"
              className="p-2 rounded-lg text-xs font-mono bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition-all shadow-sm flex items-center gap-1"
            >
              <Timer className="w-4 h-4 text-rose-400" />
              <span className="hidden xl:inline">Pomodoro</span>
            </button>
          )}

          {/* Screenshot Capture Button */}
          {onOpenScreenshot && (
            <button
              onClick={onOpenScreenshot}
              title="Capture In-App Viewport Screenshot"
              className="p-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-400 transition-all shadow-sm flex items-center gap-1"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Screenshot</span>
            </button>
          )}

          {/* Notification Center Trigger */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="Open Notification Center"
              className="p-2 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400 transition-all shadow-sm relative flex items-center"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[9px] animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Voice Meeting Recorder Trigger */}
          {onOpenVoiceMeetingRecorder && (
            <button
              onClick={onOpenVoiceMeetingRecorder}
              title="Voice Record Meeting & AI Summarize"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 hover:border-rose-400 transition-all shadow-sm flex items-center gap-1.5 glow-rose"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="hidden lg:inline">Record Meeting</span>
              <span className="inline lg:hidden">Record</span>
            </button>
          )}

          {/* Global App Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              title="Search tasks, objectives, agenda events, files & notes"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Search</span>
            </button>
          )}

          {/* Network Offline/Online Indicator */}
          <button
            onClick={onOpenBackgroundTasks}
            title={isOnline ? 'Online Sync Active' : 'Offline Mode - Local Storage Active'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              isOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:border-emerald-300'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/50 animate-pulse'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden 2xl:inline">
              {isOnline ? 'Online Sync' : 'Offline'}
            </span>
            {pendingSyncCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* JSON Backup & Restore Modal Trigger */}
          <button
            onClick={onOpenBackupModal || handleExportBackup}
            title="Open Backup & Restore Data Modal"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all font-mono shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">
              {exportedBackup ? 'Saved!' : 'Backup'}
            </span>
          </button>

          {/* Viewport Frame Toggle (Mobile vs Desktop) */}
          <button
            onClick={() => setIsMobileFrame((prev) => !prev)}
            title={isMobileFrame ? 'Switch to Full Desktop View' : 'Simulate iPhone 11 Mobile View'}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isMobileFrame
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {isMobileFrame ? <Smartphone className="w-4 h-4 text-cyan-300" /> : <Monitor className="w-4 h-4 text-slate-300" />}
          </button>

          {/* User Profile Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              title="Open User Profile Settings"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-sm"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                />
              ) : (
                <User className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          )}

          {/* AI Chat Drawer Trigger */}
          <button
            onClick={onToggleAiChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
              isAiChatOpen
                ? 'bg-purple-600 text-white border border-purple-400 glow-purple'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-purple-500/30 hover:border-purple-400'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">AI Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
