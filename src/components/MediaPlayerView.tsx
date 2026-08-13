import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Repeat,
  Repeat1,
  Shuffle,
  Sun,
  Moon,
  Sparkles,
  ListMusic,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Heart,
  Music,
  Video,
  Upload,
  Link as LinkIcon,
  Share2,
  Clock,
  Sliders,
  Smartphone,
  Tv,
  Radio,
  Eye,
  EyeOff,
  Activity,
  Layers,
} from 'lucide-react';
import { MediaItem, MediaPlaylist, MediaType } from '../types';

interface MediaPlayerViewProps {
  mediaList?: MediaItem[];
  mediaItems?: MediaItem[];
  playlists?: MediaPlaylist[];
  currentTrackId?: string;
  onUpdateMediaList?: (updater: (prev: MediaItem[]) => MediaItem[]) => void;
  onUpdateMediaItems?: (updater: (prev: MediaItem[]) => MediaItem[]) => void;
  onUpdatePlaylists?: (updater: (prev: MediaPlaylist[]) => MediaPlaylist[]) => void;
  onOpenUploadModal?: () => void;
  isFloatingMini?: boolean;
  onCloseMini?: () => void;
  onExpandToFull?: () => void;
}

export const MediaPlayerView: React.FC<MediaPlayerViewProps> = ({
  mediaList: mediaListProp,
  mediaItems: mediaItemsProp,
  playlists: playlistsProp = [],
  currentTrackId,
  onUpdateMediaList: onUpdateMediaListProp,
  onUpdateMediaItems: onUpdateMediaItemsProp,
  onUpdatePlaylists: onUpdatePlaylistsProp,
  onOpenUploadModal,
  isFloatingMini = false,
  onCloseMini,
  onExpandToFull,
}) => {
  const mediaList = mediaListProp || mediaItemsProp || [];
  const playlists = playlistsProp || [];
  const onUpdateMediaList = onUpdateMediaListProp || onUpdateMediaItemsProp || (() => {});
  const onUpdatePlaylists = onUpdatePlaylistsProp || (() => {});

  // Active media item
  const [activeMediaId, setActiveMediaId] = useState<string>(() => {
    if (currentTrackId && mediaList.some((m) => m?.id === currentTrackId)) {
      return currentTrackId;
    }
    return mediaList[0]?.id || '';
  });

  const activeMedia = mediaList.find((m) => m?.id === activeMediaId) || mediaList[0] || null;

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100); // 0 to 200% (VLC boost!)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  // Gesture & Display state
  const [brightness, setBrightness] = useState<number>(100); // 20% to 150%
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [orientationLock, setOrientationLock] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  const [showTimeRemaining, setShowTimeRemaining] = useState<boolean>(false);
  const [autoHideTimeoutSec, setAutoHideTimeoutSec] = useState<5 | 7 | 0>(5); // 5s, 7s, 0 (never)
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'galaxy' | 'matrix'>('bars');
  const [isVisualizerEnabled, setIsVisualizerEnabled] = useState<boolean>(true);

  // UI tabs & Modals inside media view
  const [activeTab, setActiveTab] = useState<'player' | 'playlist' | 'stream' | 'visualizer'>('player');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('all');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editingTitleText, setEditingTitleText] = useState<string>('');
  const [streamUrlInput, setStreamUrlInput] = useState<string>('');
  const [streamTypeInput, setStreamTypeInput] = useState<MediaType>('audio');
  const [streamTitleInput, setStreamTitleInput] = useState<string>('');
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [isAddingPlaylist, setIsAddingPlaylist] = useState<boolean>(false);
  const [resumePrompt, setResumePrompt] = useState<{ time: number; mediaId: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hideTimerRef = useRef<any>(null);

  // Web Audio Context for 200% Volume Gain & Visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Touch swipe gesture tracking for Left (Brightness) and Right (Volume)
  const touchStartRef = useRef<{ x: number; y: number; side: 'left' | 'right'; startVal: number } | null>(null);
  const [gestureFeedback, setGestureFeedback] = useState<{ text: string; icon: 'volume' | 'sun' } | null>(null);
  const gestureFeedbackTimer = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Setup Web Audio Gain & Analyser
  const setupWebAudio = useCallback((element: HTMLMediaElement) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        analyserNodeRef.current = ctx.createAnalyser();
        analyserNodeRef.current.fftSize = 256;
        analyserNodeRef.current.smoothingTimeConstant = 0.8;

        gainNodeRef.current.connect(ctx.destination);
        analyserNodeRef.current.connect(gainNodeRef.current);
      }

      if (!sourceNodeRef.current) {
        try {
          sourceNodeRef.current = ctx.createMediaElementSource(element);
          sourceNodeRef.current.connect(analyserNodeRef.current!);
        } catch {
          // MediaElementSource already connected or cross-origin restriction
        }
      }

      // Update Gain value based on volume (up to 200% -> gain up to 2.0)
      if (gainNodeRef.current) {
        const gainVal = isMuted ? 0 : volume / 100;
        gainNodeRef.current.gain.setValueAtTime(gainVal, ctx.currentTime);
      }
    } catch (err) {
      console.warn('Web Audio initialization note:', err);
    }
  }, [isMuted, volume]);

  // Sync volume with Gain Node & Media Element
  useEffect(() => {
    const el = activeMedia?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      // Set element volume (capped at 1.0) and use gain node for boost up to 2.0
      el.volume = Math.min(1.0, isMuted ? 0 : volume / 100);
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      const gainVal = isMuted ? 0 : volume / 100;
      gainNodeRef.current.gain.setValueAtTime(gainVal, audioCtxRef.current.currentTime);
    }
  }, [volume, isMuted, activeMedia]);

  // MediaSession API integration (Lock screen controls & metadata)
  useEffect(() => {
    if ('mediaSession' in navigator && activeMedia) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeMedia.title,
        artist: activeMedia.artist || 'Personal OS Media Player',
        album: 'Personal OS Hub',
        artwork: activeMedia.coverArtUrl
          ? [{ src: activeMedia.coverArtUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [{ src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=512&q=80', sizes: '512x512', type: 'image/jpeg' }],
      });

      navigator.mediaSession.setActionHandler('play', () => handlePlay());
      navigator.mediaSession.setActionHandler('pause', () => handlePause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekforward', () => handleSkip(10));
      navigator.mediaSession.setActionHandler('seekbackward', () => handleSkip(-10));
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handleSeek(details.seekTime);
        }
      });
    }
  }, [activeMedia]);

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (autoHideTimeoutSec > 0 && isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, autoHideTimeoutSec * 1000);
    }
  }, [autoHideTimeoutSec, isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Check saved progress memory when track changes
  useEffect(() => {
    if (!activeMedia) return;
    setCurrentTime(0);
    setIsPlaying(false);

    const savedPos = activeMedia.lastPosition || 0;
    if (savedPos > 10) {
      setResumePrompt({ time: savedPos, mediaId: activeMedia.id });
    } else {
      setResumePrompt(null);
    }
  }, [activeMediaId]);

  // Save playback progress to localStorage on interval / unload
  useEffect(() => {
    if (!activeMedia || currentTime <= 0) return;
    const interval = setInterval(() => {
      onUpdateMediaList((prev) =>
        prev.map((m) => (m.id === activeMedia.id ? { ...m, lastPosition: Math.floor(currentTime) } : m))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [activeMedia, currentTime, onUpdateMediaList]);

  // Audio Visualizer Rendering Loop
  useEffect(() => {
    if (!isVisualizerEnabled || activeMedia?.type === 'video' || !canvasRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAnalyser = analyserNodeRef.current;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (!localAnalyser || !isPlaying) {
        // Subtle resting idle waveform
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.03 + Date.now() * 0.002) * 8;
          ctx.lineTo(i, y);
        }
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      const bufferLength = localAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      localAnalyser.getByteFrequencyData(dataArray);

      if (visualizerMode === 'bars') {
        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.75);
          const barGrad = ctx.createLinearGradient(0, height - barHeight, 0, height);
          barGrad.addColorStop(0, '#38bdf8');
          barGrad.addColorStop(0.5, '#06b6d4');
          barGrad.addColorStop(1, '#818cf8');

          ctx.fillStyle = barGrad;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else if (visualizerMode === 'wave') {
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ec4899';
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualizerMode === 'galaxy') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.25;

        for (let i = 0; i < bufferLength; i += 2) {
          const angle = (i / bufferLength) * Math.PI * 2;
          const amp = (dataArray[i] / 255) * 60;
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + amp);
          const y2 = centerY + Math.sin(angle) * (radius + amp);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 85%, 60%)`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      } else if (visualizerMode === 'matrix') {
        // Retro VU Matrix
        const cols = 24;
        const rows = 12;
        const colW = width / cols;
        const rowH = height / rows;
        for (let c = 0; c < cols; c++) {
          const freqVal = dataArray[c * 2] || 0;
          const litRows = Math.floor((freqVal / 255) * rows);
          for (let r = 0; r < rows; r++) {
            if (rows - r <= litRows) {
              ctx.fillStyle = r < 3 ? '#ef4444' : r < 6 ? '#f59e0b' : '#10b981';
              ctx.fillRect(c * colW + 2, r * rowH + 2, colW - 4, rowH - 4);
            }
          }
        }
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isVisualizerEnabled, visualizerMode, isPlaying, activeMedia]);

  // Controls Handlers
  const handlePlay = async () => {
    const el = activeMedia?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      setupWebAudio(el);
      try {
        await el.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback autoplay policy check:', err);
      }
    }
  };

  const handlePause = () => {
    const el = activeMedia?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const handleSeek = (time: number) => {
    const el = activeMedia?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    const el = activeMedia?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      const newTime = Math.max(0, Math.min(duration || 0, el.currentTime + seconds));
      el.currentTime = newTime;
      setCurrentTime(newTime);
      showToast(`${seconds > 0 ? '+' : ''}${seconds}s`);
    }
  };

  const handleNext = () => {
    const filtered = getFilteredMediaList();
    if (filtered.length === 0) return;
    if (isShuffled) {
      const randomIdx = Math.floor(Math.random() * filtered.length);
      setActiveMediaId(filtered[randomIdx].id);
      return;
    }
    const currentIdx = filtered.findIndex((m) => m.id === activeMediaId);
    const nextIdx = (currentIdx + 1) % filtered.length;
    setActiveMediaId(filtered[nextIdx].id);
  };

  const handlePrev = () => {
    const filtered = getFilteredMediaList();
    if (filtered.length === 0) return;
    const currentIdx = filtered.findIndex((m) => m.id === activeMediaId);
    const prevIdx = (currentIdx - 1 + filtered.length) % filtered.length;
    setActiveMediaId(filtered[prevIdx].id);
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      handleSeek(0);
      handlePlay();
    } else if (repeatMode === 'all') {
      handleNext();
      setTimeout(handlePlay, 300);
    } else {
      setIsPlaying(false);
    }
  };

  // Picture in Picture (HTML5 native API)
  const handleTogglePiP = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        showToast('Picture-in-Picture not supported in current browser frame');
      }
    } else {
      showToast('Picture-in-Picture is active for Video streams');
    }
  };

  // Fullscreen
  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle:', err);
    }
  };

  // Lock Orientation
  const handleToggleOrientation = () => {
    if (orientationLock === 'auto') {
      setOrientationLock('landscape');
      showToast('Locked to Landscape View');
    } else if (orientationLock === 'landscape') {
      setOrientationLock('portrait');
      showToast('Locked to Portrait (Profile) View');
    } else {
      setOrientationLock('auto');
      showToast('Auto-Orientation');
    }
  };

  // Touch Gestures: Left Side = Brightness, Right Side = Volume
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    resetHideTimer();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftSide = touch.clientX - rect.left < rect.width / 2;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      side: isLeftSide ? 'left' : 'right',
      startVal: isLeftSide ? brightness : volume,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY; // positive = dragging up

    if (touchStartRef.current.side === 'left') {
      // Adjust Brightness (20% to 150%)
      const newBright = Math.max(20, Math.min(150, Math.round(touchStartRef.current.startVal + deltaY * 0.5)));
      setBrightness(newBright);
      setGestureFeedback({ text: `Brightness: ${newBright}%`, icon: 'sun' });
    } else {
      // Adjust Volume (0% to 200%)
      const newVol = Math.max(0, Math.min(200, Math.round(touchStartRef.current.startVal + deltaY * 0.8)));
      setVolume(newVol);
      setGestureFeedback({ text: `Volume: ${newVol}% (VLC Boost)`, icon: 'volume' });
    }

    if (gestureFeedbackTimer.current) clearTimeout(gestureFeedbackTimer.current);
    gestureFeedbackTimer.current = setTimeout(() => setGestureFeedback(null), 1200);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // File Upload (MP3 / MP4 from local storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const isVideo = file.type.startsWith('video');
      const blobUrl = URL.createObjectURL(file);
      const newMedia: MediaItem = {
        id: `media-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Upload',
        type: isVideo ? 'video' : 'audio',
        url: blobUrl,
        duration: 0,
        favorite: false,
        sizeBytes: file.size,
        addedAt: new Date().toISOString(),
        source: 'local',
      };

      onUpdateMediaList((prev) => [newMedia, ...prev]);
      setActiveMediaId(newMedia.id);
      showToast(`Loaded ${newMedia.title}`);
    });
  };

  // Add Stream from URL
  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrlInput.trim()) return;

    const newMedia: MediaItem = {
      id: `media-url-${Date.now()}`,
      title: streamTitleInput.trim() || `Web Stream (${new URL(streamUrlInput).hostname})`,
      artist: 'Web Stream URL',
      type: streamTypeInput,
      url: streamUrlInput.trim(),
      duration: 0,
      favorite: false,
      addedAt: new Date().toISOString(),
      source: 'web',
    };

    onUpdateMediaList((prev) => [newMedia, ...prev]);
    setActiveMediaId(newMedia.id);
    setStreamUrlInput('');
    setStreamTitleInput('');
    setActiveTab('player');
    showToast('Stream URL added to playlist');
  };

  // Rename Title Inline
  const handleSaveRename = () => {
    if (!activeMedia || !editingTitleText.trim()) return;
    onUpdateMediaList((prev) =>
      prev.map((m) => (m.id === activeMedia.id ? { ...m, title: editingTitleText.trim() } : m))
    );
    setIsEditingTitle(false);
    showToast('Track title updated');
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    onUpdateMediaList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, favorite: !m.favorite } : m))
    );
  };

  // Share Media
  const handleShareMedia = async () => {
    if (!activeMedia) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeMedia.title,
          text: `Check out "${activeMedia.title}" on Personal OS Media Player`,
          url: activeMedia.url.startsWith('http') ? activeMedia.url : window.location.href,
        });
      } catch {
        // Share dismissed
      }
    } else {
      navigator.clipboard.writeText(activeMedia.url);
      showToast('Media URL copied to clipboard');
    }
  };

  // Filter media by playlist
  const getFilteredMediaList = () => {
    if (selectedPlaylistId === 'all') return mediaList;
    if (selectedPlaylistId === 'fav') return mediaList.filter((m) => m.favorite);
    const pl = playlists.find((p) => p.id === selectedPlaylistId);
    if (!pl) return mediaList;
    return mediaList.filter((m) => pl.trackIds.includes(m.id));
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mini-player bar layout when rendered in floating PiP mode
  if (isFloatingMini) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 p-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-xs font-mono font-bold text-slate-200 truncate">{activeMedia?.title || 'No Media'}</p>
          </div>
          <div className="flex items-center gap-1">
            {onExpandToFull && (
              <button
                onClick={onExpandToFull}
                title="Expand Media Player"
                className="p-1 text-slate-400 hover:text-cyan-300 rounded"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onCloseMini && (
              <button onClick={onCloseMini} title="Close" className="p-1 text-slate-400 hover:text-rose-400 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mini Seeker */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-2"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleSkip(-10)} className="p-1 text-slate-400 hover:text-slate-200">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button onClick={() => handleSkip(10)} className="p-1 text-slate-400 hover:text-slate-200">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNext} className="p-1 text-slate-400 hover:text-slate-200">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'min-h-[580px]'
      } ${
        orientationLock === 'landscape' ? 'aspect-video' : orientationLock === 'portrait' ? 'max-w-md mx-auto' : ''
      }`}
      style={{
        filter: `brightness(${brightness}%)`,
      }}
    >
      {/* Hidden Media Elements */}
      {activeMedia?.type === 'video' ? (
        <video
          ref={videoRef}
          src={activeMedia.url}
          playsInline
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
            if (videoRef.current) setupWebAudio(videoRef.current);
          }}
          onEnded={handleEnded}
          onClick={handleTogglePlay}
          className={`w-full bg-black object-contain cursor-pointer ${
            isFullscreen ? 'h-full' : 'h-[320px] sm:h-[400px]'
          }`}
        />
      ) : (
        <audio
          ref={audioRef}
          src={activeMedia?.url}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            setDuration(audioRef.current?.duration || 0);
            if (audioRef.current) setupWebAudio(audioRef.current);
          }}
          onEnded={handleEnded}
        />
      )}

      {/* Audio Visualizer Screen (For MP3s) */}
      {activeMedia?.type === 'audio' && (
        <div className="relative w-full h-[260px] sm:h-[340px] bg-slate-950 flex items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} width={800} height={340} className="w-full h-full object-cover" />

          {/* Central Track Details Over Visualizer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none bg-slate-950/40 backdrop-blur-[2px]">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/40 mb-3 glow-cyan">
              <img
                src={
                  activeMedia?.coverArtUrl ||
                  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
                }
                alt={activeMedia?.title || 'Personal Media'}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white max-w-md truncate drop-shadow">
              {activeMedia?.title || 'No Track Selected'}
            </h3>
            <p className="text-xs font-mono text-cyan-300 mt-0.5">{activeMedia?.artist || 'Personal OS Media'}</p>
          </div>
        </div>
      )}

      {/* Touch Gesture Feedback Overlay */}
      {gestureFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-4 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md text-cyan-300 font-mono text-xs sm:text-sm flex items-center gap-2 shadow-2xl animate-in zoom-in-95 duration-150">
          {gestureFeedback.icon === 'sun' ? <Sun className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span>{gestureFeedback.text}</span>
        </div>
      )}

      {/* Resume from Left Off Spot Prompt Modal */}
      {resumePrompt && (
        <div className="absolute top-4 left-4 right-4 z-40 p-3 rounded-xl bg-slate-900/95 border border-cyan-500/60 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Resume playback from <strong className="text-cyan-300">{formatTime(resumePrompt.time)}</strong>?</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                handleSeek(resumePrompt.time);
                handlePlay();
                setResumePrompt(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow"
            >
              Resume
            </button>
            <button
              onClick={() => {
                handleSeek(0);
                handlePlay();
                setResumePrompt(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-all"
            >
              Start Beginning
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay Header */}
      <div
        className={`p-3 sm:p-4 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between gap-2 z-30 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shrink-0">
            {activeMedia?.type === 'video' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editingTitleText}
                onChange={(e) => setEditingTitleText(e.target.value)}
                className="px-2 py-1 rounded bg-slate-900 border border-cyan-500/50 text-white font-mono text-xs focus:outline-none"
                autoFocus
              />
              <button onClick={handleSaveRename} className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="p-1 text-slate-400 hover:bg-slate-800 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                {activeMedia?.title || 'No Media Loaded'}
              </h2>
              <button
                onClick={() => {
                  setEditingTitleText(activeMedia?.title || '');
                  setIsEditingTitle(true);
                }}
                title="Edit Title"
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Top Right Tool Bar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Visualizer Mode Toggle (Audio only) */}
          {activeMedia?.type === 'audio' && (
            <button
              onClick={() => {
                const modes: Array<'bars' | 'wave' | 'galaxy' | 'matrix'> = ['bars', 'wave', 'galaxy', 'matrix'];
                const nextMode = modes[(modes.indexOf(visualizerMode) + 1) % modes.length];
                setVisualizerMode(nextMode);
                showToast(`Visualizer: ${nextMode.toUpperCase()}`);
              }}
              title="Change Visualizer Effect"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 text-xs font-mono"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Orientation Lock Toggle */}
          <button
            onClick={handleToggleOrientation}
            title="Lock Landscape / Profile View"
            className={`p-1.5 rounded-lg border text-xs font-mono ${
              orientationLock !== 'auto'
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* PiP Button */}
          {activeMedia?.type === 'video' && (
            <button
              onClick={handleTogglePiP}
              title="Picture-in-Picture Mode"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300"
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Share */}
          <button
            onClick={handleShareMedia}
            title="Share Media Stream"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bottom VLC Player Controller Panel */}
      <div
        className={`mt-auto p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 z-30 transition-all duration-300 ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Timeline Slider with Drag Scrubbing */}
        <div className="space-y-1 mb-3">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <button
              onClick={() => setShowTimeRemaining(!showTimeRemaining)}
              title="Click to toggle Elapsed vs Time Remaining"
              className="hover:text-cyan-300 transition-colors"
            >
              {showTimeRemaining ? `-${formatTime(Math.max(0, duration - currentTime))} left` : formatTime(duration)}
            </button>
          </div>
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Shuffle, Repeat, ±10s Skips */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
              className={`p-2 rounded-lg text-xs transition-all ${
                isShuffled ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const next = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
                setRepeatMode(next);
                showToast(`Repeat: ${next.toUpperCase()}`);
              }}
              title={`Repeat: ${repeatMode}`}
              className={`p-2 rounded-lg text-xs transition-all ${
                repeatMode !== 'off'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              title="Auto Skip -10 Seconds"
              className="p-2 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-0.5 text-xs font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">10s</span>
            </button>

            <button
              onClick={handlePrev}
              title="Previous Track"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
            >
              <SkipBack className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Play / Pause */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="p-3.5 sm:p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg glow-cyan transition-all transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Right: +10s Skip, Next, 200% Volume Boost */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={handleNext}
              title="Next Track"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSkip(10)}
              title="Auto Skip +10 Seconds"
              className="p-2 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-0.5 text-xs font-mono"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">10s</span>
            </button>

            {/* VLC 200% Volume Boost Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume > 100 ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <Volume1 className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={200}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 sm:w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <span
                className={`text-[10px] font-mono font-bold w-8 text-right ${
                  volume > 100 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {isMuted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Media Tools Subtabs: Playlist, Stream URL, Settings */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab(activeTab === 'playlist' ? 'player' : 'playlist')}
              className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 transition-all ${
                activeTab === 'playlist'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Playlists ({mediaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'stream' ? 'player' : 'stream')}
              className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 transition-all ${
                activeTab === 'stream'
                  ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Stream URL</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Hide Controls Selector */}
            <select
              value={autoHideTimeoutSec}
              onChange={(e) => setAutoHideTimeoutSec(Number(e.target.value) as any)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px]"
            >
              <option value={5}>Auto-hide: 5s</option>
              <option value={7}>Auto-hide: 7s</option>
              <option value={0}>Never hide</option>
            </select>

            {/* Local Media File Upload */}
            <label className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Media</span>
              <input type="file" accept="audio/*,video/*" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Playlist Drawer Subview */}
        {activeTab === 'playlist' && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 max-h-60 overflow-y-auto">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-800">
              <button
                onClick={() => setSelectedPlaylistId('all')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedPlaylistId === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All Tracks ({mediaList.length})
              </button>
              <button
                onClick={() => setSelectedPlaylistId('fav')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  selectedPlaylistId === 'fav' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                ⭐ Favorites ({mediaList.filter((m) => m.favorite).length})
              </button>
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    selectedPlaylistId === pl.id ? 'bg-purple-500 text-white font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {pl.name}
                </button>
              ))}
            </div>

            {/* Track Rows */}
            <div className="space-y-1">
              {getFilteredMediaList().map((item) => {
                const isActive = item.id === activeMediaId;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg transition-all ${
                      isActive ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300' : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveMediaId(item.id);
                        setTimeout(handlePlay, 100);
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      {item.type === 'video' ? <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      <span className="text-xs font-mono truncate">{item.title}</span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className={`p-1 rounded ${item.favorite ? 'text-rose-400' : 'text-slate-600 hover:text-rose-400'}`}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => {
                          onUpdateMediaList((prev) => prev.filter((m) => m.id !== item.id));
                          showToast('Track removed');
                        }}
                        className="p-1 text-slate-600 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stream URL Input Subview */}
        {activeTab === 'stream' && (
          <form onSubmit={handleAddStream} className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Stream from Web Audio / Video URL</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="url"
                placeholder="https://example.com/audio.mp3 or .mp4 stream"
                value={streamUrlInput}
                onChange={(e) => setStreamUrlInput(e.target.value)}
                required
                className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center gap-1">
                <select
                  value={streamTypeInput}
                  onChange={(e) => setStreamTypeInput(e.target.value as MediaType)}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <option value="audio">MP3 Audio</option>
                  <option value="video">MP4 Video</option>
                </select>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow"
                >
                  Stream
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* In-Player Toast */}
      {toastMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-2xl backdrop-blur animate-in fade-in zoom-in-95">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
