
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useConvexAuth } from 'convex/react';
import { MapPin, Clock, Search, CalendarPlus, Trophy, CheckCircle2, Download, X, History, CalendarOff, Smartphone, CreditCard, LogIn } from 'lucide-react';
import { Button, Badge, Input, Modal, cn } from '../components/ui/UIComponents';
import { sanitizeHtml, sanitizeText } from '../utils/security';
import { categoryColorClass } from '../utils/categoryColors';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import type { Event } from '../types';

export const EventsPage: React.FC = () => {
    const { events, categories, addRegistration, isLoading, settings } = useData();
    const { isAuthenticated } = useConvexAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [regStep, setRegStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic Form State
    const [dynamicForm, setDynamicForm] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Debounce search input (500ms)
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(inputValue), 500);
        return () => clearTimeout(timer);
    }, [inputValue]);

    // Calendar Export Utilities
    const downloadICS = (event: Event) => {
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nURL:${window.location.href}\nDTSTART:${formatDate(startDate)}\nDTEND:${formatDate(endDate)}\nSUMMARY:${event.title}\nDESCRIPTION:${sanitizeText(event.description)}\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${event.slug}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    };

    const openGoogleCalendar = (event: Event) => {
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(sanitizeText(event.description))}&location=${encodeURIComponent(event.location)}`;
        window.open(url, '_blank');
    };

    // Logic & Filtering
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Split events for counts (memoized)
    const upcomingCount = useMemo(() => events.filter(e => new Date(e.date) >= new Date(todayStr)).length, [events, todayStr]);
    const pastCount = useMemo(() => events.filter(e => new Date(e.date) < new Date(todayStr)).length, [events, todayStr]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const search = normalize(searchTerm);

            // Search Filter
            const matchesSearch = !searchTerm ||
                normalize(event.title).includes(search) ||
                normalize(event.description).includes(search) ||
                normalize(event.location).includes(search);

            // Tab Filter
            let matchesTime = true;
            if (activeTab === 'upcoming') matchesTime = eventDate >= new Date(todayStr);
            if (activeTab === 'past') matchesTime = eventDate < new Date(todayStr);

            // Category Filter
            const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;

            return matchesSearch && matchesTime && matchesCategory;
        }).sort((a, b) => {
            // Sort upcoming ASC (soonest first), past DESC (most recent first)
            return activeTab === 'past'
                ? new Date(b.date).getTime() - new Date(a.date).getTime()
                : new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [events, activeTab, categoryFilter, searchTerm, todayStr]);

    const handleOpenRegistration = () => {
        if (!selectedEvent) return;
        setRegStep(1);
        setDynamicForm({}); // Reset form
        setFormErrors({}); // Reset errors
        setShowRegistrationModal(true);
    };

    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Guard against double-submit while the mutation is in flight
        if (!selectedEvent || submitting) return;

        const errors: Record<string, string> = {};

        // Determine main contact info from dynamic fields if possible, or fallback
        const contactName = String(dynamicForm['name'] || dynamicForm['team_name'] || dynamicForm['captain_name'] || "");
        const contactEmail = String(dynamicForm['email'] || dynamicForm['captain_email'] || "");

        // Validate contactName
        if (!contactName.trim()) {
            errors.contactName = 'O nome é obrigatório.';
        }

        // Validate contactEmail
        if (!contactEmail.trim()) {
            errors.contactEmail = 'O email é obrigatório.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            errors.contactEmail = 'Formato de email inválido.';
        }

        // Validate required registration fields
        if (selectedEvent.registrationFields && selectedEvent.registrationFields.length > 0) {
            for (const field of selectedEvent.registrationFields) {
                if (field.required && !(dynamicForm[field.id] || '').trim()) {
                    errors[field.id] = `${field.label} é obrigatório.`;
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setSubmitting(true);

        try {
            const result = await addRegistration({
                eventId: selectedEvent.id,
                name: contactName || "Participante",
                email: contactEmail,
                customData: dynamicForm
            });
            if (result.success) {
                setRegStep(2);
            } else {
                const errorMsg = 'error' in result ? result.error : 'Erro ao processar inscrição. Tente novamente.';
                setFormErrors({ submit: errorMsg });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg">
            <title>{`Eventos & Atividades — ${settings.siteName}`}</title>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] text-xs font-bold border border-brand-500/30 px-4 py-1 rounded-full">Agenda Cultural</span>
                    <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mt-6 mb-6">Eventos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-400 to-purple-500 dark:to-purple-300">Atividades</span></h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                        {settings.locality ? `O ponto de encontro da comunidade de ${settings.locality}.` : "O ponto de encontro da comunidade."}
                    </p>
                </div>

                {/* --- CONTROLS DECK --- */}
                <div className="flex flex-col items-center gap-4 mb-16 animate-fade-in-up [animation-delay:0.1s]">

                    {/* Search Bar */}
                    <div className="relative w-full max-w-3xl group">
                        <div className="absolute inset-x-0 -bottom-2 h-6 bg-brand-500/20 blur-2xl opacity-0 group-focus-within:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="relative flex items-center bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden focus-within:border-brand-500/40 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all duration-300">
                            <div className="pl-5 text-slate-500">
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
                                    className="pr-5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
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
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-label={`Filtrar eventos: ${tab.label}`}
                                    aria-pressed={activeTab === tab.id}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                                        activeTab === tab.id
                                            ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    )}
                                >
                                    {tab.label}
                                    <span className={cn(
                                        "tabular-nums text-[10px] px-1.5 py-0.5 rounded-full leading-none",
                                        activeTab === tab.id ? "bg-white/25 text-white" : "bg-slate-900/5 dark:bg-white/5 text-slate-500"
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
                                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30"
                                        : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5"
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
                                            : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5"
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
                        <p className="text-xs text-slate-500 self-start ml-1 animate-fade-in-up">
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
                            <p className="text-slate-500 text-center max-w-md mb-6">
                                {activeTab === 'upcoming'
                                    ? "Não existem eventos agendados para os próximos tempos com estes filtros."
                                    : "Não encontrámos eventos correspondentes à sua pesquisa."}
                            </p>
                            {activeTab === 'upcoming' && pastCount > 0 && (
                                <Button variant="outline" onClick={() => setActiveTab('past')}>
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
                            const isPast = new Date(event.date) < new Date();
                            const capacityPercent = event.maxParticipants ? ((event.currentParticipants || 0) / event.maxParticipants) * 100 : 0;
                            return (
                                <div key={event.id} className={cn(
                                    "group relative bg-white dark:bg-dark-surface border rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-6 transition-all duration-300",
                                    isPast
                                        ? "border-slate-900/5 dark:border-white/5 opacity-80 hover:opacity-100 hover:border-slate-900/10 dark:hover:border-white/10"
                                        : "border-slate-900/10 dark:border-white/10 hover:border-brand-500/30 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02]"
                                )}>
                                    {/* Image */}
                                    <div className="md:w-64 h-48 md:h-auto shrink-0 rounded-xl overflow-hidden relative">
                                        <img
                                            src={event.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop'}
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
                                            <span className="text-brand-600 dark:text-brand-400 text-xs font-mono uppercase tracking-wider">{new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            <Badge className="text-[10px] px-2 h-5">{event.category}</Badge>
                                        </div>

                                        <h3
                                            className="text-2xl md:text-3xl font-serif text-slate-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors cursor-pointer"
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            {event.title}
                                        </h3>

                                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base line-clamp-2 mb-4 max-w-3xl">
                                            {sanitizeText(event.description)}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-2"><Clock size={16} className="text-brand-600" /><span>{new Date(event.date).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span></div>
                                            <div className="flex items-center gap-2"><MapPin size={16} className="text-brand-600" /><span>{event.location}</span></div>
                                            {event.isTournament && <div className="flex items-center gap-2 text-amber-500"><Trophy size={16} /><span>Torneio</span></div>}
                                        </div>

                                        {/* Capacity Bar for Tournaments */}
                                        {event.isTournament && !isPast && (
                                            <div className="mt-4 max-w-xs">
                                                <div className="flex justify-between text-xs mb-1 text-slate-500 dark:text-slate-400">
                                                    <span>Inscritos: {event.currentParticipants ?? 0}/{event.maxParticipants}</span>
                                                    <span>{Math.round(capacityPercent)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={event.maxParticipants || 0} aria-valuenow={event.currentParticipants || 0}>
                                                    <div className={cn("h-full rounded-full transition-all duration-500", capacityPercent > 90 ? "bg-red-500" : "bg-brand-500")} style={{ width: `${capacityPercent}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col justify-center gap-3 md:border-l border-slate-900/5 dark:border-white/5 md:pl-6 md:min-w-[140px]">
                                        <Button variant="default" className={cn("flex-1 md:flex-none", isPast ? "bg-slate-700 hover:bg-slate-600 border-slate-600" : "")} onClick={() => setSelectedEvent(event)}>
                                            {isPast ? 'Ver Resumo' : 'Detalhes'}
                                        </Button>
                                        {!isPast && (
                                            <div className="flex-1 md:flex-none flex flex-col gap-2">
                                                <Button variant="outline" size="sm" className="w-full text-xs border-slate-900/10 hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5" onClick={() => openGoogleCalendar(event)}>
                                                    <CalendarPlus size={14} className="mr-1" /> Google
                                                </Button>
                                                <Button variant="outline" size="sm" className="w-full text-xs border-slate-900/10 hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5" onClick={() => downloadICS(event)}>
                                                    <Download size={14} className="mr-1" /> .ICS
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Details & Registration Modal */}
            <Modal isOpen={!!selectedEvent} onClose={() => { setSelectedEvent(null); setShowRegistrationModal(false); }} title={selectedEvent?.title} size="lg">
                {selectedEvent && !showRegistrationModal && (
                    <div className="space-y-6">
                        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden w-full group">
                            <img
                                src={selectedEvent.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'}
                                alt={selectedEvent.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                                <div className="font-serif text-2xl">{selectedEvent.title}</div>
                                <div className="flex gap-4 text-sm mt-2 text-slate-300">
                                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{selectedEvent.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            {/* Descriptions come from the rich-text editor as HTML */}
                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEvent.description) }} />
                        </div>

                        {selectedEvent.registrationOpen && new Date(selectedEvent.date) >= new Date() && (
                            <div className="pt-6 border-t border-slate-900/10 dark:border-white/10">
                                <div className="bg-brand-500/10 dark:bg-brand-900/20 border border-brand-500/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div>
                                        <div className="text-brand-600 dark:text-brand-400 font-bold uppercase text-xs tracking-wider mb-1">Inscrições Abertas</div>
                                        <div className="text-slate-900 dark:text-white text-sm">
                                            {selectedEvent.isTournament && selectedEvent.maxParticipants
                                                ? `Vagas: ${selectedEvent.maxParticipants - (selectedEvent.currentParticipants || 0)} restantes`
                                                : 'Garanta o seu lugar neste evento.'}
                                        </div>
                                    </div>
                                    {isAuthenticated ? (
                                        <Button
                                            className="bg-brand-600 hover:bg-brand-500 shadow-[0_0_20px_rgba(223,61,50,0.3)] w-full sm:w-auto"
                                            onClick={handleOpenRegistration}
                                            disabled={selectedEvent.isTournament && selectedEvent.maxParticipants ? (selectedEvent.currentParticipants || 0) >= selectedEvent.maxParticipants : false}
                                        >
                                            {selectedEvent.isTournament && selectedEvent.maxParticipants && (selectedEvent.currentParticipants || 0) >= selectedEvent.maxParticipants
                                                ? "Esgotado"
                                                : `Inscrever ${selectedEvent.entryPrice ? `(${selectedEvent.entryPrice}€)` : 'Grátis'}`
                                            }
                                        </Button>
                                    ) : (
                                        <Button
                                            className="bg-slate-700 hover:bg-slate-600 border-slate-600 w-full sm:w-auto"
                                            onClick={() => window.location.href = '/'}
                                        >
                                            <LogIn size={16} className="mr-2" /> Iniciar Sessão para Inscrever
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Dynamic Registration Form */}
                {selectedEvent && showRegistrationModal && (
                    <div className="h-full flex flex-col">
                        {regStep === 1 && (
                            <form onSubmit={handleRegistrationSubmit} className="space-y-6 animate-fade-in-up">
                                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-900/10 p-3 rounded-lg border border-brand-500/20">
                                    <Trophy size={18} />
                                    <span className="text-sm font-medium">Inscrição para: {selectedEvent.title}</span>
                                </div>

                                {/* Horizontal padding keeps input focus rings from being clipped by the scroll container */}
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1.5 -mx-1.5 pr-2 custom-scrollbar">
                                    {!selectedEvent.registrationFields || selectedEvent.registrationFields.length === 0 ? (
                                        <div className="py-2 space-y-4">
                                            <p className="text-center text-slate-500 text-sm">Este evento não requer dados específicos. Confirme apenas a sua intenção de participar.</p>
                                            <div>
                                                <label htmlFor="reg-name" className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">
                                                    Nome <span className="text-red-600 dark:text-red-400">*</span>
                                                </label>
                                                <Input id="reg-name" placeholder="O seu nome completo" type="text" autoComplete="name" required onChange={e => setDynamicForm({ ...dynamicForm, name: e.target.value })} />
                                                {formErrors.contactName && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.contactName}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="reg-email" className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">
                                                    Email <span className="text-red-600 dark:text-red-400">*</span>
                                                </label>
                                                <Input id="reg-email" placeholder="email@exemplo.pt" type="email" autoComplete="email" required onChange={e => setDynamicForm({ ...dynamicForm, email: e.target.value })} />
                                                {formErrors.contactEmail && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors.contactEmail}</p>}
                                                <p className="text-slate-500 dark:text-slate-600 text-xs mt-1">Usado apenas para confirmar a inscrição.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        selectedEvent.registrationFields.map(field => (
                                            <div key={field.id}>
                                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 block">
                                                    {field.label} {field.required && <span className="text-red-600 dark:text-red-400">*</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        required={field.required}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 rounded-lg p-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 min-h-[80px]"
                                                        onChange={e => setDynamicForm({ ...dynamicForm, [field.id]: e.target.value })}
                                                    />
                                                ) : (
                                                    <Input
                                                        type={field.type}
                                                        required={field.required}
                                                        placeholder={field.placeholder}
                                                        onChange={e => setDynamicForm({ ...dynamicForm, [field.id]: e.target.value })}
                                                    />
                                                )}
                                                {formErrors[field.id] && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{formErrors[field.id]}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {formErrors.submit && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                                        {formErrors.submit}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
                                    <Button type="button" variant="ghost" onClick={() => setShowRegistrationModal(false)}>Cancelar</Button>
                                    <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'A enviar…' : 'Confirmar Inscrição'}</Button>
                                </div>
                            </form>
                        )}

                        {regStep === 2 && (
                            <div className="text-center py-8 space-y-6 animate-fade-in-up">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500"><CheckCircle2 size={40} /></div>

                                {selectedEvent.entryPrice ? (
                                    <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl p-6 max-w-sm mx-auto">
                                        <h3 className="text-lg font-serif text-slate-900 dark:text-white mb-4">Pagamento Pendente</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Utilize os dados abaixo para concluir a inscrição.</p>

                                        <div className="space-y-4">
                                            <div className="text-slate-500 dark:text-slate-400 text-sm text-center">
                                                Contacte a associação para informações de pagamento.
                                            </div>
                                            {settings.phone && (
                                                <div className="flex items-center gap-3 p-3 bg-slate-900/5 dark:bg-black/40 rounded-lg border border-slate-900/5 dark:border-white/5">
                                                    <Smartphone className="text-brand-600 dark:text-brand-400" />
                                                    <div className="text-left">
                                                        <div className="text-xs text-slate-500 uppercase">Telefone</div>
                                                        <div className="text-slate-900 dark:text-white font-mono font-bold">{settings.phone}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {settings.contactEmail && (
                                                <div className="flex items-center gap-3 p-3 bg-slate-900/5 dark:bg-black/40 rounded-lg border border-slate-900/5 dark:border-white/5">
                                                    <CreditCard className="text-brand-600 dark:text-brand-400" />
                                                    <div className="text-left">
                                                        <div className="text-xs text-slate-500 uppercase">Email</div>
                                                        <div className="text-slate-900 dark:text-white font-mono text-xs">{settings.contactEmail}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-900/20 p-2 rounded">
                                            Valor a pagar: <strong>{selectedEvent.entryPrice}€</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div><h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">Inscrição Recebida!</h3><p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">A sua presença foi confirmada.</p></div>
                                )}

                                <Button onClick={() => { setShowRegistrationModal(false); setSelectedEvent(null); }}>Voltar à Agenda</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
