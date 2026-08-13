import React from 'react';
import {
  X,
  LayoutDashboard,
  Calendar,
  User,
  FolderOpen,
  Zap,
  CheckSquare,
  Target,
  Clock,
  FileText,
  Bot,
  Search,
  FileJson,
  Layers,
  ChevronRight,
  Sparkles,
  Database,
  Smartphone,
  HardDrive,
  Cloud,
  Mic,
  PlaySquare,
  Globe,
  Timer,
  Camera,
  Bell,
  StickyNote,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'dashboard' | 'calendar' | 'workspace' | 'profile' | 'files' | 'media' | 'browser' | 'docs';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'workspace' | 'profile' | 'files' | 'media' | 'browser' | 'docs') => void;
  onSelectAction: (action: string) => void;
  onOpenSearch: () => void;
  onOpenBackupModal: () => void;
  onOpenAiChat: () => void;
  onOpenCloudflareModal?: () => void;
  onOpenVoiceMeetingRecorder?: () => void;
  onOpenPomodoro?: () => void;
  onOpenScreenshot?: () => void;
  onOpenNotifications?: () => void;
  onOpenQuickNotes?: () => void;
  profile?: UserProfile;
  pendingSyncCount?: number;
  unreadNotificationsCount?: number;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onSelectAction,
  onOpenSearch,
  onOpenBackupModal,
  onOpenAiChat,
  onOpenCloudflareModal,
  onOpenVoiceMeetingRecorder,
  onOpenPomodoro,
  onOpenScreenshot,
  onOpenNotifications,
  onOpenQuickNotes,
  profile,
  pendingSyncCount = 0,
  unreadNotificationsCount = 0,
}) => {
  if (!isOpen) return null;

  const handleTabClick = (tab: 'dashboard' | 'calendar' | 'workspace' | 'profile' | 'files' | 'media' | 'browser' | 'docs') => {
    setActiveTab(tab);
    onClose();
  };

  const handleWidgetClick = (action: string) => {
    onSelectAction(action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] h-full bg-[#080d1a] border-r border-cyan-500/30 text-white shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-mono tracking-wider text-white">
                PERSONAL_OS <span className="text-cyan-400 font-light text-[10px]">v2.1</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">Mobile App Navigation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Bar inside Drawer */}
        <div className="p-3 border-b border-slate-800/80 bg-black/30">
          <button
            onClick={() => {
              onOpenSearch();
              onClose();
            }}
            className="w-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between transition-all group"
          >
            <span className="flex items-center gap-2 font-mono">
              <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              Search App...
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-slate-500">
              🔍
            </span>
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs font-mono">
          {/* Main Tabs Section */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] uppercase font-mono tracking-widest text-slate-500 px-2 font-bold">
              Navigation Tabs
            </h3>

            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md glow-cyan'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            {/* Media Player Tab */}
            <button
              onClick={() => handleTabClick('media')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'media'
                  ? 'bg-purple-600 text-white font-extrabold shadow-md glow-purple'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlaySquare className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold font-sans">VLC Media Player</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">MP3/MP4</span>
            </button>

            {/* In-App Web Browser Tab */}
            <button
              onClick={() => handleTabClick('browser')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'browser'
                  ? 'bg-cyan-600 text-white font-extrabold shadow-md glow-cyan'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-sans">In-App Web Browser</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">Tabs</span>
            </button>

            {/* Document Editor Tab */}
            <button
              onClick={() => handleTabClick('docs')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'docs'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-md glow-emerald'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-sans">Document & PDF Editor</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Auto-Save</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'calendar'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md glow-cyan'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">Calendar & Agenda</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => handleTabClick('workspace')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'workspace'
                  ? 'bg-blue-500 text-slate-950 font-extrabold shadow-md glow-cyan'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-sans">Google Workspace</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                Suite
              </span>
            </button>

            <button
              onClick={() => handleTabClick('files')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'files'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md glow-emerald'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">Files & Storage</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>

            <button
              onClick={() => handleTabClick('profile')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'profile'
                  ? 'bg-purple-500 text-slate-950 font-extrabold shadow-md glow-purple'
                  : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">User Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>

          {/* Quick Floating Utilities */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] uppercase font-mono tracking-widest text-slate-500 px-2 font-bold">
              Power Utilities
            </h3>

            {onOpenQuickNotes && (
              <button
                onClick={() => {
                  onOpenQuickNotes();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Floating Voice/Text Notes</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Drawer</span>
              </button>
            )}

            {onOpenPomodoro && (
              <button
                onClick={() => {
                  onOpenPomodoro();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 text-rose-400" />
                  <span className="font-bold">Pomodoro Focus Timer</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">Timer</span>
              </button>
            )}

            {onOpenScreenshot && (
              <button
                onClick={() => {
                  onOpenScreenshot();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Screenshot Viewport</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">PNG</span>
              </button>
            )}

            {onOpenNotifications && (
              <button
                onClick={() => {
                  onOpenNotifications();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Notification Center</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {onOpenVoiceMeetingRecorder && (
              <button
                onClick={() => {
                  onOpenVoiceMeetingRecorder();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span className="font-bold">Record Meeting & AI</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">Live</span>
              </button>
            )}
          </div>
        </div>

        {/* Drawer Footer Profile Card */}
        <div className="p-4 border-t border-slate-800 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-7 h-7 rounded-full object-cover border border-cyan-400"
              />
            ) : (
              <User className="w-5 h-5 text-cyan-400" />
            )}
            <div>
              <p className="text-xs font-bold text-white font-sans">{profile?.name || 'User Profile'}</p>
              <p className="text-[10px] text-slate-400 font-mono">Personal OS Active</p>
            </div>
          </div>

          {pendingSyncCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
              {pendingSyncCount} pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
