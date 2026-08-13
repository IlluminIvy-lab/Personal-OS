import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  CalendarPlus,
} from 'lucide-react';
import { GoogleCalendarEvent, TaskItem } from '../types';
import { googleCalendarSignIn, googleSignOut } from '../lib/googleAuth';

interface GoogleCalendarWidgetProps {
  onEventsFetched?: (events: GoogleCalendarEvent[]) => void;
  tasks?: TaskItem[];
}

export const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({
  onEventsFetched,
  tasks = [],
}) => {
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('google_calendar_token') || '';
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [addingSuccess, setAddingSuccess] = useState(false);

  // Fetch events when access token is available
  useEffect(() => {
    if (accessToken) {
      fetchEvents(accessToken);
    }
  }, [accessToken]);

  const saveToken = (token: string) => {
    setAccessToken(token);
    localStorage.setItem('google_calendar_token', token);
  };

  const handleDisconnect = async () => {
    await googleSignOut();
    setAccessToken('');
    setEvents([]);
    if (onEventsFetched) onEventsFetched([]);
  };

  const handleConnectGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const { accessToken: newToken } = await googleCalendarSignIn();
      if (newToken) {
        saveToken(newToken);
        await fetchEvents(newToken);
      }
    } catch (err: any) {
      console.warn('Sign in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups or open the app in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google Sign-In popup was closed before completing. Click "Connect Google" again to select your Google Account.');
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('Unauthorized Domain'))) {
        setError(`Domain Authorization Required: To allow Google Sign-In on Render (${window.location.hostname}), add '${window.location.hostname}' to Firebase Auth -> Authorized Domains.`);
      } else {
        setError(err.message || 'Google Sign-In was interrupted.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoMode = () => {
    setError('');
    const sampleEvents: GoogleCalendarEvent[] = [
      {
        id: 'demo-1',
        summary: '📅 Executive Strategy Call',
        start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        end: { dateTime: new Date(Date.now() + 7200000).toISOString() },
        location: 'Google Meet',
      },
      {
        id: 'demo-2',
        summary: '⚡ Project Sync & Architecture Review',
        start: { dateTime: new Date(Date.now() + 14400000).toISOString() },
        end: { dateTime: new Date(Date.now() + 18000000).toISOString() },
      },
    ];
    setEvents(sampleEvents);
    if (onEventsFetched) onEventsFetched(sampleEvents);
    setAccessToken('demo-mode');
  };

  const fetchEvents = async (token: string) => {
    if (token === 'demo-mode') {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          startOfDay
        )}&timeMax=${encodeURIComponent(endOfWeek)}&singleEvents=true&orderBy=startTime&maxResults=15`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
          throw new Error('Google OAuth Token expired. Please reconnect Google Calendar.');
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status} Error`);
      }

      const data = await res.json();
      const items: GoogleCalendarEvent[] = data.items || [];
      setEvents(items);
      if (onEventsFetched) {
        onEventsFetched(items);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Google Calendar events.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !accessToken) return;

    setLoading(true);
    try {
      const now = new Date();
      let startTime = new Date();
      if (newEventTime) {
        const [hours, minutes] = newEventTime.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);
      } else {
        startTime.setHours(now.getHours() + 1, 0, 0, 0);
      }

      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hr default

      const eventBody = {
        summary: newEventTitle.trim(),
        description: 'Created via Personal OS Hub',
        start: {
          dateTime: startTime.toISOString(),
        },
        end: {
          dateTime: endTime.toISOString(),
        },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!res.ok) {
        throw new Error('Failed to create event in Google Calendar.');
      }

      setNewEventTitle('');
      setNewEventTime('');
      setIsAddingEvent(false);
      setAddingSuccess(true);
      setTimeout(() => setAddingSuccess(false), 2500);

      // Refresh event list
      await fetchEvents(accessToken);
    } catch (err: any) {
      setError(err.message || 'Error creating Google Calendar event.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTaskToCalendar = async (task: TaskItem) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      const endTime = new Date(now.getTime() + (task.estimatedMinutes || 30) * 60 * 1000);

      const eventBody = {
        summary: `[${task.priority}] ${task.title}`,
        description: `Task Category: ${task.category}\nPriority: ${task.priority}\nSynced from Personal OS Hub`,
        start: { dateTime: now.toISOString() },
        end: { dateTime: endTime.toISOString() },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (res.ok) {
        setAddingSuccess(true);
        setTimeout(() => setAddingSuccess(false), 2500);
        await fetchEvents(accessToken);
      }
    } catch (err: any) {
      setError('Failed to sync task to Google Calendar.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: GoogleCalendarEvent) => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : null;

      const timeStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const endTimeStr = end ? end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

      return `${timeStr} - ${endTimeStr}`;
    }
    if (event.start.date) {
      return 'All Day';
    }
    return '';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/40 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              GOOGLE CALENDAR
              {accessToken && (
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-950/40">
                  CONNECTED
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Sync real events with your daily OS agenda</p>
          </div>
        </div>

        {accessToken ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchEvents(accessToken)}
              disabled={loading}
              title="Refresh Google Calendar events"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              title="Add event to Google Calendar"
              className="p-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDisconnect}
              title="Disconnect Google Calendar"
              className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectGoogle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all font-mono shadow-sm"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Connect Google
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
          <button
            onClick={handleUseDemoMode}
            className="self-start text-[11px] underline text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Or preview with Demo Mode
          </button>
        </div>
      )}

      {/* Success Banner */}
      {addingSuccess && (
        <div className="mb-3 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Event synced to Google Calendar!</span>
        </div>
      )}

      {/* Quick Add Form */}
      {isAddingEvent && accessToken && (
        <form onSubmit={handleCreateEvent} className="mb-4 p-3 rounded-xl bg-black/40 border border-cyan-500/30 space-y-2">
          <h4 className="text-xs font-mono font-semibold text-cyan-300">Quick Add Calendar Event</h4>
          <input
            type="text"
            placeholder="Event title..."
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-bold hover:bg-cyan-400 transition-all"
            >
              {loading ? 'Creating...' : 'Save to Google Calendar'}
            </button>
          </div>
        </form>
      )}

      {/* Content Area */}
      {!accessToken ? (
        <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center space-y-2">
          <p className="text-xs text-slate-300">
            Connect your Google Calendar account for free to view real schedule events and include them in your daily OS plans.
          </p>
          <button
            onClick={handleConnectGoogle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 transition-all font-mono"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
            Enable Google Calendar Integration
          </button>
        </div>
      ) : loading && events.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          Fetching Google Calendar events...
        </div>
      ) : events.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400 font-mono">
          No upcoming events scheduled on your Google Calendar today.
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                    {evt.summary || 'Untitled Event'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{formatEventTime(evt)}</span>
                  {evt.location && <span className="truncate max-w-[120px] text-slate-500">• {evt.location}</span>}
                </div>
              </div>

              {evt.htmlLink && (
                <a
                  href={evt.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-white/5 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition-all"
                  title="Open in Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sync Tasks Quick Action */}
      {accessToken && tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Quick Task Sync:</span>
          <button
            onClick={() => handleSyncTaskToCalendar(tasks[0])}
            disabled={loading}
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 text-[11px] flex items-center gap-1"
          >
            <CalendarPlus className="w-3 h-3" />
            Add top task "{tasks[0].title.slice(0, 20)}..." to Calendar
          </button>
        </div>
      )}
    </div>
  );
};
