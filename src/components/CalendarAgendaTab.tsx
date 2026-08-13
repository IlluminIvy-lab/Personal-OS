import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  CalendarDays,
  ListTodo,
  Check,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { LocalCalendarEvent, GoogleCalendarEvent, TaskItem } from '../types';
import { googleCalendarSignIn } from '../lib/googleAuth';
import { AutoLinkText } from './AutoLinkText';
import { getApiUrl } from '../lib/api';

interface CalendarAgendaTabProps {
  localEvents: LocalCalendarEvent[];
  setLocalEvents: React.Dispatch<React.SetStateAction<LocalCalendarEvent[]>>;
  googleEvents: GoogleCalendarEvent[];
  tasks: TaskItem[];
  isOnline: boolean;
  onQueueOfflineItem: (type: any, action: string, payload: any) => void;
}

export const CalendarAgendaTab: React.FC<CalendarAgendaTabProps> = ({
  localEvents,
  setLocalEvents,
  googleEvents,
  tasks,
  isOnline,
  onQueueOfflineItem,
}) => {
  // Mode: local vs google
  const [calendarMode, setCalendarMode] = useState<'local' | 'google'>('local');

  // Selected date state (defaults to YYYY-MM-DD today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Live time state
  const [now, setNow] = useState<Date>(new Date());

  // Modal State for New / Edit Event
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventCategory, setEventCategory] = useState<LocalCalendarEvent['category']>('Work');
  const [eventLocation, setEventLocation] = useState('');

  // Agenda View mode
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('agenda');

  // Sync Google state
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // AI Natural Language Scheduling State
  const [aiSchedulePrompt, setAiSchedulePrompt] = useState('');
  const [isParsingAiSchedule, setIsParsingAiSchedule] = useState(false);
  const [aiScheduleFeedback, setAiScheduleFeedback] = useState<string | null>(null);

  // Handle AI Natural Language Scheduling
  const handleAiSmartSchedule = async (promptText: string) => {
    const textToParse = promptText.trim();
    if (!textToParse) return;

    setIsParsingAiSchedule(true);
    setAiScheduleFeedback(null);
    try {
      const res = await fetch(getApiUrl('/api/ai/parse-schedule'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToParse,
          referenceDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const event = data.event;

      if (!event || !event.title) {
        throw new Error('AI could not identify event details from your prompt.');
      }

      const newEv: LocalCalendarEvent = {
        id: `ev-${Date.now()}`,
        title: event.title,
        description: event.description || '',
        date: event.date || selectedDate,
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '10:00',
        category: (['Work', 'Personal', 'Health', 'Meeting', 'Focus'].includes(event.category)
          ? event.category
          : 'Work') as any,
        location: event.location || '',
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setLocalEvents((prev) => [newEv, ...prev]);
      setSelectedDate(newEv.date);
      setAiSchedulePrompt('');
      setAiScheduleFeedback(`✨ Scheduled: "${newEv.title}" on ${newEv.date} at ${newEv.startTime}`);
      setTimeout(() => setAiScheduleFeedback(null), 5000);
    } catch (err: any) {
      setAiScheduleFeedback(`⚠️ ${err.message || 'Failed to parse scheduling prompt.'}`);
    } finally {
      setIsParsingAiSchedule(false);
    }
  };

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update modal date when selectedDate changes
  useEffect(() => {
    setEventDate(selectedDate);
  }, [selectedDate]);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Event Handlers
  const handleOpenNewEventModal = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDesc('');
    setEventDate(selectedDate);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventCategory('Work');
    setEventLocation('');
    setIsModalOpen(true);
  };

  const handleOpenEditEventModal = (evt: LocalCalendarEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDesc(evt.description || '');
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime);
    setEventCategory(evt.category);
    setEventLocation(evt.location || '');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (editingEventId) {
      // Edit existing
      setLocalEvents((prev) =>
        prev.map((evt) =>
          evt.id === editingEventId
            ? {
                ...evt,
                title: eventTitle.trim(),
                description: eventDesc.trim(),
                date: eventDate,
                startTime: eventStartTime,
                endTime: eventEndTime,
                category: eventCategory,
                location: eventLocation.trim(),
              }
            : evt
        )
      );
      if (!isOnline) {
        onQueueOfflineItem('calendar_event', 'update', {
          id: editingEventId,
          title: eventTitle,
          date: eventDate,
        });
      }
    } else {
      // Add new
      const newEvt: LocalCalendarEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        category: eventCategory,
        location: eventLocation.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        offlineQueued: !isOnline,
      };

      setLocalEvents((prev) => [newEvt, ...prev]);

      if (!isOnline) {
        onQueueOfflineItem('calendar_event', 'create', newEvt);
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    setLocalEvents((prev) => prev.filter((e) => e.id !== id));
    if (!isOnline) {
      onQueueOfflineItem('calendar_event', 'delete', { id });
    }
  };

  const handleToggleComplete = (id: string) => {
    setLocalEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  // Google Calendar Connect Button
  const handleConnectGoogle = async () => {
    setIsSyncingGoogle(true);
    try {
      await googleCalendarSignIn();
      setCalendarMode('google');
    } catch {
      setCalendarMode('local');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Filter local events for selected date
  const selectedDateEvents = localEvents.filter((evt) => evt.date === selectedDate);

  // Time slots from 07:00 to 20:00 for Agenda Timeline
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    const formatted = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    return formatted;
  });

  const getCategoryBadgeClass = (category: LocalCalendarEvent['category']) => {
    switch (category) {
      case 'Work':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Meeting':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Personal':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Deadline':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Health':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Time & Connectivity Awareness Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden glow-cyan">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Live Date & Time Display */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Live System Clock
              </span>

              {isOnline ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> Online Sync Ready
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5 animate-pulse">
                  <WifiOff className="w-3.5 h-3.5" /> Offline Mode (Local Cache Active)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-wide">
              {now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h1>

            <p className="text-xl sm:text-2xl font-mono text-cyan-300 font-bold tracking-widest">
              {now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </span>
            </p>
          </div>

          {/* Sync Controls & Action Button */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Mode Switcher */}
            <div className="bg-black/60 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setCalendarMode('local')}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  calendarMode === 'local'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Local Offline Calendar
              </button>
              <button
                onClick={() => {
                  if (calendarMode === 'google') setCalendarMode('local');
                  else handleConnectGoogle();
                }}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  calendarMode === 'google'
                    ? 'bg-purple-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isSyncingGoogle ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CalendarIcon className="w-3.5 h-3.5" />
                )}
                Google Calendar
              </button>
            </div>

            <button
              onClick={handleOpenNewEventModal}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-2 shadow-lg transition-all glow-cyan hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add Agenda Event
            </button>
          </div>
        </div>

        {/* AI Natural Language Smart Scheduling Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAiSmartSchedule(aiSchedulePrompt);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                value={aiSchedulePrompt}
                onChange={(e) => setAiSchedulePrompt(e.target.value)}
                placeholder="✨ AI Smart Schedule: e.g., 'Product launch sync next Tuesday at 2pm for 45 min' or 'Dentist Friday 10am'..."
                className="w-full bg-slate-950/90 border border-purple-500/40 focus:border-purple-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white font-sans placeholder-slate-500 focus:outline-none shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isParsingAiSchedule || !aiSchedulePrompt.trim()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            >
              {isParsingAiSchedule ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Event...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Schedule with AI</span>
                </>
              )}
            </button>
          </form>

          {/* Quick AI Presets & Status Feedback */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
              <span className="text-slate-500 text-[10px]">Try:</span>
              <button
                type="button"
                onClick={() => handleAiSmartSchedule('Team sprint review tomorrow at 10:00 AM')}
                className="px-2 py-0.5 rounded-md bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] transition-colors"
              >
                "Sprint review tomorrow 10am"
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSchedule('Deep work focus session Friday 2:00 PM to 4:00 PM')}
                className="px-2 py-0.5 rounded-md bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] transition-colors"
              >
                "Deep work Friday 2pm"
              </button>
              <button
                type="button"
                onClick={() => handleAiSmartSchedule('Gym & Cardio workout tomorrow 7:00 AM')}
                className="px-2 py-0.5 rounded-md bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] transition-colors"
              >
                "Gym workout tomorrow 7am"
              </button>
            </div>

            {aiScheduleFeedback && (
              <span className="text-purple-300 font-sans text-xs animate-fadeIn font-medium">
                {aiScheduleFeedback}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Layout Grid: Left = Calendar Month View, Right = Daily Agenda Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar Picker */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-sans">
                {monthNames[month]} {year}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleTodayClick}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-cyan-300 border border-cyan-500/30 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono font-semibold text-slate-400 pb-2 border-b border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-10 rounded-xl" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;

              const isSelected = selectedDate === formattedDate;
              const isToday =
                new Date().toISOString().split('T')[0] === formattedDate;

              // Check if date has local events
              const eventCount = localEvents.filter(
                (e) => e.date === formattedDate
              ).length;

              return (
                <button
                  key={formattedDate}
                  onClick={() => setSelectedDate(formattedDate)}
                  className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs font-mono ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-lg scale-105 ring-2 ring-cyan-400/50'
                      : isToday
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-400/50 font-bold'
                      : 'bg-black/30 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{dayNum}</span>
                  {eventCount > 0 && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-slate-950' : 'bg-cyan-400 animate-pulse'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span>Selected Date:</span>
              <span className="text-cyan-300 font-bold">{selectedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Agenda Items Today:</span>
              <span className="text-emerald-400 font-bold">
                {selectedDateEvents.length} Events
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Agenda Timeline */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          {/* Agenda Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white font-sans flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-cyan-400" /> Agenda Timeline for {selectedDate}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTodaySelected ? '⚡ Showing today\'s real-time schedule' : 'Scheduled offline local events & tasks'}
              </p>
            </div>

            <button
              onClick={handleOpenNewEventModal}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Quick Event
            </button>
          </div>

          {/* Timeline View */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {selectedDateEvents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                <Clock className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                <p className="text-xs text-slate-400 font-mono">
                  No agenda events scheduled for {selectedDate}.
                </p>
                <button
                  onClick={handleOpenNewEventModal}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono transition-all"
                >
                  Create First Event
                </button>
              </div>
            ) : (
              selectedDateEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    evt.completed
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/50 hover:scale-[1.01]'
                  }`}
                >
                  {/* Event Info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => handleToggleComplete(evt.id)}
                      className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                    >
                      {evt.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold font-sans ${
                            evt.completed
                              ? 'line-through text-slate-400'
                              : 'text-white group-hover:text-cyan-300'
                          }`}
                        >
                          <AutoLinkText text={evt.title} />
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${getCategoryBadgeClass(
                            evt.category
                          )}`}
                        >
                          {evt.category}
                        </span>

                        {evt.offlineQueued && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                            Offline Saved
                          </span>
                        )}
                      </div>

                      {evt.description && (
                        <p className="text-xs text-slate-300">
                          <AutoLinkText text={evt.description} />
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Clock className="w-3.5 h-3.5" />
                          {evt.startTime} - {evt.endTime}
                        </span>

                        {evt.location && (
                          <span className="flex items-center gap-1 text-purple-300">
                            <MapPin className="w-3.5 h-3.5" />
                            <AutoLinkText text={evt.location} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenEditEventModal(evt)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0a0f1d] border border-cyan-500/40 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                {editingEventId ? 'Edit Agenda Event' : 'Create New Agenda Event'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Executive Strategy Review"
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none font-mono"
                  >
                    <option value="Work">Work</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Personal">Personal</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Health">Health</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Location / Link</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Conference Room A / Meet link"
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Description / Notes</label>
                <textarea
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={2}
                  placeholder="Key agenda items..."
                  className="w-full bg-black/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs font-mono flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
