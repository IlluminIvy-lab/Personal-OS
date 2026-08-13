import { TaskItem, ObjectiveItem, QuickNote, QuickTool, SystemState, UserProfile, LocalFileItem, LocalCalendarEvent } from '../types';

export const INITIAL_CALENDAR_EVENTS: LocalCalendarEvent[] = [
  {
    id: 'evt-1',
    title: '⚡ Executive OS Morning Standup',
    description: 'Review Q3 goals, team bandwidth, and strategic roadmap.',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '09:45',
    category: 'Work',
    location: 'Conference Room Alpha / Virtual Link',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title: '🎯 Strategic Product Review & Architecture Sync',
    description: 'Deep dive into Personal OS v2.0 offline cache and background tasks.',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:00',
    endTime: '12:30',
    category: 'Meeting',
    location: 'HQ Strategy Room',
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: '🏃 Fitness & Executive Wellness Break',
    description: '30-minute cardio session & hydration.',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:30',
    endTime: '15:15',
    category: 'Health',
    location: 'Wellness Center',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-4',
    title: '🚀 AI OS Deployment & Sync Verification',
    description: 'Verify background sync queue and offline caching protocols.',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '17:00',
    category: 'Deadline',
    location: 'Dev Studio',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Antonio Shaw',
  username: 'shawantonio',
  email: 'shawantonio@gmail.com',
  phone: '+1 (555) 382-9102',
  location: 'San Francisco, CA',
  bio: 'Personal OS Creator & Executive Strategist',
  roleTitle: 'Lead OS Architect & Product Strategist',
  emergencyContact: '+1 (555) 911-0012 (Primary Office Ops)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  socials: {
    github: 'https://github.com/shawantonio',
    linkedin: 'https://linkedin.com/in/shawantonio',
    twitter: 'https://twitter.com/shawantonio',
    website: 'https://shawantonio.dev',
    youtube: 'https://youtube.com/@shawantonio',
    instagram: 'https://instagram.com/shawantonio',
    medium: 'https://medium.com/@shawantonio',
    discord: 'https://discord.gg/personal-os',
  },
};

export const INITIAL_LOCAL_FILES: LocalFileItem[] = [
  {
    id: 'file-1',
    name: 'Executive_OS_Architecture_Overview.pdf',
    type: 'pdf',
    size: 2450000,
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
    description: 'Core system architecture and security protocols blueprint.',
    source: 'local',
  },
  {
    id: 'file-2',
    name: 'Personal_OS_Dashboard_Mockup.png',
    type: 'image',
    size: 1840000,
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    fileDataUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    description: 'High-resolution UI preview screenshot of executive dashboard.',
    source: 'local',
  },
  {
    id: 'file-3',
    name: 'Q3_Strategic_Milestones_Summary.txt',
    type: 'text',
    size: 14200,
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    fileDataUrl: 'data:text/plain;charset=utf-8,Executive%20Summary%3A%20All%20key%20milestones%20on%20track.',
    description: 'Text log of recent strategic achievements.',
    source: 'local',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Review priority objectives and update status',
    category: 'Work',
    priority: 'High',
    status: 'Todo',
    dueDate: 'Today',
    estimatedMinutes: 30,
    tags: ['Planning', 'Core'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Organize project backlog and action items',
    category: 'Work',
    priority: 'Critical',
    status: 'In Progress',
    dueDate: 'Today',
    estimatedMinutes: 45,
    tags: ['Organization'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Complete 30-min focus timer session',
    category: 'Health',
    priority: 'Medium',
    status: 'Todo',
    dueDate: 'Today',
    estimatedMinutes: 30,
    tags: ['Wellness'],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_OBJECTIVES: ObjectiveItem[] = [
  {
    id: 'obj-1',
    title: 'Ship Personal OS v2.0 Platform',
    category: 'Productivity',
    description: 'Build executive dashboard with task tracking, notes, and AI assistant.',
    progress: 75,
    targetDate: '2026-08-15',
    status: 'On Track',
    milestones: [
      { id: 'm1', title: 'Setup server and API endpoints', completed: true },
      { id: 'm2', title: 'Design mobile-first dashboard', completed: true },
      { id: 'm3', title: 'Integrate Gemini assistant', completed: true },
      { id: 'm4', title: 'Conduct final review', completed: false },
    ],
  },
  {
    id: 'obj-2',
    title: 'Daily Focus & Physical Wellness Routine',
    category: 'Personal Growth',
    description: 'Sustain deep work sessions, physical exercise, and daily task review.',
    progress: 66,
    targetDate: '2026-08-31',
    status: 'On Track',
    milestones: [
      { id: 'm5', title: 'Log focus timer sessions', completed: true },
      { id: 'm6', title: 'Maintain streak on morning review', completed: true },
      { id: 'm7', title: 'Clear high-priority open items', completed: false },
    ],
  },
];

export const INITIAL_NOTES: QuickNote[] = [
  {
    id: 'note-1',
    title: '⚡ OS Morning Briefing Notes',
    content: `### Executive Focus for Today
1. **Core Priority**: Keep task board updated and execute high-priority items first.
2. **Focus Timer**: Schedule 25-minute focus intervals for deep work.
3. **Review**: Check off completed objectives and backlog items.`,
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pinned: true,
  },
];

export const INITIAL_TOOLS: QuickTool[] = [
  { id: 't-voice-meet', name: 'Meeting Recorder', category: 'Voice AI', iconName: 'Mic', action: 'open-voice-meeting-recorder', badge: 'Voice AI' },
  { id: 't-task-summary', name: 'Task Auto-Summary', category: 'Productivity', iconName: 'FileSpreadsheet', action: 'open-task-auto-summary', badge: 'Summary' },
  { id: 't1', name: 'Plan My Day', category: 'Core', iconName: 'Terminal', action: 'plan-day', badge: 'AI Plan' },
  { id: 't-ws-keep', name: 'Google Keep', category: 'Workspace', iconName: 'StickyNote', action: 'open-workspace-keep', badge: 'Keep' },
  { id: 't-ws-gmail', name: 'Gmail Inbox', category: 'Workspace', iconName: 'Mail', action: 'open-workspace-gmail', badge: 'Gmail' },
  { id: 't-ws-contacts', name: 'Contacts', category: 'Workspace', iconName: 'Users', action: 'open-workspace-contacts', badge: 'People' },
  { id: 't-ws-tasks', name: 'Google Tasks', category: 'Workspace', iconName: 'CheckSquare', action: 'open-workspace-tasks', badge: 'Google' },
  { id: 't-ws-picker', name: 'Drive Picker', category: 'Workspace', iconName: 'FolderOpen', action: 'open-workspace-picker', badge: 'Drive' },
  { id: 't2', name: 'Calendar & Agenda', category: 'Schedule', iconName: 'Calendar', action: 'open-calendar', badge: 'Today' },
  { id: 't3', name: 'Task Board', category: 'Productivity', iconName: 'CheckSquare', action: 'focus-tasks', badge: 'Tasks' },
  { id: 't4', name: 'Objectives', category: 'Strategy', iconName: 'Target', action: 'focus-objectives', badge: 'Goals' },
  { id: 't5', name: 'Focus Timer', category: 'Utility', iconName: 'Clock', action: 'focus-timer', badge: '25m' },
  { id: 't6', name: 'Quick Notes', category: 'Memory', iconName: 'FileText', action: 'focus-notes' },
  { id: 't7', name: 'User Profile', category: 'Account', iconName: 'User', action: 'open-profile', badge: 'Profile' },
];

export const INITIAL_SYSTEM_STATE: SystemState = {
  cpuUsage: 18,
  memoryUsage: 42,
  storageUsage: 64,
  focusScore: 92,
  streakDays: 14,
  activeFocusMode: false,
};

// Initial Media Player Items (Sample royalty-free audio and video streams)
export const INITIAL_MEDIA_ITEMS: import('../types').MediaItem[] = [
  {
    id: 'media-1',
    title: 'Ambient Deep Focus & Binaural Flow',
    artist: 'Personal OS Audio Lab',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/612/612608_5674468-lq.mp3',
    duration: 184,
    lastPosition: 45,
    favorite: true,
    coverArtUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    addedAt: new Date().toISOString(),
    source: 'sample',
  },
  {
    id: 'media-2',
    title: 'Cyberpunk Lo-Fi Productivity Beats',
    artist: 'Synthetica Soundscapes',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/680/680373_11861866-lq.mp3',
    duration: 215,
    lastPosition: 0,
    favorite: true,
    coverArtUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    addedAt: new Date().toISOString(),
    source: 'sample',
  },
  {
    id: 'media-3',
    title: 'Nature Rain & Alpha Waves Calm',
    artist: 'Atmosphere Studio',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/531/531947_11234907-lq.mp3',
    duration: 140,
    lastPosition: 12,
    favorite: false,
    coverArtUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
    addedAt: new Date().toISOString(),
    source: 'sample',
  },
  {
    id: 'media-4',
    title: 'Big Buck Bunny (4K Ultra HD Sample Video)',
    artist: 'Blender Open Movie Project',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596,
    lastPosition: 60,
    favorite: true,
    coverArtUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80',
    addedAt: new Date().toISOString(),
    source: 'sample',
  },
  {
    id: 'media-5',
    title: 'Tears of Steel (Sci-Fi Video Showcase)',
    artist: 'Blender Foundation VFX',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734,
    lastPosition: 145,
    favorite: false,
    coverArtUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80',
    addedAt: new Date().toISOString(),
    source: 'sample',
  },
];

export const INITIAL_PLAYLISTS: import('../types').MediaPlaylist[] = [
  {
    id: 'pl-fav',
    name: '⭐ Starred Favorites',
    description: 'Favorite focus tracks and pinned videos',
    trackIds: ['media-1', 'media-2', 'media-4'],
    createdAt: new Date().toISOString(),
    isSystemFavorite: true,
  },
  {
    id: 'pl-focus',
    name: '🧠 Deep Work & Alpha Flow',
    description: 'High energy acoustic and atmospheric binaural beats',
    trackIds: ['media-1', 'media-2', 'media-3'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pl-video',
    name: '🎬 Cinema & Presentation Demos',
    description: 'High definition MP4 video streams',
    trackIds: ['media-4', 'media-5'],
    createdAt: new Date().toISOString(),
  },
];

// Initial Browser Bookmarks
export const INITIAL_BOOKMARKS: import('../types').WebBookmark[] = [
  { id: 'bm-1', title: 'Google Search', url: 'https://www.google.com', category: 'Productivity', favicon: '🔍', createdAt: new Date().toISOString() },
  { id: 'bm-2', title: 'Wikipedia Encyclopedia', url: 'https://en.wikipedia.org', category: 'Tech', favicon: '📚', createdAt: new Date().toISOString() },
  { id: 'bm-3', title: 'GitHub Code & Open Source', url: 'https://github.com', category: 'Tech', favicon: '🐙', createdAt: new Date().toISOString() },
  { id: 'bm-4', title: 'DuckDuckGo Privacy Search', url: 'https://duckduckgo.com', category: 'Productivity', favicon: '🦆', createdAt: new Date().toISOString() },
  { id: 'bm-5', title: 'Hacker News Tech Trends', url: 'https://news.ycombinator.com', category: 'News', favicon: '⚡', createdAt: new Date().toISOString() },
  { id: 'bm-6', title: 'MDN Web Developer Docs', url: 'https://developer.mozilla.org', category: 'Tech', favicon: '📖', createdAt: new Date().toISOString() },
  { id: 'bm-7', title: 'DevDocs Offline API Search', url: 'https://devdocs.io', category: 'Tech', favicon: '💻', createdAt: new Date().toISOString() },
  { id: 'bm-8', title: 'Can I Use Browser Support', url: 'https://caniuse.com', category: 'Tech', favicon: '🌐', createdAt: new Date().toISOString() },
];

// Initial Documents
export const INITIAL_DOCUMENTS: import('../types').DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Personal OS v2.0 - Executive Strategy & Architecture Brief',
    format: 'markdown',
    tags: ['Architecture', 'Roadmap', 'Executive'],
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isStarred: true,
    content: `# Personal OS v2.0 Architecture & Strategy

## Executive Summary
Personal OS is designed as a unified command center combining operational agility, local resilience, and high-performance workflows.

### 🚀 Key Capabilities Overview
- **VLC-Style In-App Media Player**: 200% volume amplification, dual vertical swipe gestures for brightness & volume, lockscreen playback, and reactive Web Audio frequency visualizers.
- **In-App Web Browser**: Multi-tab browsing, reader mode, responsive device viewports, and interactive safe search sandbox.
- **Full Document & PDF Suite**: Multi-format text and code editing, auto-save engine, rich document export, and live markdown preview.
- **Multi-Thread AI Workspace**: Structured thread management, customizable project workspaces, smart suggestions, and 1-click ZIP/Word exports.
- **Universal Quick Notes & Screenshot Tool**: Floating accessibility from any screen without interrupting focus.

---

## 🎯 Milestones & Action Matrix
| Phase | Focus Area | Status | Target Date |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Media & Visualizer Integration | ✅ Complete | Today |
| **Phase 2** | Full In-App Web Browser | ✅ Complete | Today |
| **Phase 3** | Document Editor & PDF Reader | ✅ Complete | Today |
| **Phase 4** | Global Screenshot & Voice Capture | ✅ Complete | Today |

> *Tip: This document auto-saves continuously while you edit.*`,
  },
  {
    id: 'doc-2',
    title: 'Q3 Product Roadmap & Feature Specifications',
    format: 'richtext',
    tags: ['Product', 'Specs'],
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isStarred: true,
    content: `<h2>Product Roadmap &amp; Feature Specifications</h2>
<p>This document details our planned deliverables, system architecture requirements, and operational benchmarks for the upcoming quarter.</p>
<h3>Core Tenets</h3>
<ul>
  <li><strong>Instant Local Accessibility</strong>: Zero latency response times with cached offline states.</li>
  <li><strong>Distraction-Free Workflows</strong>: Seamless floating notes and quick screenshot tools.</li>
  <li><strong>Comprehensive Media &amp; Web Navigation</strong>: High-fidelity audio/video player with 200% volume boost.</li>
</ul>
<p><em>Approved by Lead OS Architect &amp; Product Strategist.</em></p>`,
  },
  {
    id: 'doc-3',
    title: 'Standard Operating Procedures - Daily Review & Focus Habits',
    format: 'plain',
    tags: ['SOP', 'Habits'],
    lastModified: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isStarred: false,
    content: `STANDARD OPERATING PROCEDURES: DAILY FOCUS CADENCE

1. MORNING LAUNCHPAD (08:30 - 09:00)
   - Open Personal OS Dashboard
   - Review high-priority objectives
   - Start 25-minute Pomodoro focus block
   - Queue background audio in Media Player

2. MIDDAY STRATEGY REVIEW (12:30 - 13:00)
   - Check off completed tasks in Task Tracker
   - Sync Google Workspace & Calendar events
   - Use Document Editor to record key meeting minutes

3. EVENING RETROSPECTIVE (17:30 - 18:00)
   - Export critical AI project threads to Word/ZIP
   - Capture daily state screenshot
   - Set up tomorrow's high-priority items`,
  },
];

// Initial Chat Workspaces
export const INITIAL_WORKSPACES: import('../types').ChatWorkspace[] = [
  { id: 'ws-gen', name: 'General Assistant', color: '#06b6d4', icon: 'Sparkles', createdAt: new Date().toISOString() },
  { id: 'ws-prod', name: 'Productivity & Tasks', color: '#8b5cf6', icon: 'CheckSquare', createdAt: new Date().toISOString() },
  { id: 'ws-strat', name: 'Strategy & Objectives', color: '#ec4899', icon: 'Target', createdAt: new Date().toISOString() },
  { id: 'ws-dev', name: 'Dev & Engineering', color: '#10b981', icon: 'Code', createdAt: new Date().toISOString() },
];

export const INITIAL_CHAT_THREADS: import('../types').ChatThread[] = [
  {
    id: 'thread-1',
    title: '⚡ Daily Planning & Priority Execution',
    workspaceId: 'ws-gen',
    pinned: true,
    smartSuggestions: [
      'Break down my top objective into 3 actionable milestones',
      'Suggest a 25-minute Pomodoro schedule for today',
      'Generate a summary of high-priority tasks',
      'Draft an executive status update for my team',
    ],
    messages: [
      {
        id: 'msg-1',
        role: 'assistant',
        text: 'Hello Antonio! I am your Personal OS AI Assistant powered by Gemini. You have active objectives and operational tasks queued. How would you like to direct your focus today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'thread-2',
    title: '🧠 Architecture Sync & System Specifications',
    workspaceId: 'ws-dev',
    pinned: false,
    smartSuggestions: [
      'Analyze system memory and CPU consumption',
      'Review offline sync queue error handling',
      'Draft technical spec for Web Audio visualizer',
    ],
    messages: [
      {
        id: 'msg-2-1',
        role: 'assistant',
        text: 'Welcome to the Dev & Engineering Workspace! Ready to discuss system architecture, API schemas, or code optimizations.',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const INITIAL_POMODORO_SETTINGS: import('../types').PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  soundEnabled: true,
};

export const INITIAL_QUICK_NOTES: QuickNote[] = INITIAL_NOTES;

export const INITIAL_NOTIFICATIONS: import('../types').AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Personal OS v2.1 Online',
    message: 'Media Player, In-App Web Browser, Document Editor, and Multi-Thread AI are active.',
    type: 'info',
    category: 'system',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Morning Focus Block Ready',
    message: '25-minute deep work block with binaural audio ready in Pomodoro.',
    type: 'info',
    category: 'pomodoro',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  },
];


