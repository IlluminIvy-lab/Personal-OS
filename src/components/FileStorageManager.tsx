import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Folder,
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  File,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Eye,
  X,
  Sparkles,
  RefreshCw,
  ArrowUpDown,
  FileCheck,
  Layers,
  Database,
  Cloud,
  FileSearch,
} from 'lucide-react';
import { LocalFileItem, GoogleDriveFile } from '../types';
import { googleCalendarSignIn, googleSignOut } from '../lib/googleAuth';
import { AutoLinkText } from './AutoLinkText';

interface FileStorageManagerProps {
  localFiles: LocalFileItem[];
  setLocalFiles: React.Dispatch<React.SetStateAction<LocalFileItem[]>>;
}

export const FileStorageManager: React.FC<FileStorageManagerProps> = ({
  localFiles,
  setLocalFiles,
}) => {
  // Cloud Drive State
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('google_calendar_token') || '';
  });
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'all' | 'local' | 'drive' | 'images' | 'docs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');
  const [previewFile, setPreviewFile] = useState<LocalFileItem | GoogleDriveFile | null>(null);
  const [newFileDesc, setNewFileDesc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch Drive Files
  const fetchDriveFiles = async (token: string) => {
    if (!token) return;
    setLoadingDrive(true);
    setDriveError('');

    if (token === 'demo-mode') {
      const demoFiles: GoogleDriveFile[] = [
        {
          id: 'demo-doc-1',
          name: '📄 Q3 Product Roadmap & Strategy.gdoc',
          mimeType: 'application/vnd.google-apps.document',
          modifiedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
        {
          id: 'demo-sheet-1',
          name: '📊 Executive Budget & Financial Projections 2026.gsheet',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          modifiedTime: new Date(Date.now() - 3600000 * 12).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
        {
          id: 'demo-slide-1',
          name: '🎨 Investor Deck - AI Personal OS.gslides',
          mimeType: 'application/vnd.google-apps.presentation',
          modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
        {
          id: 'demo-pdf-1',
          name: '📑 Architecture Specification v2.pdf',
          mimeType: 'application/pdf',
          modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
      ];
      setDriveFiles(demoFiles);
      setLoadingDrive(false);
      return;
    }

    try {
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=25&q=trashed%20%3D%20false&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink,thumbnailLink,size)&orderBy=modifiedTime%20desc',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          setDriveError('Drive token expired. Please re-connect.');
          return;
        }
        throw new Error(errData?.error?.message || 'Drive API error');
      }

      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      setDriveError(err.message || 'Failed to fetch Google Drive files');
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles(accessToken);
    }
  }, [accessToken]);

  const handleConnectDrive = async () => {
    try {
      const { accessToken: newToken } = await googleCalendarSignIn();
      if (newToken) {
        setAccessToken(newToken);
        localStorage.setItem('google_calendar_token', newToken);
        fetchDriveFiles(newToken);
      }
    } catch (err) {
      setAccessToken('demo-mode');
      fetchDriveFiles('demo-mode');
    }
  };

  // Upload Local File Handler
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFileList = e.target.files;
    if (!uploadedFileList || uploadedFileList.length === 0) return;

    setIsUploading(true);

    Array.from(uploadedFileList).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileDataUrl = typeof reader.result === 'string' ? reader.result : '';
        const isImg = file.type.startsWith('image/');
        const isPdf = file.type.includes('pdf');
        const isTxt = file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md');

        const newFileItem: LocalFileItem = {
          id: `local-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: isImg ? 'image' : isPdf ? 'pdf' : isTxt ? 'text' : 'document',
          size: file.size,
          uploadedAt: new Date().toISOString(),
          fileDataUrl: fileDataUrl || URL.createObjectURL(file),
          description: newFileDesc || `Uploaded ${file.name}`,
          source: 'local',
        };

        setLocalFiles((prev) => [newFileItem, ...prev]);
        setIsUploading(false);
        setNewFileDesc('');
      };

      reader.readAsDataURL(file);
    });
  };

  const handleDeleteLocalFile = (id: string) => {
    setLocalFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDownloadLocalFile = (fileItem: LocalFileItem) => {
    const element = document.createElement('a');
    element.setAttribute('href', fileItem.fileDataUrl);
    element.setAttribute('download', fileItem.name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalLocalSize = localFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  // Sorting and Filtering
  const filteredLocalFiles = localFiles
    .filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (activeTab === 'local') return true;
      if (activeTab === 'images') return f.type === 'image';
      if (activeTab === 'docs') return f.type === 'pdf' || f.type === 'text' || f.type === 'document';
      return activeTab === 'all';
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

  const filteredDriveFiles = driveFiles
    .filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'drive') return true;
      if (activeTab === 'images') return f.mimeType.includes('image');
      if (activeTab === 'docs')
        return (
          f.mimeType.includes('document') ||
          f.mimeType.includes('pdf') ||
          f.mimeType.includes('spreadsheet') ||
          f.mimeType.includes('presentation')
        );
      return activeTab === 'all' || activeTab === 'drive';
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.modifiedTime || '').getTime() - new Date(a.modifiedTime || '').getTime();
    });

  const getDriveMimeIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('presentation')) return <Layers className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-rose-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-purple-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* File Storage Banner & Metrics */}
      <div className="bg-gradient-to-r from-[#0c1428] via-[#091b36] to-[#0c1428] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glow-cyan">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 shadow-lg shrink-0">
            <HardDrive className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              STORAGE_MANAGER <span className="text-xs text-cyan-400 font-normal">Local & Cloud Drive</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Store photos, files & documents locally, manage Google Drive cloud assets, and export encrypted vaults.
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> {localFiles.length} Local Files ({formatFileSize(totalLocalSize)})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" /> {driveFiles.length} Drive Files
              </span>
            </div>
          </div>
        </div>

        {/* Upload & Drive Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 shadow-lg transition-all glow-cyan hover:scale-105">
            <Upload className="w-4 h-4" /> Upload Local Files
            <input
              type="file"
              multiple
              onChange={handleLocalFileUpload}
              className="hidden"
            />
          </label>

          {accessToken ? (
            <button
              onClick={() => fetchDriveFiles(accessToken)}
              disabled={loadingDrive}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDrive ? 'animate-spin text-cyan-400' : ''}`} /> Refresh Drive
            </button>
          ) : (
            <button
              onClick={handleConnectDrive}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" /> Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({localFiles.length + driveFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === 'local'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Local ({localFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === 'drive'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Drive ({driveFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === 'images'
                ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === 'docs'
                ? 'bg-blue-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Documents
          </button>
        </div>

        {/* Sort & Search Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-black/60 border border-slate-800 rounded-xl px-2 py-1 text-xs font-mono text-slate-400">
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="recent" className="bg-slate-900">Recent</option>
              <option value="name" className="bg-slate-900">Name</option>
              <option value="size" className="bg-slate-900">Size</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-black/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Upload Box Card */}
        <label className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/80 bg-slate-900/30 hover:bg-slate-900/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[180px]">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white font-sans">Add Photo or Document</h4>
          <p className="text-xs text-slate-400 mt-1">
            Tap to upload files from your device to local app storage
          </p>
          <input type="file" multiple onChange={handleLocalFileUpload} className="hidden" />
        </label>

        {/* Local Files Cards */}
        {filteredLocalFiles.map((file) => (
          <div
            key={file.id}
            className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all group hover:scale-[1.01]"
          >
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <Folder className="w-3 h-3 text-cyan-400" /> Local File
                </span>
                <span className="text-slate-500 text-[10px]">{formatFileSize(file.size)}</span>
              </div>

              {/* Thumbnail / Image Preview */}
              {file.type === 'image' && file.fileDataUrl && (
                <div
                  onClick={() => setPreviewFile(file)}
                  className="w-full h-32 rounded-2xl overflow-hidden border border-slate-800 bg-black/40 cursor-pointer relative group/img"
                >
                  <img src={file.fileDataUrl} alt={file.name} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white font-mono text-xs gap-1">
                    <Eye className="w-4 h-4 text-cyan-400" /> Preview
                  </div>
                </div>
              )}

              {/* Title & Desc */}
              <div>
                <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors font-sans">
                  <AutoLinkText text={file.name} />
                </h4>
                {file.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    <AutoLinkText text={file.description} />
                  </p>
                )}
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setPreviewFile(file)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownloadLocalFile(file)}
                  title="Download File to Phone / Disk"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>

                <button
                  onClick={() => handleDeleteLocalFile(file.id)}
                  title="Delete File"
                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Drive Cloud Files Cards */}
        {filteredDriveFiles.map((driveFile) => (
          <div
            key={driveFile.id}
            className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all group hover:scale-[1.01]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  {getDriveMimeIcon(driveFile.mimeType)} Google Drive
                </span>
                <span className="text-slate-500 text-[10px]">Cloud Synced</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors font-sans flex items-center gap-1.5">
                  {driveFile.name}
                </h4>
                {driveFile.modifiedTime && (
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Modified {new Date(driveFile.modifiedTime).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Drive Action Bar (Clickable live URL to default phone browser) */}
            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
              <a
                href={driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all"
              >
                Open in Google Drive <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0a0a18] border border-cyan-500/30 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-sans truncate max-w-md">
                  {'name' in previewFile ? previewFile.name : 'File Preview'}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {'type' in previewFile && previewFile.type === 'image' && previewFile.fileDataUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/60 max-h-[400px] flex items-center justify-center">
                  <img src={previewFile.fileDataUrl} alt={previewFile.name} className="max-h-[380px] object-contain" />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {'description' in previewFile && previewFile.description
                    ? previewFile.description
                    : 'File content preview ready.'}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              {'fileDataUrl' in previewFile && (
                <button
                  onClick={() => handleDownloadLocalFile(previewFile as LocalFileItem)}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" /> Download File
                </button>
              )}
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-mono"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
