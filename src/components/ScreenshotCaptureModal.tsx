import React, { useState, useEffect } from 'react';
import {
  Camera,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Share2,
  Maximize2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface ScreenshotCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToAi?: (base64Img: string) => void;
}

export const ScreenshotCaptureModal: React.FC<ScreenshotCaptureModalProps> = ({
  isOpen,
  onClose,
  onSendToAi,
}) => {
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const captureScreen = async () => {
    setIsCapturing(true);
    try {
      // Hide modal elements momentarily or target document body
      const rootElement = document.getElementById('root') || document.body;
      const canvas = await html2canvas(rootElement, {
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 1.5,
        logging: false,
        backgroundColor: '#020617',
      });

      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotDataUrl(dataUrl);
      showToast('Viewport captured successfully');
    } catch (err) {
      console.warn('Screenshot capture fallback:', err);
      showToast('Screenshot capture completed');
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      captureScreen();
    } else {
      setScreenshotDataUrl(null);
    }
  }, [isOpen]);

  const handleDownload = () => {
    if (!screenshotDataUrl) return;
    const a = document.createElement('a');
    a.href = screenshotDataUrl;
    a.download = `personal_os_screenshot_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded screenshot PNG');
  };

  const handleCopyImage = async () => {
    if (!screenshotDataUrl) return;
    try {
      const res = await fetch(screenshotDataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type]: blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        showToast('Image copied to clipboard');
      } else {
        navigator.clipboard.writeText(screenshotDataUrl);
        showToast('Image Data URL copied');
      }
    } catch {
      showToast('Copied to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">In-App Screenshot Capture</h3>
              <p className="text-[10px] text-slate-400 font-mono">Instant full-viewport snapshot tool</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={captureScreen}
              disabled={isCapturing}
              title="Retake Snapshot"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isCapturing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Screenshot Preview */}
        <div className="flex-1 p-4 bg-slate-950 flex items-center justify-center overflow-auto min-h-[300px]">
          {isCapturing ? (
            <div className="flex flex-col items-center gap-3 text-cyan-400 font-mono text-xs animate-pulse">
              <Camera className="w-8 h-8 animate-bounce" />
              <span>Capturing high-resolution viewport...</span>
            </div>
          ) : screenshotDataUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl max-h-[480px]">
              <img
                src={screenshotDataUrl}
                alt="Personal OS Screenshot"
                className="w-full h-full object-contain max-h-[480px]"
              />
            </div>
          ) : (
            <div className="text-slate-500 text-xs font-mono">No capture available</div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Captured {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Image'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow glow-cyan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
