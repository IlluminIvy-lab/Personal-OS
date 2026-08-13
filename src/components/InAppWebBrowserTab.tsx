import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  Bookmark,
  BookmarkPlus,
  Share2,
  ExternalLink,
  Copy,
  BookOpen,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  Layers,
  Terminal,
  Lock,
  Compass,
  Star,
  Trash2,
  Clipboard,
  CornerDownLeft,
  History,
  Sparkles,
  Link as LinkIcon,
  Zap,
  Pin,
  PinOff,
  CopyPlus,
  Undo2,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { WebBrowserTab, WebBookmark, WebHistoryItem } from '../types';
import { getApiUrl } from '../lib/api';

interface InAppWebBrowserTabProps {
  initialUrl?: string;
  bookmarks: WebBookmark[];
  onUpdateBookmarks: (updater: (prev: WebBookmark[]) => WebBookmark[]) => void;
  onClipToScratchpad?: (text: string) => void;
  onClipToDocs?: (title: string, content: string) => void;
  onClipToTasks?: (title: string, notes: string) => void;
}

// Popular Speed Dial presets
const SPEED_DIAL_PRESETS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page', icon: '📚', desc: 'Free Online Encyclopedia' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰', desc: 'Tech & Startup News' },
  { name: 'DevDocs', url: 'https://devdocs.io', icon: '💻', desc: 'Fast API Documentation' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/', icon: '⚡', desc: 'Web Reference' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙', desc: 'Code Repository' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/lite/', icon: '🦆', desc: 'Lightweight Web Search' },
  { name: 'Can I Use', url: 'https://caniuse.com', icon: '🌐', desc: 'Browser Support Matrix' },
  { name: 'Weather', url: 'https://wttr.in', icon: '🌤️', desc: 'Live Weather Report' },
];

interface TabContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  tabId: string;
}

export const InAppWebBrowserTab: React.FC<InAppWebBrowserTabProps> = ({
  initialUrl = 'https://en.wikipedia.org/wiki/Main_Page',
  bookmarks,
  onUpdateBookmarks,
  onClipToScratchpad,
  onClipToDocs,
  onClipToTasks,
}) => {
  // Tabs State
  const [tabs, setTabs] = useState<WebBrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Wikipedia Main Page',
      url: initialUrl,
      favicon: '📚',
    },
    {
      id: 'tab-2',
      title: 'Hacker News',
      url: 'https://news.ycombinator.com',
      favicon: '📰',
    },
    {
      id: 'tab-3',
      title: 'DevDocs API Reference',
      url: 'https://devdocs.io',
      favicon: '💻',
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0] || {
    id: 'fallback-tab',
    title: 'New Tab',
    url: 'https://en.wikipedia.org/wiki/Main_Page',
    favicon: '🌐',
  };

  // Stack of recently closed tabs (for Chromium-like Reopen Closed Tab)
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<WebBrowserTab[]>([]);

  // Tab Context Menu State (Chromium Right-Click menu)
  const [contextMenu, setContextMenu] = useState<TabContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    tabId: '',
  });

  // URL & Omnibox state
  const [urlInput, setUrlInput] = useState<string>(activeTab?.url || initialUrl);
  const [searchEngine, setSearchEngine] = useState<
    'duckduckgo' | 'google' | 'bing' | 'wikipedia' | 'github' | 'reddit' | 'youtube'
  >('duckduckgo');
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReaderMode, setIsReaderMode] = useState<boolean>(false);

  // Reader Mode Customization & AI State
  const [readerTheme, setReaderTheme] = useState<'midnight' | 'sepia' | 'paper'>('midnight');
  const [readerFont, setReaderFont] = useState<'serif' | 'sans' | 'mono'>('sans');
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [readerArticle, setReaderArticle] = useState<{
    title: string;
    estimatedReadMinutes?: number;
    summaryBullets?: string[];
    contentMarkdown?: string;
  } | null>(null);
  const [isExtractingReaderAi, setIsExtractingReaderAi] = useState<boolean>(false);

  // Bookmark Category Filtering & Dialog State
  const [bookmarkFilterCategory, setBookmarkFilterCategory] = useState<string>('All');
  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState<boolean>(false);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState<string>('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState<string>('');
  const [newBookmarkCat, setNewBookmarkCat] = useState<'Tech' | 'AI & Tools' | 'Productivity' | 'News' | 'Custom'>('Tech');

  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<WebHistoryItem[]>([
    { id: 'h-1', title: 'Wikipedia Main Page', url: 'https://en.wikipedia.org/wiki/Main_Page', visitedAt: '12:00 PM' },
    { id: 'h-2', title: 'Hacker News', url: 'https://news.ycombinator.com', visitedAt: '12:05 PM' },
    { id: 'h-3', title: 'DevDocs API Reference', url: 'https://devdocs.io', visitedAt: '12:10 PM' },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState<boolean>(true);
  const [quickSearchResults, setQuickSearchResults] = useState<Array<{ title: string; snippet: string; url: string }>>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '🌐 Chromium-Style Tab Manager Initialized',
    '⚡ X-Frame-Options bypass server proxy enabled',
    '🔒 Content-Security-Policy Sandbox Active',
  ]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync URL bar when active tab changes
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      setIsLoading(false);
      setQuickSearchResults([]);
    }
  }, [activeTabId]);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenu.isOpen) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.isOpen) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
      // Chromium keyboard shortcuts: Ctrl+W or Cmd+W to close active tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        // Only if target is not a text input inside a document
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'INPUT' && target !== inputRef.current) return;
        e.preventDefault();
        handleCloseTab(activeTabId);
      }
      // Ctrl+Shift+T or Cmd+Shift+T to reopen closed tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleReopenClosedTab();
      }
    };

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.isOpen, activeTabId, recentlyClosedTabs, tabs]);

  // Listen to postMessage from proxied iframe link clicks
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BROWSER_NAVIGATE' && event.data.url) {
        handleNavigate(event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Helper to check if string is a valid URL or domain
  const isDirectUrl = (text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('localhost:')) {
      return true;
    }
    const domainPattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/[^\s]*)?$/;
    return domainPattern.test(trimmed);
  };

  // Compute actual iframe src
  const getIframeSrc = (url: string): string => {
    if (!url) return 'about:blank';
    if (useProxy) {
      return `/api/browser/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Navigate to URL or Search Query
  const handleNavigate = async (target: string) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;

    if (!isDirectUrl(finalUrl)) {
      // It's a search term
      if (searchEngine === 'google') finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      else if (searchEngine === 'bing') finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
      else if (searchEngine === 'wikipedia') finalUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(finalUrl)}`;
      else if (searchEngine === 'github') finalUrl = `https://github.com/search?q=${encodeURIComponent(finalUrl)}`;
      else if (searchEngine === 'reddit') finalUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(finalUrl)}`;
      else if (searchEngine === 'youtube') finalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(finalUrl)}`;
      else finalUrl = `https://duckduckgo.com/lite/?q=${encodeURIComponent(finalUrl)}`;
    } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    setIsLoading(true);
    setUrlInput(finalUrl);
    setQuickSearchResults([]);

    // Derive readable title
    let displayTitle = finalUrl;
    try {
      displayTitle = new URL(finalUrl).hostname.replace('www.', '');
    } catch {
      displayTitle = finalUrl;
    }

    // Update active tab
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: finalUrl,
              title: displayTitle,
            }
          : t
      )
    );

    // Add to history
    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        title: displayTitle,
        url: finalUrl,
        visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 49),
    ]);

    setConsoleLogs((prev) => [
      `[NAVIGATE] Loaded: ${finalUrl} via ${useProxy ? 'Proxy Engine' : 'Direct Frame'}`,
      ...prev.slice(0, 25),
    ]);

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Instant Search lookup for autocomplete / quick answers
  const handleSearchQueryChange = async (val: string) => {
    setUrlInput(val);
    if (!val || isDirectUrl(val) || val.length < 2) {
      setQuickSearchResults([]);
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/api/browser/search?q=${encodeURIComponent(val)}`));
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setQuickSearchResults(data.results);
      }
    } catch {
      // Ignore background suggestion failures
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text);
          handleNavigate(text);
          showToast('Navigated to clipboard URL');
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
    const manual = prompt('Paste or enter URL to browse:');
    if (manual) {
      setUrlInput(manual);
      handleNavigate(manual);
    }
  };

  // Add new tab (Chromium New Tab)
  const handleAddNewTab = (customUrl?: string, customTitle?: string) => {
    const newId = `tab-${Date.now()}`;
    const newTab: WebBrowserTab = {
      id: newId,
      title: customTitle || 'New Tab',
      url: customUrl || 'https://en.wikipedia.org/wiki/Main_Page',
      favicon: '🌐',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(newTab.url);
  };

  // Chromium-style individual tab close handler
  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const tabIndex = tabs.findIndex((t) => t.id === id);
    if (tabIndex === -1) return;
    const tabToClose = tabs[tabIndex];

    // Push to recently closed stack for Chromium Ctrl+Shift+T / Reopen Closed Tab
    setRecentlyClosedTabs((prev) => [tabToClose, ...prev.slice(0, 19)]);

    const remainingTabs = tabs.filter((t) => t.id !== id);

    // In Chromium: If closing the LAST remaining tab, create a fresh "New Tab"
    if (remainingTabs.length === 0) {
      const freshTab: WebBrowserTab = {
        id: `tab-${Date.now()}`,
        title: 'New Tab',
        url: 'https://en.wikipedia.org/wiki/Main_Page',
        favicon: '🌐',
      };
      setTabs([freshTab]);
      setActiveTabId(freshTab.id);
      setUrlInput(freshTab.url);
      showToast('Closed tab (Opened new tab)');
      return;
    }

    setTabs(remainingTabs);

    // In Chromium: If the closed tab was currently active, switch to the adjacent tab
    // (the tab to its right, or the one to its left if it was the rightmost tab)
    if (activeTabId === id) {
      const nextIndex = Math.min(tabIndex, remainingTabs.length - 1);
      const nextTab = remainingTabs[nextIndex];
      setActiveTabId(nextTab.id);
      setUrlInput(nextTab.url);
    }

    showToast(`Closed "${tabToClose.title || 'Tab'}"`);
  };

  // Chromium Middle-Click on tab to close immediately
  const handleTabAuxClick = (id: string, e: React.MouseEvent) => {
    if (e.button === 1) {
      // Middle click (wheel click)
      e.preventDefault();
      e.stopPropagation();
      handleCloseTab(id);
    }
  };

  // Chromium Right-Click context menu opener
  const handleTabContextMenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      tabId: id,
    });
  };

  // Close other tabs (Chromium action)
  const handleCloseOtherTabs = (id: string) => {
    const targetTab = tabs.find((t) => t.id === id);
    if (!targetTab) return;
    const closed = tabs.filter((t) => t.id !== id);
    setRecentlyClosedTabs((prev) => [...closed, ...prev.slice(0, 19)]);
    setTabs([targetTab]);
    setActiveTabId(targetTab.id);
    setUrlInput(targetTab.url);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast(`Closed ${closed.length} other tabs`);
  };

  // Close tabs to the right (Chromium action)
  const handleCloseTabsToRight = (id: string) => {
    const tabIndex = tabs.findIndex((t) => t.id === id);
    if (tabIndex === -1 || tabIndex === tabs.length - 1) {
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    const keep = tabs.slice(0, tabIndex + 1);
    const closed = tabs.slice(tabIndex + 1);
    setRecentlyClosedTabs((prev) => [...closed, ...prev.slice(0, 19)]);
    setTabs(keep);
    if (!keep.some((t) => t.id === activeTabId)) {
      setActiveTabId(id);
      const target = tabs.find((t) => t.id === id);
      if (target) setUrlInput(target.url);
    }
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast(`Closed ${closed.length} tabs to the right`);
  };

  // Duplicate Tab (Chromium action)
  const handleDuplicateTab = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    const tabIndex = tabs.findIndex((t) => t.id === id);
    const duplicated: WebBrowserTab = {
      ...tab,
      id: `tab-${Date.now()}`,
      title: tab.title,
    };
    const nextTabs = [...tabs];
    nextTabs.splice(tabIndex + 1, 0, duplicated);
    setTabs(nextTabs);
    setActiveTabId(duplicated.id);
    setUrlInput(duplicated.url);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast(`Duplicated "${tab.title}"`);
  };

  // Pin/Unpin tab toggle
  const handleTogglePinTab = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  // Reopen recently closed tab (Chromium Ctrl+Shift+T)
  const handleReopenClosedTab = () => {
    if (recentlyClosedTabs.length === 0) {
      showToast('No recently closed tabs to restore');
      return;
    }
    const [restored, ...remaining] = recentlyClosedTabs;
    setRecentlyClosedTabs(remaining);
    const newTab: WebBrowserTab = {
      ...restored,
      id: `tab-${Date.now()}`,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput(newTab.url);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast(`Restored tab: "${restored.title}"`);
  };

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = getIframeSrc(activeTab.url);
    }
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleToggleBookmark = () => {
    const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
    if (isBookmarked) {
      onUpdateBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
      showToast('Bookmark removed');
    } else {
      const newBm: WebBookmark = {
        id: `bm-${Date.now()}`,
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        category: 'Custom',
        favicon: '⭐',
        createdAt: new Date().toISOString(),
      };
      onUpdateBookmarks((prev) => [newBm, ...prev]);
      showToast('Page added to Bookmarks');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeTab.url);
    showToast('URL copied to clipboard');
  };

  // Web Clipper Handlers
  const handleClipToScratchpad = () => {
    const clipText = `### Web Clip: [${activeTab.title}](${activeTab.url})\n- **URL:** ${activeTab.url}\n- **Clipped At:** ${new Date().toLocaleString()}\n${
      readerArticle?.summaryBullets ? `\n**Key Takeaways:**\n${readerArticle.summaryBullets.map((b) => `- ${b}`).join('\n')}` : ''
    }`;
    if (onClipToScratchpad) {
      onClipToScratchpad(clipText);
      showToast('Clipped page details to Scratchpad!');
    } else {
      navigator.clipboard.writeText(clipText);
      showToast('Copied clipped markdown to clipboard!');
    }
  };

  const handleClipToDocs = () => {
    const docTitle = `Clip: ${activeTab.title.slice(0, 40)}`;
    const docBody = `# ${activeTab.title}\n\n**Source URL:** [${activeTab.url}](${activeTab.url})\n**Clipped:** ${new Date().toLocaleString()}\n\n---\n\n${
      readerArticle?.contentMarkdown ||
      `### Executive Summary\n${(readerArticle?.summaryBullets || ['Research reference and web clip.']).map((b) => `- ${b}`).join('\n')}\n\n### Original URL\n${activeTab.url}`
    }`;
    if (onClipToDocs) {
      onClipToDocs(docTitle, docBody);
      showToast(`Created document: "${docTitle}"`);
    } else {
      showToast('Document clipper ready');
    }
  };

  const handleClipToTasks = () => {
    const taskTitle = `Review: ${activeTab.title.slice(0, 35)}`;
    const taskNotes = `Web Resource: ${activeTab.url}\nClipped on: ${new Date().toLocaleDateString()}`;
    if (onClipToTasks) {
      onClipToTasks(taskTitle, taskNotes);
      showToast(`Created research task: "${taskTitle}"`);
    }
  };

  // AI Reader Mode Article Extractor
  const handleExtractReaderAi = async () => {
    setIsExtractingReaderAi(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/reader-extract'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeTab.url,
          title: activeTab.title,
          rawText: `${activeTab.title} - Source: ${activeTab.url}`,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReaderArticle(data);
      setIsReaderMode(true);
      showToast('AI Reader extraction complete!');
    } catch (err: any) {
      showToast('Using local reader view fallback.');
      setIsReaderMode(true);
    } finally {
      setIsExtractingReaderAi(false);
    }
  };

  // Add Custom Bookmark Handler
  const handleSaveCustomBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) return;

    const newBm: WebBookmark = {
      id: `bm-${Date.now()}`,
      title: newBookmarkTitle.trim(),
      url: newBookmarkUrl.trim().startsWith('http') ? newBookmarkUrl.trim() : `https://${newBookmarkUrl.trim()}`,
      category: newBookmarkCat,
      favicon: newBookmarkCat === 'Tech' ? '💻' : newBookmarkCat === 'AI & Tools' ? '⚡' : newBookmarkCat === 'Productivity' ? '📊' : newBookmarkCat === 'News' ? '📰' : '⭐',
      createdAt: new Date().toISOString(),
    };

    onUpdateBookmarks((prev) => [newBm, ...prev]);
    setIsAddBookmarkModalOpen(false);
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
    showToast(`Bookmark added to ${newBookmarkCat}!`);
  };

  const isCurrentBookmarked = bookmarks.some((b) => b.url === activeTab?.url);
  const inputIsUrl = isDirectUrl(urlInput);

  return (
    <div
      ref={containerRef}
      id="inapp-web-browser-container"
      className="w-full flex flex-col rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl overflow-hidden min-h-[760px] select-none"
    >
      {/* Top Chromium-Style Tab Strip */}
      <div
        id="chromium-tab-strip"
        className="bg-slate-950 px-2 pt-2 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none"
      >
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto py-0.5">
          {tabs.map((t, index) => {
            const isActive = t.id === activeTabId;
            const isPinned = !!t.isPinned;

            return (
              <div
                key={t.id}
                id={`browser-tab-${t.id}`}
                onClick={() => setActiveTabId(t.id)}
                onAuxClick={(e) => handleTabAuxClick(t.id, e)}
                onContextMenu={(e) => handleTabContextMenu(t.id, e)}
                title={`${t.title} (${t.url})\n• Left-click to switch\n• Click ✕ or Middle-click to close\n• Right-click for tab options`}
                className={`group relative flex items-center transition-all duration-150 cursor-pointer select-none rounded-t-xl border-t border-x ${
                  isPinned
                    ? 'px-3 py-2 shrink-0'
                    : 'px-3 py-2 min-w-[130px] max-w-[210px] sm:min-w-[150px] sm:max-w-[240px] flex-1'
                } ${
                  isActive
                    ? 'bg-slate-900 border-slate-700/90 text-cyan-300 font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.5)] z-10'
                    : 'bg-slate-950/80 border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Top Glow Line */}
                {isActive && (
                  <div className="absolute top-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                )}

                {/* Tab Favicon */}
                <span className="text-sm shrink-0 mr-2 flex items-center justify-center">
                  {t.favicon || (isPinned ? '📌' : '🌐')}
                </span>

                {/* Tab Title */}
                {!isPinned && (
                  <span className="text-xs font-mono truncate flex-1 tracking-tight pr-1">
                    {t.title || 'Untitled'}
                  </span>
                )}

                {/* CHROMIUM INDIVIDUAL TAB CLOSE BUTTON */}
                <button
                  id={`btn-close-tab-${t.id}`}
                  type="button"
                  onClick={(e) => handleCloseTab(t.id, e)}
                  title={`Close tab "${t.title}" (or middle-click tab)`}
                  aria-label={`Close tab ${t.title}`}
                  className={`shrink-0 p-1 rounded-full transition-all flex items-center justify-center ${
                    isActive
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/80'
                      : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* New Tab Button (+) */}
          <button
            id="btn-add-new-browser-tab"
            onClick={() => handleAddNewTab()}
            title="Open New Tab (Ctrl+T)"
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors shrink-0 ml-0.5"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Reopen Closed Tab Quick Action (If closed tabs exist) */}
          {recentlyClosedTabs.length > 0 && (
            <button
              id="btn-reopen-closed-browser-tab"
              onClick={handleReopenClosedTab}
              title={`Reopen closed tab: "${recentlyClosedTabs[0].title}" (Ctrl+Shift+T)`}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-slate-900 transition-colors shrink-0 flex items-center gap-1 text-[11px] font-mono"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[10px]">Reopen ({recentlyClosedTabs.length})</span>
            </button>
          )}
        </div>

        {/* Viewport Frame Mode Selectors */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 ml-1">
          <button
            onClick={() => setDeviceViewport('desktop')}
            title="Desktop View"
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
              deviceViewport === 'desktop'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px]">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceViewport('tablet')}
            title="iPad Tablet Frame"
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
              deviceViewport === 'tablet'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px]">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceViewport('mobile')}
            title="iPhone Mobile Frame"
            className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors ${
              deviceViewport === 'mobile'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px]">Mobile</span>
          </button>
        </div>
      </div>

      {/* PROMINENT URL ADDRESS & SEARCH OMNIBOX BAR */}
      <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 space-y-2 relative select-text">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Nav Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Main_Page')}
              title="Browser Home"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={handleReload}
              title="Reload Web Page (Ctrl+R)"
              className={`p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors ${
                isLoading ? 'animate-spin text-cyan-400' : ''
              }`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Omnibox Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate(urlInput);
            }}
            className="flex-1 flex items-center gap-2 min-w-0"
          >
            <div className="relative flex-1 flex items-center bg-black/90 border-2 border-cyan-500/50 rounded-xl overflow-visible focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
              {/* Search Engine Switcher Dropdown */}
              <div className="flex items-center bg-slate-900/95 border-r border-slate-800 px-2.5 py-2 shrink-0 rounded-l-[10px]">
                <select
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value as any)}
                  title="Select Search Engine"
                  className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer pr-1"
                >
                  <option value="duckduckgo" className="bg-slate-900 text-slate-200">
                    🦆 DuckDuckGo
                  </option>
                  <option value="wikipedia" className="bg-slate-900 text-slate-200">
                    📚 Wikipedia
                  </option>
                  <option value="google" className="bg-slate-900 text-slate-200">
                    🔍 Google
                  </option>
                  <option value="github" className="bg-slate-900 text-slate-200">
                    🐙 GitHub
                  </option>
                  <option value="bing" className="bg-slate-900 text-slate-200">
                    🔎 Bing
                  </option>
                  <option value="reddit" className="bg-slate-900 text-slate-200">
                    🤖 Reddit
                  </option>
                </select>
              </div>

              {/* Protocol / Search Type Indicator */}
              <div className="flex items-center pl-2.5 pr-1 text-slate-500 shrink-0">
                {inputIsUrl ? (
                  <Lock className="w-3.5 h-3.5 text-emerald-400" title="Valid Web URL (SSL/HTTPS)" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-cyan-400" title="Web Search Query" />
                )}
              </div>

              {/* Main Input Text Field */}
              <input
                ref={inputRef}
                type="text"
                value={urlInput}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Enter web URL (e.g. https://wikipedia.org) or search query..."
                className="w-full px-2.5 py-2.5 bg-transparent text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none"
              />

              {/* Clear Input Button */}
              {urlInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setQuickSearchResults([]);
                    inputRef.current?.focus();
                  }}
                  title="Clear input"
                  className="p-1.5 text-slate-400 hover:text-white mr-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Paste from Clipboard Button */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                title="Paste URL from Clipboard"
                className="px-2.5 py-1.5 text-slate-400 hover:text-cyan-300 border-l border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors hidden xs:flex"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">Paste</span>
              </button>

              {/* Submit Go Button */}
              <button
                type="submit"
                title="Navigate to URL or Search (Enter)"
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-extrabold transition-all flex items-center gap-1 shrink-0 rounded-r-[10px] glow-cyan"
              >
                <span>Go</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Proxy Mode Toggle */}
            <button
              onClick={() => {
                const next = !useProxy;
                setUseProxy(next);
                showToast(next ? '⚡ Proxy Mode Enabled (Bypasses Frame Blocks)' : 'Direct Mode (Raw Iframe)');
              }}
              title={useProxy ? 'Proxy Active: Bypasses X-Frame-Options embedding restrictions' : 'Direct iframe mode'}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1 ${
                useProxy
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Zap className={`w-4 h-4 ${useProxy ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span className="hidden xl:inline text-[11px] font-bold">Proxy</span>
            </button>

            {/* Speed Dial Toggle */}
            <button
              onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
              title="Toggle Speed Dial Shortcuts"
              className={`p-2.5 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1 ${
                isSpeedDialOpen
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Reader Mode Toggle */}
            <button
              onClick={() => {
                if (!isReaderMode && !readerArticle) {
                  handleExtractReaderAi();
                } else {
                  setIsReaderMode(!isReaderMode);
                }
              }}
              title="Toggle AI Clean Reader Mode"
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                isReaderMode
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-mono">Reader</span>
            </button>

            {/* Web Clipper Menu */}
            <button
              onClick={handleClipToScratchpad}
              title="Clip page details to Scratchpad"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
            </button>

            <button
              onClick={handleClipToDocs}
              title="Create Document from this page"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <CopyPlus className="w-4 h-4" />
            </button>

            {/* Bookmark Button */}
            <button
              onClick={() => setIsAddBookmarkModalOpen(true)}
              title={isCurrentBookmarked ? 'Edit Bookmarks' : 'Add to Categorized Bookmarks'}
              className={`p-2.5 rounded-xl border transition-colors ${
                isCurrentBookmarked
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400'
              }`}
            >
              <Star className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              title="View Browsing History"
              className={`p-2.5 rounded-xl border transition-colors ${
                isHistoryOpen
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-cyan-300'
              }`}
            >
              <History className="w-4 h-4" />
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyUrl}
              title="Copy Page URL"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Open in Native Browser Tab */}
            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open current page in native new browser tab"
              className="p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-all flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden 2xl:inline text-[11px] font-mono">Launch</span>
            </a>

            {/* Console Log Toggle */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              title="Developer Console & Sandbox Inspector"
              className={`p-2.5 rounded-xl border transition-colors ${
                isConsoleOpen
                  ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-purple-300'
              }`}
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search Autocomplete Suggestions Dropdown */}
        {quickSearchResults.length > 0 && (
          <div className="absolute left-16 right-16 top-16 z-50 bg-slate-900/98 border-2 border-cyan-500/60 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto space-y-1 animate-in fade-in-50">
            <div className="text-[10px] font-mono text-cyan-400 px-2 py-1 flex items-center justify-between border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Instant Results
              </span>
              <button
                onClick={() => setQuickSearchResults([])}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            {quickSearchResults.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  handleNavigate(r.url);
                  setQuickSearchResults([]);
                }}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
              >
                <p className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{r.title}</span>
                </p>
                <p className="text-[11px] font-sans text-slate-400 line-clamp-1 mt-0.5">{r.snippet}</p>
              </div>
            ))}
          </div>
        )}

        {/* SPEED DIAL PRESETS BAR */}
        {isSpeedDialOpen && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider shrink-0 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Speed Dial:</span>
            </span>

            {SPEED_DIAL_PRESETS.map((preset) => (
              <button
                key={preset.url}
                onClick={() => handleNavigate(preset.url)}
                title={`Quick navigate to ${preset.name} (${preset.desc})`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all shrink-0 shadow-sm"
              >
                <span>{preset.icon}</span>
                <span className="font-semibold">{preset.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* CATEGORIZED BOOKMARKS BAR */}
        <div className="pt-1.5 flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1 font-bold">
              <Bookmark className="w-3 h-3 text-amber-400" />
              <span>Bookmarks:</span>
            </span>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-slate-800">
              {['All', 'Tech', 'AI & Tools', 'Productivity', 'News'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBookmarkFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    bookmarkFilterCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 justify-start">
            {bookmarks
              .filter((bm) => bookmarkFilterCategory === 'All' || bm.category === bookmarkFilterCategory)
              .map((bm) => (
                <div key={bm.id} className="flex items-center group relative">
                  <button
                    onClick={() => handleNavigate(bm.url)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-mono text-slate-300 hover:text-amber-300 transition-all shrink-0"
                  >
                    <span>{bm.favicon || '⭐'}</span>
                    <span className="truncate max-w-[120px]">{bm.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
                      showToast('Bookmark removed');
                    }}
                    className="hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded bg-rose-950 text-rose-300 ml-0.5 hover:bg-rose-900 text-[9px]"
                    title="Delete bookmark"
                  >
                    ✕
                  </button>
                </div>
              ))}

            <button
              onClick={() => {
                setNewBookmarkTitle(activeTab.title);
                setNewBookmarkUrl(activeTab.url);
                setIsAddBookmarkModalOpen(true);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-2.5 h-2.5" /> Bookmark
            </button>
          </div>
        </div>
      </div>

      {/* History Drawer Overlay */}
      {isHistoryOpen && (
        <div className="bg-slate-900 border-b border-cyan-500/30 p-3 max-h-48 overflow-y-auto space-y-1.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-2">
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Browsing History ({history.length} items)</span>
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear History
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono italic">No browsing history yet.</p>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                onClick={() => {
                  handleNavigate(h.url);
                  setIsHistoryOpen(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-200 truncate">{h.title}</span>
                  <span className="text-[10px] font-mono text-slate-500 truncate hidden sm:inline">{h.url}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{h.visitedAt}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Browser Viewport Container */}
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-2 relative overflow-hidden">
        {/* Device Frame Wrapper */}
        <div
          className={`w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col transition-all ${
            deviceViewport === 'tablet'
              ? 'max-w-2xl mx-auto h-[600px] border-4 border-slate-700'
              : deviceViewport === 'mobile'
              ? 'max-w-sm mx-auto h-[600px] border-4 border-slate-700'
              : 'w-full flex-1'
          }`}
        >
          {/* Reader View Mode */}
          {isReaderMode ? (
            <div
              className={`w-full h-full p-6 sm:p-10 overflow-y-auto leading-relaxed select-text transition-colors ${
                readerTheme === 'midnight'
                  ? 'bg-slate-950 text-slate-200'
                  : readerTheme === 'sepia'
                  ? 'bg-[#2b241c] text-[#f4ecd8]'
                  : 'bg-[#faf8f5] text-slate-800'
              } ${
                readerFont === 'serif' ? 'font-serif' : readerFont === 'mono' ? 'font-mono' : 'font-sans'
              }`}
            >
              <div
                className={`max-w-2xl mx-auto space-y-5 ${
                  readerFontSize === 'sm' ? 'text-sm' : readerFontSize === 'lg' ? 'text-lg' : 'text-base'
                }`}
              >
                {/* Reader Controls Toolbar */}
                <div
                  className={`p-3 rounded-2xl flex items-center justify-between gap-3 flex-wrap border ${
                    readerTheme === 'paper'
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-black/40 border-slate-800 shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Distraction-Free Reader</span>
                    </span>
                    {readerArticle?.estimatedReadMinutes && (
                      <span className="text-xs text-slate-400 font-mono">
                        ⏱️ ~{readerArticle.estimatedReadMinutes} min read
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Theme Switcher */}
                    <div className="flex items-center bg-slate-900/60 p-1 rounded-lg border border-slate-700/60">
                      <button
                        onClick={() => setReaderTheme('midnight')}
                        className={`w-5 h-5 rounded-full bg-slate-950 border ${
                          readerTheme === 'midnight' ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-700'
                        }`}
                        title="Midnight Dark Theme"
                      />
                      <button
                        onClick={() => setReaderTheme('sepia')}
                        className={`w-5 h-5 rounded-full bg-[#3d3226] border ml-1 ${
                          readerTheme === 'sepia' ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'
                        }`}
                        title="Warm Sepia Theme"
                      />
                      <button
                        onClick={() => setReaderTheme('paper')}
                        className={`w-5 h-5 rounded-full bg-[#f4ecd8] border ml-1 ${
                          readerTheme === 'paper' ? 'border-cyan-600 ring-2 ring-cyan-600/40' : 'border-slate-400'
                        }`}
                        title="Clean Paper Theme"
                      />
                    </div>

                    {/* Font Selector */}
                    <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-700/60 text-xs font-mono">
                      {(['serif', 'sans', 'mono'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setReaderFont(f)}
                          className={`px-2 py-0.5 rounded ${
                            readerFont === f ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {f === 'serif' ? 'Serif' : f === 'sans' ? 'Sans' : 'Mono'}
                        </button>
                      ))}
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-700/60 text-xs font-mono">
                      <button
                        onClick={() => setReaderFontSize('sm')}
                        className={`px-1.5 py-0.5 rounded ${
                          readerFontSize === 'sm' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setReaderFontSize('base')}
                        className={`px-1.5 py-0.5 rounded ${
                          readerFontSize === 'base' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setReaderFontSize('lg')}
                        className={`px-1.5 py-0.5 rounded ${
                          readerFontSize === 'lg' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        A+
                      </button>
                    </div>

                    <button
                      onClick={() => setIsReaderMode(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
                    >
                      Exit
                    </button>
                  </div>
                </div>

                {/* Article Header */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {readerArticle?.title || activeTab.title}
                  </h1>
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">Source: {activeTab.url}</span>
                  </p>
                </div>

                {/* AI Executive Summary & Takeaways */}
                {readerArticle?.summaryBullets && readerArticle.summaryBullets.length > 0 && (
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      readerTheme === 'paper'
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Gemini AI Key Takeaways:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-sm">
                      {readerArticle.summaryBullets.map((bullet, idx) => (
                        <li key={idx} className="leading-snug">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Re-Extract Button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleExtractReaderAi}
                    disabled={isExtractingReaderAi}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isExtractingReaderAi ? 'animate-spin' : ''}`} />
                    <span>{isExtractingReaderAi ? 'Extracting with Gemini AI...' : 'Re-Analyze with AI'}</span>
                  </button>

                  <button
                    onClick={handleClipToScratchpad}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Clip to Scratchpad</span>
                  </button>

                  <button
                    onClick={handleClipToDocs}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Create Doc</span>
                  </button>
                </div>

                <hr className={readerTheme === 'paper' ? 'border-slate-300 my-4' : 'border-slate-800 my-4'} />

                {/* Content Section */}
                <div className="space-y-4">
                  {readerArticle?.contentMarkdown ? (
                    <div className="space-y-3">
                      {readerArticle.contentMarkdown.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p>
                        Viewing content from <strong>{activeTab.title}</strong> in Personal OS clean reader view. All
                        ads, tracking scripts, and popups have been stripped for deep focus.
                      </p>
                      <p>
                        Click <strong>"Re-Analyze with AI"</strong> above to extract key takeaways, summaries, and full
                        article sections using Gemini 3.7 Flash.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col">
              {/* Web Sandbox Iframe with Proxy Endpoint */}
              <iframe
                ref={iframeRef}
                key={`${activeTab.id}-${useProxy ? 'proxy' : 'direct'}`}
                src={getIframeSrc(activeTab.url)}
                title={activeTab.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                className="w-full h-full border-0 bg-white"
              />

              {/* Embedding Note & Direct Fallback Bar */}
              <div className="bg-slate-950/95 border-t border-slate-800 p-2 text-xs font-mono text-slate-400 flex items-center justify-between gap-2 flex-wrap select-none">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {useProxy ? '⚡ Proxy Engine Active (X-Frame Bypassed)' : 'Direct Sandbox Mode'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUseProxy(!useProxy);
                      showToast(!useProxy ? 'Switched to Proxy Mode' : 'Switched to Direct Mode');
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    {useProxy ? 'Switch to Direct Mode' : 'Switch to Proxy Mode'}
                  </button>
                  <span className="text-slate-600">|</span>
                  <a
                    href={activeTab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1 transition-all"
                  >
                    <span>Launch Direct</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Developer Console Emulator Drawer */}
        {isConsoleOpen && (
          <div className="w-full mt-2 p-3 rounded-xl bg-slate-900 border border-purple-500/40 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto animate-in slide-in-from-bottom-2 select-text">
            <div className="flex items-center justify-between text-[11px] text-purple-400 font-bold border-b border-slate-800 pb-1 mb-2">
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Web Browser Console & Sandbox Inspector</span>
              </span>
              <button onClick={() => setConsoleLogs([])} className="text-slate-500 hover:text-slate-300">
                Clear
              </button>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CHROMIUM TAB CONTEXT MENU (Right-Click Menu) */}
      {contextMenu.isOpen && (
        <div
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 260),
            left: Math.min(contextMenu.x, window.innerWidth - 220),
          }}
          className="fixed z-50 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl py-1.5 text-xs font-mono text-slate-200 animate-in fade-in-50 zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Tab (Primary Chromium Action) */}
          <button
            onClick={() => {
              handleCloseTab(contextMenu.tabId);
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-rose-950/60 hover:text-rose-300 transition-colors text-rose-400 font-bold"
          >
            <span className="flex items-center gap-2">
              <X className="w-3.5 h-3.5" /> Close Tab
            </span>
            <span className="text-[10px] text-slate-500 font-sans">Ctrl+W</span>
          </button>

          {/* Close Other Tabs */}
          {tabs.length > 1 && (
            <button
              onClick={() => handleCloseOtherTabs(contextMenu.tabId)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" /> Close Other Tabs
            </button>
          )}

          {/* Close Tabs to the Right */}
          {tabs.findIndex((t) => t.id === contextMenu.tabId) < tabs.length - 1 && (
            <button
              onClick={() => handleCloseTabsToRight(contextMenu.tabId)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> Close Tabs to the Right
            </button>
          )}

          <div className="h-px bg-slate-800 my-1" />

          {/* Duplicate Tab */}
          <button
            onClick={() => handleDuplicateTab(contextMenu.tabId)}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
          >
            <CopyPlus className="w-3.5 h-3.5 text-slate-400" /> Duplicate Tab
          </button>

          {/* Pin / Unpin Tab */}
          <button
            onClick={() => handleTogglePinTab(contextMenu.tabId)}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
          >
            {tabs.find((t) => t.id === contextMenu.tabId)?.isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-slate-400" /> Unpin Tab
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-slate-400" /> Pin Tab
              </>
            )}
          </button>

          {/* Reload Tab */}
          <button
            onClick={() => {
              handleReload();
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-400" /> Reload Tab
          </button>

          {/* Reopen Closed Tab (if available) */}
          {recentlyClosedTabs.length > 0 && (
            <>
              <div className="h-px bg-slate-800 my-1" />
              <button
                onClick={handleReopenClosedTab}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 hover:text-amber-300 transition-colors text-amber-400"
              >
                <span className="flex items-center gap-2 truncate">
                  <Undo2 className="w-3.5 h-3.5" /> Reopen Closed Tab
                </span>
                <span className="text-[10px] text-slate-500 font-sans">Ctrl+Shift+T</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Add / Edit Bookmark Modal */}
      {isAddBookmarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-mono text-amber-300 flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-amber-400" />
                <span>Save Web Bookmark</span>
              </h3>
              <button
                onClick={() => setIsAddBookmarkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomBookmark} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Bookmark Title</label>
                <input
                  type="text"
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                  placeholder="e.g. React Documentation"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-sans focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Destination URL</label>
                <input
                  type="text"
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Category Tag</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Tech', 'AI & Tools', 'Productivity', 'News', 'Custom'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewBookmarkCat(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        newBookmarkCat === cat
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBookmarkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save to Bookmarks</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-xs shadow-2xl backdrop-blur animate-in zoom-in-95 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
