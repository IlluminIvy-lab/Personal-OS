import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TaskTracker } from './components/TaskTracker';
import { HighPriorityObjectives } from './components/HighPriorityObjectives';
import { SystemPulseWidget } from './components/SystemPulseWidget';
import { FocusTimerWidget } from './components/FocusTimerWidget';
import { QuickScratchpad } from './components/QuickScratchpad';
import { QuickToolsGrid } from './components/QuickToolsGrid';
import { AIChatAssistant } from './components/AIChatAssistant';
import { GoogleCalendarWidget } from './components/GoogleCalendarWidget';
import { GoogleDriveWidget } from './components/GoogleDriveWidget';
import { UserProfileModal } from './components/UserProfileModal';
import { UserProfileTab } from './components/UserProfileTab';
import { FileStorageManager } from './components/FileStorageManager';
import { CalendarAgendaTab } from './components/CalendarAgendaTab';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';
import { BackgroundTaskManager } from './components/BackgroundTaskManager';
import { SideNavDrawer } from './components/SideNavDrawer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DataBackupModal } from './components/DataBackupModal';
import { CloudflareMcpModal } from './components/CloudflareMcpModal';
import { DashboardGrid } from './components/DashboardGrid';
import { MeetingVoiceRecorderModal } from './components/MeetingVoiceRecorderModal';
import { MediaPlayerView } from './components/MediaPlayerView';
import { InAppWebBrowserTab } from './components/InAppWebBrowserTab';
import { DocumentEditorTab } from './components/DocumentEditorTab';
import { PomodoroTimerModal } from './components/PomodoroTimerModal';
import { ScreenshotCaptureModal } from './components/ScreenshotCaptureModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { QuickNotesDrawer } from './components/QuickNotesDrawer';
import { KeyboardDismissButton } from './components/KeyboardDismissButton';
import { getApiUrl } from './lib/api';

import { DEFAULT_DASHBOARD_WIDGETS, loadSavedDashboardWidgets, saveDashboardWidgets } from './data/defaultWidgets';
import {
  LayoutDashboard,
  Calendar,
  User,
  FolderOpen,
  Sparkles,
  Layers,
  WifiOff,
  PlaySquare,
  Globe,
  FileText,
  Timer,
  Camera,
  Bell,
  StickyNote,
} from 'lucide-react';

import {
  INITIAL_TASKS,
  INITIAL_OBJECTIVES,
  INITIAL_NOTES,
  INITIAL_TOOLS,
  INITIAL_SYSTEM_STATE,
  INITIAL_USER_PROFILE,
  INITIAL_LOCAL_FILES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_MEDIA_ITEMS,
  INITIAL_PLAYLISTS,
  INITIAL_BOOKMARKS,
  INITIAL_DOCUMENTS,
  INITIAL_QUICK_NOTES,
  INITIAL_NOTIFICATIONS,
} from './data/mockDefaults';
import {
  TaskItem,
  ObjectiveItem,
  SystemState,
  GoogleCalendarEvent,
  UserProfile,
  LocalFileItem,
  LocalCalendarEvent,
  OfflineSyncItem,
  BackgroundTask,
  CloudflareMcpConfig,
  DashboardWidgetConfig,
  MediaItem,
  MediaPlaylist,
  WebBookmark,
  DocumentItem,
  QuickNote,
  AppNotification,
} from './types';

export default function App() {
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calendar' | 'workspace' | 'profile' | 'files' | 'media' | 'browser' | 'docs'
  >('dashboard');
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'gmail' | 'contacts' | 'tasks' | 'picker' | 'keep'>('gmail');

  // Network Online/Offline state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isBgTasksOpen, setIsBgTasksOpen] = useState(false);

  // Offline Sync Queue
  const [syncQueue, setSyncQueue] = useState<OfflineSyncItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_sync_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local Calendar & Agenda Events
  const [localEvents, setLocalEvents] = useState<LocalCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_calendar_events');
      return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
    } catch {
      return INITIAL_CALENDAR_EVENTS;
    }
  });

  // Background Tasks List
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([
    {
      id: 'bg-1',
      title: 'Local Cache Engine & Offline Storage Watcher',
      type: 'offline_sync',
      status: 'running',
      progress: 100,
      startedAt: new Date().toISOString(),
      details: 'All local edits cached in localStorage & IndexedDB fallback',
    },
  ]);

  // Local Files persistence
  const [localFiles, setLocalFiles] = useState<LocalFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_local_files');
      return saved ? JSON.parse(saved) : INITIAL_LOCAL_FILES;
    } catch {
      return INITIAL_LOCAL_FILES;
    }
  });

  // Media Player State & Playlists
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_media_items');
      return saved ? JSON.parse(saved) : INITIAL_MEDIA_ITEMS;
    } catch {
      return INITIAL_MEDIA_ITEMS;
    }
  });

  const [playlists, setPlaylists] = useState<MediaPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_media_playlists');
      return saved ? JSON.parse(saved) : INITIAL_PLAYLISTS;
    } catch {
      return INITIAL_PLAYLISTS;
    }
  });

  // Web Browser Bookmarks
  const [browserBookmarks, setBrowserBookmarks] = useState<WebBookmark[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_web_bookmarks');
      return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
    } catch {
      return INITIAL_BOOKMARKS;
    }
  });

  // Documents & PDF items
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  // Floating Quick Notes
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_quick_notes');
      return saved ? JSON.parse(saved) : INITIAL_QUICK_NOTES;
    } catch {
      return INITIAL_QUICK_NOTES;
    }
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('personal_os_media_items', JSON.stringify(mediaItems));
    } catch (e) {
      console.warn('Failed to save media items:', e);
    }
  }, [mediaItems]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_media_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists:', e);
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_web_bookmarks', JSON.stringify(browserBookmarks));
    } catch (e) {
      console.warn('Failed to save browser bookmarks:', e);
    }
  }, [browserBookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_documents', JSON.stringify(documents));
    } catch (e) {
      console.warn('Failed to save documents:', e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_quick_notes', JSON.stringify(quickNotes));
    } catch (e) {
      console.warn('Failed to save quick notes:', e);
    }
  }, [quickNotes]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  }, [notifications]);

  // Listen to online / offline network events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncQueue.length > 0) {
        setBackgroundTasks((prev) => [
          {
            id: `bg-sync-${Date.now()}`,
            title: 'Auto Syncing Offline Queued Items...',
            type: 'offline_sync',
            status: 'running',
            progress: 50,
            startedAt: new Date().toISOString(),
          },
          ...prev,
        ]);

        setTimeout(() => {
          setSyncQueue((prev) => prev.map((item) => ({ ...item, status: 'completed' })));
          setBackgroundTasks((prev) =>
            prev.map((t) =>
              t.type === 'offline_sync' ? { ...t, status: 'completed', progress: 100 } : t
            )
          );
        }, 1500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue.length]);

  // Handle queueing offline items
  const handleQueueOfflineItem = (type: any, action: string, payload: any) => {
    const newItem: OfflineSyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      action,
      payload,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'completed' : 'pending',
    };
    setSyncQueue((prev) => [newItem, ...prev]);
  };

  const handleForceSync = () => {
    setSyncQueue((prev) => prev.map((item) => ({ ...item, status: 'completed' })));
  };

  const handleClearCompletedTasks = () => {
    setBackgroundTasks((prev) => prev.filter((t) => t.status === 'running'));
    setSyncQueue((prev) => prev.filter((item) => item.status === 'pending'));
  };

  // User profile state
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('personal_os_profile');
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Persistence state
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [objectives, setObjectives] = useState<ObjectiveItem[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_objectives');
      return saved ? JSON.parse(saved) : INITIAL_OBJECTIVES;
    } catch {
      return INITIAL_OBJECTIVES;
    }
  });

  const [scratchpad, setScratchpad] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('personal_os_scratchpad');
      return saved !== null ? saved : INITIAL_NOTES[0].content;
    } catch {
      return INITIAL_NOTES[0].content;
    }
  });

  const [systemState, setSystemState] = useState<SystemState>(() => {
    try {
      const saved = localStorage.getItem('personal_os_system');
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_STATE;
    } catch {
      return INITIAL_SYSTEM_STATE;
    }
  });

  // Drag-and-Drop Dashboard Widgets Layout
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetConfig[]>(() =>
    loadSavedDashboardWidgets()
  );

  useEffect(() => {
    saveDashboardWidgets(dashboardWidgets);
  }, [dashboardWidgets]);

  const handleResetDashboardLayout = () => {
    setDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
    saveDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
  };

  // Modals & Drawers state
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'valid' | 'missing'>('loading');
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isVoiceMeetingRecorderOpen, setIsVoiceMeetingRecorderOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isScreenshotOpen, setIsScreenshotOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);

  // Add Action Items from Voice Meeting Recorder directly into Tasks
  const handleBatchAddTasks = (newTasks: Array<Partial<TaskItem> & { title: string }>) => {
    const formatted: TaskItem[] = newTasks.map((t, idx) => ({
      id: `task-meet-${Date.now()}-${idx}`,
      title: t.title,
      category: t.category || 'Work',
      priority: t.priority || 'High',
      status: 'Todo',
      dueDate: t.dueDate || 'Today',
      estimatedMinutes: t.estimatedMinutes || 30,
      createdAt: new Date().toISOString(),
    }));
    setTasks((prev) => [...formatted, ...prev]);

    // Push notification
    addAppNotification(
      'Tasks Added from Meeting 🎯',
      `Imported ${formatted.length} action items into your Task Board.`,
      'tasks',
      'success'
    );
  };

  const addAppNotification = (
    title: string,
    message: string,
    category: 'tasks' | 'pomodoro' | 'system' | 'media' = 'system',
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      category,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Cloudflare MCP / Second Brain Config State
  const [cloudflareConfig, setCloudflareConfig] = useState<CloudflareMcpConfig>(() => {
    try {
      const saved = localStorage.getItem('personal_os_cloudflare_mcp');
      return saved
        ? JSON.parse(saved)
        : {
            workerUrl: '',
            apiToken: '',
            protocolMode: 'rest',
            isEnabled: false,
            lastSyncedAt: undefined,
          };
    } catch {
      return {
        workerUrl: '',
        apiToken: '',
        protocolMode: 'rest',
        isEnabled: false,
        lastSyncedAt: undefined,
      };
    }
  });

  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_cloudflare_mcp', JSON.stringify(cloudflareConfig));
    } catch (err) {
      console.warn('Failed to save Cloudflare MCP config:', err);
    }
  }, [cloudflareConfig]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('personal_os_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_objectives', JSON.stringify(objectives));
    } catch (e) {
      console.warn('Failed to save objectives:', e);
    }
  }, [objectives]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_scratchpad', scratchpad);
    } catch (e) {
      console.warn('Failed to save scratchpad:', e);
    }
  }, [scratchpad]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_system', JSON.stringify(systemState));
    } catch (e) {
      console.warn('Failed to save system state:', e);
    }
  }, [systemState]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_calendar_events', JSON.stringify(localEvents));
    } catch (e) {
      console.warn('Failed to save local calendar events:', e);
    }
  }, [localEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_local_files', JSON.stringify(localFiles));
    } catch (e) {
      console.warn('Failed to save local files:', e);
    }
  }, [localFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('personal_os_sync_queue', JSON.stringify(syncQueue));
    } catch (e) {
      console.warn('Failed to save sync queue:', e);
    }
  }, [syncQueue]);

  // Health check for backend API & GEMINI_API_KEY
  const checkHealth = async () => {
    setApiKeyStatus('loading');
    try {
      const url = getApiUrl('/api/health');
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        setApiKeyStatus('missing');
        return;
      }
      const data = await res.json();
      if (data && data.status === 'ok' && (data.apiKeyConfigured || data.hasApiKey)) {
        setApiKeyStatus('valid');
      } else {
        setApiKeyStatus('missing');
      }
    } catch (err) {
      console.warn('API health check info:', err);
      setApiKeyStatus('missing');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSelectDrawerAction = (action: string) => {
    switch (action) {
      case 'plan-day':
        setIsAiChatOpen(true);
        break;
      case 'open-voice-meeting-recorder':
        setIsVoiceMeetingRecorderOpen(true);
        break;
      case 'open-task-auto-summary':
        setIsAiChatOpen(true);
        break;
      case 'focus-tasks':
        setActiveTab('dashboard');
        break;
      case 'focus-objectives':
        setActiveTab('dashboard');
        break;
      case 'focus-timer':
        setIsPomodoroOpen(true);
        break;
      case 'focus-notes':
        setIsQuickNotesOpen(true);
        break;
      case 'open-workspace-gmail':
        setWorkspaceSubTab('gmail');
        setActiveTab('workspace');
        break;
      case 'open-workspace-contacts':
        setWorkspaceSubTab('contacts');
        setActiveTab('workspace');
        break;
      case 'open-workspace-tasks':
        setWorkspaceSubTab('tasks');
        setActiveTab('workspace');
        break;
      case 'open-workspace-picker':
        setWorkspaceSubTab('picker');
        setActiveTab('workspace');
        break;
      case 'open-workspace-keep':
        setWorkspaceSubTab('keep');
        setActiveTab('workspace');
        break;
      case 'open-calendar':
        setActiveTab('calendar');
        break;
      case 'open-profile':
        setActiveTab('profile');
        break;
      case 'open-browser':
        setActiveTab('browser');
        break;
      case 'open-docs':
        setActiveTab('docs');
        break;
      case 'open-media':
        setActiveTab('media');
        break;
      case 'open-files':
        setActiveTab('files');
        break;
      case 'open-cloudflare':
        setIsCloudflareModalOpen(true);
        break;
      case 'open-backup':
        setIsBackupModalOpen(true);
        break;
      case 'open-screenshot':
        setIsScreenshotOpen(true);
        break;
      case 'open-notifications':
        setIsNotificationsOpen(true);
        break;
      default:
        break;
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#080814] to-[#050505] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        onToggleAiChat={() => setIsAiChatOpen(!isAiChatOpen)}
        isAiChatOpen={isAiChatOpen}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        apiKeyStatus={apiKeyStatus}
        checkHealth={checkHealth}
        tasks={tasks}
        objectives={objectives}
        scratchpad={scratchpad}
        profile={profile}
        onOpenProfile={() => setActiveTab('profile')}
        isOnline={isOnline}
        pendingSyncCount={syncQueue.filter((s) => s.status === 'pending').length}
        onOpenBackgroundTasks={() => setIsBgTasksOpen(true)}
        onOpenSideDrawer={() => setIsSideDrawerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        cloudflareConfig={cloudflareConfig}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onOpenVoiceMeetingRecorder={() => setIsVoiceMeetingRecorderOpen(true)}
        onOpenMediaPlayer={() => setActiveTab('media')}
        onOpenBrowser={() => setActiveTab('browser')}
        onOpenDocs={() => setActiveTab('docs')}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onOpenScreenshot={() => setIsScreenshotOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenQuickNotes={() => setIsQuickNotesOpen(true)}
        unreadNotificationsCount={unreadNotifCount}
      />

      {/* Main Primary Tab Navigation Bar */}
      <div className="shrink-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>

            {/* VLC Media Player Tab */}
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'media'
                  ? 'bg-purple-600 text-white shadow-md glow-purple'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlaySquare className="w-4 h-4 text-purple-300" /> Media Player
            </button>

            {/* In-App Browser Tab */}
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'browser'
                  ? 'bg-cyan-600 text-white shadow-md glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-300" /> Web Browser
            </button>

            {/* Document Editor Tab */}
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'docs'
                  ? 'bg-emerald-600 text-white shadow-md glow-emerald'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-300" /> Documents & PDF
            </button>

            {/* Calendar Tab */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-cyan-500 text-slate-950 shadow-md glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>

            {/* Workspace Hub Tab */}
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'workspace'
                  ? 'bg-blue-500 text-slate-950 shadow-md glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" /> Google Workspace
            </button>

            {/* Files Tab */}
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'files'
                  ? 'bg-emerald-500 text-slate-950 shadow-md glow-emerald'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderOpen className="w-4 h-4" /> Files ({localFiles.length})
            </button>

            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-purple-500 text-slate-950 shadow-md glow-purple'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
          </div>

          {/* Quick Right Shortcuts */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setIsPomodoroOpen(true)}
              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Pomodoro</span>
            </button>
            <button
              onClick={() => setIsQuickNotesOpen(true)}
              className="p-1.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900 transition-colors flex items-center gap-1 text-[11px]"
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>Quick Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <main
        className={`flex-1 min-h-0 overflow-y-auto mx-auto w-full transition-all duration-300 px-3 sm:px-6 py-6 ${
          isMobileFrame
            ? 'max-w-[380px] border-x border-b border-cyan-500/30 rounded-b-3xl shadow-2xl bg-black/60 backdrop-blur-2xl my-4 glow-cyan'
            : 'max-w-7xl'
        }`}
      >
        {/* Tab: VLC-Style Media Player */}
        {activeTab === 'media' && (
          <MediaPlayerView
            mediaItems={mediaItems}
            playlists={playlists}
            onUpdateMediaItems={setMediaItems}
            onUpdatePlaylists={setPlaylists}
            onOpenUploadModal={() => setActiveTab('files')}
          />
        )}

        {/* Tab: In-App Multi-Tab Web Browser */}
        {activeTab === 'browser' && (
          <InAppWebBrowserTab
            bookmarks={browserBookmarks}
            onUpdateBookmarks={setBrowserBookmarks}
            onClipToScratchpad={(text) => {
              setScratchpad((prev) => (prev ? `${prev}\n\n${text}` : text));
            }}
            onClipToDocs={(title, content) => {
              const newDoc = {
                id: `doc-${Date.now()}`,
                title,
                content,
                format: 'markdown' as const,
                tags: ['Web Clip', 'Research'],
                lastModified: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                isStarred: true,
              };
              setDocuments((prev) => [newDoc, ...prev]);
            }}
            onClipToTasks={(title, notes) => {
              const newTask = {
                id: `task-${Date.now()}`,
                title,
                notes,
                category: 'Work' as const,
                priority: 'Medium' as const,
                status: 'Todo' as const,
                tags: ['Research', 'Web'],
                createdAt: new Date().toISOString(),
                subtasks: [],
              };
              setTasks((prev) => [newTask, ...prev]);
            }}
          />
        )}

        {/* Tab: Document & Rich Text Editor */}
        {activeTab === 'docs' && (
          <DocumentEditorTab
            documents={documents}
            onUpdateDocuments={setDocuments}
            onAskAiToAssistWithDoc={(docContent, docTitle) => {
              setIsAiChatOpen(true);
            }}
          />
        )}

        {/* Tab: Calendar & Agenda */}
        {activeTab === 'calendar' && (
          <CalendarAgendaTab
            localEvents={localEvents}
            setLocalEvents={setLocalEvents}
            googleEvents={calendarEvents}
            tasks={tasks}
            isOnline={isOnline}
            onQueueOfflineItem={handleQueueOfflineItem}
          />
        )}

        {/* Tab: Google Workspace Suite */}
        {activeTab === 'workspace' && (
          <GoogleWorkspaceHub
            initialTab={workspaceSubTab}
            onSyncTasksToApp={(syncedTasks) => {
              setTasks((prev) => {
                const existingIds = new Set(prev.map((t) => t.id));
                const newOnly = syncedTasks.filter((t) => !existingIds.has(t.id));
                return [...newOnly, ...prev];
              });
            }}
            onSavePickedFile={(file) => {
              setLocalFiles((prev) => [file, ...prev]);
            }}
            onSyncScratchpad={(text) => {
              setScratchpad((prev) => (prev ? `${prev}\n\n${text}` : text));
            }}
          />
        )}

        {/* Tab: User Profile */}
        {activeTab === 'profile' && (
          <UserProfileTab
            profile={profile}
            onSaveProfile={setProfile}
            cloudflareConfig={cloudflareConfig}
            onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
          />
        )}

        {/* Tab: Files & Storage */}
        {activeTab === 'files' && (
          <FileStorageManager localFiles={localFiles} setLocalFiles={setLocalFiles} />
        )}

        {/* Tab: Dashboard Layout */}
        {activeTab === 'dashboard' && (
          <>
            {/* Active Focus Shield Overlay Notice if active */}
            {systemState.activeFocusMode && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <strong>Focus Shield Active:</strong> Distractions blocked. Executive focus mode engaged.
                </span>
                <button
                  onClick={() => setSystemState((prev) => ({ ...prev, activeFocusMode: false }))}
                  className="text-[11px] font-mono text-amber-300 hover:underline"
                >
                  Disable
                </button>
              </div>
            )}

            {/* Dashboard Grid Layout */}
            <DashboardGrid
              widgets={dashboardWidgets}
              onLayoutChange={setDashboardWidgets}
              onResetLayout={handleResetDashboardLayout}
              onToolAction={handleSelectDrawerAction}
              tasks={tasks}
              setTasks={setTasks}
              objectives={objectives}
              setObjectives={setObjectives}
              systemState={systemState}
              setSystemState={setSystemState}
              scratchpad={scratchpad}
              setScratchpad={setScratchpad}
              tools={INITIAL_TOOLS}
              isOnline={isOnline}
              onQueueOfflineItem={handleQueueOfflineItem}
              onOpenVoiceMeetingRecorder={() => setIsVoiceMeetingRecorderOpen(true)}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
              onOpenAiChat={() => setIsAiChatOpen(true)}
              onOpenCalendarTab={() => setActiveTab('calendar')}
              onOpenWorkspaceTab={() => setActiveTab('workspace')}
              onOpenFilesTab={() => setActiveTab('files')}
              onOpenProfileTab={() => setActiveTab('profile')}
              onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
              onOpenBrowserTab={() => setActiveTab('browser')}
              onOpenDocsTab={() => setActiveTab('docs')}
              onOpenMediaTab={() => setActiveTab('media')}
              onOpenPomodoroModal={() => setIsPomodoroOpen(true)}
              onOpenScreenshotModal={() => setIsScreenshotOpen(true)}
              onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
              onOpenQuickNotesModal={() => setIsQuickNotesOpen(true)}
            />
          </>
        )}
      </main>

      {/* Global AI Chat Assistant with Multi-Threads, Workspaces & ZIP Export */}
      <AIChatAssistant
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        apiKeyStatus={apiKeyStatus}
        tasks={tasks}
        objectives={objectives}
        scratchpadContent={scratchpad}
        calendarEvents={calendarEvents}
        cloudflareConfig={cloudflareConfig}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onAddTaskFromAi={(title) => {
          setTasks((prev) => [
            {
              id: `task-ai-${Date.now()}`,
              title,
              category: 'Work',
              priority: 'High',
              status: 'Todo',
              dueDate: 'Today',
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }}
        onCreateDocFromAi={(docTitle, docContent) => {
          const newDoc: DocumentItem = {
            id: `doc-${Date.now()}`,
            title: docTitle,
            content: docContent,
            format: 'markdown',
            tags: ['AI Generated'],
            lastModified: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isStarred: true,
          };
          setDocuments((prev) => [newDoc, ...prev]);
          setActiveTab('docs');
        }}
      />

      {/* Side Navigation Drawer */}
      <SideNavDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectAction={handleSelectDrawerAction}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onOpenVoiceMeetingRecorder={() => setIsVoiceMeetingRecorderOpen(true)}
        onOpenPomodoro={() => setIsPomodoroOpen(true)}
        onOpenScreenshot={() => setIsScreenshotOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenQuickNotes={() => setIsQuickNotesOpen(true)}
        profile={profile}
        pendingSyncCount={syncQueue.filter((s) => s.status === 'pending').length}
        unreadNotificationsCount={unreadNotifCount}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        objectives={objectives}
        calendarEvents={localEvents}
        files={localFiles}
        scratchpad={scratchpad}
        onSelectTask={() => setActiveTab('dashboard')}
        onSelectObjective={() => setActiveTab('dashboard')}
        onSelectCalendarEvent={() => setActiveTab('calendar')}
        onSelectFile={() => setActiveTab('files')}
      />

      {/* In-App Screenshot Tool */}
      <ScreenshotCaptureModal
        isOpen={isScreenshotOpen}
        onClose={() => setIsScreenshotOpen(false)}
      />

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroTimerModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        tasks={tasks}
        onNotify={(t, m) => addAppNotification(t, m, 'pomodoro', 'success')}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
      />

      {/* Floating Quick Notes Drawer */}
      <QuickNotesDrawer
        isOpen={isQuickNotesOpen}
        onClose={() => setIsQuickNotesOpen(false)}
        notes={quickNotes}
        onUpdateNotes={setQuickNotes}
        onAppendToScratchpad={(txt) => setScratchpad((prev) => `${prev}\n\n${txt}`)}
      />

      {/* Voice Meeting Recorder & Transcriber Modal */}
      <MeetingVoiceRecorderModal
        isOpen={isVoiceMeetingRecorderOpen}
        onClose={() => setIsVoiceMeetingRecorderOpen(false)}
        onAddTasksFromMeeting={handleBatchAddTasks}
        onAppendToScratchpad={(summary) => {
          setScratchpad((prev) => `${prev}\n\n### Meeting Notes\n${summary}`);
        }}
      />

      {/* JSON Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
        objectives={objectives}
        setObjectives={setObjectives}
        scratchpad={scratchpad}
        setScratchpad={setScratchpad}
        profile={profile}
        setProfile={setProfile}
        localFiles={localFiles}
        setLocalFiles={setLocalFiles}
        localEvents={localEvents}
        setLocalEvents={setLocalEvents}
      />

      {/* Cloudflare MCP Integration Modal */}
      <CloudflareMcpModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        config={cloudflareConfig}
        onSaveConfig={setCloudflareConfig}
      />

      {/* Background Task Engine & Offline Sync Manager Modal */}
      <BackgroundTaskManager
        isOpen={isBgTasksOpen}
        onClose={() => setIsBgTasksOpen(false)}
        tasks={backgroundTasks}
        syncQueue={syncQueue}
        isOnline={isOnline}
        onForceSync={handleForceSync}
        onClearCompleted={handleClearCompletedTasks}
      />

      {/* Global Auto Keyboard Collapse/Dismiss Button */}
      <KeyboardDismissButton />
    </div>
  );
}
