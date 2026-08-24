
/**
 * Navigation Bar Component
 *
 * A responsive navigation bar that adapts its appearance based on the user's scroll position.
 * Logo URL and site name are sourced from environment configuration.
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, UserCircle, CalendarDays, ShieldCheck, Sun, Moon } from 'lucide-react';
import { cn } from './ui/UIComponents';
import { LogoMark } from './ui/LogoMark';
import { useData } from '../context/DataContext';
import { useTheme } from '../hooks/useTheme';

// Built-in logo paths where the theme-aware inline mark should be used instead
// of a plain <img>, so the mark stays legible in both themes.
const BUILTIN_LOGOS = ['', '/favicon.svg', '/logo-arcva.svg', '/logo-arcva-white.svg'];

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onMemberLogin: () => void;
  onOpenAgenda: () => void;
  onAdminLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onMemberLogin, onOpenAgenda, onAdminLogin }) => {
  const { settings } = useData();
  const { theme, toggleTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Handle scroll detection for hiding/showing navbar and changing transparency
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 20);

          // Smart hide logic: hide when scrolling down, show when scrolling up
          if (currentScrollY < 20) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auto-reveal: moving the pointer to the top edge brings the hidden navbar
  // back without needing to scroll up (desktop nicety; harmless on touch)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 80) setIsVisible(true);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileOpen]);

  const navLinks = [
    { name: 'Início', id: 'home' },
    { name: 'História', id: 'history' },
    { name: 'Sobre', id: 'about' },
    { name: 'Equipa', id: 'team' },
    { name: 'Eventos', id: 'events' },
    { name: 'Notícias', id: 'blog' },
    { name: 'Galeria', id: 'gallery' },
  ];

  const isHome = currentPage === 'home';
  const useBuiltinLogo = BUILTIN_LOGOS.includes(settings.logoUrl ?? '');

  return (
    <>
      <nav
        aria-label="Menu principal"
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] flex justify-center pt-2 sm:pt-4 transition-transform duration-500 ease-in-out",
          isVisible && !mobileOpen ? "translate-y-0" : mobileOpen ? "translate-y-0" : "-translate-y-[150%]"
        )}
      >
        <div className={cn(
          "w-full max-w-7xl mx-2 sm:mx-6 lg:mx-8 flex items-center justify-between rounded-[2rem] px-4 sm:px-6 transition-all duration-500",
          scrolled && !mobileOpen
            ? "bg-white/85 dark:bg-dark-bg/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 shadow-2xl py-2"
            : mobileOpen
              ? "bg-transparent border-transparent py-3"
              : isHome
                ? "bg-gradient-to-b from-white/60 dark:from-black/60 to-transparent border-transparent py-3 sm:py-5"
                : "bg-white/75 dark:bg-dark-bg/60 backdrop-blur-md border border-slate-900/5 dark:border-white/5 shadow-lg py-3"
        )}>

          {/* Logo Section */}
          {/* Logo - sourced from environment config with text fallback */}
          <div
            className="cursor-pointer flex items-center gap-3 group relative z-[102]"
            onClick={() => { onNavigate('home'); setMobileOpen(false); }}
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
              {useBuiltinLogo || imgError ? (
                <LogoMark className="w-full h-full relative z-10 transition-colors text-brand-600 dark:text-brand-500" />
              ) : (
                <img
                  src={settings.logoUrl}
                  alt={`${settings.siteName} Logo`}
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_10px_rgba(223,61,50,0.4)]"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
            <span className="font-serif font-bold text-base sm:text-lg tracking-wide group-hover:text-brand-500 transition-colors text-slate-900 dark:text-white">{settings.siteName}</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 p-1 rounded-full backdrop-blur-md border bg-slate-900/5 dark:bg-black/20 border-slate-900/5 dark:border-white/5">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                aria-current={currentPage === link.id ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  currentPage === link.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10"
                )}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 relative z-[102]">
            <button
              className="w-9 h-9 flex items-center justify-center rounded-xl backdrop-blur-md border transition-all bg-slate-900/5 border-slate-900/10 text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              className="hidden md:flex items-center gap-2 px-4 py-2 h-9 rounded-xl backdrop-blur-md border transition-all text-[10px] font-bold uppercase tracking-wider group bg-slate-900/5 border-slate-900/10 text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={onOpenAgenda}
            >
              <CalendarDays size={15} className="group-hover:text-brand-500 transition-colors" />
              <span>Agenda</span>
            </button>

            <button
              className="hidden md:flex items-center gap-2 px-4 py-2 h-9 rounded-xl backdrop-blur-md border transition-all text-[10px] font-bold uppercase tracking-wider group bg-brand-600/10 border-brand-600/20 text-brand-700 hover:text-brand-800 hover:bg-brand-600/20 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 dark:hover:text-brand-200 dark:hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={onMemberLogin}
            >
              <UserCircle size={15} />
              <span>Sócio</span>
            </button>

            {onAdminLogin && (
              <button
                onClick={onAdminLogin}
                className="hidden md:flex items-center gap-2 px-4 py-2 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:text-amber-300 hover:bg-amber-500/20 transition-all text-[10px] font-bold uppercase tracking-widest group shadow-[0_0_15px_rgba(245,158,11,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ShieldCheck size={15} />
                <span>Reservado</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md border border-slate-900/10 bg-slate-900/5 text-slate-900 dark:border-white/10 dark:bg-black/40 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-[90] transition-all duration-500 h-[100dvh] w-screen",
        mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-slate-50/95 dark:bg-dark-bg/80 backdrop-blur-3xl"></div>
        <div className="relative z-10 w-full h-full flex flex-col px-6 pt-32 pb-10 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => { onNavigate(link.id); setMobileOpen(false); }}
                aria-current={currentPage === link.id ? "page" : undefined}
                className="text-4xl font-serif font-medium text-slate-900/90 dark:text-white/90 hover:text-brand-600 dark:hover:text-brand-400 transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {link.name}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-4 mt-12 w-full max-w-xs mx-auto">
            <button onClick={() => { onOpenAgenda(); setMobileOpen(false); }} className="w-full py-4 rounded-2xl bg-slate-900/5 border border-slate-900/10 text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-white font-medium flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><CalendarDays size={20} /> Agenda Cultural</button>
            <button onClick={() => { onMemberLogin(); setMobileOpen(false); }} className="w-full py-4 rounded-2xl bg-brand-600 text-white font-medium flex items-center justify-center gap-3 hover:bg-brand-500 active:scale-[0.97] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_20px_rgba(223,61,50,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"><UserCircle size={20} /> Área de Sócio</button>
            {onAdminLogin && <button onClick={() => { onAdminLogin(); setMobileOpen(false); }} className="w-full py-4 rounded-2xl border border-amber-500/30 text-amber-500 font-medium flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><ShieldCheck size={20} /> Acesso Reservado</button>}
          </div>
        </div>
      </div>
    </>
  );
};
