import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Sparkles,
  X,
  Copy,
  Check,
  Download,
  PlusCircle,
  Clock,
  Calendar,
  Layers,
  FileText,
  RefreshCw,
  Share2,
  Trash2,
  ChevronDown,
  Volume2,
  CheckSquare,
  Save,
  Radio,
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';
import { getApiUrl } from '../lib/api';

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  transcript: string;
  summary: string;
  actionItems: string[];
  tags: string[];
  createdAt: string;
}

interface MeetingVoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasksFromMeeting?: (newTasks: TaskItem[]) => void;
  onAppendToScratchpad?: (text: string) => void;
}

export const MeetingVoiceRecorderModal: React.FC<MeetingVoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onAddTasksFromMeeting,
  onAppendToScratchpad,
}) => {
  const [meetingTitle, setMeetingTitle] = useState('Executive Sync & Project Review');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [addedTasksSuccess, setAddedTasksSuccess] = useState(false);
  const [extractedActionItems, setExtractedActionItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'record' | 'transcript' | 'summary' | 'history'>('record');
  const [audioLevel, setAudioLevel] = useState(0);

  // Stored meeting archives
  const [meetingHistory, setMeetingHistory] = useState<MeetingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('personal_os_meeting_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Audio Context & Recognition Refs
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Persist meeting archives
  useEffect(() => {
    try {
      localStorage.setItem('personal_os_meeting_records', JSON.stringify(meetingHistory));
    } catch (e) {
      console.warn('Failed to save meetings history', e);
    }
  }, [meetingHistory]);

  // Format Duration string
  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup Web Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    const reco = new SpeechRecognition();
    reco.continuous = true;
    reco.interimResults = true;
    reco.lang = 'en-US';

    reco.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalChunk += text + ' ';
        } else {
          interim += text;
        }
      }

      if (finalChunk.trim()) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTranscript((prev) => (prev ? `${prev}\n[${timestamp}] ${finalChunk.trim()}` : `[${timestamp}] ${finalChunk.trim()}`));
        setInterimText('');
      } else {
        setInterimText(interim);
      }

      if (transcriptScrollRef.current) {
        transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
      }
    };

    reco.onerror = (err: any) => {
      console.warn('Speech Recognition meeting error:', err);
      // Restart if aborted and still recording
      if (err.error !== 'no-speech' && isRecording && !isPaused) {
        try {
          reco.start();
        } catch {}
      }
    };

    reco.onend = () => {
      if (isRecording && !isPaused) {
        try {
          reco.start();
        } catch {}
      }
    };

    return reco;
  };

  // Start Meeting Recording
  const startRecording = async () => {
    try {
      // Audio level analyser
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          // Start visualizer loop
          drawWaveform();
        }
      }

      // Initialize Speech Recognition
      const reco = initSpeechRecognition();
      if (reco) {
        recognitionRef.current = reco;
        reco.start();
      }

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting meeting audio recording:', err);
      alert('Microphone access is required to record and transcribe meetings.');
    }
  };

  // Pause / Resume Recording
  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      try {
        recognitionRef.current?.start?.();
      } catch {}
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Pause
      setIsPaused(true);
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      clearInterval(timerIntervalRef.current);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    clearInterval(timerIntervalRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAudioLevel(0);
    setActiveTab('transcript');
  };

  // Waveform canvas rendering loop
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Summarize meeting with Gemini AI
  const handleSummarizeWithAi = async () => {
    const contentToSummarize = transcript.trim();
    if (!contentToSummarize) {
      alert('Please record or enter a meeting transcript first.');
      return;
    }

    setIsSummarizing(true);
    setActiveTab('summary');
    setSummary('');

    const promptPayload = {
      messages: [
        {
          role: 'user',
          content: `You are an executive meeting assistant. Please analyze this recorded meeting transcript and produce a structured, actionable summary in clean Markdown:

Meeting Title: ${meetingTitle}
Meeting Duration: ${formatDuration(duration)}
Recorded Transcript:
${contentToSummarize}

Format the summary with the following clear sections:
# 🎙️ Executive Meeting Summary: ${meetingTitle}
- **Date & Duration**: ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} (${formatDuration(duration)})
- **Core Objective**: [One sentence statement of the meeting's primary goal]

## 📌 Key Decisions Made
- [List decisive agreements, architectural choices, or approvals]

## 📝 Key Discussion Highlights & Topics
- [Bullet points summarizing important debate, context, or data reviewed]

## ⚡ Action Items & Next Steps
- [ ] [Action Item 1 - Assignee / Due Date]
- [ ] [Action Item 2 - Assignee / Due Date]
- [ ] [Action Item 3 - Assignee / Due Date]

## ⚠️ Risks, Blockers & Open Questions
- [Any unresolved points or dependencies]`,
        },
      ],
      systemInstruction:
        'You are Personal OS Meeting Intelligence Engine. Extract maximum actionable clarity, synthesize discussion points concisely, and produce precise Markdown task lists.',
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
      const generatedSummary = data.text || '';
      setSummary(generatedSummary);

      // Extract Action items for quick-add
      const lines = generatedSummary.split('\n');
      const actionItems = lines
        .filter((l: string) => l.trim().startsWith('- [ ]') || l.trim().startsWith('* [ ]') || (l.includes('[Action Item') && l.includes(']')))
        .map((l: string) => l.replace(/^[-*]\s*\[\s*\]\s*/, '').trim())
        .filter(Boolean);

      setExtractedActionItems(actionItems);

      // Save to meeting history archive
      const newRecord: MeetingRecord = {
        id: `meeting-${Date.now()}`,
        title: meetingTitle,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        durationSeconds: duration,
        transcript: contentToSummarize,
        summary: generatedSummary,
        actionItems,
        tags: ['Voice Meeting', 'AI Summary'],
        createdAt: new Date().toISOString(),
      };

      setMeetingHistory((prev) => [newRecord, ...prev]);
    } catch (err: any) {
      console.error('Error generating AI meeting summary:', err);
      // Fallback local summary
      const localFallback = `# 🎙️ Executive Meeting Summary: ${meetingTitle}
- **Date & Duration**: ${new Date().toLocaleDateString()} (${formatDuration(duration)})
- **Core Objective**: Review operational objectives and sync across deliverables.

## 📌 Key Decisions Made
- Confirmed next steps based on discussion items.
- Synchronized active project milestones.

## ⚡ Action Items & Next Steps
- [ ] Complete follow-up action items identified during sync
- [ ] Share meeting takeaways with relevant stakeholders

## 📝 Raw Discussion Notes
${contentToSummarize.slice(0, 400)}...`;

      setSummary(localFallback);
      setExtractedActionItems(['Complete follow-up action items identified during sync', 'Share meeting takeaways with relevant stakeholders']);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Add Extracted Action Items into Personal OS Tasks
  const handleConvertActionItemsToTasks = () => {
    if (!onAddTasksFromMeeting) return;

    let itemsToAdd = extractedActionItems;
    if (itemsToAdd.length === 0 && summary) {
      const lines = summary.split('\n');
      itemsToAdd = lines
        .filter((l) => l.trim().startsWith('- [ ]') || l.trim().startsWith('* [ ]'))
        .map((l) => l.replace(/^[-*]\s*\[\s*\]\s*/, '').trim());
    }

    if (itemsToAdd.length === 0) {
      itemsToAdd = [`Follow up on ${meetingTitle} discussions and deliverables`];
    }

    const newTasks: TaskItem[] = itemsToAdd.map((title, idx) => ({
      id: `task-meeting-${Date.now()}-${idx}`,
      title: title.replace(/^-\s*/, '').trim(),
      category: 'Work',
      priority: 'High' as TaskPriority,
      status: 'Todo',
      dueDate: 'Tomorrow',
      estimatedMinutes: 30,
      createdAt: new Date().toISOString(),
    }));

    onAddTasksFromMeeting(newTasks);
    setAddedTasksSuccess(true);
    setTimeout(() => setAddedTasksSuccess(false), 3000);
  };

  // Export Markdown File
  const handleDownloadMarkdown = () => {
    const mdContent = `# ${meetingTitle}
**Date:** ${new Date().toLocaleDateString()}
**Duration:** ${formatDuration(duration)}

---

${summary ? `## AI Executive Summary\n\n${summary}\n\n---\n\n` : ''}
## Full Transcript
${transcript || 'No transcript recorded.'}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meetingTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSendToScratchpad = () => {
    if (!onAppendToScratchpad) return;
    const block = `\n\n--- 🎙️ Meeting Notes: ${meetingTitle} (${new Date().toLocaleDateString()}) ---\n${summary || transcript}`;
    onAppendToScratchpad(block);
    alert('Meeting notes successfully sent to Executive Scratchpad!');
  };

  const handleDeleteMeetingHistory = (id: string) => {
    setMeetingHistory((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLoadArchivedMeeting = (record: MeetingRecord) => {
    setMeetingTitle(record.title);
    setDuration(record.durationSeconds);
    setTranscript(record.transcript);
    setSummary(record.summary);
    setExtractedActionItems(record.actionItems || []);
    setActiveTab('summary');
  };

  // Clean up recording when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                isRecording
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse shadow-sm shadow-rose-950'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                  Meeting Voice Recorder & AI Summarizer
                </h2>
                {isRecording && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 text-[10px] font-mono font-bold animate-pulse">
                    <Radio className="w-3 h-3 text-rose-400" /> LIVE REC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Continuous voice transcription with one-click Gemini AI executive summaries
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isRecording) {
                if (confirm('Recording is still active. Stop and close?')) {
                  stopRecording();
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800/80 bg-slate-950 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'record'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>1. Record & Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'transcript'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Live Transcript {transcript ? `(${transcript.split('\n').length})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'summary'
                ? 'border-purple-400 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. AI Executive Summary {summary ? '✓' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Meeting History ({meetingHistory.length})</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* TAB 1: RECORD & CONTROLS */}
          {activeTab === 'record' && (
            <div className="space-y-6">
              {/* Meeting Title Input */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Meeting / Session Subject
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q3 Roadmap Review, Client Discovery, Standup..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Central Audio Recording Console */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                {/* Timer Display */}
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest">
                  {formatDuration(duration)}
                </div>

                {/* Status Indicator */}
                <div className="text-xs font-mono">
                  {isRecording ? (
                    isPaused ? (
                      <span className="text-amber-400">Recording Paused</span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1.5 justify-center">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        Listening & Transcribing...
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">Ready to record meeting audio</span>
                  )}
                </div>

                {/* Audio Waveform Canvas */}
                <div className="w-full max-w-lg h-16 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-1">
                  {isRecording && !isPaused ? (
                    <canvas ref={canvasRef} width={400} height={60} className="w-full h-full" />
                  ) : (
                    <div className="flex items-center gap-1">
                      {[...Array(24)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-slate-800 rounded-full"
                          style={{ height: `${Math.sin(i * 0.5) * 12 + 16}px` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-lg shadow-cyan-950 transition-all glow-cyan cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Meeting Recording</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePause}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all"
                      >
                        {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>

                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-md transition-all shadow-rose-950"
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop & View Notes</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Live Preview Snippet */}
              {(transcript || interimText) && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 flex items-center justify-between mb-2">
                    <span>Live Transcript Feed</span>
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      Open Full Editor →
                    </button>
                  </div>
                  <div className="text-xs text-slate-200 max-h-24 overflow-y-auto whitespace-pre-wrap font-sans">
                    {transcript || interimText}
                    {interimText && <span className="text-cyan-400 italic"> {interimText}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Full Meeting Transcript
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Editable speech transcription with real-time speaker timestamps
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTranscript}
                    disabled={!transcript}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all disabled:opacity-50"
                  >
                    {copiedTranscript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleSummarizeWithAi}
                    disabled={!transcript || isSummarizing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold shadow transition-all glow-purple disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSummarizing ? 'Summarizing...' : 'Summarize with Gemini AI'}</span>
                  </button>
                </div>
              </div>

              <div ref={transcriptScrollRef} className="relative">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your recorded meeting transcript will appear here in real-time as you speak... (You can also type or paste raw meeting notes directly)."
                  rows={12}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                {interimText && (
                  <div className="p-2 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 rounded-lg mt-1 italic animate-pulse">
                    Live: {interimText}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AI EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-mono text-purple-300 uppercase tracking-wider font-semibold">
                    AI Meeting Synthesis & Takeaways
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSummarizeWithAi}
                    disabled={isSummarizing || !transcript}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-mono transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
                    <span>Re-summarize</span>
                  </button>

                  <button
                    onClick={handleCopySummary}
                    disabled={!summary}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
                  >
                    {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleConvertActionItemsToTasks}
                    disabled={!summary}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      addedTasksSuccess
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{addedTasksSuccess ? 'Tasks Added to Hub!' : 'Add Action Items to Tasks'}</span>
                  </button>
                </div>
              </div>

              {isSummarizing ? (
                <div className="p-12 rounded-xl bg-slate-900/40 border border-purple-500/20 flex flex-col items-center justify-center space-y-3 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                  <p className="text-sm font-mono text-purple-300 font-semibold animate-pulse">
                    Synthesizing Executive Meeting Summary...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Gemini AI is extracting core decisions, deliverables, risks, and next steps from your transcript.
                  </p>
                </div>
              ) : summary ? (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans prose prose-invert prose-sm max-w-none">
                  {summary}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-400 font-mono">
                    No summary generated yet. Transcribe a meeting and click "Summarize with Gemini AI".
                  </p>
                  <button
                    onClick={handleSummarizeWithAi}
                    disabled={!transcript}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all"
                  >
                    Generate AI Summary Now
                  </button>
                </div>
              )}

              {/* Action Buttons: Scratchpad & Download */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={handleSendToScratchpad}
                  disabled={!summary && !transcript}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Push to Executive Scratchpad</span>
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  disabled={!transcript && !summary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download .md Notes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MEETING HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Archived Meetings & Voice Recordings ({meetingHistory.length})
              </h3>

              {meetingHistory.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                  No recorded meetings in archive. Start a recording above to automatically save meeting notes.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {meetingHistory.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-mono">{m.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                            {formatDuration(m.durationSeconds)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{m.date}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-sans">
                          {m.summary
                            ? m.summary.slice(0, 160).replace(/[#*]/g, '')
                            : m.transcript.slice(0, 160)}
                          ...
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoadArchivedMeeting(m)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteMeetingHistory(m.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-all"
                          title="Delete archived meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audio Status: {isRecording ? `Active (${audioLevel}%)` : 'Standby'}</span>
          </div>

          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              }
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium font-mono transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
