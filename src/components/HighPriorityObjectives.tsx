import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, Sparkles, Plus, ChevronRight, AlertTriangle, Trash2 } from 'lucide-react';
import { ObjectiveItem, ObjectiveMilestone } from '../types';
import { AutoLinkText } from './AutoLinkText';
import { VoiceInputButton } from './VoiceInputButton';

interface HighPriorityObjectivesProps {
  objectives: ObjectiveItem[];
  setObjectives: React.Dispatch<React.SetStateAction<ObjectiveItem[]>>;
  onAskAiForObjectiveAdvice: (prompt: string) => void;
}

export const HighPriorityObjectives: React.FC<HighPriorityObjectivesProps> = ({
  objectives,
  setObjectives,
  onAskAiForObjectiveAdvice,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(objectives[0]?.id || null);
  const [isAdding, setIsAdding] = useState(false);

  // New objective state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [newDesc, setNewDesc] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('2026-09-01');

  const toggleMilestone = (objId: string, milestoneId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id !== objId) return obj;

        const updatedMilestones = obj.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );

        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const totalCount = updatedMilestones.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          ...obj,
          progress: newProgress,
          milestones: updatedMilestones,
          status: newProgress === 100 ? 'Achieved' : obj.status === 'Achieved' ? 'On Track' : obj.status,
        };
      })
    );
  };

  const addObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newObj: ObjectiveItem = {
      id: `obj-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || 'Core high-priority objective.',
      progress: 0,
      targetDate: newTargetDate,
      status: 'Planning',
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Define scope & target metrics', completed: false },
        { id: `m-${Date.now()}-2`, title: 'Execute primary milestone sprint', completed: false },
      ],
    };

    setObjectives((prev) => [newObj, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const deleteObjective = (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  };

  const getStatusBadge = (status: ObjectiveItem['status']) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
      case 'Achieved':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/80 glow-purple';
      case 'At Risk':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
      case 'Planning':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">
              Priority Objectives
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/40 text-purple-300 border border-purple-500/30">
              {objectives.length} Goals
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            North star targets & milestone roadmap execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onAskAiForObjectiveAdvice(
                'Review my current high-priority objectives and milestone completion. Where should I focus my effort to de-risk delivery?'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all glow-purple"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Risk Audit</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all glow-purple"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form
          onSubmit={addObjective}
          className="mb-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3"
        >
          <h3 className="text-xs font-semibold text-indigo-300 font-mono uppercase tracking-wider">
            Define New Objective
          </h3>
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Objective Title (e.g. Expand OS Cloud Automation)..."
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
              title="Dictate objective title"
            />
          </div>
          <div>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description & success metric..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Date</label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Create Goal
            </button>
          </div>
        </form>
      )}

      {/* Objectives Accordion List */}
      <div className="space-y-3">
        {objectives.map((obj) => {
          const isExpanded = expandedId === obj.id;
          return (
            <div
              key={obj.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? 'bg-slate-950 border-indigo-500/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header bar */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-9 h-9 transform -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        className="stroke-slate-800"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        className="stroke-indigo-500 transition-all duration-500"
                        strokeWidth="3"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * obj.progress) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-slate-200">
                      {obj.progress}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">
                        <AutoLinkText text={obj.title} />
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${getStatusBadge(
                          obj.status
                        )}`}
                      >
                        {obj.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      <AutoLinkText text={obj.description} />
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteObjective(obj.id);
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Delete Objective"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-90 text-indigo-400' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Milestones Checklist */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Category: {obj.category}</span>
                    <span>Target: {obj.targetDate}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Key Milestones ({obj.milestones.filter((m) => m.completed).length}/
                      {obj.milestones.length})
                    </h4>
                    {obj.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        onClick={() => toggleMilestone(obj.id, milestone.id)}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-850 cursor-pointer text-xs transition-colors"
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span
                          className={`${
                            milestone.completed ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          <AutoLinkText text={milestone.title} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
