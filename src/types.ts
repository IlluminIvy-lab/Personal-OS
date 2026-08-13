export type TaskCategory = 'Work' | 'Personal' | 'Health' | 'System';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  estimatedMinutes?: number;
  tags?: string[];
  createdAt: string;
}

export interface ObjectiveMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface ObjectiveItem {
  id: string;
  title: string;
  category: string;
  description: string;
  progress: number; // 0 to 100
  targetDate: string;
  status: 'On Track' | 'At Risk' | 'Achieved' | 'Planning';
  milestones: ObjectiveMilestone[];
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface QuickTool {
  id: string;
  name: string;
  category: string;
  iconName: string;
  url?: string;
  action?: string;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface SystemState {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  focusScore: number;
  streakDays: number;
  activeFocusMode: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
  location?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
}

export interface LocalCalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'Work' | 'Meeting' | 'Personal' | 'Deadline' | 'Health';
  location?: string;
  isGoogleSync?: boolean;
  completed?: boolean;
  createdAt: string;
  offlineQueued?: boolean;
}

export interface OfflineSyncItem {
  id: string;
  type: 'file_cache' | 'calendar_event' | 'task_update' | 'ai_query';
  action: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface BackgroundTask {
  id: string;
  title: string;
  type: 'ai_stream' | 'offline_sync' | 'file_cache' | 'timer';
  status: 'running' | 'queued' | 'completed' | 'failed';
  progress: number; // 0 to 100
  startedAt: string;
  details?: string;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatarUrl: string;
  roleTitle?: string;
  emergencyContact?: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    website: string;
    youtube?: string;
    instagram?: string;
    medium?: string;
    discord?: string;
  };
}

export interface LocalFileItem {
  id: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'text' | 'document' | 'other'
  size: number;
  uploadedAt: string;
  fileDataUrl: string; // base64 or blob URL
  description?: string;
  source: 'local' | 'drive';
}

export interface CloudflareMcpConfig {
  workerUrl: string;
  apiToken?: string;
  protocolMode: 'mcp' | 'rest' | 'vectorize';
  httpMethod?: 'auto' | 'POST' | 'GET';
  isEnabled: boolean;
  autoAiContext: boolean;
  lastConnectedAt?: string;
  lastStatus?: 'connected' | 'error' | 'untested';
  lastErrorDetails?: string;
}

// Google Workspace Integration Types
export interface GoogleContact {
  resourceName: string;
  etag?: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  emailAddresses: Array<{ value: string; type?: string; primary?: boolean }>;
  phoneNumbers: Array<{ value: string; type?: string; primary?: boolean }>;
  photos?: Array<{ url: string; default?: boolean }>;
  organizations?: Array<{ name?: string; title?: string; department?: string }>;
  addresses?: Array<{ formattedValue?: string; type?: string }>;
  biographies?: Array<{ value: string }>;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  bodyHtml?: string;
  bodyText?: string;
  isUnread?: boolean;
  isStarred?: boolean;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
  parent?: string;
  position?: string;
  taskListId?: string;
}

export interface GoogleKeepNote {
  id: string;
  title: string;
  bodyText?: string;
  listItems?: Array<{ text: string; isChecked: boolean }>;
  createTime?: string;
  updateTime?: string;
  trash?: boolean;
  color?: string;
}

export interface GooglePickerDocument {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

// Media Player Types
export type MediaType = 'audio' | 'video';

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  type: MediaType;
  url: string; // Blob URL, web URL, or sample URL
  duration: number; // in seconds
  lastPosition?: number; // saved playback position in seconds
  favorite?: boolean;
  coverArtUrl?: string;
  sizeBytes?: number;
  addedAt: string;
  source: 'local' | 'web' | 'sample';
}

export interface MediaPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: string;
  isSystemFavorite?: boolean;
}

// In-App Web Browser Types
export interface WebBrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isPinned?: boolean;
}

export interface WebBookmark {
  id: string;
  title: string;
  url: string;
  category: 'Tech' | 'AI & Tools' | 'Productivity' | 'News' | 'Custom';
  favicon?: string;
  createdAt: string;
}

export interface WebHistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: string;
}

// Document Editor Types
export type DocumentFormat = 'markdown' | 'richtext' | 'plain' | 'code' | 'pdf';

export interface DocumentItem {
  id: string;
  title: string;
  content: string; // Markdown / Text / HTML
  format: DocumentFormat;
  tags: string[];
  lastModified: string;
  createdAt: string;
  isStarred?: boolean;
  pdfUrl?: string; // For PDF viewing
}

// AI Chat Multi-Thread & Workspace Types
export interface ChatWorkspace {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  workspaceId: string;
  messages: ChatMessage[];
  pinned?: boolean;
  smartSuggestions?: string[];
  createdAt: string;
  updatedAt: string;
}

// App Notification Types
export type NotificationType = 'task' | 'tasks' | 'pomodoro' | 'ai' | 'media' | 'system' | 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category?: 'tasks' | 'pomodoro' | 'system' | 'media' | 'ai';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Pomodoro Settings
export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // intervals before long break
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}


// Dashboard Customization & Drag-and-Drop Types
export type DashboardWidgetId =
  | 'launchpad'
  | 'systemPulse'
  | 'taskTracker'
  | 'objectives'
  | 'googleCalendar'
  | 'googleDrive'
  | 'focusTimer'
  | 'scratchpad'
  | 'mediaPlayer'
  | 'quickNotes'
  | 'pomodoro';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  icon: string;
  colSpan: 1 | 2; // 1 = half/normal width, 2 = full width span
  visible: boolean;
}





