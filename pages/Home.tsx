
/**
 * Homepage Logic
 * 
 * This is the landing page of the application. It features:
 * 1. An immersive Hero section with animated backgrounds.
 * 2. Bento-grid style news highlights.
 * 3. Horizontal scrolling event carousel.
 * 4. Infinite scrolling partners/sponsors marquee.
 * 5. Modals for event details and partnership applications.
 */

import React, { useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, ChevronRight, Sparkles, Target, Heart, Users, Search, Mic, Lightbulb, CheckCircle2, ChevronLeft, Handshake, LucideIcon, Activity, Shield, Trophy } from 'lucide-react';
import { Button, Badge, Modal } from '../components/ui/UIComponents';
import { SponsorshipModal } from '../components/ui/SponsorshipModal';
import { PartnerDetailsModal } from '../components/ui/PartnerDetailsModal';
import { Skeleton } from '../components/ui/Skeleton';
import { useData } from '../context/DataContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { cn } from '../utils/cn';
import { sanitizeHtml, sanitizeText } from '../utils/security';
import type { Event, Sponsor, ActionArea } from '../types';
import type { LayoutOutletContext } from '../layouts/types';

// Helper to map string names from DB to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Users, Lightbulb, Target, Heart, Sparkles, Handshake, Activity, Shield, Trophy
};

interface HomePageProps {
  onNavigate: (page: string) => void;
  onAskAI: (query?: string) => void;
  onViewPost: (id: string) => void;
  onContact: (subject: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAskAI, onViewPost, onContact }) => {
  const { posts, events, sponsors, actionAreas, stats, isLoading, settings } = useData();
  const [searchValue, setSearchValue] = useState('');

  const {
    isSupported: voiceSupported,
    isListening,
    interimTranscript,
    error: voiceError,
    toggle: toggleVoice,
  } = useSpeechRecognition({
    onFinal: (transcript) => {
      setSearchValue('');
      onAskAI(transcript);
    },
  });

  // Hands the question to the AI modal and resets the bar; an empty value
  // simply opens the assistant.
  const handleHeroSearch = () => {
    if (isListening) return;
    onAskAI(searchValue);
    setSearchValue('');
  };
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedArea, setSelectedArea] = useState<ActionArea | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);

  // Select top posts for the Bento Grid
  const highlightPost = posts[0];
  const secondaryPosts = posts.slice(1, 3);

  // Horizontal Scroll Logic for Event Carousel
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  const scrollEvents = (direction: 'left' | 'right') => {
    if (eventsContainerRef.current) {
      const scrollAmount = eventsContainerRef.current?.firstElementChild?.clientWidth
        ? eventsContainerRef.current.firstElementChild.clientWidth + 16 // card width + gap
        : 340;
      const currentScroll = eventsContainerRef.current.scrollLeft;
      const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      eventsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <title>{settings.siteName}</title>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524591434253-08742636f60d?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-[0.08] mix-blend-multiply dark:opacity-30 dark:mix-blend-overlay scale-105 animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/90 to-slate-50 dark:from-dark-bg dark:via-dark-bg/90 dark:to-dark-bg"></div>
          {/* Animated Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-float [animation-delay:2s]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pb-20">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 backdrop-blur-md mb-8 animate-fade-in-up hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tracking-wider uppercase">Portal Comunitário 2.0</span>
          </div>

          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-slate-500 mb-8 leading-[0.9] tracking-tight animate-fade-in-up drop-shadow-2xl [animation-delay:0.1s]">
            {settings.locality || settings.siteName}<br />
            {settings.locality && (
              <span className="text-4xl md:text-6xl lg:text-7xl font-light italic font-sans text-brand-600 dark:text-brand-400 opacity-90">{settings.siteName}</span>
            )}
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:0.2s]">
            {settings.heroTagline}{settings.heroTagline && settings.heroSubtitle && <br />}
            {settings.heroSubtitle}
          </p>

          {/* AI Search Bar Mockup */}
          <div className="w-full max-w-lg mx-auto mb-12 animate-fade-in-up relative group [animation-delay:0.25s]">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className={cn(
              'relative flex items-center bg-white/80 dark:bg-black/60 border rounded-full px-4 py-2 backdrop-blur-xl transition-colors',
              isListening ? 'border-red-500/40' : 'border-slate-900/10 dark:border-white/10',
            )}>
              <Sparkles className="text-brand-600 dark:text-brand-400 mr-3" size={18} />
              <input
                type="text"
                placeholder={isListening ? 'A ouvir... fala agora' : 'Pergunte à IA: Quando é o próximo torneio?'}
                aria-label="Pesquisar"
                className={cn(
                  'bg-transparent border-none outline-none text-slate-900 dark:text-white w-full text-sm h-10',
                  isListening ? 'placeholder:text-red-400/70 dark:placeholder:text-red-300/60' : 'placeholder:text-slate-500',
                )}
                value={isListening ? interimTranscript || searchValue : searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                readOnly={isListening}
              />
              <div className="flex gap-2">
                {voiceSupported && (
                  <button
                    className={cn(
                      'p-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      isListening ? 'text-red-400 bg-red-500/10' : 'hover:text-brand-600 dark:hover:text-brand-400 text-slate-500',
                    )}
                    onClick={toggleVoice}
                    aria-label={isListening ? 'Parar de ouvir' : 'Perguntar por voz'}
                    aria-pressed={isListening}
                  >
                    <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
                  </button>
                )}
                <button className="p-2 bg-brand-600 rounded-full text-white hover:bg-brand-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={handleHeroSearch} aria-label="Pesquisar"><Search size={16} /></button>
              </div>
            </div>
            {voiceError && (
              <p className="absolute -bottom-7 inset-x-0 text-center text-xs text-red-400" role="alert">{voiceError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up [animation-delay:0.3s]">
            <Button size="lg" className="rounded-full px-10 h-14 text-lg" onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorar Eventos
            </Button>
            <Button size="lg" variant="glass" className="rounded-full px-10 h-14 text-lg hover:bg-slate-900/10 dark:hover:bg-white/10" onClick={() => onNavigate('history')}>
              Nossa História
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:[@media(min-height:760px)]:flex flex-col items-center gap-3 animate-float cursor-pointer group z-20"
          role="button"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.scrollTo({ top: window.innerHeight, behavior: 'smooth' }); } }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Explorar</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-brand-500 via-brand-400 to-transparent opacity-50 group-hover:h-20 group-hover:opacity-100 transition-all duration-500"></div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <div className="border-y border-slate-900/5 dark:border-white/5 bg-slate-900/[0.02] dark:bg-white/[0.02] backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-900/5 dark:divide-white/5">
          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="py-12 flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          ) : (
            <>
              {stats.map((stat) => (
                <div key={stat.label} className="py-12 text-center group hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-default">
                  <div className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors scale-100 group-hover:scale-110 duration-300 transform">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
              {stats.length === 0 && [1, 2, 3, 4].map(i => <div key={i} className="py-12 bg-slate-900/5 dark:bg-white/5 animate-pulse"></div>)}
            </>
          )}
        </div>
      </div>

      {/* Action Areas Section */}
      <section className="py-32 bg-slate-50 dark:bg-dark-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,61,50,0.05)_0,transparent_70%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.25em] text-xs font-bold mb-4 block">Os Nossos Pilares</span>
            <h2 className="font-serif text-5xl md:text-6xl text-slate-900 dark:text-white mb-8 leading-tight">Áreas de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">Impacto</span></h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto text-lg font-light leading-relaxed">
              {`Da vida recreativa ao desporto, da cultura à solidariedade — a nossa missão assenta em áreas de ação ao serviço ${settings.locality ? `de ${settings.locality}` : "da comunidade"}.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[2rem] border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface overflow-hidden h-[420px] p-8 flex flex-col">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="mt-auto space-y-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : actionAreas.map((area) => {
              const Icon = ICON_MAP[area.iconName] || Users;
              return (
                <div
                  key={area.id}
                  className="group relative h-[420px] rounded-[2rem] border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(223,61,50,0.15)] transition-all duration-500"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedArea(area)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedArea(area); } }}
                >
                  {/* Background Image on Hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700">
                    <img src={area.imageUrl} alt={area.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-dark-surface dark:via-dark-surface/80 to-transparent"></div>
                  </div>

                  {/* Border Glow */}
                  <div className="absolute -inset-px bg-gradient-to-b from-brand-500 to-purple-600 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none p-px -z-10"></div>

                  <div className="relative z-10 flex flex-col h-full p-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-auto group-hover:bg-brand-500 group-hover:text-white group-hover:border-transparent transition-all duration-500">
                      <Icon size={28} />
                    </div>

                    <div className="mt-8">
                      <div className="mb-2 text-xs font-mono uppercase tracking-widest text-brand-600/80 dark:text-brand-400/80">{area.subtitle}</div>
                      <h3 className="text-3xl font-serif text-slate-900 dark:text-white mb-4 group-hover:translate-x-1 transition-transform duration-300">{area.title}</h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                        {sanitizeText(area.description)}
                      </p>

                      <div className="mt-6 pt-4 border-t border-slate-900/5 dark:border-white/5 flex items-center text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider opacity-80 group-hover:opacity-100">
                        Explorar <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bento Grid News Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="font-serif text-5xl text-slate-900 dark:text-white mb-4">Blog & Notícias</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl text-lg">Acompanhe as novidades da associação.</p>
            </div>
            <Button variant="link" className="hidden md:flex group text-brand-600 dark:text-brand-400" onClick={() => onNavigate('blog')}>
              Ver todas as notícias <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 min-h-[600px]">
            <div className="md:col-span-2 md:row-span-2 rounded-3xl border border-slate-900/10 dark:border-white/10 overflow-hidden">
              <Skeleton className="w-full h-full min-h-[400px] rounded-none" />
            </div>
            <div className="md:col-span-2 md:row-span-1 rounded-3xl border border-slate-900/10 dark:border-white/10 overflow-hidden">
              <Skeleton className="w-full h-full min-h-[180px] rounded-none" />
            </div>
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-slate-900/10 dark:border-white/10 overflow-hidden">
              <Skeleton className="w-full h-full min-h-[180px] rounded-none" />
            </div>
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-slate-900/10 dark:border-white/10 overflow-hidden">
              <Skeleton className="w-full h-full min-h-[180px] rounded-none" />
            </div>
          </div>
          ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 min-h-[600px]">
            {/* Highight Post */}
            {highlightPost && (
              <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/10 bg-dark-surface cursor-pointer h-96 md:h-auto" onClick={() => onViewPost(highlightPost.slug || highlightPost.id)}>
                <img src={highlightPost.coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop'} alt={highlightPost.title} loading="lazy" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent" />

                <div className="absolute top-6 right-6">
                  <div className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(223,61,50,0.5)]">Destaque</div>
                </div>

                <div className="absolute bottom-0 left-0 p-8 w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-4xl font-serif text-white font-medium mb-4 leading-tight group-hover:text-brand-400 transition-colors">{highlightPost.title}</h3>
                  <p className="text-slate-300 line-clamp-2 mb-6 text-lg font-light opacity-80 group-hover:opacity-100">{highlightPost.excerpt}</p>
                  <div className="flex items-center text-brand-400 font-medium uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    Ler Artigo Completo <ChevronRight size={16} className="ml-2" />
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Post 1 */}
            {secondaryPosts[0] && (
              <div className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface cursor-pointer flex items-center" onClick={() => onViewPost(secondaryPosts[0].slug || secondaryPosts[0].id)}>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-purple-500/10 dark:from-brand-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-1/3 h-full relative">
                  <img src={secondaryPosts[0].coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'} alt={secondaryPosts[0].title} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'; }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white dark:to-dark-surface"></div>
                </div>
                <div className="w-2/3 p-6 relative z-10">
                  <span className="text-brand-600 dark:text-brand-400 text-xs font-mono mb-2 block">{new Date(secondaryPosts[0].date).toLocaleDateString('pt-PT')}</span>
                  <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">{secondaryPosts[0].title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{secondaryPosts[0].excerpt}</p>
                </div>
              </div>
            )}

            {/* Secondary Post 2 */}
            {secondaryPosts[1] && (
              <div className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface p-6 flex flex-col justify-between hover:border-brand-500/30 transition-colors hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer" onClick={() => onViewPost(secondaryPosts[1].slug || secondaryPosts[1].id)}>
                <div>
                  <Sparkles className="text-accent-gold mb-4 w-8 h-8" />
                  <h3 className="text-lg font-serif text-slate-900 dark:text-white leading-snug">{secondaryPosts[1].title}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-900/5 dark:border-white/5 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Notícia</span>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </div>
              </div>
            )}

            {/* Gallery Link */}
            <div className="md:col-span-1 md:row-span-1 relative group overflow-hidden rounded-3xl bg-brand-600 p-6 flex flex-col justify-center items-center text-center hover:bg-brand-500 transition-colors shadow-[0_0_30px_rgba(223,61,50,0.2)] cursor-pointer" onClick={() => onNavigate('gallery')}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              <h3 className="text-2xl font-serif text-white mb-2 relative z-10">Multimédia</h3>
              <p className="text-brand-100 text-sm mb-4 relative z-10">Explore a galeria de fotos e vídeos.</p>
              <Button variant="glass" size="sm" className="w-full relative z-10">Ver Galeria</Button>
            </div>
          </div>
          ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Sem notícias de momento.</p>
          </div>
          )}
        </div>
      </section>

      {/* Events Stream */}
      <section id="events" className="py-32 bg-white dark:bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 dark:via-brand-900 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-5xl text-slate-900 dark:text-white mb-4">Agenda Cultural</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">{settings.locality ? `Próximos eventos em ${settings.locality}.` : "Próximos eventos."}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10" aria-label="Eventos anteriores" onClick={() => scrollEvents('left')}>
                <ChevronLeft size={20} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10" aria-label="Próximos eventos" onClick={() => scrollEvents('right')}>
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>

          {/* Event Cards Container */}
          {isLoading ? (
          <div className="flex gap-6 overflow-hidden pb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[300px] md:min-w-[340px] rounded-2xl border border-slate-900/10 dark:border-white/10 bg-white dark:bg-dark-surface overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          ) : events.length > 0 ? (
          <div
            ref={eventsContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar [scrollbar-width:none]"
          >
            {events.map(event => (
              <div
                key={event.id}
                className="min-w-[300px] md:min-w-[340px] snap-center group relative bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl overflow-hidden hover:border-brand-500/40 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-surface to-transparent"></div>

                  <div className="absolute top-3 right-3 bg-brand-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                    {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-brand-600 text-white border-none shadow-md text-[10px]">{event.category || 'Geral'}</Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">{event.title}</h3>
                  <div className="flex items-center text-slate-500 text-xs mb-4">
                    <MapPin size={12} className="mr-1 text-brand-500" />
                    {event.location}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-900/10 dark:border-white/10 hover:bg-brand-600 hover:border-brand-600 hover:text-white group-hover:bg-slate-900/5 dark:group-hover:bg-white/5"
                    onClick={() => setSelectedEvent(event)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}

            {/* View All Card */}
            <div
              className="min-w-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900/10 dark:border-white/10 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-brand-500 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-all cursor-pointer snap-center"
              onClick={() => onNavigate('events')}
            >
              <Calendar size={32} className="mb-3" />
              <span className="font-medium">Ver Calendário Completo</span>
            </div>
          </div>
          ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Sem eventos agendados de momento.</p>
          </div>
          )}
        </div>
      </section>

      {/* Infinite Partners Marquee */}
      <section className="py-24 border-t border-slate-900/5 dark:border-white/5 bg-slate-900/[0.01] dark:bg-white/[0.01] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <p className="text-slate-500 uppercase tracking-[0.2em] text-xs font-bold">Rede de Parceiros</p>
        </div>

        <div className="relative w-full flex overflow-hidden group">
          {/* Gradient Masks */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-50 dark:from-dark-bg to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-50 dark:from-dark-bg to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling Content */}
          <div className="flex gap-16 animate-marquee whitespace-nowrap hover:[animation-play-state:paused] items-center">
            {/* Duplicate list for seamless loop */}
            {[...sponsors, ...sponsors].map((sponsor, i) => (
              <div
                key={`${sponsor.id}-${i}`}
                className="flex-shrink-0 transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer"
                title={sponsor.name}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSponsor(sponsor)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSponsor(sponsor); } }}
              >
                {sponsor.logoUrl ? (
                  <div className="h-28 px-8 py-4 bg-white rounded-2xl border border-slate-900/10 dark:border-white/15 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2">
                    <img src={sponsor.logoUrl} alt={sponsor.name} loading="lazy" className="h-12 max-w-[180px] w-auto object-contain" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 truncate max-w-[180px]">{sponsor.name}</span>
                  </div>
                ) : (
                  <div className="h-28 px-8 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/15 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 cursor-pointer flex items-center justify-center text-slate-900 dark:text-white font-serif font-bold text-xl">
                    {sponsor.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="gap-2 rounded-full hover:bg-brand-600/10 dark:hover:bg-brand-900/20 border-slate-900/10 dark:border-white/10 hover:border-brand-500/30"
            onClick={() => setShowSponsorshipModal(true)}
          >
            <Handshake size={16} /> Quero ser Parceiro
          </Button>
        </div>
      </section>

      {/* Modals */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Detalhes do Evento"
      >
        {selectedEvent && (() => {
          const isUpcoming = new Date(selectedEvent.date) >= new Date();
          const canRegister = isUpcoming && selectedEvent.registrationOpen === true;
          const slotsLeft = selectedEvent.maxParticipants !== undefined
            ? selectedEvent.maxParticipants - (selectedEvent.currentParticipants ?? 0)
            : undefined;
          const isFull = slotsLeft !== undefined && slotsLeft <= 0;

          return (
            <div className="space-y-6">
              <img
                src={selectedEvent.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'}
                className="w-full h-64 object-cover rounded-xl"
                alt={selectedEvent.title}
              />
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <h2 className="text-2xl font-serif text-slate-900 dark:text-white font-bold">{selectedEvent.title}</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-brand-600 text-white border-none shadow-md">{selectedEvent.category || 'Geral'}</Badge>
                    {selectedEvent.isHighlight && <Badge className="bg-accent-gold text-black border-none shadow-md">Destaque</Badge>}
                    {selectedEvent.isTournament && selectedEvent.tournamentType && (
                      <Badge className="bg-purple-600 text-white border-none shadow-md">
                        <Trophy size={12} className="inline mr-1" /> {selectedEvent.tournamentType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-sm flex gap-4 mb-4 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedEvent.date).toLocaleDateString('pt-PT')}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedEvent.location}</span>
                </div>
                {/* Descriptions come from the rich-text editor as HTML */}
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEvent.description) }} />
              </div>

              {(selectedEvent.isTournament || selectedEvent.entryPrice !== undefined || selectedEvent.maxParticipants !== undefined) && (
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/5 dark:bg-black/30 rounded-xl border border-slate-900/5 dark:border-white/5">
                  {selectedEvent.entryPrice !== undefined && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Inscrição</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedEvent.entryPrice > 0 ? `${selectedEvent.entryPrice}€` : 'Grátis'}
                      </div>
                    </div>
                  )}
                  {selectedEvent.maxParticipants !== undefined && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Vagas</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedEvent.currentParticipants ?? 0} / {selectedEvent.maxParticipants}
                        {isFull && <span className="ml-2 text-xs text-red-400 font-normal">Esgotado</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {canRegister && !isFull ? (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('events');
                    }}
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    {selectedEvent.entryPrice && selectedEvent.entryPrice > 0
                      ? `Inscrever (${selectedEvent.entryPrice}€)`
                      : 'Inscrever-me'}
                  </Button>
                ) : isFull ? (
                  <Button variant="outline" disabled className="flex-1">Vagas Esgotadas</Button>
                ) : isUpcoming ? (
                  <Button variant="outline" disabled className="flex-1">Inscrições Fechadas</Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEvent(null);
                    onNavigate('events');
                  }}
                >
                  Ver Agenda
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={!!selectedArea}
        onClose={() => setSelectedArea(null)}
        title={selectedArea?.title}
        size="lg"
      >
        {selectedArea && (
          <div className="flex flex-col gap-6">
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden">
              <img src={selectedArea.imageUrl} alt={selectedArea.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-surface to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <div className="text-brand-400 text-xs font-mono uppercase mb-1">{selectedArea.subtitle}</div>
                <h2 className="text-3xl md:text-4xl font-serif text-white font-bold">{selectedArea.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-lg font-serif text-slate-900 dark:text-white mb-3">Sobre esta área</h3>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedArea.longDescription) }} />

                <h3 className="text-lg font-serif text-slate-900 dark:text-white mb-3">O que fazemos</h3>
                <ul className="space-y-3">
                  {selectedArea.features?.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-500 dark:text-slate-400 text-sm">
                      <CheckCircle2 className="text-brand-500 shrink-0 mt-0.5" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/5 dark:bg-white/5 rounded-xl p-5 border border-slate-900/10 dark:border-white/10 h-fit">
                <h4 className="text-slate-900 dark:text-white font-medium mb-4 flex items-center gap-2">
                  {(() => { const Icon = ICON_MAP[selectedArea.iconName] || Users; return <Icon size={18} className="text-brand-600 dark:text-brand-400" />; })()} Destaques
                </h4>
                <div className="space-y-4 text-sm">
                  <p className="text-slate-500 dark:text-slate-400">Procura envolver-se nesta área? Estamos sempre à procura de voluntários e novas ideias.</p>
                  <Button className="w-full" onClick={() => { setSelectedArea(null); onContact('Direção'); }}>Contactar Direção</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <SponsorshipModal isOpen={showSponsorshipModal} onClose={() => setShowSponsorshipModal(false)} />

      <PartnerDetailsModal
        sponsor={selectedSponsor}
        onClose={() => setSelectedSponsor(null)}
        onBecomePartner={() => setShowSponsorshipModal(true)}
      />

    </div>
  );
};

/**
 * Router wrapper for HomePage.
 * Bridges React Router navigation to the legacy prop-based interface.
 */
export const HomePageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { onAskAI, openContact } = useOutletContext<LayoutOutletContext>();

  return (
    <HomePage
      onNavigate={(page: string) => {
        const pathMap: Record<string, string> = {
          home: '/', about: '/about', history: '/history', team: '/team',
          events: '/events', blog: '/blog', gallery: '/gallery',
          'member-area': '/member', admin: '/admin',
        };
        navigate(pathMap[page] || '/');
      }}
      onAskAI={onAskAI}
      onViewPost={(id: string) => {
        navigate(`/blog/${id}`);
      }}
      onContact={openContact}
    />
  );
};
