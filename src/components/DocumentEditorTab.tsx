import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Save,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Eye,
  Edit3,
  SplitSquareVertical,
  Star,
  Tag,
  Clock,
  Sparkles,
  Printer,
  FileCode,
  FileType,
  CheckCircle2,
  RotateCcw,
  FileCheck,
} from 'lucide-react';
import { DocumentItem, DocumentFormat } from '../types';

interface DocumentEditorTabProps {
  documents: DocumentItem[];
  onUpdateDocuments: (updater: (prev: DocumentItem[]) => DocumentItem[]) => void;
  onAskAiToAssistWithDoc?: (docContent: string, docTitle: string) => void;
}

export const DocumentEditorTab: React.FC<DocumentEditorTabProps> = ({
  documents,
  onUpdateDocuments,
  onAskAiToAssistWithDoc,
}) => {
  // Active document selection
  const [selectedDocId, setSelectedDocId] = useState<string>(() => documents[0]?.id || '');
  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Editor working state
  const [title, setTitle] = useState<string>(activeDoc?.title || '');
  const [content, setContent] = useState<string>(activeDoc?.content || '');
  const [format, setFormat] = useState<DocumentFormat>(activeDoc?.format || 'markdown');
  const [tags, setTags] = useState<string[]>(activeDoc?.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  const [isStarred, setIsStarred] = useState<boolean>(activeDoc?.isStarred || false);

  // View mode: 'split' | 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSaveTimerRef = useRef<any>(null);

  // Update working state when selected document changes
  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title);
      setContent(activeDoc.content);
      setFormat(activeDoc.format);
      setTags(activeDoc.tags || []);
      setIsStarred(activeDoc.isStarred || false);
      setAutoSaveStatus('saved');
    }
  }, [selectedDocId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Auto-Save Engine (Saves on content/title changes after 1 second debounced)
  const saveDocumentNow = useCallback(() => {
    if (!activeDoc) return;
    setAutoSaveStatus('saving');

    onUpdateDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? {
              ...d,
              title: title.trim() || 'Untitled Document',
              content: content,
              format: format,
              tags: tags,
              isStarred: isStarred,
              lastModified: new Date().toISOString(),
            }
          : d
      )
    );

    setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 400);
  }, [activeDoc, title, content, format, tags, isStarred, onUpdateDocuments]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!activeDoc) return;
    if (
      title !== activeDoc.title ||
      content !== activeDoc.content ||
      format !== activeDoc.format ||
      isStarred !== activeDoc.isStarred
    ) {
      setAutoSaveStatus('dirty');
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveDocumentNow();
      }, 1000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, content, format, isStarred, activeDoc, saveDocumentNow]);

  // Save on unmount / exiting editor
  useEffect(() => {
    return () => {
      if (autoSaveStatus === 'dirty') {
        saveDocumentNow();
      }
    };
  }, [autoSaveStatus, saveDocumentNow]);

  // Formatting Toolbar Helper
  const applyFormat = (prefix: string, suffix: string = '', defaultText: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Create New Document
  const handleCreateNewDoc = (fmt: DocumentFormat = 'markdown') => {
    const newId = `doc-${Date.now()}`;
    const newDoc: DocumentItem = {
      id: newId,
      title: `Untitled Document (${new Date().toLocaleDateString()})`,
      content:
        fmt === 'markdown'
          ? `# New Markdown Document\n\nStart typing your notes, specifications, or meeting minutes here...\n\n- [ ] Action Item 1\n- [ ] Action Item 2\n`
          : fmt === 'code'
          ? `// TypeScript / JavaScript Scratchpad\nexport function executeTask() {\n  console.log("Executing high priority OS task");\n}\n`
          : `New Document Content\n\nEnter your text here...`,
      format: fmt,
      tags: ['Draft'],
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isStarred: false,
    };

    onUpdateDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocId(newId);
    showToast('New document created');
  };

  // Delete Document
  const handleDeleteDoc = (id: string) => {
    if (documents.length <= 1) {
      showToast('Cannot delete last document');
      return;
    }
    const remaining = documents.filter((d) => d.id !== id);
    onUpdateDocuments(() => remaining);
    setSelectedDocId(remaining[0].id);
    showToast('Document deleted');
  };

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  // Export handlers
  const handleDownload = (ext: 'md' | 'txt' | 'doc' | 'html') => {
    let outputContent = content;
    let mimeType = 'text/plain;charset=utf-8';

    if (ext === 'doc') {
      // Create Word-compatible HTML format
      outputContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;padding:40px;color:#222;}</style></head><body><h1>${title}</h1><div>${content.replace(
        /\n/g,
        '<br/>'
      )}</div></body></html>`;
      mimeType = 'application/msword;charset=utf-8';
    } else if (ext === 'html') {
      outputContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui;padding:2rem;max-width:800px;margin:auto;line-height:1.6;}</style></head><body><h1>${title}</h1><div>${content.replace(
        /\n/g,
        '<br/>'
      )}</div></body></html>`;
      mimeType = 'text/html;charset=utf-8';
    } else if (ext === 'md') {
      mimeType = 'text/markdown;charset=utf-8';
    }

    const blob = new Blob([outputContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${ext === 'doc' ? 'docx' : ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported as .${ext.toUpperCase()}`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Word & Character count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Filter documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.content.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFormat = formatFilter === 'all' || d.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 min-h-[720px] rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl p-3 sm:p-4">
      {/* Left Sidebar: Document List & Search */}
      <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-4">
        {/* Sidebar Header & New Doc Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Documents</h2>
              <p className="text-[10px] text-slate-400 font-mono">{documents.length} files saved</p>
            </div>
          </div>

          {/* New Document Button */}
          <div className="relative group">
            <button
              onClick={() => handleCreateNewDoc('markdown')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow glow-cyan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Format Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-2 py-0.5 rounded-full ${
              formatFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFormatFilter('markdown')}
            className={`px-2 py-0.5 rounded-full ${
              formatFilter === 'markdown' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            MD
          </button>
          <button
            onClick={() => setFormatFilter('richtext')}
            className={`px-2 py-0.5 rounded-full ${
              formatFilter === 'richtext' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Rich
          </button>
          <button
            onClick={() => setFormatFilter('code')}
            className={`px-2 py-0.5 rounded-full ${
              formatFilter === 'code' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Code
          </button>
        </div>

        {/* Document Items List */}
        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[460px] pr-1">
          {filteredDocs.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-slate-500">No documents found.</div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <h3
                      className={`text-xs font-bold font-mono truncate max-w-[170px] ${
                        isSelected ? 'text-cyan-300' : 'text-slate-200'
                      }`}
                    >
                      {doc.title}
                    </h3>
                    {doc.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-sans">
                    {doc.content.replace(/[#*`_]/g, '') || 'Empty document'}
                  </p>

                  <div className="flex items-center justify-between gap-1 mt-2 text-[10px] font-mono text-slate-500">
                    <span className="uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {doc.format}
                    </span>
                    <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Right Editor & Preview Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Document Header & Actions Bar */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title..."
              className="w-full text-base sm:text-lg font-bold font-mono text-white bg-transparent border-b border-transparent focus:border-cyan-500 focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                {autoSaveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Auto-saved</span>
                  </>
                ) : autoSaveStatus === 'saving' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400">Saving...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">Unsaved edits</span>
                  </>
                )}
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('edit')}
                title="Editor Only"
                className={`p-1.5 rounded ${viewMode === 'edit' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                title="Split Editor & Live Preview"
                className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                title="Preview Only"
                className={`p-1.5 rounded ${viewMode === 'preview' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Assistant Hook */}
            {onAskAiToAssistWithDoc && (
              <button
                onClick={() => onAskAiToAssistWithDoc(content, title)}
                title="Ask Gemini to polish or summarize document"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-mono font-medium transition-all shadow glow-purple"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Polish</span>
              </button>
            )}

            {/* Export Dropdown Button */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDownload('md')}
                title="Export as Markdown"
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono"
              >
                .MD
              </button>
              <button
                onClick={() => handleDownload('doc')}
                title="Export as Word .DOCX"
                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono"
              >
                .DOC
              </button>
              <button
                onClick={handlePrintPdf}
                title="Print / Save PDF"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Star Favorite */}
            <button
              onClick={() => setIsStarred(!isStarred)}
              title="Star Document"
              className={`p-1.5 rounded-lg border text-xs ${
                isStarred
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Delete Document */}
            <button
              onClick={() => handleDeleteDoc(activeDoc.id)}
              title="Delete Document"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rich Formatting Toolbar */}
        <div className="py-2 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto text-slate-400 text-xs">
          <button
            onClick={() => applyFormat('**', '**', 'bold text')}
            title="Bold (**text**)"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('*', '*', 'italic text')}
            title="Italic (*text*)"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('<u>', '</u>', 'underlined text')}
            title="Underline"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('~~', '~~', 'strikethrough')}
            title="Strikethrough"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => applyFormat('# ', '', 'Heading 1')}
            title="Heading 1"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('## ', '', 'Heading 2')}
            title="Heading 2"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('### ', '', 'Heading 3')}
            title="Heading 3"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={() => applyFormat('- ', '', 'List item')}
            title="Bullet List"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('1. ', '', 'Numbered item')}
            title="Numbered List"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('> ', '', 'Quotation note')}
            title="Blockquote"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('```\n', '\n```', 'code here')}
            title="Code Block"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              applyFormat(
                '\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Data 1 | Data 2 | Data 3 |\n',
                ''
              )
            }
            title="Insert Table"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormat('[', '](https://example.com)', 'Link text')}
            title="Insert Link"
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Editor & Preview Split Workspace */}
        <div className="flex-1 flex gap-3 mt-3 min-h-[460px]">
          {/* Textarea Editor */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col min-w-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing in markdown, code, or plain text..."
                className="w-full flex-1 p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
              />
            </div>
          )}

          {/* Live Markdown / HTML Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 rounded-xl bg-slate-900/60 border border-slate-800 overflow-y-auto max-h-[560px] text-slate-200 font-sans text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none">
              <div className="space-y-3">
                {content.split('\n\n').map((block, idx) => {
                  if (block.startsWith('# ')) {
                    return (
                      <h1 key={idx} className="text-xl sm:text-2xl font-bold text-white border-b border-slate-800 pb-2">
                        {block.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (block.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-lg sm:text-xl font-bold text-cyan-300 border-b border-slate-800/60 pb-1 mt-4">
                        {block.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (block.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-base font-bold text-purple-300 mt-3">
                        {block.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (block.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="p-3 rounded-lg bg-cyan-950/40 border-l-4 border-cyan-400 text-cyan-200 font-mono text-xs my-2">
                        {block.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  if (block.startsWith('```')) {
                    return (
                      <pre key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                        {block.replace(/```/g, '')}
                      </pre>
                    );
                  }
                  if (block.startsWith('- ') || block.startsWith('* ')) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1">
                        {block.split('\n').map((item, itemIdx) => (
                          <li key={itemIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={idx}>{block}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tags Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
            <Tag className="w-3 h-3 text-cyan-400" />
            <span>Tags:</span>
          </span>
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1 text-[11px]"
            >
              <span>#{tag}</span>
              <button
                onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                className="text-slate-500 hover:text-rose-400"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag + Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-xs shadow-2xl backdrop-blur animate-in zoom-in-95">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
