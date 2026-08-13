import React, { useState, useEffect } from 'react';
import { Keyboard, ChevronDown } from 'lucide-react';

export const KeyboardDismissButton: React.FC = () => {
  const [isKeyboardActive, setIsKeyboardActive] = useState<boolean>(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        setIsKeyboardActive(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (
          !active ||
          (active.tagName !== 'INPUT' &&
            active.tagName !== 'TEXTAREA' &&
            !active.isContentEditable)
        ) {
          setIsKeyboardActive(false);
        }
      }, 150);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleDismissKeyboard = () => {
    if (document.activeElement && (document.activeElement as HTMLElement).blur) {
      (document.activeElement as HTMLElement).blur();
    }
    setIsKeyboardActive(false);
  };

  if (!isKeyboardActive) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 animate-in slide-in-from-bottom-2 duration-200">
      <button
        onClick={handleDismissKeyboard}
        title="Collapse & Dismiss On-Screen Keyboard"
        className="px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-cyan-500/60 shadow-2xl backdrop-blur text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all transform hover:scale-105"
      >
        <Keyboard className="w-4 h-4 text-cyan-400" />
        <span>Hide Keyboard</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
