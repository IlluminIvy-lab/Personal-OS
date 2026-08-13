import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles, Copy, Check, Trash2, Save, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface QuickScratchpadProps {
  content: string;
  setContent: (val: string) => void;
  onSummarizeWithAi: (text: string) => void;
}

export const QuickScratchpad: React.FC<QuickScratchpadProps> = ({
  content,
  setContent,
  onSummarizeWithAi,
}) => {
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [listeningStatus, setListeningStatus] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // If content changes significantly while speaking, stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [content]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setListeningStatus('Listening for voice memo...');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        setContent((prev) => {
          const trimmedPrev = prev.trim();
          const noteText = finalTranscript.trim();
          if (!trimmedPrev) return noteText;
          return `${trimmedPrev}\n${noteText}`;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setListeningStatus('Microphone access denied');
      } else {
        setListeningStatus('Voice recognition stopped');
      }
      setTimeout(() => setListeningStatus(''), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
      setListeningStatus('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [setContent]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setListeningStatus('');
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleToggleListen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!content.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider uppercase">OS Scratchpad</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {micSupported && (
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-mono transition-all ${
                  isListening
                    ? 'bg-red-950/80 border-red-500/60 text-red-300 animate-pulse shadow-lg shadow-red-900/40'
                    : 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-500/30 text-cyan-300'
                }`}
                title={isListening ? 'Stop Voice Memo Recording' : 'Record Voice Memo to Scratchpad'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                    <span className="hidden sm:inline">Recording...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Voice Memo</span>
                  </>
                )}
              </button>
            )}

            {speechSupported && (
              <button
                onClick={handleToggleListen}
                disabled={!content.trim() && !isSpeaking}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-mono transition-all disabled:opacity-40 ${
                  isSpeaking
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 animate-pulse shadow-lg shadow-emerald-900/40'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-300 hover:text-emerald-200'
                }`}
                title={isSpeaking ? 'Stop Reading Notes Aloud' : 'Read Notes Aloud with Web Speech API'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Listen</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onSummarizeWithAi(content)}
              disabled={!content.trim()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all glow-purple disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Extract</span>
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
              title="Copy Scratchpad Content"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setContent('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              title="Clear Scratchpad"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {listeningStatus && (
          <div className="mb-2 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              {listeningStatus}
            </span>
            <span className="text-[10px] text-slate-400">Speak clearly into microphone</span>
          </div>
        )}

        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture quick thoughts, meeting notes, voice memos, or ideas here... (Auto-saved)"
          className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 resize-none outline-none font-mono leading-relaxed transition-all"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
        <span>
          {wordCount} words • {charCount} chars
        </span>
        <span className="flex items-center gap-1">
          <Save className="w-3 h-3 text-emerald-400" /> Saved {lastSaved}
        </span>
      </div>
    </div>
  );
};

