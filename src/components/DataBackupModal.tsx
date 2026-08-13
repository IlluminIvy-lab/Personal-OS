import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Database,
  X,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  HardDrive,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import {
  TaskItem,
  ObjectiveItem,
  LocalCalendarEvent,
  LocalFileItem,
  UserProfile,
} from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  objectives: ObjectiveItem[];
  localEvents: LocalCalendarEvent[];
  localFiles: LocalFileItem[];
  scratchpad: string;
  profile: UserProfile;
  onRestoreData: (restoredData: {
    tasks?: TaskItem[];
    objectives?: ObjectiveItem[];
    localEvents?: LocalCalendarEvent[];
    localFiles?: LocalFileItem[];
    scratchpad?: string;
    profile?: UserProfile;
  }) => void;
  onResetData?: () => void;
}

// AES-GCM Web Crypto Helpers
async function encryptWithPassword(plainText: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  const packageObj = {
    app: 'Personal OS Hub Encrypted Vault',
    version: '2.1-aes-gcm',
    isEncrypted: true,
    salt: Array.from(salt),
    iv: Array.from(iv),
    cipher: Array.from(new Uint8Array(cipherBuffer)),
    encryptedAt: new Date().toISOString(),
  };

  return JSON.stringify(packageObj, null, 2);
}

async function decryptWithPassword(encryptedJsonStr: string, password: string): Promise<string> {
  const packageObj = JSON.parse(encryptedJsonStr);
  if (!packageObj.isEncrypted || !packageObj.salt || !packageObj.iv || !packageObj.cipher) {
    throw new Error('Unrecognized encrypted backup format.');
  }

  const salt = new Uint8Array(packageObj.salt);
  const iv = new Uint8Array(packageObj.iv);
  const cipher = new Uint8Array(packageObj.cipher);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Incorrect password or corrupted encrypted backup.');
  }
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  objectives,
  localEvents,
  localFiles,
  scratchpad,
  profile,
  onRestoreData,
  onResetData,
}) => {
  const [exportMode, setExportMode] = useState<'plain' | 'encrypted'>('encrypted');
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Restore State
  const [pendingEncryptedContent, setPendingEncryptedContent] = useState<string | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [showDecryptPassword, setShowDecryptPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const createBackupPayload = () => {
    let cachedChat: any = null;
    try {
      const raw = localStorage.getItem('personal_os_ai_chat_messages');
      if (raw) cachedChat = JSON.parse(raw);
    } catch {
      // ignore
    }

    return {
      appName: 'Personal OS Hub',
      version: '2.1.0',
      backupTimestamp: new Date().toISOString(),
      data: {
        tasks,
        objectives,
        localEvents,
        localFiles,
        scratchpad,
        profile,
        aiChatHistory: cachedChat,
      },
    };
  };

  const handleDownloadBackup = async () => {
    const payload = createBackupPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];

    if (exportMode === 'encrypted') {
      if (!exportPassword.trim()) {
        alert('Please enter an encryption password to secure your backup.');
        return;
      }
      setIsEncrypting(true);
      try {
        const encryptedStr = await encryptWithPassword(jsonStr, exportPassword.trim());
        const blob = new Blob([encryptedStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personal_os_vault_${dateStr}.enc.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err: any) {
        alert(`Encryption failed: ${err.message}`);
      } finally {
        setIsEncrypting(false);
      }
    } else {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_os_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleCopyJson = () => {
    const payload = createBackupPayload();
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const applyRestoredData = (parsed: any) => {
    const dataToRestore = parsed.data || parsed;

    if (
      !dataToRestore.tasks &&
      !dataToRestore.objectives &&
      !dataToRestore.scratchpad &&
      !dataToRestore.localEvents
    ) {
      throw new Error('Invalid backup file structure.');
    }

    if (dataToRestore.aiChatHistory) {
      try {
        localStorage.setItem(
          'personal_os_ai_chat_messages',
          JSON.stringify(dataToRestore.aiChatHistory)
        );
      } catch {
        // ignore
      }
    }

    onRestoreData({
      tasks: dataToRestore.tasks,
      objectives: dataToRestore.objectives,
      localEvents: dataToRestore.localEvents,
      localFiles: dataToRestore.localFiles,
      scratchpad: dataToRestore.scratchpad,
      profile: dataToRestore.profile,
    });

    setImportStatus('success');
    setImportMessage(
      'Backup restored successfully! Tasks, events, notes, files, and profile state have been restored.'
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.isEncrypted) {
          // Requires password decryption
          setPendingEncryptedContent(text);
          setImportStatus('idle');
          return;
        }

        applyRestoredData(parsed);
      } catch (err: any) {
        setImportStatus('error');
        setImportMessage(
          err.message || 'Failed to parse backup JSON file. Please check file format.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEncryptedContent || !decryptPassword) return;

    setIsDecrypting(true);
    try {
      const decryptedPlain = await decryptWithPassword(
        pendingEncryptedContent,
        decryptPassword
      );
      const parsed = JSON.parse(decryptedPlain);
      applyRestoredData(parsed);
      setPendingEncryptedContent(null);
      setDecryptPassword('');
    } catch (err: any) {
      setImportStatus('error');
      setImportMessage(err.message || 'Decryption failed. Please check password.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#090e1d] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 glow-cyan">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-mono">
                DATA_BACKUP & VAULT_EXPORT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                AES-GCM-256 Encrypted Export • Restore • System Backup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* Status Messages */}
          {importStatus === 'success' && (
            <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-200 font-mono">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-300">Restore Complete</p>
                <p className="mt-1 text-emerald-200/90">{importMessage}</p>
              </div>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="bg-rose-950/60 border border-rose-500/50 p-4 rounded-2xl flex items-start gap-3 text-xs text-rose-200 font-mono">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">Operation Failed</p>
                <p className="mt-1 text-rose-200/90">{importMessage}</p>
              </div>
            </div>
          )}

          {/* Pending Encrypted Decrypt Password Prompt */}
          {pendingEncryptedContent && (
            <form
              onSubmit={handleDecryptAndRestore}
              className="bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-5 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Encrypted Backup Detected (AES-GCM-256)</span>
              </div>
              <p className="text-xs text-amber-200/90">
                This backup is password-protected. Enter the encryption password to decrypt and restore your data.
              </p>

              <div className="relative">
                <input
                  type={showDecryptPassword ? 'text' : 'password'}
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  placeholder="Enter vault password"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-white font-mono focus:outline-none focus:border-amber-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showDecryptPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingEncryptedContent(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDecrypting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isDecrypting ? 'Decrypting...' : 'Decrypt & Restore'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Section 1: Export & Download Backup */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase">
                <FileJson className="w-4 h-4 text-cyan-400" /> 1. Download System Backup
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setExportMode('encrypted')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    exportMode === 'encrypted'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3" /> Encrypted (.enc)
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('plain')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    exportMode === 'plain'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Plain JSON
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {exportMode === 'encrypted'
                ? 'Protects your entire Personal OS database with AES-GCM-256 encryption and PBKDF2 key derivation using your custom password.'
                : 'Exports your unencrypted Personal OS database in raw human-readable JSON format.'}
            </p>

            {exportMode === 'encrypted' && (
              <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <label className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Set Vault Password
                </label>
                <div className="relative">
                  <input
                    type={showExportPassword ? 'text' : 'password'}
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Enter strong encryption password..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassword(!showExportPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-white"
                  >
                    {showExportPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleDownloadBackup}
                disabled={isEncrypting}
                className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 font-mono shadow-md glow-cyan transition-all disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" /> Vault Saved!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>
                      {isEncrypting
                        ? 'Encrypting...'
                        : exportMode === 'encrypted'
                        ? 'Download Encrypted Vault'
                        : 'Download Backup JSON'}
                    </span>
                  </>
                )}
              </button>

              {exportMode === 'plain' && (
                <button
                  onClick={handleCopyJson}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 font-mono transition-all"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" /> Copy JSON
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Import & Restore Backup */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold uppercase">
                <Upload className="w-4 h-4 text-emerald-400" /> 2. Restore Backup or Vault
              </div>
              <span className="text-[10px] font-mono text-slate-500">.JSON / .ENC.JSON</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a previously exported plain or encrypted Personal OS vault file to restore all tasks, notes, documents, files, and agendas.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.enc,.enc.json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 font-bold text-xs flex items-center justify-center gap-2 font-mono transition-all"
            >
              <Upload className="w-4 h-4 text-emerald-400" /> Select & Upload Backup File (.json / .enc)
            </button>
          </div>

          {/* Section 3: Reset Data Option */}
          {onResetData && (
            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Reset app to fresh state</span>
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to reset Personal OS to initial defaults? Unbacked-up data will be replaced.'
                    )
                  ) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 font-mono flex items-center gap-1.5 text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
