import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  CheckSquare,
  Target,
  Calendar,
  FolderOpen,
  FileText,
  ChevronRight,
  Sparkles,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { TaskItem, ObjectiveItem, LocalCalendarEvent, LocalFileItem, CloudflareMcpConfig } from '../types';
import { AutoLinkText } from './AutoLinkText';
import { VoiceInputButton } from './VoiceInputButton';
import { getApiUrl } from '../lib/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  objectives: ObjectiveItem[];
  localEvents: LocalCalendarEvent[];
  localFiles: LocalFileItem[];
  scratchpad: string;
  onSelectResult: (type: 'task' | 'objective' | 'event' | 'file' | 'scratchpad', item?: any) => void;
  cloudflareConfig?: CloudflareMcpConfig;
  onOpenCloudflareModal?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  objectives,
  localEvents,
  localFiles,
  scratchpad,
  onSelectResult,
  cloudflareConfig,
  onOpenCloudflareModal,
}) => {
  const [query, setQuery] = useState('');
  const [cfResults, setCfResults] = useState<any>(null);
  const [isSearchingCf, setIsSearchingCf] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setCfResults(null);
    }
  }, [isOpen]);

  const handleSearchCloudflare = async () => {
    if (!query.trim() || !cloudflareConfig?.workerUrl) return;
    setIsSearchingCf(true);
    setCfResults(null);
    try {
      const res = await fetch(getApiUrl('/api/cloudflare/query'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerUrl: cloudflareConfig.workerUrl,
          apiToken: cloudflareConfig.apiToken,
          protocolMode: cloudflareConfig.protocolMode,
          query: query.trim(),
        }),
      });
      const data = await res.json();
      setCfResults(data);
    } catch (err: any) {
      setCfResults({ error: err.message || 'Search failed' });
    } finally {
      setIsSearchingCf(false);
    }
  };

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  const matchingTasks = cleanQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(cleanQuery) ||
          t.category.toLowerCase().includes(cleanQuery) ||
          t.priority.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingObjectives = cleanQuery
    ? objectives.filter(
        (o) =>
          o.title.toLowerCase().includes(cleanQuery) ||
          o.description.toLowerCase().includes(cleanQuery) ||
          o.milestones.some((m) => m.title.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchingEvents = cleanQuery
    ? localEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(cleanQuery) ||
          (e.description && e.description.toLowerCase().includes(cleanQuery)) ||
          (e.location && e.location.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchingFiles = cleanQuery
    ? localFiles.filter(
        (f) =>
          f.name.toLowerCase().includes(cleanQuery) ||
          (f.description && f.description.toLowerCase().includes(cleanQuery)) ||
          (f.tags && f.tags.some((tg) => tg.toLowerCase().includes(cleanQuery)))
      )
    : [];

  const matchScratchpad =
    cleanQuery && scratchpad.toLowerCase().includes(cleanQuery);

  const totalResults =
    matchingTasks.length +
    matchingObjectives.length +
    matchingEvents.length +
    matchingFiles.length +
    (matchScratchpad ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090e1d] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-black/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, objectives, agenda events, files & notes..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-sans"
          />
          <VoiceInputButton
            onTranscript={(text, isFinal) => {
              if (isFinal) {
                setQuery((prev) => (prev ? `${prev} ${text}` : text));
              } else if (!query) {
                setQuery(text);
              }
            }}
            size="sm"
            variant="cyan"
            title="Voice Search (Click to speak query)"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white text-xs font-mono px-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Count Bar */}
        <div className="px-5 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            {cleanQuery
              ? `Found ${totalResults} matching item(s)`
              : 'Type to start searching across Personal OS...'}
          </span>
          <span className="text-[10px] text-slate-500">ESC or click X to exit</span>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!cleanQuery && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono">
                Search tasks, objectives, agenda calendar events, uploaded files, or notes.
              </p>
            </div>
          )}

          {cleanQuery && totalResults === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-bold font-sans">No matching records found</p>
              <p className="text-xs font-mono text-slate-500">
                Try searching for keywords like "review", "meeting", "code", or "notes".
              </p>
            </div>
          )}

          {/* Matching Tasks */}
          {matchingTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Tasks ({matchingTasks.length})
              </h4>
              <div className="space-y-1.5">
                {matchingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onSelectResult('task', task);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left group transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                        <AutoLinkText text={task.title} />
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          {task.category}
                        </span>
                        <span>{task.priority} Priority</span>
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Objectives */}
          {matchingObjectives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Objectives ({matchingObjectives.length})
              </h4>
              <div className="space-y-1.5">
                {matchingObjectives.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => {
                      onSelectResult('objective', obj);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left group transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">
                        <AutoLinkText text={obj.title} />
                      </span>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        <AutoLinkText text={obj.description} />
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Agenda Events */}
          {matchingEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Calendar Events ({matchingEvents.length})
              </h4>
              <div className="space-y-1.5">
                {matchingEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      onSelectResult('event', evt);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left group transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        <AutoLinkText text={evt.title} />
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span>{evt.date}</span>
                        <span>
                          {evt.startTime} - {evt.endTime}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {evt.category}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Files */}
          {matchingFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" /> Files & Storage ({matchingFiles.length})
              </h4>
              <div className="space-y-1.5">
                {matchingFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      onSelectResult('file', file);
                      onClose();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left group transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">
                        <AutoLinkText text={file.name} />
                      </span>
                      {file.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          <AutoLinkText text={file.description} />
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Scratchpad */}
          {matchScratchpad && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Scratchpad Notes
              </h4>
              <button
                onClick={() => {
                  onSelectResult('scratchpad');
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between text-left group transition-all"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                    Scratchpad Content Matches Search
                  </span>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    <AutoLinkText text={scratchpad.substring(0, 100)} />...
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
              </button>
            </div>
          )}

          {/* Cloudflare Second Brain Search */}
          {cleanQuery && (
            <div className="p-3.5 rounded-2xl border border-orange-500/30 bg-orange-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-mono text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-orange-400" /> Cloudflare Second Brain Knowledge
                </h4>

                {cloudflareConfig?.workerUrl ? (
                  <button
                    onClick={handleSearchCloudflare}
                    disabled={isSearchingCf}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isSearchingCf ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Cloud className="w-3 h-3 text-orange-400" />
                    )}
                    <span>Search Second Brain</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onOpenCloudflareModal) {
                        onOpenCloudflareModal();
                        onClose();
                      }
                    }}
                    className="text-[11px] font-mono text-orange-400 hover:underline"
                  >
                    Connect Worker
                  </button>
                )}
              </div>

              {cfResults && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                  <pre className="text-[11px] text-emerald-300 overflow-x-auto max-h-40">
                    {JSON.stringify(cfResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
