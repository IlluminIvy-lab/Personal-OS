import React from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceToText } from '../lib/useVoiceToText';

interface VoiceInputButtonProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'cyan' | 'amber' | 'emerald' | 'subtle';
  showLabel?: boolean;
  label?: string;
  title?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  size = 'md',
  variant = 'cyan',
  showLabel = false,
  label = 'Voice to Text',
  title = 'Voice Dictation (Click to Speak)',
}) => {
  const { isListening, isSupported, error, toggleListening } = useVoiceToText({
    onTranscript: (text, isFinal) => {
      onTranscript(text, isFinal);
    },
  });

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-xs',
    lg: 'px-3 py-2 text-sm',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  const variantClasses = {
    cyan: isListening
      ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-lg shadow-red-950/40 animate-pulse'
      : 'bg-slate-900/80 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 border-slate-700/80',
    amber: isListening
      ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-lg shadow-red-950/40 animate-pulse'
      : 'bg-slate-900/80 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border-slate-700/80',
    emerald: isListening
      ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-lg shadow-red-950/40 animate-pulse'
      : 'bg-slate-900/80 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-slate-700/80',
    subtle: isListening
      ? 'bg-red-500/20 text-red-400 border-red-500/60 shadow-lg shadow-red-950/40 animate-pulse'
      : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white border-transparent',
  }[variant];

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => toggleListening()}
        title={isListening ? 'Listening... Click to stop dictation' : title}
        className={`relative inline-flex items-center gap-1.5 rounded-xl border font-mono font-medium transition-all select-none cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <Mic className={`${iconSizes} text-red-400 animate-bounce`} />
            {showLabel && <span className="text-red-400 font-bold">Listening...</span>}
          </>
        ) : (
          <>
            <Mic className={iconSizes} />
            {showLabel && <span>{label}</span>}
          </>
        )}
      </button>

      {error && (
        <span
          title={error}
          className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 text-[10px] font-mono whitespace-nowrap border border-rose-500/40 z-50 flex items-center gap-1 shadow-lg"
        >
          <AlertCircle className="w-2.5 h-2.5" /> Mic error
        </span>
      )}
    </div>
  );
};
