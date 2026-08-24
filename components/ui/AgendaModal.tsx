import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Badge } from './UIComponents';
import type { Event } from '../../types';
import { Calendar, MapPin, ChevronRight, Clock, ArrowRight } from 'lucide-react';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agenda Cultural ARCVA" size="lg">
      <div className="space-y-8">
        <div className="bg-brand-500/10 dark:bg-brand-900/20 border border-brand-500/20 p-4 rounded-xl flex items-start gap-3">
            <Calendar className="text-brand-600 dark:text-brand-400 shrink-0 mt-1" size={20} />
            <div>
                <h4 className="text-slate-900 dark:text-white font-medium text-sm">Próximos Eventos</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    Consulte a cronologia das atividades planeadas. Clique num evento para ver detalhes ou inscrever-se.
                </p>
            </div>
        </div>

        {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-12">
                <p className="text-slate-500">Não existem eventos agendados para breve.</p>
            </div>
        ) : (
            <div className="relative border-l border-slate-900/10 dark:border-white/10 ml-3 space-y-8 pb-4">
                {Object.keys(groupedEvents).map((month) => {
                    const monthEvents = groupedEvents[month];
                    return (
                    <div key={month} className="relative pl-8">
                        {/* Month Header */}
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_10px_#df3d32]"></div>
                        <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-4 sticky top-0 bg-white/95 dark:bg-dark-surface/95 backdrop-blur py-2 z-10 w-fit pr-4 rounded-r-lg">
                            {month}
                        </h3>

                        <div className="grid gap-4">
                            {monthEvents.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => { onClose(); onEventClick(event); }}
                                    className="group bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 hover:border-brand-500/30 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-xl p-4 transition-all cursor-pointer flex gap-4"
                                >
                                    {/* Date Box */}
                                    <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-white dark:bg-black/40 rounded-lg border border-slate-900/10 dark:border-white/10 shrink-0 group-hover:border-brand-500/30 transition-colors">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{new Date(event.date).getDate()}</span>
                                        <span className="text-[10px] uppercase text-slate-500 font-bold">{new Date(event.date).toLocaleString('pt-PT', { weekday: 'short' })}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className="text-[10px] px-1.5 py-0 h-5 bg-slate-900/5 dark:bg-white/5 border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300">
                                                {event.category}
                                            </Badge>
                                            {event.isTournament && (
                                                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                    Torneio
                                                </Badge>
                                            )}
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-medium truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                            {event.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(event.date).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {event.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )})}
            </div>
        )}

        <div className="pt-4 border-t border-slate-900/10 dark:border-white/10 flex justify-center">
            <Button variant="link" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => { onClose(); navigate('/events'); }}>
                Ver Calendário Completo <ArrowRight size={14} className="ml-2"/>
            </Button>
        </div>
      </div>
    </Modal>
  );
};
