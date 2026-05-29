'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, MapPin, Bell, Plus, Loader2, X, ChevronRight, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJarvisStore, type CalendarEvent } from '@/lib/jarvis-store';

const SOURCE_COLORS: Record<string, string> = {
  jarvis: 'bg-jarvis-cyan/10 text-jarvis-cyan border-jarvis-cyan/20',
  google: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  manual: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  outlook: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
};

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr) >= new Date();
}

export function JarvisCalendar() {
  const { calendarEvents, isLoadingCalendar, loadCalendarEvents, createCalendarEvent, deleteCalendarEvent, sendMessage } = useJarvisStore();

  const [showCreate, setShowCreate] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  const todayEvents = useMemo(() =>
    calendarEvents
      .filter((e) => isToday(e.startTime))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [calendarEvents]
  );

  const upcomingEvents = useMemo(() =>
    calendarEvents
      .filter((e) => isFuture(e.startTime) && !isToday(e.startTime))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5),
    [calendarEvents]
  );

  const thisWeekEvents = useMemo(() =>
    calendarEvents
      .filter((e) => isThisWeek(e.startTime) && !isToday(e.startTime))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [calendarEvents]
  );

  const nextThreeEvents = useMemo(() =>
    calendarEvents
      .filter((e) => isFuture(e.startTime))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3),
    [calendarEvents]
  );

  const handleCreate = useCallback(async () => {
    if (!newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime) return;
    setCreating(true);
    await createCalendarEvent({
      title: newEvent.title.trim(),
      description: newEvent.description || undefined,
      location: newEvent.location || undefined,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
    });
    setNewEvent({ title: '', description: '', location: '', startTime: '', endTime: '' });
    setShowCreate(false);
    setCreating(false);
  }, [newEvent, createCalendarEvent]);

  const handleQuickAdd = useCallback(async () => {
    if (!quickTitle.trim() || !quickTime) return;
    setCreating(true);
    const today = new Date();
    const [hours, minutes] = quickTime.split(':').map(Number);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    await createCalendarEvent({
      title: quickTitle.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    setQuickTitle('');
    setQuickTime('');
    setQuickAdd(false);
    setCreating(false);
  }, [quickTitle, quickTime, createCalendarEvent]);

  // Mini month grid
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, year, month };
  }, []);

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    calendarEvents.forEach((e) => {
      const d = new Date(e.startTime);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [calendarEvents]);

  const today = new Date();

  const handleAskJarvis = useCallback(() => {
    const upcoming = nextThreeEvents.map((e) => `${e.title} em ${formatEventDate(e.startTime)} às ${formatEventTime(e.startTime)}`).join(', ');
    sendMessage(`Quais são meus próximos compromissos? ${upcoming || 'Nenhum compromisso agendado.'}`);
  }, [nextThreeEvents, sendMessage]);

  return (
    <div className="jarvis-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-jarvis-cyan/10">
          <CalendarIcon className="h-5 w-5 text-jarvis-cyan" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-jarvis-cyan jarvis-glow-text">Calendário</h2>
          <p className="text-xs text-muted-foreground">Agenda e compromissos</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleAskJarvis} className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] hidden sm:inline">Perguntar</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setQuickAdd(!quickAdd)} className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] hidden sm:inline">Rápido</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowCreate(!showCreate)} className="text-jarvis-cyan/60 hover:bg-jarvis-cyan/10 hover:text-jarvis-cyan gap-1.5">
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Next 3 appointments highlighted */}
      {nextThreeEvents.length > 0 && (
        <div className="mb-3">
          <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2">Próximos Compromissos</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {nextThreeEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="shrink-0 jarvis-panel p-2.5 border-l-2 border-jarvis-cyan/40"
              >
                <p className="text-xs font-medium text-foreground/80">{event.title}</p>
                <p className="text-[10px] text-jarvis-cyan/60 flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                </p>
                {event.location && (
                  <p className="text-[9px] text-muted-foreground/40 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {event.location}
                  </p>
                )}
                {event.reminder && (
                  <p className="text-[9px] text-yellow-400/50 flex items-center gap-1 mt-0.5">
                    <Bell className="h-2.5 w-2.5" />
                    Lembrete: {event.reminder}min
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add */}
      <AnimatePresence>
        {quickAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="jarvis-panel p-3 flex items-center gap-2">
              <Input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Título rápido"
                className="flex-1 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 h-8"
              />
              <Input
                value={quickTime}
                onChange={(e) => setQuickTime(e.target.value)}
                type="time"
                className="w-28 bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 focus:border-jarvis-cyan/40 h-8"
              />
              <Button onClick={handleQuickAdd} disabled={creating || !quickTitle.trim() || !quickTime} className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 h-8" size="sm">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="jarvis-panel p-3 space-y-2">
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título do evento"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                placeholder="Local (opcional)"
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] text-muted-foreground/50 mb-0.5 block">Início</label>
                  <Input
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
                    type="datetime-local"
                    className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 focus:border-jarvis-cyan/40 h-8"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-muted-foreground/50 mb-0.5 block">Fim</label>
                  <Input
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
                    type="datetime-local"
                    className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 focus:border-jarvis-cyan/40 h-8"
                  />
                </div>
              </div>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                rows={2}
                className="bg-jarvis-dark/50 border-jarvis-border/30 text-xs text-foreground/80 placeholder:text-muted-foreground/30 focus:border-jarvis-cyan/40 resize-none"
              />
              <Button
                onClick={handleCreate}
                disabled={creating || !newEvent.title.trim() || !newEvent.startTime || !newEvent.endTime}
                className="bg-jarvis-cyan/20 text-jarvis-cyan hover:bg-jarvis-cyan/30 border border-jarvis-cyan/20 gap-2"
                size="sm"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Criar Evento
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="jarvis-scrollbar flex-1">
        {isLoadingCalendar ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-jarvis-cyan animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon className="h-8 w-8 text-jarvis-cyan/15 mb-2" />
            <p className="text-xs text-muted-foreground/40">Nenhum evento agendado</p>
          </div>
        ) : (
          <div className="space-y-4 pr-1">
            {/* Mini Month Grid */}
            <div className="jarvis-panel p-3">
              <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2">
                {today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <span key={i} className="text-[8px] text-muted-foreground/30 py-0.5">{d}</span>
                ))}
                {currentMonth.days.map((day, i) => {
                  const hasEvent = day ? eventDates.has(`${currentMonth.year}-${currentMonth.month}-${day}`) : false;
                  const isTodayDate = day === today.getDate() && currentMonth.month === today.getMonth();
                  return (
                    <span
                      key={i}
                      className={`text-[9px] py-0.5 rounded ${
                        day === null ? '' :
                        isTodayDate ? 'bg-jarvis-cyan/20 text-jarvis-cyan font-bold' :
                        hasEvent ? 'text-jarvis-cyan/60' : 'text-muted-foreground/30'
                      }`}
                    >
                      {day || ''}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Hoje
                </h3>
                <div className="space-y-1.5">
                  {todayEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={deleteCalendarEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {thisWeekEvents.length > 0 && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-jarvis-cyan" />
                  Esta Semana
                </h3>
                <div className="space-y-1.5">
                  {thisWeekEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={deleteCalendarEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > 0 && upcomingEvents.some((e) => !isThisWeek(e.startTime)) && (
              <div>
                <h3 className="text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase mb-2 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Futuros
                </h3>
                <div className="space-y-1.5">
                  {upcomingEvents.filter((e) => !isThisWeek(e.startTime)).map((event) => (
                    <EventCard key={event.id} event={event} onDelete={deleteCalendarEvent} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EventCard({ event, onDelete }: { event: CalendarEvent; onDelete: (id: string) => Promise<void> }) {
  const sourceColor = SOURCE_COLORS[event.source] || SOURCE_COLORS.jarvis;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="jarvis-panel p-2.5 group"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-foreground/80 truncate">{event.title}</p>
            <Badge variant="outline" className={`text-[7px] h-3.5 px-1 ${sourceColor}`}>
              {event.source}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-jarvis-cyan/60 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
            </span>
            {event.location && (
              <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {event.location}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-[10px] text-muted-foreground/30 mt-0.5 line-clamp-1">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {event.reminder && (
            <Bell className="h-3 w-3 text-yellow-400/40" />
          )}
          <button
            onClick={() => onDelete(event.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground/30 hover:text-red-400"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
