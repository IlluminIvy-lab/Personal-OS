import React, { useState } from 'react';
import {
  GripVertical,
  Maximize2,
  Minimize2,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Check,
} from 'lucide-react';
import { DashboardWidgetConfig, DashboardWidgetId, QuickTool, SystemState, TaskItem, ObjectiveItem, GoogleCalendarEvent } from '../types';
import { QuickToolsGrid } from './QuickToolsGrid';
import { SystemPulseWidget } from './SystemPulseWidget';
import { TaskTracker } from './TaskTracker';
import { HighPriorityObjectives } from './HighPriorityObjectives';
import { GoogleCalendarWidget } from './GoogleCalendarWidget';
import { GoogleDriveWidget } from './GoogleDriveWidget';
import { FocusTimerWidget } from './FocusTimerWidget';
import { QuickScratchpad } from './QuickScratchpad';
import { DashboardCustomizerModal } from './DashboardCustomizerModal';

interface DashboardGridProps {
  widgets: DashboardWidgetConfig[];
  setWidgets?: React.Dispatch<React.SetStateAction<DashboardWidgetConfig[]>>;
  onLayoutChange?: (widgets: DashboardWidgetConfig[]) => void;
  onResetLayout: () => void;
  // Widget subprops
  tools: QuickTool[];
  onToolAction?: (action: string) => void;
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  objectives: ObjectiveItem[];
  setObjectives: React.Dispatch<React.SetStateAction<ObjectiveItem[]>>;
  calendarEvents?: GoogleCalendarEvent[];
  setCalendarEvents?: (events: GoogleCalendarEvent[]) => void;
  scratchpad: string;
  setScratchpad: (val: string) => void;
  onAskAi?: (prompt: string) => void;
  isOnline?: boolean;
  onQueueOfflineItem?: (type: string, data: any) => void;
  onOpenVoiceMeetingRecorder?: () => void;
  onOpenBackupModal?: () => void;
  onOpenAiChat?: () => void;
  onOpenCalendarTab?: () => void;
  onOpenWorkspaceTab?: () => void;
  onOpenFilesTab?: () => void;
  onOpenProfileTab?: () => void;
  onOpenCloudflareModal?: () => void;
  onOpenBrowserTab?: () => void;
  onOpenDocsTab?: () => void;
  onOpenMediaTab?: () => void;
  onOpenPomodoroModal?: () => void;
  onOpenScreenshotModal?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenQuickNotesModal?: () => void;
  // Section refs for anchor navigation
  taskRef?: React.RefObject<HTMLDivElement>;
  objRef?: React.RefObject<HTMLDivElement>;
  timerRef?: React.RefObject<HTMLDivElement>;
  notesRef?: React.RefObject<HTMLDivElement>;
  systemRef?: React.RefObject<HTMLDivElement>;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  setWidgets,
  onLayoutChange,
  onResetLayout,
  tools,
  onToolAction,
  systemState,
  setSystemState,
  tasks,
  setTasks,
  objectives,
  setObjectives,
  calendarEvents = [],
  setCalendarEvents = (_events: GoogleCalendarEvent[]) => {},
  scratchpad,
  setScratchpad,
  onAskAi = (_prompt: string) => {},
  isOnline,
  onQueueOfflineItem,
  onOpenVoiceMeetingRecorder,
  onOpenBackupModal,
  onOpenAiChat,
  onOpenCalendarTab,
  onOpenWorkspaceTab,
  onOpenFilesTab,
  onOpenProfileTab,
  onOpenCloudflareModal,
  onOpenBrowserTab,
  onOpenDocsTab,
  onOpenMediaTab,
  onOpenPomodoroModal,
  onOpenScreenshotModal,
  onOpenNotificationsModal,
  onOpenQuickNotesModal,
  taskRef,
  objRef,
  timerRef,
  notesRef,
  systemRef,
}) => {
  const [draggedId, setDraggedId] = useState<DashboardWidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<DashboardWidgetId | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const safeSetWidgets = (updater: React.SetStateAction<DashboardWidgetConfig[]>) => {
    if (setWidgets) {
      setWidgets(updater);
    } else if (onLayoutChange) {
      if (typeof updater === 'function') {
        onLayoutChange(updater(widgets));
      } else {
        onLayoutChange(updater);
      }
    }
  };

  const handleToolAction = (action: string) => {
    if (typeof onToolAction === 'function') {
      onToolAction(action);
      return;
    }
    // Fallback actions
    switch (action) {
      case 'open-voice-meeting-recorder':
        onOpenVoiceMeetingRecorder?.();
        break;
      case 'plan-day':
        onOpenAiChat?.();
        break;
      case 'open-calendar':
        onOpenCalendarTab?.();
        break;
      case 'open-profile':
        onOpenProfileTab?.();
        break;
      case 'open-browser':
        onOpenBrowserTab?.();
        break;
      case 'open-docs':
        onOpenDocsTab?.();
        break;
      case 'open-media':
        onOpenMediaTab?.();
        break;
      case 'open-files':
        onOpenFilesTab?.();
        break;
      case 'focus-timer':
        onOpenPomodoroModal?.();
        break;
      case 'focus-notes':
        onOpenQuickNotesModal?.();
        break;
      case 'open-backup':
        onOpenBackupModal?.();
        break;
      case 'open-cloudflare':
        onOpenCloudflareModal?.();
        break;
      default:
        break;
    }
  };

  const visibleWidgets = widgets.filter((w) => w.visible);
  const hiddenCount = widgets.filter((w) => !w.visible).length;

  const handleDragStart = (e: React.DragEvent, id: DashboardWidgetId) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: DashboardWidgetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: DashboardWidgetId) => {
    e.preventDefault();
    const sourceId = draggedId || (e.dataTransfer.getData('text/plain') as DashboardWidgetId);
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    safeSetWidgets((prev) => {
      const sourceIndex = prev.findIndex((w) => w.id === sourceId);
      const targetIndex = prev.findIndex((w) => w.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const moveWidget = (id: DashboardWidgetId, direction: 'up' | 'down') => {
    safeSetWidgets((prev) => {
      const index = prev.findIndex((w) => w.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const toggleColSpan = (id: DashboardWidgetId) => {
    safeSetWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w))
    );
  };

  const hideWidget = (id: DashboardWidgetId) => {
    safeSetWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: false } : w))
    );
  };

  const renderWidgetContent = (id: DashboardWidgetId) => {
    switch (id) {
      case 'launchpad':
        return <QuickToolsGrid tools={tools} onToolAction={handleToolAction} />;
      case 'systemPulse':
        return (
          <div ref={systemRef}>
            <SystemPulseWidget systemState={systemState} setSystemState={setSystemState} />
          </div>
        );
      case 'taskTracker':
        return (
          <div ref={taskRef}>
            <TaskTracker
              tasks={tasks}
              setTasks={setTasks}
              onAskAiForTaskAnalysis={onAskAi}
            />
          </div>
        );
      case 'objectives':
        return (
          <div ref={objRef}>
            <HighPriorityObjectives
              objectives={objectives}
              setObjectives={setObjectives}
              onAskAiForObjectiveAdvice={onAskAi}
            />
          </div>
        );
      case 'googleCalendar':
        return (
          <GoogleCalendarWidget
            tasks={tasks}
            onEventsFetched={(evts) => setCalendarEvents(evts)}
          />
        );
      case 'googleDrive':
        return <GoogleDriveWidget />;
      case 'focusTimer':
        return (
          <div ref={timerRef}>
            <FocusTimerWidget
              onSessionComplete={() => {
                setSystemState((prev) => ({
                  ...prev,
                  focusScore: Math.min(100, prev.focusScore + 2),
                }));
              }}
            />
          </div>
        );
      case 'scratchpad':
        return (
          <div ref={notesRef}>
            <QuickScratchpad
              content={scratchpad}
              setContent={setScratchpad}
              onSummarizeWithAi={(text) =>
                onAskAi(
                  `Please summarize the following scratchpad notes and extract any actionable to-do items:\n\n${text}`
                )
              }
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Dashboard Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080e1c] border border-slate-800 px-4 py-2.5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-bold text-white">Interactive Workspace</span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-sans">
            • Drag any widget to reposition or customize spans
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1.5 hover:bg-amber-500/20 transition-colors"
            >
              <span>{hiddenCount} Hidden Widget{hiddenCount === 1 ? '' : 's'}</span>
            </button>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              isEditMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md glow-cyan'
                : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Done Reordering' : 'Rearrange Layout'}</span>
          </button>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize View</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.map((widget, index) => {
          const isDragging = draggedId === widget.id;
          const isOver = dragOverId === widget.id && draggedId !== widget.id;

          return (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 relative group/widget rounded-2xl ${
                widget.colSpan === 2 ? 'lg:col-span-2' : 'lg:col-span-1'
              } ${
                isDragging
                  ? 'opacity-40 scale-[0.98] border-2 border-dashed border-cyan-400'
                  : isOver
                  ? 'border-2 border-dashed border-cyan-400 ring-2 ring-cyan-500/20 scale-[1.01]'
                  : ''
              }`}
            >
              {/* Drag & Action Header Ribbon */}
              <div
                className={`flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono text-slate-400 backdrop-blur-sm transition-opacity ${
                  isEditMode ? 'opacity-100 ring-1 ring-cyan-500/40 bg-slate-900/90' : 'opacity-0 group-hover/widget:opacity-100'
                }`}
              >
                <div
                  className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-cyan-300 select-none py-0.5"
                  title="Drag and drop to reposition widget"
                >
                  <GripVertical className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold">{widget.title}</span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">(Drag to move)</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveWidget(widget.id, 'up')}
                    title="Move earlier"
                    className="p-1 hover:text-cyan-400 disabled:opacity-30 text-slate-400"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={index === visibleWidgets.length - 1}
                    onClick={() => moveWidget(widget.id, 'down')}
                    title="Move later"
                    className="p-1 hover:text-cyan-400 disabled:opacity-30 text-slate-400"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => toggleColSpan(widget.id)}
                    title={widget.colSpan === 2 ? 'Collapse to half width' : 'Expand to full width'}
                    className="p-1 hover:text-purple-400 text-slate-400 ml-1"
                  >
                    {widget.colSpan === 2 ? (
                      <Minimize2 className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => hideWidget(widget.id)}
                    title="Hide widget from dashboard"
                    className="p-1 hover:text-rose-400 text-slate-400 ml-1"
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Real Widget Node */}
              <div>{renderWidgetContent(widget.id)}</div>
            </div>
          );
        })}
      </div>

      {/* Modal Customizer */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={widgets}
        setWidgets={safeSetWidgets}
        onResetLayout={onResetLayout}
      />
    </div>
  );
};
