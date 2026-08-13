import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ListTodo,
  Copy,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';
import { getApiUrl } from '../lib/api';

interface TaskAutoSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onOpenAiAssistantWithPrompt?: (prompt: string) => void;
}

export const TaskAutoSummaryModal: React.FC<TaskAutoSummaryModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenAiAssistantWithPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string>('');

  const completed = tasks.filter((t) => t.status === 'Completed');
  const inProgress = tasks.filter((t) => t.status === 'In Progress');
  const todo = tasks.filter((t) => t.status === 'Todo');
  const critical = tasks.filter((t) => t.priority === 'Critical' && t.status !== 'Completed');
  const high = tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed');

  const totalMinutes = tasks.reduce((acc, t) => acc + (t.status !== 'Completed' ? t.estimatedMinutes : 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

  // Category breakdown
  const categoryCounts = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleGenerateAiExecutiveSummary = async () => {
    setIsGeneratingAi(true);
    setAiSummaryText('');

    const promptPayload = {
      messages: [
        {
          role: 'user',
          content: `Please generate a high-level Executive Task Auto-Summary and actionable prioritization breakdown for my active workload:
Total tasks: ${tasks.length}
Completed: ${completed.length} (${completionRate}%)
In Progress: ${inProgress.length}
Pending Todo: ${todo.length}
Critical Priority Tasks: ${critical.map((t) => t.title).join(', ') || 'None'}
High Priority Tasks: ${high.map((t) => t.title).join(', ') || 'None'}
Estimated Work Remaining: ${totalHours} hours
Full Tasks List:
${tasks.map((t) => `- [${t.status}] [${t.priority}] ${t.title} (${t.category}, ${t.estimatedMinutes}m)`).join('\n')}

Format as:
1. Executive Workload Status (2-3 sentences)
2. Immediate Priority Focus (Top 3 tasks to execute first)
3. Bottlenecks & Risk Mitigation
4. Estimated Completion Horizon`,
        },
      ],
      systemInstruction:
        'You are Personal OS Executive AI. Provide concise, sharp, professional productivity analysis with Markdown bullet points and bold highlights.',
    };

    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiSummaryText(data.text || 'Summary generated successfully.');
    } catch {
      // Fallback local generated executive summary
      const localSummary = `### Executive Workload Snapshot
- **Workload Status**: ${tasks.length} total tasks with a **${completionRate}% completion rate**. ${todo.length} tasks remain in queue, with **${totalHours} hours** of estimated active effort remaining.
- **Critical Focus Required**: ${
        critical.length > 0
          ? `${critical.length} critical items require urgent focus: ${critical.map((c) => c.title).slice(0, 2).join(', ')}.`
          : 'No critical blockers identified in current sprint.'
      }
- **In-Flight Momentum**: ${inProgress.length} tasks currently in progress. Prioritize closing open loops before pulling new backlog items.
- **Top Recommended Action**: Complete "${critical[0]?.title || high[0]?.title || todo[0]?.title || 'Open tasks'}" during your next dedicated focus block.`;
      setAiSummaryText(localSummary);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen && !aiSummaryText && tasks.length > 0) {
      handleGenerateAiExecutiveSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const textToCopy =
      aiSummaryText ||
      `Tasks Auto-Summary:
Total Tasks: ${tasks.length} | Completed: ${completed.length} (${completionRate}%)
Remaining Work: ~${totalHours} hours
Critical Items: ${critical.map((t) => t.title).join(', ') || 'None'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Executive Task Auto-Summary
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Automated workload analysis & sprint telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5 text-cyan-400" /> Completion
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {completionRate}%
              </div>
              <div className="text-[10px] text-slate-500">
                {completed.length} of {tasks.length} done
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Backlog Effort
              </div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                ~{totalHours} hrs
              </div>
              <div className="text-[10px] text-slate-500">
                {totalMinutes} estimated mins
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Critical / High
              </div>
              <div className="text-lg font-bold font-mono text-rose-300 mt-1">
                {critical.length + high.length}
              </div>
              <div className="text-[10px] text-rose-400/80">
                {critical.length} critical priority
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> In Flight
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                {inProgress.length}
              </div>
              <div className="text-[10px] text-slate-500">Active WIP items</div>
            </div>
          </div>

          {/* AI Generated Intelligence Section */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/20 to-slate-900/60 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-semibold uppercase text-purple-300 tracking-wider">
                  AI Auto-Analysis & Next Steps
                </span>
              </div>
              <button
                onClick={handleGenerateAiExecutiveSummary}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Analyzing...' : 'Refresh AI'}</span>
              </button>
            </div>

            {isGeneratingAi ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                <p className="text-xs text-slate-400 font-mono animate-pulse">
                  Synthesizing task dependencies & priority paths...
                </p>
              </div>
            ) : aiSummaryText ? (
              <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                {aiSummaryText}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Click refresh to generate AI summary.</p>
            )}
          </div>

          {/* Category Spread */}
          <div>
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Workload by Domain
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2"
                >
                  <span className="font-semibold text-cyan-400">{cat}</span>
                  <span className="text-slate-500">•</span>
                  <span>{count} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenAiAssistantWithPrompt && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAiAssistantWithPrompt(
                    'Please review my auto-summary and help me organize my next 2-hour deep work sprint based on the highest priority items.'
                  );
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all glow-purple"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discuss with AI Assistant</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
