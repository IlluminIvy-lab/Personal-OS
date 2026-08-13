import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  Search,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image,
  Folder,
  File,
  Sparkles,
  ShieldAlert,
  Unlink,
} from 'lucide-react';
import { GoogleDriveFile } from '../types';
import { googleCalendarSignIn, googleSignOut } from '../lib/googleAuth';

export const GoogleDriveWidget: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('google_calendar_token') || '';
  });
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setError('');

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
          name: '📑 Architecture Specification v2.4.pdf',
          mimeType: 'application/pdf',
          modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
          webViewLink: 'https://drive.google.com',
        },
      ];
      setFiles(demoFiles);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?pageSize=15&q=trashed%20%3D%20false&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink,thumbnailLink,size)&orderBy=modifiedTime%20desc',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const apiErrMsg = errData?.error?.message || res.statusText;
        if (res.status === 401 || res.status === 403 || apiErrMsg.toLowerCase().includes('insufficient')) {
          setError('Google Drive access requires re-authorization. Please click "Re-connect Drive" to grant permissions.');
          return;
        }
        throw new Error(`Google Drive API error: ${apiErrMsg}`);
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.warn('Error fetching Drive files:', err);
      setError(err.message || 'Failed to fetch Drive files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFiles(accessToken);
    }
  }, [accessToken]);

  const handleConnectDrive = async () => {
    setError('');
    setLoading(true);
    try {
      const { accessToken: newToken } = await googleCalendarSignIn();
      if (newToken) {
        setAccessToken(newToken);
        localStorage.setItem('google_calendar_token', newToken);
        fetchFiles(newToken);
      }
    } catch (err: any) {
      console.warn('Sign in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or open the app in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google Sign-In popup was closed before completing. Click "Connect Google Drive" again to select your Google Account.');
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('Unauthorized Domain'))) {
        setError(`Domain Authorization Required: To allow Google Drive on Render (${window.location.hostname}), add '${window.location.hostname}' to Firebase Auth -> Authorized Domains.`);
      } else {
        setError(err.message || 'Google Drive sign-in was interrupted.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoMode = () => {
    setError('');
    setAccessToken('demo-mode');
    fetchFiles('demo-mode');
  };

  const handleDisconnect = async () => {
    await googleSignOut();
    setAccessToken('');
    setFiles([]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('document')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('presentation')) return <Sparkles className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('folder')) return <Folder className="w-4 h-4 text-yellow-400" />;
    if (mimeType.includes('image')) return <Image className="w-4 h-4 text-purple-400" />;
    if (mimeType.includes('pdf') || mimeType.includes('code') || mimeType.includes('json'))
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
              Google Drive
              {accessToken && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {accessToken ? 'Connected & Synced' : 'Recent files & docs'}
            </p>
          </div>
        </div>

        {accessToken && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchFiles(accessToken)}
              disabled={loading}
              title="Refresh Drive files"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDisconnect}
              title="Disconnect Drive"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      {!accessToken ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h4 className="text-sm font-medium text-slate-200">Connect Google Drive</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access your Google Docs, Sheets, Slides, and files instantly inside your Personal OS dashboard.
            </p>
          </div>

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-1.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <div className="w-full space-y-2">
            <button
              onClick={handleConnectDrive}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs transition-all shadow-md hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <HardDrive className="w-4 h-4" />
              )}
              Connect Google Drive
            </button>

            <button
              onClick={handleUseDemoMode}
              className="text-[11px] text-slate-400 hover:text-emerald-300 underline transition-colors"
            >
              Or preview with Demo Mode
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Drive files..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="truncate">{error}</span>
              </div>
              <button
                onClick={handleConnectDrive}
                className="self-start px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[11px] font-medium transition-colors"
              >
                Re-connect Drive & Grant Permission
              </button>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0 max-h-[260px]">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                {searchQuery ? 'No files match your search.' : 'No recent files found in Google Drive.'}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-800/50 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                        {file.name}
                      </p>
                      {file.modifiedTime && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          Modified {new Date(file.modifiedTime).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
