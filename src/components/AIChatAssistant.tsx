import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Terminal,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Edit3,
  MoreVertical,
  Download,
  Share2,
  FileText,
  Cloud,
  Pin,
  PinOff,
  FolderPlus,
  Plus,
  Layers,
  MessageSquare,
  Search,
  CheckSquare,
  Target,
  Code,
  Archive,
  FileCode,
  ArrowRight,
  Folder,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  ChatMessage,
  TaskItem,
  ObjectiveItem,
  GoogleCalendarEvent,
  CloudflareMcpConfig,
  ChatThread,
  ChatWorkspace,
} from '../types';
import { AutoLinkText } from './AutoLinkText';
import { INITIAL_CHAT_THREADS, INITIAL_WORKSPACES } from '../data/mockDefaults';
import { getApiUrl } from '../lib/api';

interface AIChatAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeyStatus: 'loading' | 'valid' | 'missing';
  tasks: TaskItem[];
  objectives: ObjectiveItem[];
  scratchpadContent?: string;
  calendarEvents?: GoogleCalendarEvent[];
  cloudflareConfig?: CloudflareMcpConfig;
  onOpenCloudflareModal?: () => void;
  onAddTaskFromAi?: (taskTitle: string) => void;
  onCreateDocFromAi?: (title: string, content: string) => void;
}

const DEFAULT_PROMPTS = [
  '📅 Plan My Day',
  '🎯 Prioritize my high-priority tasks',
  '🚀 Help refine my top objective',
  '📝 Turn scratchpad notes into action items',
  '🧠 Search Cloudflare Second Brain',
];

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({
  isOpen,
  onClose,
  apiKeyStatus,
  tasks,
  objectives,
  scratchpadContent,
  calendarEvents = [],
  cloudflareConfig,
  onOpenCloudflareModal,
  onAddTaskFromAi,
  onCreateDocFromAi,
}) => {
  const THREADS_STORAGE_KEY = 'personal_os_chat_threads_v2';
  const WORKSPACES_STORAGE_KEY = 'personal_os_chat_workspaces_v2';

  // Workspaces & Projects State
  const [workspaces, setWorkspaces] = useState<ChatWorkspace[]>(() => {
    try {
      const cached = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      return cached ? JSON.parse(cached) : INITIAL_WORKSPACES;
    } catch {
      return INITIAL_WORKSPACES;
    }
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('all');
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState<boolean>(false);

  // Chat Threads State
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const cached = localStorage.getItem(THREADS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load chat threads:', err);
    }
    return INITIAL_CHAT_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || 'thread-1');
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Persist threads & workspaces
  useEffect(() => {
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    } catch (err) {
      console.warn('Failed to save threads:', err);
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    } catch (err) {
      console.warn('Failed to save workspaces:', err);
    }
  }, [workspaces]);

  // Input & Streaming state
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');

  // Editing Thread Title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Voice Input Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // TTS Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    // Custom simple toast feedback
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeThread?.messages]);

  // Text-To-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Voice recognition toggle
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice recognition not supported in browser');
      return;
    }

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
        if (chunk) setInput(chunk);
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Multiple Threads Handlers
  const handleCreateNewThread = () => {
    const newId = `thread-${Date.now()}`;
    const wsId = activeWorkspaceId !== 'all' ? activeWorkspaceId : 'ws-gen';
    const newThread: ChatThread = {
      id: newId,
      title: 'New Chat Thread',
      workspaceId: wsId,
      pinned: false,
      smartSuggestions: [
        'Plan my priority tasks for today',
        'Summarize active objectives and progress',
        'Draft an executive briefing note',
      ],
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          text: 'Hello! I am ready to assist in this new chat thread. Ask me to plan your day, analyze data, or organize notes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setIsDrawerOpen(false);
  };

  const handleTogglePinThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, pinned: !t.pinned } : t))
    );
  };

  const handleDeleteThread = (threadId: string) => {
    if (threads.length <= 1) return;
    const remaining = threads.filter((t) => t.id !== threadId);
    setThreads(remaining);
    if (activeThreadId === threadId) {
      setActiveThreadId(remaining[0].id);
    }
  };

  const handleSaveRenameThread = () => {
    if (!editingTitleText.trim()) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, title: editingTitleText.trim() } : t))
    );
    setIsEditingTitle(false);
  };

  // Export handlers
  const getThreadText = (thread: ChatThread) => {
    const header = `PERSONAL OS - AI ASSISTANT THREAD\nTitle: ${thread.title}\nWorkspace: ${thread.workspaceId}\nExported: ${new Date().toLocaleString()}\n\n=========================================\n\n`;
    const body = thread.messages
      .map(
        (m) => `[${m.timestamp}] ${m.role === 'user' ? 'USER' : 'GEMINI AI'}:\n${m.text}`
      )
      .join('\n\n-----------------------------------------\n\n');
    return header + body;
  };

  const handleExportSingleThread = (format: 'txt' | 'doc') => {
    if (!activeThread) return;
    const text = getThreadText(activeThread);
    let blob: Blob;
    let filename = `${activeThread.title.replace(/[^a-z0-9]/gi, '_')}`;

    if (format === 'doc') {
      const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeThread.title}</title><style>body{font-family:Arial,sans-serif;padding:30px;line-height:1.6;color:#222;}.user{color:#0284c7;font-weight:bold;}.ai{color:#7c3aed;font-weight:bold;}</style></head><body><h1>${activeThread.title}</h1><p><em>Exported from Personal OS AI on ${new Date().toLocaleString()}</em></p><hr/><div>${activeThread.messages
        .map(
          (m) =>
            `<p><span class="${m.role === 'user' ? 'user' : 'ai'}">[${m.timestamp}] ${m.role === 'user' ? 'User' : 'Gemini AI'}:</span><br/>${m.text.replace(/\n/g, '<br/>')}</p>`
        )
        .join('<hr/>')}</div></body></html>`;
      blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
      filename += '.docx';
    } else {
      blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      filename += '.txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Full Project / Workspace as ZIP
  const handleExportFullProjectZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder('personal_os_ai_workspace');

    // Index README
    let readme = `# Personal OS AI Chat Project Archive\nExport Date: ${new Date().toISOString()}\nTotal Threads: ${threads.length}\n\n## Included Threads:\n`;

    threads.forEach((th, idx) => {
      readme += `${idx + 1}. ${th.title} (${th.messages.length} messages) [Workspace: ${th.workspaceId}]\n`;
      const cleanFileName = `${idx + 1}_${th.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
      folder?.file(cleanFileName, getThreadText(th));
    });

    folder?.file('README.md', readme);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal_os_ai_project_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send Message with Streaming & Smart Suggestions Generation
  const sendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isStreaming || !activeThread) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMsgs = [...activeThread.messages, userMsg];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: updatedMsgs, updatedAt: new Date().toISOString() }
          : t
      )
    );

    if (!customText) setInput('');

    const openTasks = tasks.filter((t) => t.status !== 'Completed');
    const hasScratchpad = Boolean(scratchpadContent && scratchpadContent.trim());
    const isPlanOrPrioritizeQuery = /plan|prioritize|schedule|briefing|today/i.test(textToSend);

    if (isPlanOrPrioritizeQuery && openTasks.length === 0 && !hasScratchpad) {
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: 'No tasks captured yet today — capture something first in the Task Board or Scratchpad to generate your daily plan.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: false,
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...updatedMsgs, assistantMsg] }
            : t
        )
      );
      return;
    }

    setIsStreaming(true);

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...updatedMsgs, initialAssistantMsg] }
          : t
      )
    );

    try {
      const openTasksFormatted = openTasks.length > 0
        ? openTasks.map((t, idx) => `${idx + 1}. [Priority: ${t.priority}] "${t.title}" (Category: ${t.category}, Status: ${t.status})`).join('\n')
        : 'None';

      const objectivesFormatted = objectives.length > 0
        ? objectives.map((o) => `- "${o.title}" (Status: ${o.status}, Progress: ${o.progress}%)`).join('\n')
        : 'None';

      const scratchpadFormatted = scratchpadContent?.trim() ? `"${scratchpadContent.trim()}"` : 'None';

      let cloudflareBrainData = 'Not connected';
      if (cloudflareConfig?.isEnabled && cloudflareConfig?.workerUrl) {
        try {
          const cfRes = await fetch(getApiUrl('/api/cloudflare/query'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workerUrl: cloudflareConfig.workerUrl,
              apiToken: cloudflareConfig.apiToken,
              protocolMode: cloudflareConfig.protocolMode,
              query: textToSend,
            }),
          });
          const cfJson = await cfRes.json();
          if (cfJson.ok && cfJson.data) {
            cloudflareBrainData = typeof cfJson.data === 'string' ? cfJson.data : JSON.stringify(cfJson.data);
          }
        } catch {
          // Cloudflare query note
        }
      }

      const systemInstruction = `You are Personal OS Assistant powered by Gemini. Provide crisp, high-impact answers using real stored app data when relevant.

REAL STORED APP DATA:
Open Tasks:
${openTasksFormatted}

Active Objectives:
${objectivesFormatted}

Scratchpad Notes:
${scratchpadFormatted}

Cloudflare Second Brain Knowledge:
${cloudflareBrainData}`;

      const response = await fetch(getApiUrl('/api/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMsgs.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          systemInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setThreads((prev) =>
                    prev.map((t) =>
                      t.id === activeThread.id
                        ? {
                            ...t,
                            messages: t.messages.map((m) =>
                              m.id === assistantMsgId
                                ? { ...m, text: accumulatedText, isStreaming: true }
                                : m
                            ),
                          }
                        : t
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial JSON chunks
              }
            }
          }
        }
      }

      // Generate dynamic smart suggestions
      const smartSuggestions = [
        'Break this down into 3 immediate action items',
        'Summarize in 2 bullet points for executive review',
        'Create a new document from this response',
        'Draft a follow-up agenda schedule',
      ];

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                smartSuggestions,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ),
              }
            : t
        )
      );
    } catch (err: any) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        text: `Error connecting to Gemini AI. Please verify connectivity or retry in a moment.`,
                        isStreaming: false,
                        isError: true,
                      }
                    : m
                ),
              }
            : t
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  // Filter threads by workspace and search
  const filteredThreads = threads
    .filter((t) => {
      const matchesWs = activeWorkspaceId === 'all' || t.workspaceId === activeWorkspaceId;
      const matchesSearch = t.title.toLowerCase().includes(threadSearch.toLowerCase());
      return matchesWs && matchesSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all ${
          isExpanded ? 'w-[98vw] h-[95vh]' : 'max-w-4xl h-[680px]'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 min-w-0">
            {/* Drawer Switcher Button */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title="Toggle Thread & Workspace Drawer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Threads ({threads.length})</span>
            </button>

            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingTitleText}
                  onChange={(e) => setEditingTitleText(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-950 border border-cyan-500 text-xs font-mono text-white"
                  autoFocus
                />
                <button onClick={handleSaveRenameThread} className="p-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono truncate max-w-[180px] sm:max-w-xs">
                  {activeThread?.title}
                </h3>
                <button
                  onClick={() => {
                    setEditingTitleText(activeThread?.title || '');
                    setIsEditingTitle(true);
                  }}
                  title="Rename Thread"
                  className="p-1 text-slate-500 hover:text-slate-300"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Export Dropdown / Buttons */}
            <button
              onClick={() => handleExportSingleThread('doc')}
              title="Export Thread as Word .DOCX"
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Word</span>
            </button>

            <button
              onClick={handleExportFullProjectZip}
              title="Export Full Project as .ZIP"
              className="px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-mono flex items-center gap-1"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ZIP All</span>
            </button>

            {/* Expand / Minimize */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area (With Left Drawer overlay / column) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Pullout Drawer: Threads & Workspaces */}
          {isDrawerOpen && (
            <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shrink-0 p-3 space-y-3 animate-in slide-in-from-left duration-200">
              {/* Drawer Top */}
              <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Workspaces & Threads</span>
                </span>
                <button
                  onClick={handleCreateNewThread}
                  title="New Thread"
                  className="p-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Workspace Filter Tabs */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Workspaces</span>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
                  <button
                    onClick={() => setActiveWorkspaceId('all')}
                    className={`px-2 py-0.5 rounded-md ${
                      activeWorkspaceId === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => setActiveWorkspaceId(ws.id)}
                      className={`px-2 py-0.5 rounded-md truncate max-w-[90px] ${
                        activeWorkspaceId === ws.id ? 'bg-purple-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ws.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              {/* Threads List */}
              <div className="flex-1 space-y-1 overflow-y-auto pr-1 max-h-[380px]">
                {filteredThreads.map((th) => {
                  const isSel = th.id === activeThreadId;
                  return (
                    <div
                      key={th.id}
                      onClick={() => {
                        setActiveThreadId(th.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`group flex items-center justify-between gap-1.5 p-2 rounded-xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-slate-950 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {th.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="text-xs font-mono truncate">{th.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinThread(th.id);
                          }}
                          className="p-1 hover:text-amber-400"
                        >
                          {th.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteThread(th.id);
                          }}
                          className="p-1 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Messages View */}
          <div className="flex-1 flex flex-col bg-slate-950 p-3 sm:p-4 overflow-y-auto">
            {/* Quick Prompts Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-900">
              {DEFAULT_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(p)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 shrink-0 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Messages Stack */}
            <div className="flex-1 space-y-4 py-4">
              {activeThread?.messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-cyan-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow'
                      }`}
                    >
                      <AutoLinkText text={m.text} />

                      {/* Tool Row */}
                      {!isUser && !m.isStreaming && (
                        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>{m.timestamp}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSpeak(m.id, m.text)}
                              className="hover:text-cyan-300"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === m.id ? 'text-cyan-400 animate-pulse' : ''}`} />
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.text);
                                setCopiedId(m.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="hover:text-cyan-300"
                            >
                              {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {onCreateDocFromAi && (
                              <button
                                onClick={() => onCreateDocFromAi(`AI Summary - ${activeThread.title}`, m.text)}
                                title="Create Document from AI Response"
                                className="hover:text-purple-300 flex items-center gap-0.5"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                <span>Doc</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Suggestions & Next Steps Pills */}
            {activeThread?.smartSuggestions && activeThread.smartSuggestions.length > 0 && !isStreaming && (
              <div className="py-2 border-t border-slate-900">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Suggested Next Steps:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeThread.smartSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(sug)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition-all shadow-sm"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Listening' : 'Voice Input'}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Gemini to plan, summarize, or analyze..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono text-xs font-bold transition-all shadow glow-cyan flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
