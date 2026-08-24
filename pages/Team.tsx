
/**
 * Team Page
 *
 * Displays the organizational structure of the association.
 * Allows filtering members by their respective organs (Direction, General Assembly, Fiscal Council).
 */

import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import type { Member } from '../types';
import { Badge } from '../components/ui/UIComponents';
import { Lightbox } from '../components/ui/Lightbox';

const memberPhotoUrl = (member: Member) =>
  member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=0f172a&color=df3d32&bold=true`;

// Component for rendering individual member cards
const MemberCard: React.FC<{ member: Member, isFeatured?: boolean, onOpenPhoto: () => void }> = ({ member, isFeatured, onOpenPhoto }) => (
  <div className={`relative group transition-transform duration-300 hover:-translate-y-1 ${isFeatured ? 'md:col-span-1 md:row-span-1' : ''}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
    <div className={`relative bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl overflow-hidden hover:border-slate-900/20 dark:hover:border-white/20 transition-all duration-300 h-full flex flex-col ${isFeatured ? 'shadow-[0_0_30px_rgba(223,61,50,0.2)]' : ''}`}>

      <div
        className={`relative overflow-hidden cursor-zoom-in ${isFeatured ? 'h-96' : 'h-80'}`}
        role="button"
        tabIndex={0}
        aria-label={`Ampliar fotografia de ${member.name}`}
        onClick={onOpenPhoto}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenPhoto(); } }}
      >
        <div className="absolute inset-0 bg-brand-900/20 z-10 mix-blend-overlay"></div>
        <img
          src={memberPhotoUrl(member)}
          alt={member.name}
          className="w-full h-full object-cover object-[50%_25%] grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=400&background=0f172a&color=df3d32&bold=true`; }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-dark-surface via-dark-surface/80 to-transparent opacity-95"></div>

        <div className="absolute bottom-6 left-6 z-20">
          {isFeatured && <Badge className="mb-2 bg-brand-600 text-white border-none shadow-lg ring-1 ring-white/30 text-[10px] tracking-widest">LIDERANÇA</Badge>}
          <div className="w-10 h-1 bg-brand-500 mb-2 w-0 group-hover:w-10 transition-all duration-500"></div>
          <h3 className={`font-serif font-medium text-white mb-1 leading-tight ${isFeatured ? 'text-3xl' : 'text-xl'}`}>{member.name}</h3>
          <p className="text-xs text-brand-300 font-mono uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{member.role}</p>
        </div>
      </div>
    </div>
  </div>
);

// Canonical organ order; extra groups found in data are appended alphabetically
const KNOWN_ORGANS = ['Direção', 'Assembleia Geral', 'Conselho Fiscal'];

export const TeamPage: React.FC = () => {
  const { members, settings } = useData();
  const [activeTab, setActiveTab] = useState<string>('Direção');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const tabOptions = useMemo(() => {
    const groups = Array.from(new Set(members.map(m => m.group))).filter(g => g && g !== 'founder');
    if (groups.length === 0) return KNOWN_ORGANS;
    const known = KNOWN_ORGANS.filter(o => groups.includes(o));
    const extras = groups.filter(g => !KNOWN_ORGANS.includes(g)).sort((a, b) => a.localeCompare(b, 'pt'));
    return [...known, ...extras];
  }, [members]);

  // Sort members by 'order' property to ensure hierarchy (President first)
  const filteredMembers = members
    .filter(m => m.group === activeTab)
    .sort((a, b) => (a.order || 99) - (b.order || 99));

  const lightboxImages = filteredMembers.map((member) => ({
    src: memberPhotoUrl(member),
    alt: member.name,
    caption: `${member.name} — ${member.role} (${activeTab})`,
  }));

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setLightboxIndex(null);
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg">
      <title>{`Corpos Sociais — ${settings.siteName}`}</title>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] text-xs font-bold border border-brand-500/30 px-4 py-1 rounded-full">Estrutura Orgânica</span>
          <h1 className="text-6xl font-serif text-slate-900 dark:text-white mt-6 mb-6">Corpos Sociais</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
            Conheça a equipa dedicada que lidera os destinos da associação. Mandato {settings.currentMandate || "Ativo"}.
          </p>
        </div>

        {/* Navigation Tabs for Organizational Organs */}
        <div className="flex justify-center mb-16 animate-fade-in-up [animation-delay:0.1s]">
          <div className="flex flex-wrap justify-center gap-2 bg-slate-900/5 dark:bg-white/5 p-1 rounded-full border border-slate-900/10 dark:border-white/10">
            {tabOptions.map((tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                    ${activeTab === tab
                    ? 'bg-brand-600 text-white shadow-lg scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
                  }
                  `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up min-h-[500px] [animation-delay:0.2s]">
          {filteredMembers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 place-items-center">
              {filteredMembers.map((member, index) => {
                // Highlight the leader (order 1)
                const isLeader = member.order === 1;
                return (
                  <div key={member.id} className={`w-full ${isLeader ? 'md:col-start-2 md:-mt-8 mb-8 md:mb-0 z-10' : ''}`}>
                    <MemberCard member={member} isFeatured={isLeader} onOpenPhoto={() => setLightboxIndex(index)} />
                  </div>
                );
              })}
            </div>
          )}

          {filteredMembers.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              Nenhum membro registado neste órgão.
            </div>
          )}
        </div>

      </div>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
};
