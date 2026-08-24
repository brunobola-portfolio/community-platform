
/**
 * Main Layout Component
 *
 * Wraps all public pages with shared UI elements:
 * - Navbar (with active page detection via useLocation)
 * - Footer (hidden on post-details and member-area routes)
 * - Floating AI Chat button & modal
 * - Agenda modal
 * - Contact modal
 * - Login modal
 * - ScrollToTop on route change
 */

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScrollToTop } from '../components/ScrollToTop';
import { ContactModal } from '../components/ui/ContactModal';
import { AgendaModal } from '../components/ui/AgendaModal';
import { useData } from '../context/DataContext';
import { MessageCircle, WifiOff, Wrench } from 'lucide-react';
import { LoginModal } from '../components/LoginModal';
import { AIModal } from '../components/AIModal';
import { PAGES } from '../utils/constants';
import { ToastProvider } from '../context/ToastContext';

/** Full-screen service notice used for maintenance and offline states. */
const ServiceScreen: React.FC<{ icon: React.ReactNode; title: string; text: string; onRetry?: () => void }> = ({ icon, title, text, onRetry }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-6">
    <div className="flex flex-col items-center gap-5 text-center max-w-md">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
        {icon}
      </div>
      <h1 className="text-3xl font-serif text-slate-900 dark:text-white">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400">{text}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"
        >
          Tentar novamente
        </button>
      )}
    </div>
  </div>
);

export const MainLayout: React.FC = () => {
  const { events, settings, isBackendDown } = useData();
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  // Role check so administrators can still browse the site during maintenance
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip');
  const location = useLocation();
  const navigate = useNavigate();

  // Derive currentPage from the pathname for Navbar active state
  const currentPage = deriveCurrentPage(location.pathname);

  // UI State
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'USER' | 'ADMIN'>('USER');
  const [showAI, setShowAI] = useState<boolean>(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);
  const [showAgenda, setShowAgenda] = useState<boolean>(false);
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; subject?: string }>({ isOpen: false });

  // Opening without a query must clear any stale pending question,
  // otherwise a previous hero-search query would replay on plain opens.
  const openAI = (query?: string) => {
    const trimmed = query?.trim();
    setAiInitialQuery(trimmed ? trimmed : undefined);
    setShowAI(true);
  };

  const handleOpenLogin = (mode: 'USER' | 'ADMIN') => {
    setLoginMode(mode);
    setShowLogin(true);
  };

  const handleLoginSuccess = (role: 'USER' | 'ADMIN') => {
    if (role === 'ADMIN') navigate('/admin');
    else navigate('/member');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const openContact = (subject: string = 'Geral') => setContactModal({ isOpen: true, subject });

  // Determine if footer should be hidden
  const hideFooter = location.pathname.startsWith('/blog/') || location.pathname === '/member';

  if (isBackendDown) {
    return (
      <ServiceScreen
        icon={<WifiOff size={28} />}
        title="Serviço indisponível"
        text="Não foi possível ligar ao servidor. Verifique a sua ligação à internet e tente novamente dentro de momentos."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (settings.maintenanceMode && me?.role !== 'admin') {
    return (
      <ServiceScreen
        icon={<Wrench size={28} />}
        title="Portal em manutenção"
        text="Estamos a fazer melhorias no portal. Voltamos dentro de momentos — obrigado pela paciência."
      />
    );
  }

  return (
    <ToastProvider>
      <div className="font-sans text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-dark-bg min-h-screen flex flex-col selection:bg-brand-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Saltar para o conteúdo
        </a>
        <ScrollToTop />

        <Navbar
          currentPage={currentPage}
          onNavigate={(page: string) => navigate(pageToPath(page))}
          onMemberLogin={() => handleOpenLogin('USER')}
          onOpenAgenda={() => setShowAgenda(true)}
          onAdminLogin={() => handleOpenLogin('ADMIN')}
        />

        <main id="main-content" className="flex-grow">
          <Outlet context={{ onAskAI: openAI, openContact, handleLogout }} />
        </main>

        {/* Floating AI Action Button */}
        {!showAI && settings.enableChatbot && (
          <button
            data-chatbot-trigger
            onClick={() => openAI()}
            aria-label={`Abrir o assistente ${settings.siteName}`}
            className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all group animate-fade-in-up border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <MessageCircle size={32} className="text-white" />
            <div className="absolute right-full mr-4 bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 px-4 py-2 rounded-xl text-xs text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
              Como posso ajudar?
            </div>
          </button>
        )}

        {/* Global Modals */}
        <AIModal
          isOpen={showAI}
          onClose={() => setShowAI(false)}
          initialQuery={aiInitialQuery}
          onInitialQueryConsumed={() => setAiInitialQuery(undefined)}
        />
        <AgendaModal
          isOpen={showAgenda}
          onClose={() => setShowAgenda(false)}
          events={events}
          onEventClick={() => {
            setShowAgenda(false);
            navigate('/events');
          }}
        />
        <ContactModal
          isOpen={contactModal.isOpen}
          onClose={() => setContactModal({ isOpen: false })}
          initialSubject={contactModal.subject}
        />
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          mode={loginMode}
          onLogin={handleLoginSuccess}
        />

        {/* Footer is hidden on certain views */}
        {!hideFooter && (
          <Footer
            onContact={() => openContact('Geral')}
            onNavigate={(page: string) => navigate(pageToPath(page))}
            onAdminLogin={() => handleOpenLogin('ADMIN')}
          />
        )}
      </div>
    </ToastProvider>
  );
};

/**
 * Maps a URL pathname to the legacy page id used by Navbar for active state.
 */
function deriveCurrentPage(pathname: string): string {
  if (pathname === '/') return PAGES.HOME;
  if (pathname === '/about') return PAGES.ABOUT;
  if (pathname === '/history') return 'history';
  if (pathname === '/team') return 'team';
  if (pathname === '/events') return PAGES.EVENTS;
  if (pathname === '/blog') return PAGES.BLOG;
  if (pathname.startsWith('/blog/')) return PAGES.BLOG;
  if (pathname === '/gallery') return PAGES.GALLERY;
  if (pathname === '/member') return PAGES.MEMBER;
  if (pathname === '/admin') return PAGES.ADMIN;
  return PAGES.HOME;
}

/**
 * Maps legacy page ids (used by Navbar/Footer) to URL paths.
 */
function pageToPath(page: string): string {
  switch (page) {
    case PAGES.HOME: return '/';
    case PAGES.ABOUT: return '/about';
    case 'history': return '/history';
    case 'team': return '/team';
    case PAGES.EVENTS: return '/events';
    case PAGES.BLOG: return '/blog';
    case PAGES.GALLERY: return '/gallery';
    case PAGES.MEMBER: return '/member';
    case PAGES.ADMIN: return '/admin';
    default: return '/';
  }
}
