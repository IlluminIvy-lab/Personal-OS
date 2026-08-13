import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  Clock,
  Sparkles,
  Tag,
  ChevronDown,
  FileSpreadsheet,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { TaskItem, TaskCategory, TaskPriority, TaskStatus } from '../types';
import { AutoLinkText } from './AutoLinkText';
import { VoiceInputButton } from './VoiceInputButton';
import { TaskItemRow } from './TaskItemRow';
import { TaskAutoSummaryModal } from './TaskAutoSummaryModal';

interface TaskTrackerProps {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  onAskAiForTaskAnalysis: (prompt: string) => void;
}

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks,
  setTasks,
  onAskAiForTaskAnalysis,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isAutoSummaryOpen, setIsAutoSummaryOpen] = useState(false);

  // Undo delete notification state
  const [lastDeletedTask, setLastDeletedTask] = useState<TaskItem | null>(null);
  const undoTimeoutRef = useRef<any>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Work');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newDueDate, setNewDueDate] = useState('Today');
  const [newEstMinutes, setNewEstMinutes] = useState(30);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: TaskStatus =
            t.status === 'Completed' ? 'Todo' : t.status === 'Todo' ? 'In Progress' : 'Completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (taskToDelete) {
      setLastDeletedTask(taskToDelete);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setLastDeletedTask(null);
      }, 5000);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUndoDelete = () => {
    if (lastDeletedTask) {
      setTasks((prev) => [lastDeletedTask, ...prev]);
      setLastDeletedTask(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Todo',
      dueDate: newDueDate,
      estimatedMinutes: Number(newEstMinutes) || 30,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPriorityBadgeClass = (p: TaskPriority) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
      case 'High':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
      case 'Medium':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80';
      case 'Low':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">
              Daily System & Tasks
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/40 text-cyan-300 border border-cyan-500/30">
              {completedCount}/{totalCount} Done
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Operational task execution • Mobile swipe-to-delete active
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* AI Auto Summary Trigger */}
          <button
            onClick={() => setIsAutoSummaryOpen(true)}
            title="Open Executive Task Auto-Summary Modal"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium transition-all shadow-sm glow-cyan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Auto Summary</span>
          </button>

          {/* AI Prioritize Trigger */}
          <button
            onClick={() =>
              onAskAiForTaskAnalysis(
                'Please analyze my open task list, group them by priority, and suggest an optimal focus schedule for today.'
              )
            }
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all glow-purple"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Prioritize</span>
          </button>

          {/* Add Task Trigger */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
          <span>Task Completion Progress</span>
          <span className="font-semibold text-cyan-400">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Add Task Form Collapsible */}
      {isAdding && (
        <form
          onSubmit={addTask}
          className="mb-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3 transition-all"
        >
          <h3 className="text-xs font-semibold text-indigo-300 font-mono uppercase tracking-wider">
            Create New Task
          </h3>
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task description (e.g. Audit server logs for memory leaks)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <VoiceInputButton
              onTranscript={(text, isFinal) => {
                if (isFinal) {
                  setNewTitle((prev) => (prev ? `${prev} ${text}` : text));
                } else if (!newTitle) {
                  setNewTitle(text);
                }
              }}
              size="md"
              variant="cyan"
              title="Dictate task description"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="System">System</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
              <input
                type="text"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                placeholder="Today, Tomorrow..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Est. Mins</label>
              <input
                type="number"
                min={5}
                step={5}
                value={newEstMinutes}
                onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Health">Health</option>
            <option value="System">System</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Mobile Usability Swipe Hint */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-1 px-1 sm:hidden">
        <span className="flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-cyan-400" />
          <span>Swipe task left to delete</span>
        </span>
        <span>{filteredTasks.length} items</span>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
            No tasks found matching current filters.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <TaskItemRow
              key={t.id}
              task={t}
              onToggleStatus={toggleTaskStatus}
              onDelete={deleteTask}
              getPriorityBadgeClass={getPriorityBadgeClass}
            />
          ))
        )}
      </div>

      {/* Undo Delete Toast Notification */}
      {lastDeletedTask && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-rose-500/40 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono truncate">
            <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">Deleted: "{lastDeletedTask.title}"</span>
          </div>

          <button
            onClick={handleUndoDelete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Executive Task Auto-Summary Modal */}
      <TaskAutoSummaryModal
        isOpen={isAutoSummaryOpen}
        onClose={() => setIsAutoSummaryOpen(false)}
        tasks={tasks}
        onOpenAiAssistantWithPrompt={onAskAiForTaskAnalysis}
      />
    </div>
  );
};
