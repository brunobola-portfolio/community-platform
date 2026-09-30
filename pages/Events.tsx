
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useOutletContext, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { LayoutOutletContext } from '../layouts/types';
import { EventsJsonLd } from '../components/StructuredData';
import { MapPin, Clock, Search, CalendarPlus, Trophy, CheckCircle2, X, History, CalendarOff, LogIn } from 'lucide-react';
import { Button, Badge, Modal, cn } from '../components/ui/UIComponents';
import { sanitizeHtml, sanitizeText } from '../utils/security';
import { categoryColorClass } from '../utils/categoryColors';
import { eventSummaryText, normalize, progressWidthClass } from '../utils/text';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import { ShareBar } from '../components/ui/ShareBar';
import { EventPoster } from '../components/events/EventPoster';
import { useEventDescription } from '../hooks/useEventDescription';
import { absoluteUrl, eventPath, eventShareText, formatEventDate } from '../utils/share';
import { canAddToCalendar, downloadIcs } from '../utils/calendar';
import { isEventPast, isEventUpcoming } from '../utils/eventTime';
import { FALLBACK_IMAGES } from '../utils/constants';
import { PageMeta } from '../components/PageMeta';
import { useEventRegistration } from '../hooks/useEventRegistration';
import { RegistrationForm } from '../components/events/RegistrationForm';
import { RegistrationDone } from '../components/events/RegistrationDone';
import type { Event } from '../types';

export const EventsPage: React.FC = () => {
    const { events, categories, isLoading, settings } = useData();
    const { isAuthenticated } = useConvexAuth();
    // The server only accepts the signed-in member's own email; prefill it so nobody types another
    const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip');
    const { openMemberLogin } = useOutletContext<LayoutOutletContext>();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const tabTouched = useRef(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    // The list subscription carries excerpts; the open event pulls its own body
    const { html: selectedEventBody, isLoading: isBodyLoading } = useEventDescription(selectedEvent);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const registration = useEventRegistration(selectedEvent, isAuthenticated, me);


    // Every event has its own address, so a link on WhatsApp opens that event
    // and the back button closes it instead of leaving the agenda
    const { slug: routeSlug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    useEffect(() => {
        if (!routeSlug) { setSelectedEvent(null); setShowRegistrationModal(false); return; }
        if (events.length === 0) return;
        const match = events.find(e => e.slug === routeSlug);
        if (match) setSelectedEvent(match);
        else navigate('/events', { replace: true });
    }, [routeSlug, events, navigate]);
    // The home page hands over an event to open (registration CTA)
    const location = useLocation();
    // Opened from the list, closing is a step back, so the browser's Back button
    // does not reopen what was just closed; opened from a shared link, closing
    // replaces the entry and lands on the agenda
    // Registration state belongs to one event: Back, a shared link or another
    // card must never show the previous event's form or "received" screen
    const selectedEventId = selectedEvent?.id;
    const resetRegistration = registration.reset;
    useEffect(() => {
        setShowRegistrationModal(false);
        resetRegistration();
    }, [selectedEventId, resetRegistration]);
    const openedFromList = Boolean((location.state as { fromList?: boolean } | null)?.fromList);
    const openEvent = (event: Event) => navigate(eventPath(event.slug), { state: { fromList: true } });
    const closeEvent = () => {
        setShowRegistrationModal(false);
        if (openedFromList) navigate(-1);
        else navigate('/events', { replace: true });
    };
    useEffect(() => {
        const wanted = (location.state as { eventId?: string } | null)?.eventId;
        if (!wanted || selectedEvent) return;
        const match = events.find(e => e.id === wanted);
        if (match) navigate(eventPath(match.slug), { replace: true });
    }, [location.state, events, selectedEvent, navigate]);

    // Debounce search input (500ms)
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(inputValue), 500);
        return () => clearTimeout(timer);
    }, [inputValue]);

    // Calendar export lives in utils/calendar (RFC 5545 file, Google link)
    const calendarFor = (event: Event) => ({ title: event.title, date: event.date, location: event.location, slug: event.slug, description: sanitizeText(eventSummaryText(event)), url: absoluteUrl(eventPath(event.slug)) });

    // Logic & Filtering
    // Fixed at mount so the lists do not reshuffle mid-visit; same rule as the home page
    const now = useMemo(() => new Date(), []);

    // Split events for counts (memoized)
    const upcomingCount = useMemo(() => events.filter(e => isEventUpcoming(e.date, now)).length, [events, now]);
    const pastCount = useMemo(() => events.filter(e => isEventPast(e.date, now)).length, [events, now]);

    // Nothing scheduled yet: open on the full list instead of an empty "upcoming" tab,
    // unless the visitor already picked a tab
    useEffect(() => {
        if (isLoading || tabTouched.current) return;
        if (upcomingCount === 0 && pastCount > 0) setActiveTab('all');
    }, [isLoading, upcomingCount, pastCount]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const search = normalize(searchTerm);

            // Search Filter
            const matchesSearch = !searchTerm ||
                normalize(event.title).includes(search) ||
                normalize(eventSummaryText(event)).includes(search) ||
                normalize(event.location).includes(search);

            // Tab Filter
            let matchesTime = true;
            if (activeTab === 'upcoming') matchesTime = isEventUpcoming(event.date, now);
            if (activeTab === 'past') matchesTime = isEventPast(event.date, now);

            // Category Filter
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;

            return matchesSearch && matchesTime && matchesCategory;
        }).sort((a, b) => {
            // Upcoming soonest first, past most recent first; "all" shows what is next
            // before the archive instead of starting at the oldest event
            const ta = new Date(a.date).getTime(), tb = new Date(b.date).getTime();
            const aPast = isEventPast(a.date, now), bPast = isEventPast(b.date, now);
            if (aPast !== bPast) return aPast ? 1 : -1;
            return aPast ? tb - ta : ta - tb;
        });
    }, [events, activeTab, categoryFilter, searchTerm, now]);

    const handleOpenRegistration = () => {
        if (!selectedEvent) return;
        registration.reset();
        setShowRegistrationModal(true);
    };

    const registrationOpen = Boolean(
        selectedEvent?.registrationOpen && selectedEvent && isEventUpcoming(selectedEvent.date),
    );
    // The server enforces the limit on every event, so the button must too
    const soldOut = Boolean(
        selectedEvent?.maxParticipants && (selectedEvent.currentParticipants || 0) >= selectedEvent.maxParticipants,
    );

    // One action bar for every state of the event dialog, so the primary action
    // always sits in the same place
    const eventModalFooter = !selectedEvent ? undefined
        : showRegistrationModal && !registration.done ? (
            <div key="form" className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowRegistrationModal(false)}>Voltar</Button>
                <Button type="submit" form="event-registration-form" className="flex-1" disabled={registration.submitting}>
                    {registration.submitting ? 'A enviar…' : 'Enviar inscrição'}
                </Button>
            </div>
        ) : showRegistrationModal ? (
            <div key="done" className="flex justify-center">
                <Button variant="outline" onClick={closeEvent}>Voltar à agenda</Button>
            </div>
        ) : registrationOpen ? (
            <div key="details" className="flex justify-end">
                {registration.canRegister ? (
                    <Button onClick={handleOpenRegistration} disabled={soldOut || registration.authLoading} className="w-full sm:w-auto">
                        {soldOut ? 'Esgotado' : selectedEvent.entryPrice ? `Inscrever-me · ${selectedEvent.entryPrice} €` : 'Inscrever-me (grátis)'}
                    </Button>
                ) : (
                    <Button variant="outline" onClick={openMemberLogin} className="w-full sm:w-auto">
                        <LogIn size={16} /> Iniciar sessão para inscrever
                    </Button>
                )}
            </div>
        ) : undefined;

    return (
        <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg">
            <PageMeta title="Eventos & Atividades" description={settings.locality ? `Agenda de eventos e atividades de ${settings.siteName}, em ${settings.locality}.` : `Agenda de eventos e atividades de ${settings.siteName}.`} />
            <EventsJsonLd events={events.filter(e => isEventUpcoming(e.date, now))} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <span className="text-brand-700 dark:text-brand-400 uppercase tracking-[0.2em] text-xs font-bold border border-brand-500/30 px-4 py-1 rounded-full">Agenda Cultural</span>
                    <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mt-6 mb-6">Eventos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-400 to-accent-gold dark:to-amber-300">Atividades</span></h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
                        {settings.locality ? `O ponto de encontro da comunidade de ${settings.locality}.` : "O ponto de encontro da comunidade."}
                    </p>
                </div>

                {/* --- CONTROLS DECK --- */}
                <div className="flex flex-col items-center gap-4 mb-16 animate-fade-in-up [animation-delay:0.1s]">

                    {/* Search Bar */}
                    <div className="relative w-full max-w-3xl group">
                        <div className="absolute inset-x-0 -bottom-2 h-6 bg-brand-500/20 blur-2xl opacity-0 group-focus-within:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="relative flex items-center bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden focus-within:border-brand-500/40 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-300">
                            <div className="pl-5 text-slate-600 dark:text-slate-400">
                                <Search size={18} className="group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors duration-300" />
                            </div>
                            <input
                                type="text"
                                placeholder="Pesquisar eventos..."
                                aria-label="Pesquisar eventos"
                                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 py-5 px-4 focus:ring-0 focus:outline-none text-sm"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            {inputValue && (
                                <button
                                    onClick={() => { setInputValue(''); setSearchTerm(''); }}
                                    aria-label="Limpar pesquisa"
                                    className="pr-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Unified Filter Bar */}
                    {/* Stacks on small screens: the chip rail needs the full row width to stay scrollable */}
                    <div className="flex flex-col sm:flex-row sm:items-center w-full max-w-3xl bg-white/70 dark:bg-dark-surface/70 border border-slate-900/10 dark:border-white/10 rounded-2xl px-2.5 py-2 backdrop-blur-sm gap-2 shadow-lg">

                        {/* Time segment — compact pill group */}
                        <div className="flex shrink-0 gap-0.5 p-0.5 bg-slate-900/5 dark:bg-white/5 rounded-xl self-center">
                            {[
                                { id: 'upcoming' as const, label: 'Próximos', count: upcomingCount },
                                { id: 'past' as const, label: 'Arquivo', count: pastCount },
                                { id: 'all' as const, label: 'Todos', count: events.length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { tabTouched.current = true; setActiveTab(tab.id); }}
                                    aria-label={`Filtrar eventos: ${tab.label}`}
                                    aria-pressed={activeTab === tab.id}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                                        activeTab === tab.id
                                            ? "bg-brand-700 text-white shadow-md shadow-brand-600/30"
                                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                    <span className={cn(
                                        "tabular-nums text-[10px] px-1.5 py-0.5 rounded-full leading-none",
                                        activeTab === tab.id ? "bg-black/25 text-white" : "bg-slate-900/5 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                                    )}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-5 bg-slate-900/10 dark:bg-white/10 shrink-0" aria-hidden="true"></div>

                        {/* Category chips — scrollable rail with edge fade on narrow screens,
                            wrapping from lg up so no category stays hidden on desktop */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:flex-1 min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] lg:flex-wrap lg:overflow-visible lg:[mask-image:none]">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                aria-label="Filtrar por categoria: Todas"
                                aria-pressed={categoryFilter === 'all'}
                                className={cn(
                                    "flex-none px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                                    categoryFilter === 'all'
                                        ? "bg-brand-500/15 text-brand-700 dark:text-brand-400 border-brand-500/30"
                                        : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5"
                                )}
                            >
                                Todas
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryFilter(cat.name)}
                                    aria-label={`Filtrar por categoria: ${cat.name}`}
                                    aria-pressed={categoryFilter === cat.name}
                                    className={cn(
                                        "flex-none flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                                        categoryFilter === cat.name
                                            ? "bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white border-brand-500/50 shadow-sm shadow-brand-500/10"
                                            : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5"
                                    )}
                                >
                                    <span className={`w-2 h-2 rounded-full ${categoryColorClass(cat.color)} shrink-0`}></span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active filter result count */}
                    {(searchTerm || categoryFilter !== 'all') && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 self-start ml-1 animate-fade-in-up">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{filteredEvents.length}</span> evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
                            {searchTerm && <> para &ldquo;<span className="text-slate-600 dark:text-slate-300">{searchTerm}</span>&rdquo;</>}
                        </p>
                    )}
                </div>

                {/* --- EVENTS LIST --- */}
                <div className="space-y-6 animate-fade-in-up min-h-[400px] [animation-delay:0.2s]">

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <EventCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900/10 dark:border-white/10 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.02]">
                            <div className="w-20 h-20 bg-slate-900/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-400 dark:text-slate-600">
                                <CalendarOff size={32} />
                            </div>
                            <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2">Sem eventos encontrados</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
                                {activeTab === 'upcoming'
                                    ? "Não existem eventos agendados para os próximos tempos com estes filtros."
                                    : "Não encontrámos eventos correspondentes à sua pesquisa."}
                            </p>
                            {activeTab === 'upcoming' && pastCount > 0 && (
                                <Button variant="outline" onClick={() => { tabTouched.current = true; setActiveTab('past'); }}>
                                    <History size={16} className="mr-2" /> Explorar o Arquivo
                                </Button>
                            )}
                            {searchTerm && (
                                <Button variant="link" onClick={() => { setInputValue(''); setSearchTerm(''); }}>Limpar Pesquisa</Button>
                            )}
                        </div>
                    ) : (
                        // Grid
                        filteredEvents.map((event) => {
                            const isPast = isEventPast(event.date, now);
                            const capacityPercent = event.maxParticipants ? ((event.currentParticipants || 0) / event.maxParticipants) * 100 : 0;
                            return (
                                <div key={event.id} className={cn(
                                    "group relative bg-white dark:bg-dark-surface border rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 transition-all duration-300",
                                    isPast
                                        ? "border-slate-900/5 dark:border-white/5 hover:border-slate-900/10 dark:hover:border-white/10"
                                        : "border-slate-900/10 dark:border-white/10 hover:border-brand-500/30 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02]"
                                )}>
                                    {/* Image */}
                                    <div className="md:w-64 h-48 md:h-auto shrink-0 rounded-xl overflow-hidden relative">
                                        <img
                                            src={event.imageUrl || FALLBACK_IMAGES.event}
                                            alt={event.title}
                                            loading="lazy"
                                            className={cn(
                                                "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                                                isPast ? "grayscale group-hover:grayscale-0" : ""
                                            )}
                                        />
                                        {/* Floating Badges */}
                                        <div className="absolute top-2 left-2 flex gap-2">
                                            {isPast && <Badge className="bg-black/60 text-slate-300 border-white/10 backdrop-blur-md">Realizado</Badge>}
                                            {event.isHighlight && !isPast && <Badge className="bg-accent-gold text-black font-bold border-none shadow-lg">Destaque</Badge>}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-brand-700 dark:text-brand-400 text-xs font-mono uppercase tracking-wider">{new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            <Badge className="text-[10px] px-2 h-5">{event.category}</Badge>
                                        </div>

                                        <h3
                                            className="text-2xl md:text-3xl font-serif text-slate-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors cursor-pointer"
                                            onClick={() => openEvent(event)}
                                        >
                                            {event.title}
                                        </h3>

                                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base line-clamp-2 mb-4 max-w-3xl">
                                            {sanitizeText(eventSummaryText(event))}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2"><Clock size={16} className="text-brand-700 dark:text-brand-400" /><span>{new Date(event.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                            <div className="flex items-center gap-2"><MapPin size={16} className="text-brand-700 dark:text-brand-400" /><span>{event.location}</span></div>
                                            {event.isTournament && <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><Trophy size={16} aria-hidden="true" /><span>Torneio</span></div>}
                                        </div>

                                        {/* Places left, for any event with a limit */}
                                        {Boolean(event.maxParticipants) && !isPast && (
                                            <div className="mt-4 max-w-xs">
                                                <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-400">
                                                    <span>Inscritos: {event.currentParticipants ?? 0} de {event.maxParticipants}</span>
                                                    <span>{Math.round(capacityPercent)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-label={`Lugares ocupados em ${event.title}`} aria-valuemin={0} aria-valuemax={event.maxParticipants || 0} aria-valuenow={event.currentParticipants || 0}>
                                                    <div className={cn("h-full rounded-full transition-all duration-500", capacityPercent > 90 ? "bg-red-500" : "bg-brand-500", progressWidthClass(capacityPercent))}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col justify-center gap-3 md:border-l border-slate-900/5 dark:border-white/5 md:pl-6 md:min-w-[140px]">
                                        <Button variant="default" className={cn("flex-1 md:flex-none", isPast ? "bg-slate-700 hover:bg-slate-600 border-slate-600" : "")} onClick={() => openEvent(event)}>
                                            {isPast ? 'Ver resumo' : event.registrationOpen ? 'Ver e inscrever-me' : 'Ver detalhes'}
                                        </Button>
                                        {!isPast && canAddToCalendar(event) && (
                                            <Button variant="outline" size="sm" className="flex-1 md:flex-none text-xs border-slate-900/10 hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5" onClick={() => downloadIcs(calendarFor(event))}>
                                                <CalendarPlus size={14} className="mr-1" /> Adicionar ao calendário
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Details & Registration Modal */}
            <Modal
                isOpen={!!selectedEvent}
                onClose={closeEvent}
                title={showRegistrationModal ? 'Inscrição' : (selectedEvent?.title ?? '')}
                eyebrow={selectedEvent ? (showRegistrationModal ? selectedEvent.title : `${formatEventDate(selectedEvent.date)} · ${selectedEvent.location}`) : undefined}
                description={showRegistrationModal && !registration.done ? 'Preencha os seus dados. A organização confirma a inscrição depois.' : undefined}
                icon={selectedEvent?.isTournament ? <Trophy size={20} /> : <CalendarPlus size={20} />}
                size="lg"
                footer={eventModalFooter}
            >
                {selectedEvent && !showRegistrationModal && (
                    <div className="space-y-6">
                        <EventPoster key={selectedEvent.id} src={selectedEvent.imageUrl} title={selectedEvent.title} />

                        <div className="prose dark:prose-invert max-w-none">
                            {/* Descriptions come from the rich-text editor as HTML */}
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg" aria-busy={isBodyLoading} dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEventBody) }} />
                        </div>

                        {registrationOpen && (soldOut ? (
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/5 p-4 ring-1 ring-slate-900/10 dark:bg-white/5 dark:ring-white/10">
                                <X size={18} className="shrink-0 text-slate-600 dark:text-slate-400" />
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Esgotado</div>
                                    <div className="text-sm text-slate-700 dark:text-slate-200">Já não há lugares. Fale com a organização para ficar em lista de espera.</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-2xl bg-brand-500/10 p-4 ring-1 ring-brand-500/20">
                                <CheckCircle2 size={18} className="shrink-0 text-brand-700 dark:text-brand-400" />
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">Inscrições abertas</div>
                                    <div className="text-sm text-slate-700 dark:text-slate-200">
                                        {selectedEvent.maxParticipants
                                            ? `Restam ${Math.max(0, selectedEvent.maxParticipants - (selectedEvent.currentParticipants || 0))} lugares.`
                                            : 'Garanta o seu lugar neste evento.'}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <ShareBar
                            url={absoluteUrl(eventPath(selectedEvent.slug))}
                            title={selectedEvent.title}
                            text={eventShareText(selectedEvent)}
                        />
                    </div>
                )}

                {selectedEvent && showRegistrationModal && (registration.done ? (
                    <RegistrationDone event={selectedEvent} email={registration.values.email} contactEmail={settings.contactEmail} phone={settings.phone} />
                ) : (
                    <RegistrationForm
                        formId="event-registration-form"
                        event={selectedEvent}
                        values={registration.values}
                        errors={registration.errors}
                        isGuest={registration.isGuest}
                        lockedEmail={Boolean(me?.email)}
                        siteName={settings.siteName}
                        onChange={registration.update}
                        onExtraChange={registration.updateExtra}
                        onSubmit={registration.submit}
                    />
                ))}
            </Modal>
        </div>
    );
};
