
/**
 * Footer Component
 *
 * Displays the website footer with navigation links, contact details, and administrative access.
 * Contact information is sourced from environment configuration.
 */

import React from 'react';
import { MapPin, Mail, Phone, Facebook, Instagram, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useData } from '../context/DataContext';

interface FooterProps {
  onContact?: () => void;
  onAdminLogin?: () => void;
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onContact, onAdminLogin, onNavigate }) => {
  const { settings } = useData();

  const addressParts = settings.address ? settings.address.split(',') : [];
  const addressLine1 = addressParts.slice(0, 2).join(',');
  const addressLine2 = addressParts.slice(2).join(',').trim();

  return (
    <footer className="bg-slate-100 dark:bg-black text-slate-600 dark:text-slate-300 py-20 border-t border-slate-900/10 dark:border-white/10 relative overflow-hidden">
      {/* Background Gradient Fade */}
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-brand-500/5 dark:from-brand-900/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6 text-center md:text-left">
            <h2 className="text-6xl md:text-8xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter opacity-20 hover:opacity-100 transition-opacity duration-700 cursor-default">{settings.siteName}</h2>
            <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400 max-w-md font-light mx-auto md:mx-0">
              {settings.aboutMission}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3">
              {settings.facebookPageId && (
                <a
                  href={`https://www.facebook.com/${settings.facebookPageId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Facebook da ${settings.siteName}`}
                  className="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Facebook size={16} />
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram da ${settings.siteName}`}
                  className="w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-brand-500/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Instagram size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 md:col-start-7 space-y-6 text-center md:text-left">
            <h3 className="text-slate-900 dark:text-white font-mono uppercase text-xs tracking-[0.2em] text-brand-600 dark:text-brand-400">Explorar</h3>
            <div className="flex justify-center md:justify-start">
              <ul className="inline-block text-left space-y-4 text-sm">
                <li><button onClick={() => onNavigate?.('blog')} className="block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:translate-x-2 transition-all flex items-center group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Notícias <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100"/></button></li>
                <li><button onClick={() => onNavigate?.('events')} className="block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:translate-x-2 transition-all flex items-center group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Agenda Cultural <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100"/></button></li>
                <li><button onClick={() => onNavigate?.('about')} className="block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:translate-x-2 transition-all flex items-center group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Sobre Nós <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100"/></button></li>
                <li><button onClick={onContact} className="block text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:translate-x-2 transition-all flex items-center group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Contacte-nos <ArrowUpRight size={12} className="ml-1 opacity-0 group-hover:opacity-100"/></button></li>
              </ul>
            </div>
          </div>

          {/* Contact Information - sourced from environment config */}
          <div className="md:col-span-3 space-y-6 text-center md:text-left">
            <h3 className="text-slate-900 dark:text-white font-mono uppercase text-xs tracking-[0.2em] text-brand-600 dark:text-brand-400">Contactos</h3>
            <div className="flex justify-center md:justify-start">
              <ul className="inline-block text-left space-y-4 text-sm">
                {settings.address && (
                  <li className="flex items-start space-x-3 group">
                    <MapPin size={18} className="text-brand-500 shrink-0 group-hover:text-slate-900 dark:group-hover:text-white" />
                    <a href={settings.mapsUrl || '#'} target="_blank" rel="noopener noreferrer" className="group-hover:text-slate-900 dark:group-hover:text-white">
                      {addressLine1}{addressLine2 && <><br/>{addressLine2}</>}
                    </a>
                  </li>
                )}
                {settings.phone && (
                  <li className="flex items-center space-x-3 group">
                    <Phone size={18} className="text-brand-500 shrink-0 group-hover:text-slate-900 dark:group-hover:text-white" />
                    <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="group-hover:text-slate-900 dark:group-hover:text-white">{settings.phone}</a>
                  </li>
                )}
                {settings.contactEmail && (
                  <li className="flex items-center space-x-3 group">
                    <Mail size={18} className="text-brand-500 shrink-0 group-hover:text-slate-900 dark:group-hover:text-white" />
                    <a href={`mailto:${settings.contactEmail}`} className="group-hover:text-slate-900 dark:group-hover:text-white">{settings.contactEmail}</a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-600 font-mono">
          <div>&copy; {new Date().getFullYear()} {settings.siteName}. Todos os direitos reservados.</div>
          <div className="flex items-center space-x-6">
            <button onClick={onAdminLogin} disabled={!onAdminLogin} className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 hover:bg-amber-900/10 hover:border-amber-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
               <ShieldCheck size={12} className="text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-500" />
               <span className="text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 font-semibold">Acesso Reservado</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
