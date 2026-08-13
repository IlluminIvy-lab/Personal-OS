import React from 'react';
import {
  X,
  LayoutGrid,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
} from 'lucide-react';
import { DashboardWidgetConfig, DashboardWidgetId } from '../types';
import { DEFAULT_DASHBOARD_WIDGETS } from '../data/defaultWidgets';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  setWidgets: React.Dispatch<React.SetStateAction<DashboardWidgetConfig[]>>;
  onResetLayout: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  setWidgets,
  onResetLayout,
}) => {
  if (!isOpen) return null;

  const toggleVisibility = (id: DashboardWidgetId) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const toggleColSpan = (id: DashboardWidgetId) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w))
    );
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;

    const next = [...widgets];
    const [moved] = next.splice(index, 1);
    next.splice(newIndex, 0, moved);
    setWidgets(next);
  };

  const applyPreset = (preset: 'balanced' | 'tasks-first' | 'all-expanded') => {
    if (preset === 'balanced') {
      onResetLayout();
    } else if (preset === 'tasks-first') {
      const reordered = [...widgets].sort((a, b) => {
        const order = ['taskTracker', 'objectives', 'scratchpad', 'launchpad', 'systemPulse', 'googleCalendar', 'googleDrive', 'focusTimer'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      }).map((w) => ({ ...w, visible: true }));
      setWidgets(reordered);
    } else if (preset === 'all-expanded') {
      setWidgets((prev) => prev.map((w) => ({ ...w, colSpan: 2, visible: true })));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#050b14] border border-cyan-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl glow-cyan overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">Customize Dashboard Layout</h2>
              <p className="text-xs text-slate-400 font-sans">
                Drag, reorder, resize and customize widgets for your personal workflow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-black/20 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-400">Layout Presets:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyPreset('balanced')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-mono border border-slate-700/80 transition-colors"
            >
              Default Balanced
            </button>
            <button
              onClick={() => applyPreset('tasks-first')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-300 text-[11px] font-mono border border-slate-700/80 transition-colors"
            >
              Tasks First
            </button>
            <button
              onClick={() => applyPreset('all-expanded')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 text-[11px] font-mono border border-slate-700/80 transition-colors"
            >
              Full Width Stream
            </button>
          </div>
        </div>

        {/* Widget List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                widget.visible
                  ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    disabled={index === 0}
                    onClick={() => moveWidget(index, 'up')}
                    className="p-1 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === widgets.length - 1}
                    onClick={() => moveWidget(index, 'down')}
                    className="p-1 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-500"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white truncate">
                      {widget.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        widget.colSpan === 2
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {widget.colSpan === 2 ? 'Full Width (2 Col)' : 'Standard (1 Col)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{widget.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleColSpan(widget.id)}
                  title={widget.colSpan === 2 ? 'Collapse to 1 Column' : 'Expand to Full Width'}
                  className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                    widget.colSpan === 2
                      ? 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60'
                      : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  {widget.colSpan === 2 ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => toggleVisibility(widget.id)}
                  title={widget.visible ? 'Hide Widget' : 'Show Widget'}
                  className={`p-2 rounded-xl border text-xs font-mono transition-colors ${
                    widget.visible
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={onResetLayout}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
