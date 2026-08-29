import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Badge } from './UIComponents';
import { EmptyState } from './EmptyState';
import type { Event } from '../../types';
import { CalendarDays, CalendarOff, MapPin, ChevronRight, Clock, ArrowRight } from 'lucide-react';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, events, onEventClick }) => {
  const navigate = useNavigate();

  // Filter upcoming and sort by date
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by Month
  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const date = new Date(event.date);
    // pt-PT yields lowercase "julho de 2026"; capitalize only the month name
    // (a CSS capitalize transform would also uppercase the "de" connector)
    const raw = date.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
    const monthKey = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const months = Object.keys(groupedEvents);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agenda Cultural"
      eyebrow={upcomingEvents.length > 0 ? `${upcomingEvents.length} ${upcomingEvents.length === 1 ? 'evento marcado' : 'eventos marcados'}` : 'Próximos eventos'}
      description="A cronologia das atividades planeadas. Escolha um evento para ver detalhes ou inscrever-se."
      icon={<CalendarDays size={20} />}
      size="lg"
      footer={
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => { onClose(); navigate('/events'); }}>
            Ver calendário completo <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      }
    >
      {months.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="Sem eventos agendados"
          description="Ainda não há atividades marcadas para os próximos dias. Consulte o arquivo para rever o que já aconteceu."
          action={{ label: 'Ver arquivo de eventos', onClick: () => { onClose(); navigate('/events'); } }}
        />
      ) : (
        <div className="space-y-8">
          {months.map(month => (
            <section key={month}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="font-serif text-lg text-slate-900 dark:text-white">{month}</h3>
                <span className="h-px flex-1 bg-gradient-to-r from-slate-900/10 to-transparent dark:from-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {groupedEvents[month].length}
                </span>
              </div>

              <div className="space-y-2.5">
                {groupedEvents[month].map(event => {
                  const date = new Date(event.date);
                  return (
                    <button
                      key={event.id}
                      onClick={() => { onClose(); onEventClick(event); }}
                      className="group flex w-full items-center gap-4 rounded-2xl bg-slate-900/[0.03] p-3 text-left ring-1 ring-slate-900/5 transition-all hover:bg-white hover:shadow-lg hover:ring-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.03] dark:ring-white/5 dark:hover:bg-white/[0.06]"
                    >
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white ring-1 ring-slate-900/10 transition-colors group-hover:ring-brand-500/30 dark:bg-black/40 dark:ring-white/10">
                        <span className="text-lg font-bold leading-none text-slate-900 tabular-nums dark:text-white">{date.getDate()}</span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          {date.toLocaleString('pt-PT', { weekday: 'short' }).replace('.', '')}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex flex-wrap items-center gap-1.5">
                          <Badge className="h-5 border-slate-900/10 bg-slate-900/5 px-1.5 py-0 text-[9px] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                            {event.category}
                          </Badge>
                          {event.isTournament && (
                            <Badge className="h-5 border-amber-500/20 bg-amber-500/15 px-1.5 py-0 text-[9px] text-amber-600 dark:text-amber-400">
                              Torneio
                            </Badge>
                          )}
                        </span>
                        <span className="block truncate font-medium text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                          {event.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin size={12} className="shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        </span>
                      </span>

                      <ChevronRight
                        size={18}
                        className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600"
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
};
