import React, { useState, useRef, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  Pin,
  PinOff,
  Search,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Clock,
} from 'lucide-react';
import { QuickNote } from '../types';

interface QuickNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: QuickNote[];
  onUpdateNotes: (updater: (prev: QuickNote[]) => QuickNote[]) => void;
  onAppendToScratchpad?: (text: string) => void;
}

export const QuickNotesDrawer: React.FC<QuickNotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onUpdateNotes,
  onAppendToScratchpad,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Voice recording
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let chunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          chunk += event.results[i][0].transcript;
        }
        if (chunk) {
          setNewContent((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || `Quick Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      content: newContent.trim(),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pinned: false,
    };

    onUpdateNotes((prev) => [newNote, ...prev]);
    setNewTitle('');
    setNewContent('');
  };

  const handleTogglePin = (id: string) => {
    onUpdateNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Quick Floating Notes</h3>
            <p className="text-[10px] text-slate-400 font-mono">Accessible anywhere in Personal OS</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Quick Note Form with Voice Dictation */}
      <form onSubmit={handleCreateNote} className="p-3 bg-slate-900/40 border-b border-slate-800 space-y-2">
        <input
          type="text"
          placeholder="Note title (optional)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
        />

        <div className="relative">
          <textarea
            placeholder="Type or dictate voice note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />

          <button
            type="button"
            onClick={toggleVoiceRecording}
            title={isListening ? 'Stop Voice Input' : 'Voice Dictation'}
            className={`absolute right-2 bottom-2 p-1.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            {isListening ? '🎙️ Listening to microphone...' : 'Type or record voice memo'}
          </span>
          <button
            type="submit"
            disabled={!newContent.trim()}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-mono text-xs font-bold transition-all shadow flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>
      </form>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">No notes captured yet.</div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-xl border transition-all ${
                note.pinned
                  ? 'bg-slate-900 border-amber-500/50 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-xs font-bold font-mono text-slate-200 truncate">{note.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePin(note.id)}
                    className={`p-1 rounded ${note.pinned ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                  >
                    {note.pinned ? <Pin className="w-3 h-3 fill-current" /> : <PinOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleCopy(note.id, note.content)}
                    className="p-1 text-slate-500 hover:text-cyan-300"
                  >
                    {copiedId === note.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>

              <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{note.updatedAt}</span>
                {onAppendToScratchpad && (
                  <button
                    onClick={() => onAppendToScratchpad(note.content)}
                    className="text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>+ Scratchpad</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
