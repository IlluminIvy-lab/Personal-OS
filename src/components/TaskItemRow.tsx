import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Clock,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';
import { AutoLinkText } from './AutoLinkText';

interface TaskItemRowProps {
  task: TaskItem;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  getPriorityBadgeClass: (priority: TaskPriority) => string;
}

export const TaskItemRow: React.FC<TaskItemRowProps> = ({
  task,
  onToggleStatus,
  onDelete,
  getPriorityBadgeClass,
}) => {
  const isCompleted = task.status === 'Completed';
  const isInProgress = task.status === 'In Progress';

  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const SWIPE_THRESHOLD = -85; // threshold in pixels to trigger deletion or reveal action
  const MAX_SWIPE = -140;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Detect if the user is swiping horizontally or scrolling vertically
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        isHorizontalSwipe.current = true;
      } else if (Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = false;
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      // Prevent browser pull/scroll when swiping item horizontally
      if (e.cancelable && Math.abs(deltaX) > 10) {
        // e.preventDefault();
      }

      // Allow dragging to the left (negative deltaX)
      if (deltaX < 0) {
        const dampenedOffset = Math.max(MAX_SWIPE, deltaX);
        setDragOffset(dampenedOffset);
      } else {
        // slight right resistance
        setDragOffset(Math.min(15, deltaX * 0.2));
      }
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (dragOffset <= SWIPE_THRESHOLD) {
      // Swiped past threshold -> trigger smooth deletion
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(task.id);
      }, 250);
    } else {
      // Reset position
      setDragOffset(0);
    }
    isHorizontalSwipe.current = null;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
        isDeleting ? 'opacity-0 scale-95 max-h-0 mb-0 py-0' : 'max-h-40'
      }`}
    >
      {/* Background Revealed Delete Zone */}
      <div
        className={`absolute inset-0 bg-gradient-to-l from-rose-600 via-rose-700 to-rose-900 rounded-xl flex items-center justify-end px-5 transition-colors ${
          dragOffset < SWIPE_THRESHOLD ? 'from-rose-500 to-rose-600 shadow-inner' : ''
        }`}
      >
        <div className="flex items-center gap-2 text-white font-mono text-xs font-bold select-none">
          <span>{dragOffset < SWIPE_THRESHOLD ? 'Release to Delete' : 'Swipe to Delete'}</span>
          <Trash2 className={`w-4 h-4 transition-transform ${dragOffset < SWIPE_THRESHOLD ? 'scale-125' : ''}`} />
        </div>
      </div>

      {/* Foreground Swipeable Task Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 group flex items-center justify-between gap-3 p-3 rounded-xl border select-none transition-colors ${
          isCompleted
            ? 'bg-[#080f1e]/90 border-slate-800/60 opacity-65'
            : isInProgress
            ? 'bg-[#0b1428] border-indigo-500/40 shadow-sm shadow-indigo-950/40'
            : 'bg-[#080e1c] border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleStatus(task.id)}
            className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            {isCompleted ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs sm:text-sm font-medium leading-snug break-words ${
                  isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                <AutoLinkText text={task.title} />
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]">
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${getPriorityBadgeClass(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-mono text-[10px]">
                {task.category}
              </span>
              <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-slate-600" /> {task.estimatedMinutes}m • {task.dueDate}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isCompleted
                    ? 'text-emerald-400 bg-emerald-950/30'
                    : isInProgress
                    ? 'text-indigo-400 bg-indigo-950/30'
                    : 'text-slate-400'
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Hover / Direct Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-all shrink-0 cursor-pointer"
          title="Delete Task (or swipe left on mobile)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
