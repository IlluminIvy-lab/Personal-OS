import { DashboardWidgetConfig } from '../types';

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'launchpad',
    title: 'Operational Launchpad',
    description: 'Quick system actions, Workspace shortcuts & tool runner',
    icon: 'Terminal',
    colSpan: 2,
    visible: true,
  },
  {
    id: 'systemPulse',
    title: 'System Diagnostics & Telemetry',
    description: 'CPU, RAM, Focus score & streak counters',
    icon: 'Cpu',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'taskTracker',
    title: 'Active Tasks & Priority Pipeline',
    description: 'Task board, status transitions & AI priority breakdown',
    icon: 'CheckSquare',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'objectives',
    title: 'High-Priority Objectives',
    description: 'Quarterly milestones, strategic roadmap & progress tracking',
    icon: 'Target',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'googleCalendar',
    title: 'Schedule & Calendar Agenda',
    description: 'Google Calendar sync & daily event timeline',
    icon: 'Calendar',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'googleDrive',
    title: 'Google Drive Storage Sync',
    description: 'Cloud document previews & drive file management',
    icon: 'HardDrive',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'focusTimer',
    title: 'Deep Focus & Pomodoro Engine',
    description: 'Interval timer, focus shield & productivity streak booster',
    icon: 'Clock',
    colSpan: 1,
    visible: true,
  },
  {
    id: 'scratchpad',
    title: 'Executive Scratchpad & Notes',
    description: 'Instant markdown notes, voice dictation & speech synthesis',
    icon: 'FileText',
    colSpan: 1,
    visible: true,
  },
];

const STORAGE_KEY = 'personal_os_dashboard_widgets_v2';

export function loadSavedDashboardWidgets(): DashboardWidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_WIDGETS;
    const parsed: DashboardWidgetConfig[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DASHBOARD_WIDGETS;

    // Ensure all default widget IDs exist even if user had an older config
    const savedIds = new Set(parsed.map((w) => w.id));
    const missing = DEFAULT_DASHBOARD_WIDGETS.filter((def) => !savedIds.has(def.id));
    return [...parsed, ...missing];
  } catch (err) {
    console.warn('Failed to load saved dashboard layout:', err);
    return DEFAULT_DASHBOARD_WIDGETS;
  }
}

export function saveDashboardWidgets(widgets: DashboardWidgetConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch (err) {
    console.warn('Failed to save dashboard layout:', err);
  }
}
