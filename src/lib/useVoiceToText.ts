import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseVoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useVoiceToText(defaultOptions: UseVoiceToTextOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef<UseVoiceToTextOptions>(defaultOptions);

  useEffect(() => {
    optionsRef.current = defaultOptions;
  }, [defaultOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(
    (overrideOptions?: UseVoiceToTextOptions) => {
      setError(null);
      setInterimTranscript('');

      if (typeof window === 'undefined') return;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        const errMsg = 'Voice recognition is not supported in this browser.';
        setError(errMsg);
        setIsSupported(false);
        defaultOptions.onError?.(errMsg);
        return;
      }

      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const mergedOptions = { ...optionsRef.current, ...overrideOptions };

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = mergedOptions.continuous !== false;
        recognition.interimResults = mergedOptions.interimResults !== false;
        recognition.lang = mergedOptions.lang || 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let currentFinal = '';
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const textChunk = res[0]?.transcript || '';
            if (res.isFinal) {
              currentFinal += textChunk;
            } else {
              currentInterim += textChunk;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));
            mergedOptions.onTranscript?.(currentFinal.trim(), true);
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
            mergedOptions.onTranscript?.(currentInterim, false);
          } else {
            setInterimTranscript('');
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            // benign
            return;
          }
          if (event.error === 'not-allowed') {
            const msg = 'Microphone access was denied. Please allow microphone permissions.';
            setError(msg);
            mergedOptions.onError?.(msg);
          } else {
            const msg = `Voice recognition notice: ${event.error}`;
            setError(msg);
            mergedOptions.onError?.(msg);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        const msg = err?.message || 'Failed to start microphone speech engine';
        setError(msg);
        setIsListening(false);
        mergedOptions.onError?.(msg);
      }
    },
    [defaultOptions]
  );

  const toggleListening = useCallback(
    (overrideOptions?: UseVoiceToTextOptions) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(overrideOptions);
      }
    },
    [isListening, startListening, stopListening]
  );

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
