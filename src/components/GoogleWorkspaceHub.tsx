import React, { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  StickyNote,
  Send,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  Star,
  User,
  Check,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LogOut,
  Phone,
  Building,
  Calendar,
  Layers,
  Paperclip,
} from 'lucide-react';
import {
  googleSignIn,
  googleSignOut,
  getCachedToken,
  initAuth,
  getCurrentUser,
} from '../lib/googleAuth';
import {
  fetchGoogleContacts,
  createGoogleContact,
  deleteGoogleContact,
} from '../lib/googleContacts';
import {
  fetchGmailMessages,
  sendGmailMessage,
  toggleGmailStar,
} from '../lib/googleGmail';
import {
  fetchGoogleTaskLists,
  fetchGoogleTasks,
  createGoogleTask,
  updateGoogleTaskStatus,
  deleteGoogleTask,
} from '../lib/googleTasks';
import { openGooglePicker } from '../lib/googlePicker';
import {
  fetchGoogleKeepNotes,
  createGoogleKeepNote,
  deleteGoogleKeepNote,
} from '../lib/googleKeep';
import {
  GoogleContact,
  GmailMessage,
  GoogleTask,
  GoogleTaskList,
  GoogleKeepNote,
  GooglePickerDocument,
  TaskItem,
  LocalFileItem,
} from '../types';
import { getApiUrl } from '../lib/api';

interface GoogleWorkspaceHubProps {
  onSyncTasksToApp?: (tasks: TaskItem[]) => void;
  onSavePickedFile?: (file: LocalFileItem) => void;
  onSyncScratchpad?: (text: string) => void;
  initialTab?: 'gmail' | 'contacts' | 'tasks' | 'picker' | 'keep';
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  onSyncTasksToApp,
  onSavePickedFile,
  onSyncScratchpad,
  initialTab = 'gmail',
}) => {
  const [activeTab, setActiveTab] = useState<'gmail' | 'contacts' | 'tasks' | 'picker' | 'keep'>(
    initialTab
  );

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null>(null);

  // General Loading & Notification states
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Confirmation Modal State (MANDATORY for mutating operations)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
    danger?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: async () => {},
  });

  // -------------------------------------------------------------
  // 1. GMAIL STATE
  // -------------------------------------------------------------
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [gmailFilter, setGmailFilter] = useState<'INBOX' | 'STARRED' | 'SENT' | 'ALL'>('INBOX');
  const [gmailSearch, setGmailSearch] = useState<string>('');
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeData, setComposeData] = useState<{
    to: string;
    subject: string;
    body: string;
    cc?: string;
  }>({ to: '', subject: '', body: '', cc: '' });

  // Email AI Intelligence State
  const [emailSummaries, setEmailSummaries] = useState<Record<string, string>>({});
  const [isSummarizingEmail, setIsSummarizingEmail] = useState<boolean>(false);
  const [isDraftingReply, setIsDraftingReply] = useState<boolean>(false);
  const [customReplyPrompt, setCustomReplyPrompt] = useState<string>('');
  const [replyTone, setReplyTone] = useState<'professional' | 'concise' | 'friendly' | 'casual'>('professional');
  const [showAiReplyMenu, setShowAiReplyMenu] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 2. CONTACTS STATE
  // -------------------------------------------------------------
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [isAddContactOpen, setIsAddContactOpen] = useState<boolean>(false);
  const [newContactData, setNewContactData] = useState<{
    givenName: string;
    familyName: string;
    email: string;
    phone: string;
    jobTitle: string;
    company: string;
  }>({
    givenName: '',
    familyName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
  });

  // -------------------------------------------------------------
  // 3. GOOGLE TASKS STATE
  // -------------------------------------------------------------
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('@default');
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 4. GOOGLE PICKER STATE
  // -------------------------------------------------------------
  const [pickedDocuments, setPickedDocuments] = useState<GooglePickerDocument[]>([]);
  const [pickerViewType, setPickerViewType] = useState<
    'all' | 'documents' | 'spreadsheets' | 'presentations' | 'images'
  >('all');

  // -------------------------------------------------------------
  // 5. GOOGLE KEEP STATE
  // -------------------------------------------------------------
  const [keepNotes, setKeepNotes] = useState<GoogleKeepNote[]>([]);
  const [keepSearch, setKeepSearch] = useState<string>('');
  const [keepFilter, setKeepFilter] = useState<'all' | 'text' | 'lists'>('all');
  const [keepError, setKeepError] = useState<string | null>(null);
  const [newKeepTitle, setNewKeepTitle] = useState<string>('');
  const [newKeepText, setNewKeepText] = useState<string>('');
  const [newKeepMode, setNewKeepMode] = useState<'text' | 'checklist'>('text');
  const [newKeepItems, setNewKeepItems] = useState<string[]>(['']);
  const [pinnedKeepIds, setPinnedKeepIds] = useState<string[]>([]);
  const [isAddKeepOpen, setIsAddKeepOpen] = useState<boolean>(false);

  // Auto clear status notifications
  useEffect(() => {
    if (statusMessage) {
      const t = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

  // Auth Lifecycle setup
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setIsAuthenticated(true);
        setUserProfile({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
      },
      () => {
        const token = getCachedToken();
        if (!token) {
          setIsAuthenticated(false);
          setUserProfile(null);
        }
      }
    );

    const user = getCurrentUser();
    const token = getCachedToken();
    if (user && token) {
      setIsAuthenticated(true);
      setUserProfile({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    }

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // When Authenticated or active tab changes, load data
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'gmail') loadGmail();
      else if (activeTab === 'contacts') loadContacts();
      else if (activeTab === 'tasks') loadTasks();
      else if (activeTab === 'keep') loadKeepNotes();
    }
  }, [isAuthenticated, activeTab, selectedTaskListId, gmailFilter]);

  // -------------------------------------------------------------
  // AUTH HANDLERS
  // -------------------------------------------------------------
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      setIsAuthenticated(true);
      setUserProfile({
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL,
      });
      setStatusMessage({ text: 'Connected to Google Workspace!', type: 'success' });
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate with Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setGmailMessages([]);
    setContacts([]);
    setGoogleTasks([]);
    setKeepNotes([]);
    setStatusMessage({ text: 'Signed out of Google Workspace.', type: 'success' });
  };

  // -------------------------------------------------------------
  // GMAIL METHODS
  // -------------------------------------------------------------
  const loadGmail = async () => {
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('gmail');
    try {
      let labelQuery = '';
      if (gmailFilter === 'INBOX') labelQuery = 'in:inbox';
      else if (gmailFilter === 'STARRED') labelQuery = 'is:starred';
      else if (gmailFilter === 'SENT') labelQuery = 'in:sent';

      const finalQuery = [labelQuery, gmailSearch.trim()].filter(Boolean).join(' ');

      const msgs = await fetchGmailMessages(token, {
        maxResults: 20,
        query: finalQuery || undefined,
      });
      setGmailMessages(msgs);
      if (msgs.length > 0 && !selectedEmail) {
        setSelectedEmail(msgs[0]);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load Gmail messages', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  const handleToggleStar = async (msg: GmailMessage) => {
    const token = getCachedToken();
    if (!token) return;

    const nextStarred = !msg.isStarred;
    setGmailMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: nextStarred } : m))
    );
    if (selectedEmail?.id === msg.id) {
      setSelectedEmail({ ...selectedEmail, isStarred: nextStarred });
    }

    try {
      await toggleGmailStar(token, msg.id, nextStarred);
    } catch {
      // rollback
      setGmailMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isStarred: !nextStarred } : m))
      );
    }
  };

  const requestSendEmail = () => {
    if (!composeData.to.trim()) {
      setStatusMessage({ text: 'Please specify a recipient email address.', type: 'error' });
      return;
    }

    // MANDATORY USER CONFIRMATION BEFORE SENDING
    setConfirmModal({
      isOpen: true,
      title: 'Send Email via Gmail?',
      description: `You are about to send an email to "${composeData.to}" with subject "${composeData.subject || '(No Subject)'}". Would you like to proceed?`,
      confirmLabel: 'Send Email Now',
      danger: false,
      onConfirm: async () => {
        const token = getCachedToken();
        if (!token) return;
        setLoadingSection('send-mail');
        try {
          await sendGmailMessage(token, {
            to: composeData.to.trim(),
            subject: composeData.subject.trim(),
            body: composeData.body,
            cc: composeData.cc?.trim() || undefined,
          });
          setIsComposeOpen(false);
          setComposeData({ to: '', subject: '', body: '', cc: '' });
          setStatusMessage({ text: 'Email sent successfully via Gmail!', type: 'success' });
          loadGmail();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to send email.', type: 'error' });
        } finally {
          setLoadingSection(null);
        }
      },
    });
  };

  // AI Email Summarizer
  const handleSummarizeEmail = async (msg: GmailMessage) => {
    if (emailSummaries[msg.id]) return;
    setIsSummarizingEmail(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/email-draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          subject: msg.subject,
          from: msg.from,
          body: msg.bodyText || msg.snippet,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmailSummaries((prev) => ({
        ...prev,
        [msg.id]: data.result || 'No summary generated.',
      }));
      setStatusMessage({ text: 'AI Summary generated for email thread!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to generate AI email summary', type: 'error' });
    } finally {
      setIsSummarizingEmail(false);
    }
  };

  // AI Email Reply & Draft Generator
  const handleGenerateAiReply = async (
    msg: GmailMessage,
    actionType: string,
    customInstruction?: string
  ) => {
    setIsDraftingReply(true);
    setShowAiReplyMenu(false);
    try {
      const res = await fetch(getApiUrl('/api/ai/email-draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          subject: msg.subject,
          from: msg.from,
          body: msg.bodyText || msg.snippet,
          tone: replyTone,
          customInstruction: customInstruction || customReplyPrompt,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const replyTo = msg.from ? msg.from.match(/<([^>]+)>/)?.[1] || msg.from : '';

      setComposeData({
        to: replyTo,
        subject: msg.subject?.startsWith('Re:') ? msg.subject : `Re: ${msg.subject || ''}`,
        body: `${data.result || ''}\n\n--- Original Message ---\n${msg.bodyText || msg.snippet}`,
      });
      setIsComposeOpen(true);
      setStatusMessage({ text: 'AI Reply drafted in compose window!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to generate AI email reply', type: 'error' });
    } finally {
      setIsDraftingReply(false);
    }
  };

  // Polish / Refine Compose Body with AI
  const handlePolishComposeWithAi = async (tone: string) => {
    if (!composeData.body.trim()) {
      setStatusMessage({ text: 'Please write a message body first to polish.', type: 'error' });
      return;
    }
    setLoadingSection('ai-polish');
    try {
      const res = await fetch(getApiUrl('/api/ai/email-draft'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'polish and enhance draft',
          subject: composeData.subject,
          from: 'Me',
          body: composeData.body,
          tone,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result) {
        setComposeData((prev) => ({ ...prev, body: data.result }));
        setStatusMessage({ text: `Email polished with ${tone} tone!`, type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to polish email draft.', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  // -------------------------------------------------------------
  // CONTACTS METHODS
  // -------------------------------------------------------------
  const loadContacts = async () => {
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('contacts');
    try {
      const data = await fetchGoogleContacts(token);
      setContacts(data);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load Google Contacts', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  const handleCreateContact = async () => {
    if (!newContactData.givenName.trim()) {
      setStatusMessage({ text: 'First name is required.', type: 'error' });
      return;
    }
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('create-contact');
    try {
      await createGoogleContact(token, {
        givenName: newContactData.givenName.trim(),
        familyName: newContactData.familyName.trim(),
        email: newContactData.email.trim(),
        phone: newContactData.phone.trim(),
        jobTitle: newContactData.jobTitle.trim(),
        company: newContactData.company.trim(),
      });
      setIsAddContactOpen(false);
      setNewContactData({
        givenName: '',
        familyName: '',
        email: '',
        phone: '',
        jobTitle: '',
        company: '',
      });
      setStatusMessage({ text: 'Contact added to Google Contacts!', type: 'success' });
      loadContacts();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create contact', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  const requestDeleteContact = (contact: GoogleContact) => {
    // MANDATORY USER CONFIRMATION
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Contact?',
      description: `Are you sure you want to permanently delete "${contact.displayName}" from your Google Contacts? This action cannot be undone.`,
      confirmLabel: 'Delete Contact',
      danger: true,
      onConfirm: async () => {
        const token = getCachedToken();
        if (!token) return;
        setLoadingSection('delete-contact');
        try {
          await deleteGoogleContact(token, contact.resourceName);
          setStatusMessage({ text: `Deleted contact ${contact.displayName}`, type: 'success' });
          loadContacts();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete contact', type: 'error' });
        } finally {
          setLoadingSection(null);
        }
      },
    });
  };

  const handleEmailContact = (email: string) => {
    setComposeData({ to: email, subject: '', body: '' });
    setActiveTab('gmail');
    setIsComposeOpen(true);
  };

  // -------------------------------------------------------------
  // GOOGLE TASKS METHODS
  // -------------------------------------------------------------
  const loadTasks = async () => {
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('tasks');
    try {
      const lists = await fetchGoogleTaskLists(token);
      setTaskLists(lists);

      const targetList = selectedTaskListId === '@default' && lists[0] ? lists[0].id : selectedTaskListId;
      const tasks = await fetchGoogleTasks(token, targetList);
      setGoogleTasks(tasks);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load Google Tasks', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('create-task');
    try {
      await createGoogleTask(token, selectedTaskListId, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: newTaskDueDate || undefined,
      });
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDueDate('');
      setIsAddTaskOpen(false);
      setStatusMessage({ text: 'Google Task created!', type: 'success' });
      loadTasks();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create task', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTask) => {
    const token = getCachedToken();
    if (!token) return;

    const nextCompleted = task.status !== 'completed';
    setGoogleTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: nextCompleted ? 'completed' : 'needsAction' } : t
      )
    );

    try {
      await updateGoogleTaskStatus(token, selectedTaskListId, task.id, nextCompleted);
    } catch {
      // rollback
      setGoogleTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const requestDeleteTask = (task: GoogleTask) => {
    // MANDATORY USER CONFIRMATION
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Task?',
      description: `Are you sure you want to permanently delete task "${task.title}"?`,
      confirmLabel: 'Delete Task',
      danger: true,
      onConfirm: async () => {
        const token = getCachedToken();
        if (!token) return;
        try {
          await deleteGoogleTask(token, selectedTaskListId, task.id);
          setStatusMessage({ text: 'Task deleted from Google Tasks', type: 'success' });
          loadTasks();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete task', type: 'error' });
        }
      },
    });
  };

  const handleSyncTasksToApp = () => {
    if (!onSyncTasksToApp) return;

    const converted: TaskItem[] = googleTasks.map((gt) => ({
      id: `gt-${gt.id}`,
      title: gt.title,
      category: 'Work',
      priority: 'Medium',
      status: gt.status === 'completed' ? 'Completed' : 'Todo',
      dueDate: gt.due ? gt.due.split('T')[0] : undefined,
      createdAt: new Date().toISOString(),
      tags: ['GoogleTasks', 'Synced'],
    }));

    onSyncTasksToApp(converted);
    setStatusMessage({
      text: `Synced ${converted.length} Google Tasks into Personal OS!`,
      type: 'success',
    });
  };

  // -------------------------------------------------------------
  // GOOGLE PICKER METHODS
  // -------------------------------------------------------------
  const handleLaunchPicker = async () => {
    const token = getCachedToken();
    if (!token) {
      setStatusMessage({ text: 'Please sign in with Google first.', type: 'error' });
      return;
    }

    setLoadingSection('picker');
    try {
      await openGooglePicker({
        accessToken: token,
        viewType: pickerViewType,
        title: 'Personal OS • Select Google Drive Files',
        onPicked: (docs) => {
          setPickedDocuments((prev) => [...docs, ...prev]);
          setStatusMessage({
            text: `Selected ${docs.length} file(s) from Google Drive!`,
            type: 'success',
          });

          if (onSavePickedFile) {
            docs.forEach((doc) => {
              onSavePickedFile({
                id: `drive-${doc.id}`,
                name: doc.name,
                type: doc.mimeType.includes('image')
                  ? 'image'
                  : doc.mimeType.includes('pdf')
                  ? 'pdf'
                  : 'document',
                size: doc.sizeBytes || 1024,
                uploadedAt: new Date().toISOString(),
                fileDataUrl: doc.url,
                description: `Google Drive file: ${doc.mimeType}`,
                source: 'drive',
              });
            });
          }
        },
        onCancel: () => {
          // User closed picker
        },
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to launch Google Picker', type: 'error' });
    } finally {
      setLoadingSection(null);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE KEEP METHODS
  // -------------------------------------------------------------
  const loadKeepNotes = async () => {
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('keep');
    setKeepError(null);
    try {
      const notes = await fetchGoogleKeepNotes(token);
      setKeepNotes(notes);
    } catch (err: any) {
      setKeepError(err.message || 'Failed to load Google Keep notes');
    } finally {
      setLoadingSection(null);
    }
  };

  const handleCreateKeepNote = async () => {
    if (!newKeepTitle.trim()) return;
    const token = getCachedToken();
    if (!token) return;

    setLoadingSection('create-keep');
    try {
      let createdNote: GoogleKeepNote;
      if (newKeepMode === 'checklist') {
        const filteredItems = newKeepItems
          .map((item) => item.trim())
          .filter(Boolean)
          .map((text) => ({ text, isChecked: false }));

        createdNote = await createGoogleKeepNote(token, {
          title: newKeepTitle.trim(),
          listItems: filteredItems.length > 0 ? filteredItems : [{ text: 'Item 1', isChecked: false }],
        });
      } else {
        createdNote = await createGoogleKeepNote(token, {
          title: newKeepTitle.trim(),
          text: newKeepText.trim(),
        });
      }

      setNewKeepTitle('');
      setNewKeepText('');
      setNewKeepItems(['']);
      setNewKeepMode('text');
      setIsAddKeepOpen(false);
      setStatusMessage({ text: 'Note created in Google Keep!', type: 'success' });
      loadKeepNotes();
    } catch (err: any) {
      // If enterprise permission denied, offer to save to local notes
      setStatusMessage({ text: err.message || 'Failed to create Keep note', type: 'error' });
      // Fallback: save to local state and scratchpad
      const fallbackNote: GoogleKeepNote = {
        id: `local-keep-${Date.now()}`,
        title: newKeepTitle.trim(),
        bodyText: newKeepMode === 'text' ? newKeepText.trim() : undefined,
        listItems:
          newKeepMode === 'checklist'
            ? newKeepItems.filter(Boolean).map((t) => ({ text: t, isChecked: false }))
            : undefined,
        createTime: new Date().toISOString(),
      };
      setKeepNotes((prev) => [fallbackNote, ...prev]);
      if (onSyncScratchpad && newKeepText.trim()) {
        onSyncScratchpad(`### ${newKeepTitle}\n${newKeepText}`);
      }
      setNewKeepTitle('');
      setNewKeepText('');
      setNewKeepItems(['']);
      setIsAddKeepOpen(false);
    } finally {
      setLoadingSection(null);
    }
  };

  const handleToggleKeepListItem = (noteId: string, itemIndex: number) => {
    setKeepNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId || !n.listItems) return n;
        const updatedItems = n.listItems.map((item, idx) =>
          idx === itemIndex ? { ...item, isChecked: !item.isChecked } : item
        );
        return { ...n, listItems: updatedItems };
      })
    );
  };

  const handleTogglePinNote = (noteId: string) => {
    setPinnedKeepIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const requestDeleteKeepNote = (note: GoogleKeepNote) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Google Keep Note?',
      description: `Are you sure you want to delete note "${note.title}"?`,
      confirmLabel: 'Delete Note',
      danger: true,
      onConfirm: async () => {
        const token = getCachedToken();
        if (token && !note.id.startsWith('local-keep-')) {
          try {
            await deleteGoogleKeepNote(token, note.id);
          } catch {
            // ignore remote delete failure if unsupported
          }
        }
        setKeepNotes((prev) => prev.filter((n) => n.id !== note.id));
        setPinnedKeepIds((prev) => prev.filter((id) => id !== note.id));
        setStatusMessage({ text: 'Note deleted', type: 'success' });
      },
    });
  };

  // Filter contacts by search term
  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.emailAddresses.some((e) => e.value.toLowerCase().includes(q)) ||
      c.phoneNumbers.some((p) => p.value.includes(q)) ||
      c.organizations?.some((o) => (o.name || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ----------------- Top Header & Status ----------------- */}
      <div className="bg-[#0b1222] border border-cyan-500/30 rounded-2xl p-5 shadow-xl glow-cyan">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold font-mono text-white tracking-wide">
                  GOOGLE WORKSPACE SUITE
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  v2.0 Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official Contacts • Gmail • Tasks • Keep • Google Picker Integrations
              </p>
            </div>
          </div>

          {/* Authentication & User Badge */}
          <div className="flex items-center gap-2.5">
            {!isAuthenticated ? (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="gsi-material-button flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-sans font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <div className="gsi-material-button-icon w-4 h-4">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono">
                  {userProfile?.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName || 'Google Account'}
                      className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                    />
                  ) : (
                    <User className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-white font-bold max-w-[130px] truncate">
                    {userProfile?.displayName || userProfile?.email || 'Google User'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign out of Google Workspace"
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {statusMessage && (
          <div
            className={`mt-4 p-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {authError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Authentication Issue:</p>
              <p className="text-slate-300">{authError}</p>
            </div>
          </div>
        )}

        {/* ----------------- Workspace Service Tabs ----------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('gmail')}
            className={`p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'gmail'
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-md shadow-red-950/50'
                : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Mail className="w-4 h-4 text-red-400" />
            <span>Gmail</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'contacts'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-950/50'
                : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'tasks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/50'
                : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('picker')}
            className={`p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'picker'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50'
                : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span>Drive Picker</span>
          </button>

          <button
            onClick={() => setActiveTab('keep')}
            className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'keep'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/50'
                : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4 text-amber-400" />
            <span>Keep Notes</span>
          </button>
        </div>
      </div>

      {/* ----------------- TAB 1: GMAIL ----------------- */}
      {activeTab === 'gmail' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e1c] border border-slate-800 p-4 rounded-2xl">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['INBOX', 'STARRED', 'SENT', 'ALL'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setGmailFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    gmailFilter === filter
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Actions: Search & Compose */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Gmail..."
                  value={gmailSearch}
                  onChange={(e) => setGmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadGmail()}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-400 font-mono"
                />
              </div>

              <button
                onClick={loadGmail}
                disabled={loadingSection === 'gmail'}
                title="Refresh Gmail Inbox"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingSection === 'gmail' ? 'animate-spin text-red-400' : ''}`}
                />
              </button>

              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/60 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose</span>
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="p-12 text-center bg-[#080e1c] border border-slate-800/80 rounded-2xl space-y-3">
              <Mail className="w-10 h-10 text-red-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white font-mono">Gmail Integration Locked</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to read your recent inbox threads, view email bodies, and compose messages directly inside Personal OS.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign in to Access Gmail</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[450px]">
              {/* Message List (Left 5 Cols) */}
              <div className="lg:col-span-5 bg-[#080e1c] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Messages ({gmailMessages.length})</span>
                  {loadingSection === 'gmail' && <span className="text-red-400">Syncing...</span>}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/60">
                  {gmailMessages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">
                      No emails found for this filter.
                    </div>
                  ) : (
                    gmailMessages.map((msg) => {
                      const isSelected = selectedEmail?.id === msg.id;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedEmail(msg)}
                          className={`p-3.5 cursor-pointer transition-colors relative flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-red-500/10 border-l-2 border-red-500'
                              : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(msg);
                            }}
                            className="mt-0.5 text-slate-500 hover:text-amber-400"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                msg.isStarred ? 'text-amber-400 fill-amber-400' : ''
                              }`}
                            />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs truncate font-mono ${
                                  msg.isUnread ? 'text-white font-bold' : 'text-slate-300'
                                }`}
                              >
                                {msg.from ? msg.from.split('<')[0].replace(/"/g, '') : 'Unknown'}
                              </span>
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </div>

                            <p
                              className={`text-xs truncate mt-0.5 ${
                                msg.isUnread ? 'text-slate-100 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              {msg.subject || '(No Subject)'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {msg.snippet}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Email Content Viewer (Right 7 Cols) */}
              <div className="lg:col-span-7 bg-[#080e1c] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                {selectedEmail ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-white font-sans">
                          {selectedEmail.subject || '(No Subject)'}
                        </h3>
                        <button
                          onClick={() => handleToggleStar(selectedEmail)}
                          className="p-1 text-slate-400 hover:text-amber-400"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              selectedEmail.isStarred ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                        <div>
                          <span className="text-slate-500">From: </span>
                          <span className="text-cyan-300">{selectedEmail.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{selectedEmail.date || 'Recent'}</span>
                          <button
                            onClick={() => handleSummarizeEmail(selectedEmail)}
                            disabled={isSummarizingEmail}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-mono text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Generate 3-bullet executive summary with Gemini AI"
                          >
                            <Sparkles className={`w-3 h-3 text-purple-400 ${isSummarizingEmail ? 'animate-spin' : ''}`} />
                            <span>{emailSummaries[selectedEmail.id] ? 'AI Summary Ready' : 'Summarize Thread'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Executive Summary Card if generated */}
                    {emailSummaries[selectedEmail.id] && (
                      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 font-sans text-xs text-purple-200 space-y-1.5 animate-fadeIn shadow-inner">
                        <div className="flex items-center justify-between font-mono text-[11px] text-purple-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Gemini AI Thread Summary</span>
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(emailSummaries[selectedEmail.id]);
                              setStatusMessage({ text: 'AI Summary copied to clipboard!', type: 'success' });
                            }}
                            className="hover:text-purple-200 text-[10px]"
                          >
                            Copy Summary
                          </button>
                        </div>
                        <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {emailSummaries[selectedEmail.id]}
                        </div>
                      </div>
                    )}

                    {/* Body */}
                    <div className="prose prose-invert max-w-none text-xs text-slate-300 max-h-[300px] overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedEmail.bodyText || selectedEmail.snippet}
                    </div>

                    {/* AI Smart Reply Assistant Toolbar */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const replyTo = selectedEmail.from
                                ? selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from
                                : '';
                              setComposeData({
                                to: replyTo,
                                subject: selectedEmail.subject?.startsWith('Re:')
                                  ? selectedEmail.subject
                                  : `Re: ${selectedEmail.subject || ''}`,
                                body: `\n\n--- Original Message ---\n${selectedEmail.bodyText || selectedEmail.snippet}`,
                              });
                              setIsComposeOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-red-400" />
                            <span>Manual Reply</span>
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setShowAiReplyMenu(!showAiReplyMenu)}
                              disabled={isDraftingReply}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/60 to-purple-950/60 hover:from-red-900/60 hover:to-purple-900/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-red-400 ${isDraftingReply ? 'animate-spin' : ''}`} />
                              <span>{isDraftingReply ? 'Drafting...' : '✨ AI Smart Reply'}</span>
                            </button>

                            {showAiReplyMenu && (
                              <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#0b1222] border border-red-500/30 rounded-xl p-3 shadow-2xl z-30 space-y-2 text-xs font-mono">
                                <div className="text-[11px] font-bold text-red-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                                  <span>Choose AI Reply Intent:</span>
                                  <select
                                    value={replyTone}
                                    onChange={(e) => setReplyTone(e.target.value as any)}
                                    className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 text-[10px]"
                                  >
                                    <option value="professional">Professional</option>
                                    <option value="concise">Concise</option>
                                    <option value="friendly">Friendly</option>
                                    <option value="casual">Casual</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  <button
                                    onClick={() => handleGenerateAiReply(selectedEmail, 'Accept, confirm availability and express enthusiasm')}
                                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[11px] transition-colors"
                                  >
                                    ✅ Confirm & Accept
                                  </button>
                                  <button
                                    onClick={() => handleGenerateAiReply(selectedEmail, 'Politely decline and propose rescheduling for later')}
                                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[11px] transition-colors"
                                  >
                                    ⏳ Polite Decline & Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleGenerateAiReply(selectedEmail, 'Acknowledge receipt and request additional details or agenda')}
                                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[11px] transition-colors"
                                  >
                                    ❓ Request More Details / Agenda
                                  </button>
                                  <button
                                    onClick={() => handleGenerateAiReply(selectedEmail, 'Acknowledge, thank them, and state no action is needed')}
                                    className="text-left px-2 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-[11px] transition-colors"
                                  >
                                    🤝 Thank & Acknowledge
                                  </button>
                                </div>

                                <div className="pt-1.5 border-t border-slate-800 space-y-1">
                                  <input
                                    type="text"
                                    placeholder="Or custom prompt (e.g. tell them Tuesday at 2pm)"
                                    value={customReplyPrompt}
                                    onChange={(e) => setCustomReplyPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && customReplyPrompt.trim()) {
                                        handleGenerateAiReply(selectedEmail, customReplyPrompt);
                                      }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                                  />
                                  <button
                                    disabled={!customReplyPrompt.trim()}
                                    onClick={() => handleGenerateAiReply(selectedEmail, customReplyPrompt)}
                                    className="w-full py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-[10px]"
                                  >
                                    Generate Custom Draft
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${selectedEmail.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 font-mono transition-colors"
                        >
                          <span>Open in Gmail</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 font-mono text-xs">
                    <Mail className="w-8 h-8 opacity-40 mb-2" />
                    <p>Select a message from the list to preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 2: CONTACTS ----------------- */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e1c] border border-slate-800 p-4 rounded-2xl">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Contacts by name, email, company, phone..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadContacts}
                disabled={loadingSection === 'contacts'}
                title="Refresh Contacts"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingSection === 'contacts' ? 'animate-spin text-blue-400' : ''}`}
                />
              </button>

              <button
                onClick={() => setIsAddContactOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="p-12 text-center bg-[#080e1c] border border-slate-800/80 rounded-2xl space-y-3">
              <Users className="w-10 h-10 text-blue-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white font-mono">Google Contacts Locked</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to synchronize your personal and organization contacts, search email directories, and create new contact cards.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign in to Access Contacts</span>
              </button>
            </div>
          ) : (
            <div>
              {loadingSection === 'contacts' && contacts.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-blue-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading Google Contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-12 text-center bg-[#080e1c] border border-slate-800 rounded-2xl text-xs text-slate-400 font-mono space-y-2">
                  <p>No contacts matched your search.</p>
                  <button
                    onClick={() => setIsAddContactOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold"
                  >
                    + Create First Contact
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredContacts.map((contact) => {
                    const primaryEmail = contact.emailAddresses[0]?.value;
                    const primaryPhone = contact.phoneNumbers[0]?.value;
                    const org = contact.organizations?.[0];

                    return (
                      <div
                        key={contact.resourceName}
                        className="bg-[#080e1c] border border-slate-800/90 hover:border-blue-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {contact.photos?.[0]?.url && !contact.photos[0].default ? (
                              <img
                                src={contact.photos[0].url}
                                alt={contact.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-blue-400/40"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold font-mono text-sm">
                                {contact.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-white font-sans">
                                {contact.displayName}
                              </h4>
                              {org && (
                                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                                  {org.title ? `${org.title} • ` : ''}
                                  {org.name || ''}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => requestDeleteContact(contact)}
                            title="Delete Contact"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 text-xs font-mono">
                          {primaryEmail && (
                            <div className="flex items-center justify-between gap-2 text-slate-300">
                              <span className="truncate">{primaryEmail}</span>
                              <button
                                onClick={() => handleEmailContact(primaryEmail)}
                                title="Compose Email in Gmail"
                                className="p-1 rounded bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {primaryPhone && (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{primaryPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: GOOGLE TASKS ----------------- */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080e1c] border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">List:</span>
              <select
                value={selectedTaskListId}
                onChange={(e) => setSelectedTaskListId(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>

              <button
                onClick={loadTasks}
                disabled={loadingSection === 'tasks'}
                title="Refresh Tasks"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingSection === 'tasks' ? 'animate-spin text-cyan-400' : ''}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onSyncTasksToApp && googleTasks.length > 0 && (
                <button
                  onClick={handleSyncTasksToApp}
                  title="Import Google Tasks into Personal OS task board"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sync to Personal OS</span>
                </button>
              )}

              <button
                onClick={() => setIsAddTaskOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Google Task</span>
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="p-12 text-center bg-[#080e1c] border border-slate-800/80 rounded-2xl space-y-3">
              <CheckSquare className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white font-mono">Google Tasks Locked</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to view and update your Google Tasks, check off completed action items, and sync items into your local Personal OS boards.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign in to Access Google Tasks</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#080e1c] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
              {googleTasks.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-slate-500">
                  No tasks found in this list. Create your first task above!
                </div>
              ) : (
                googleTasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                        isDone ? 'bg-slate-950/40 opacity-60' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                            isDone
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'bg-slate-900 border-slate-700 hover:border-cyan-400'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-medium ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-100'
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-[11px] text-slate-400 mt-1 font-mono">{task.notes}</p>
                          )}
                          {task.due && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => requestDeleteTask(task)}
                        title="Delete Google Task"
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 4: GOOGLE PICKER & DRIVE ----------------- */}
      {activeTab === 'picker' && (
        <div className="space-y-4">
          <div className="bg-[#080e1c] border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  Google Drive File Picker
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Securely browse and pick Docs, Sheets, Slides, and Drive attachments using Google's native Picker component.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pickerViewType}
                  onChange={(e: any) => setPickerViewType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                >
                  <option value="all">All Documents & Files</option>
                  <option value="documents">Google Docs only</option>
                  <option value="spreadsheets">Google Sheets only</option>
                  <option value="presentations">Google Slides only</option>
                  <option value="images">Images & Media</option>
                </select>

                <button
                  onClick={handleLaunchPicker}
                  disabled={loadingSection === 'picker' || !isAuthenticated}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open Drive Picker</span>
                </button>
              </div>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="p-12 text-center bg-[#080e1c] border border-slate-800/80 rounded-2xl space-y-3">
              <FolderOpen className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white font-mono">Drive Picker Authorization Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to grant Drive Picker access to select documents and import them directly into Personal OS.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#080e1c] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Picked Drive Documents ({pickedDocuments.length})
              </h4>

              {pickedDocuments.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 font-mono space-y-2">
                  <p>No documents picked in this session.</p>
                  <button
                    onClick={handleLaunchPicker}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                  >
                    Click here to open Google Drive Picker
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pickedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{doc.name}</h5>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {doc.mimeType}
                          </p>
                        </div>
                      </div>

                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-mono flex items-center gap-1 border border-slate-800"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 5: GOOGLE KEEP ----------------- */}
      {activeTab === 'keep' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#080e1c] border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <StickyNote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono text-white font-bold block">Google Keep & Memos</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {keepNotes.length} note{keepNotes.length === 1 ? '' : 's'} synchronized
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Keep notes..."
                  value={keepSearch}
                  onChange={(e) => setKeepSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setKeepFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    keepFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setKeepFilter('text')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    keepFilter === 'text'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setKeepFilter('lists')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    keepFilter === 'lists'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Checklists
                </button>
              </div>

              <button
                onClick={loadKeepNotes}
                disabled={loadingSection === 'keep'}
                title="Refresh Keep Notes"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingSection === 'keep' ? 'animate-spin text-amber-400' : ''}`}
                />
              </button>

              <button
                onClick={() => setIsAddKeepOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/60 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="p-12 text-center bg-[#080e1c] border border-slate-800/80 rounded-2xl space-y-3">
              <StickyNote className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-white font-mono">Keep Authorization Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to synchronize your Google Keep notes, checklists, and scratchpad memos.
              </p>
              <button
                onClick={handleSignIn}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <>
              {keepError && (
                <div className="bg-[#080e1c] border border-amber-500/30 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Google Keep Workspace Account Information</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {keepError}
                  </p>
                  <p className="text-[11px] text-amber-200/80 font-mono">
                    ✓ You can create and organize notes here; notes will persist in your Personal OS workspace and sync with your scratchpad!
                  </p>
                </div>
              )}

              {/* Filtered Notes Grid */}
              {(() => {
                const query = keepSearch.toLowerCase();
                const filtered = keepNotes.filter((n) => {
                  const matchQuery =
                    n.title.toLowerCase().includes(query) ||
                    (n.bodyText && n.bodyText.toLowerCase().includes(query)) ||
                    (n.listItems && n.listItems.some((li) => li.text.toLowerCase().includes(query)));
                  if (!matchQuery) return false;
                  if (keepFilter === 'text') return !n.listItems || n.listItems.length === 0;
                  if (keepFilter === 'lists') return n.listItems && n.listItems.length > 0;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-[#080e1c] border border-slate-800 rounded-2xl p-12 text-center text-xs font-mono text-slate-500 space-y-3">
                      <StickyNote className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>No notes matching your filter or search.</p>
                      <button
                        onClick={() => setIsAddKeepOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold"
                      >
                        + Create a new Keep note
                      </button>
                    </div>
                  );
                }

                // Sort: pinned first
                const sorted = [...filtered].sort((a, b) => {
                  const aPinned = pinnedKeepIds.includes(a.id);
                  const bPinned = pinnedKeepIds.includes(b.id);
                  if (aPinned && !bPinned) return -1;
                  if (!aPinned && bPinned) return 1;
                  return 0;
                });

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map((note) => {
                      const isPinned = pinnedKeepIds.includes(note.id);
                      return (
                        <div
                          key={note.id}
                          className={`bg-[#080e1c] border rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between ${
                            isPinned
                              ? 'border-amber-400/60 shadow-lg shadow-amber-950/20 glow-amber'
                              : 'border-slate-800 hover:border-amber-500/40'
                          }`}
                        >
                          <div className="space-y-2">
                            {/* Note Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <StickyNote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <h4 className="text-xs font-bold text-amber-300 font-mono truncate">
                                  {note.title || 'Untitled Note'}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleTogglePinNote(note.id)}
                                  title={isPinned ? 'Unpin note' : 'Pin note to top'}
                                  className={`p-1 rounded transition-colors ${
                                    isPinned
                                      ? 'text-amber-400 hover:text-amber-300'
                                      : 'text-slate-600 hover:text-amber-400'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                                </button>
                                <button
                                  onClick={() => requestDeleteKeepNote(note)}
                                  title="Delete Note"
                                  className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Note Body Text */}
                            {note.bodyText && (
                              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                                {note.bodyText}
                              </p>
                            )}

                            {/* Checklist Items */}
                            {note.listItems && note.listItems.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {note.listItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => handleToggleKeepListItem(note.id, idx)}
                                    className="flex items-start gap-2 text-xs font-sans text-slate-300 cursor-pointer group select-none"
                                  >
                                    <div
                                      className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                        item.isChecked
                                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                                          : 'border-slate-700 bg-slate-900 group-hover:border-amber-400'
                                      }`}
                                    >
                                      {item.isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <span
                                      className={`flex-1 min-w-0 ${
                                        item.isChecked ? 'line-through text-slate-500' : 'text-slate-200'
                                      }`}
                                    >
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>
                              {note.createTime
                                ? new Date(note.createTime).toLocaleDateString()
                                : 'Google Keep'}
                            </span>
                            {onSyncScratchpad && (
                              <button
                                onClick={() => {
                                  const textToCopy =
                                    note.bodyText ||
                                    (note.listItems
                                      ? note.listItems
                                          .map((li) => `${li.isChecked ? '[x]' : '[ ]'} ${li.text}`)
                                          .join('\n')
                                      : '');
                                  onSyncScratchpad(`### ${note.title}\n${textToCopy}`);
                                  setStatusMessage({
                                    text: `Note "${note.title}" copied to Scratchpad!`,
                                    type: 'success',
                                  });
                                }}
                                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 text-[10px] font-mono border border-slate-800 transition-colors"
                              >
                                Copy to Scratchpad
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MANDATORY EXPLICIT CONFIRMATION DIALOG (FOR MUTATING APIS)    */}
      {/* ------------------------------------------------------------- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmModal.danger
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold font-mono text-white">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  await confirmModal.onConfirm();
                }}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                  confirmModal.danger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- GMAIL COMPOSE MODAL ----------------- */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-red-500/30 text-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold font-mono text-white">Compose Gmail Message</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">To (Recipient Email)</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Subject line..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-slate-400">Message Body</label>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-slate-500">✨ AI Polish:</span>
                    <button
                      type="button"
                      onClick={() => handlePolishComposeWithAi('crisp, polished professional')}
                      disabled={loadingSection === 'ai-polish'}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700"
                    >
                      Professional
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePolishComposeWithAi('concise and direct')}
                      disabled={loadingSection === 'ai-polish'}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700"
                    >
                      Concise
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePolishComposeWithAi('warm and friendly')}
                      disabled={loadingSection === 'ai-polish'}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700"
                    >
                      Friendly
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  placeholder="Type your message here..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-red-400 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={requestSendEmail}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/60 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Review & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADD CONTACT MODAL ----------------- */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-blue-500/30 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold font-mono text-white">Add Google Contact</h3>
              </div>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane"
                    value={newContactData.givenName}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, givenName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={newContactData.familyName}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, familyName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={newContactData.email}
                  onChange={(e) =>
                    setNewContactData({ ...newContactData, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newContactData.phone}
                  onChange={(e) =>
                    setNewContactData({ ...newContactData, phone: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="Architect"
                    value={newContactData.jobTitle}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, jobTitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="Acme Inc"
                    value={newContactData.company}
                    onChange={(e) =>
                      setNewContactData({ ...newContactData, company: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateContact}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-md shadow-blue-950/60 transition-all cursor-pointer"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADD GOOGLE TASK MODAL ----------------- */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-cyan-500/30 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white">New Google Task</h3>
              </div>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review Q3 Architecture Proposal"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notes / Details</label>
                <textarea
                  rows={3}
                  placeholder="Additional task notes..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-xs shadow-md shadow-cyan-950/60 transition-all cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADD KEEP NOTE MODAL ----------------- */}
      {isAddKeepOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1222] border border-amber-500/30 text-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono text-white">Create Google Keep Note</h3>
              </div>
              <button
                onClick={() => setIsAddKeepOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Note Type Selector */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setNewKeepMode('text')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  newKeepMode === 'text'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Text Note
              </button>
              <button
                type="button"
                onClick={() => setNewKeepMode('checklist')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  newKeepMode === 'checklist'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Checklist
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Ideas or Weekly Shopping"
                  value={newKeepTitle}
                  onChange={(e) => setNewKeepTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {newKeepMode === 'text' ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Note Content</label>
                  <textarea
                    rows={4}
                    placeholder="Write your note body here..."
                    value={newKeepText}
                    onChange={(e) => setNewKeepText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400 resize-none font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-slate-400">Checklist Items</label>
                    <button
                      type="button"
                      onClick={() => setNewKeepItems((prev) => [...prev, ''])}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {newKeepItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-900 shrink-0" />
                        <input
                          type="text"
                          placeholder={`Item ${idx + 1}...`}
                          value={item}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewKeepItems((prev) =>
                              prev.map((it, i) => (i === idx ? val : it))
                            );
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                        />
                        {newKeepItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewKeepItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddKeepOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateKeepNote}
                disabled={!newKeepTitle.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-amber-950/60 transition-all cursor-pointer disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
