
/**
 * History Page
 * 
 * Displays the chronological evolution of the organization.
 * Features a vertical timeline layout with alternating content placement.
 */

import React, { useState } from 'react';
import { Award, Scroll } from 'lucide-react';
import { Lightbox } from '../components/ui/Lightbox';
import { useData } from '../context/DataContext';

// Paragraphs come from settings.historyIntro; both real blank lines (admin
// textarea) and a literal \n\n (env files) separate them
const splitParagraphs = (text?: string) =>
  (text ?? "").split(/\r?\n\s*\r?\n|\\n\\n/).map((p) => p.trim()).filter(Boolean);

export const HistoryPage: React.FC = () => {
  const { milestones: dbMilestones, members, settings } = useData();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Backoffice-managed timeline (tab História) and founders (Membros, grupo "founder")
  const milestones = dbMilestones.map(m => ({ year: m.year, title: m.title, desc: m.description, image: m.imageUrl || "/placeholder.jpg" }));
  const founders = members
    .filter(m => m.group === "founder")
    .sort((a, b) => (a.order || 99) - (b.order || 99))
    .map(m => m.name);
  const introParagraphs = splitParagraphs(settings.historyIntro);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg overflow-x-hidden">
      <title>{`História & Tradição — ${settings.siteName}`}</title>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro Narrative */}
        <div className="text-center mb-24 animate-fade-in-up">
           <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.3em] text-xs font-bold border border-brand-500/30 px-4 py-1 rounded-full">O Nosso Legado</span>
           <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mt-6 mb-12">História & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-400 to-purple-500 dark:to-purple-300">Tradição</span></h1>

           <div className="relative max-w-4xl mx-auto text-left bg-white dark:bg-dark-surface/50 p-8 md:p-12 rounded-3xl border border-slate-900/10 dark:border-white/10 backdrop-blur-md shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 opacity-50"></div>
             
             <div className="space-y-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 font-light leading-relaxed">
               {introParagraphs.map((paragraph, i) => (
                 <React.Fragment key={i}>
                   <p>{paragraph}</p>
                   {i === 1 && settings.historyQuote && (
                     <div className="pl-6 border-l-4 border-brand-500 italic text-slate-500 dark:text-slate-400 my-8 py-2 bg-slate-900/5 dark:bg-white/5 rounded-r-xl">
                       {`"${settings.historyQuote}"`}
                     </div>
                   )}
                 </React.Fragment>
               ))}
               {introParagraphs.length === 0 && (
                 <p>{settings.aboutMission}</p>
               )}
             </div>
           </div>
        </div>

        {/* Timeline Visualization */}
        <div className="relative py-12">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent md:-ml-px"></div>

          <div className="space-y-24">
            {milestones.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">A cronologia será publicada em breve.</p>
            )}
            {milestones.map((item, idx) => (
              <div key={idx} className={`relative flex flex-col md:flex-row gap-8 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''} group`}>
                
                {/* Center Dot */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full border-4 border-slate-50 dark:border-dark-bg bg-brand-500 shadow-[0_0_20px_#df3d32] transform -translate-x-1/2 z-10 flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>

                {/* Content Side */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                   <div className="inline-block">
                      <span className="text-6xl md:text-8xl font-serif font-bold text-slate-900/5 dark:text-white/5 absolute -top-10 transition-colors duration-500 group-hover:text-brand-500/10 select-none z-0">
                        {item.year}
                      </span>
                      <h3 className="relative z-10 text-3xl font-serif text-slate-900 dark:text-white mb-4 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{item.title}</h3>
                   </div>
                   <div className={`relative z-10 bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 p-6 rounded-2xl shadow-xl hover:border-brand-500/30 transition-all duration-300 ${idx % 2 === 0 ? 'md:rounded-tr-none' : 'md:rounded-tl-none'}`}>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                   </div>
                </div>

                {/* Image Side */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${idx % 2 === 0 ? 'md:pl-16' : 'md:pr-16'}`}>
                   <div
                      className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden border border-slate-900/10 dark:border-white/10 group-hover:border-brand-500/50 group-hover:shadow-[0_0_30px_rgba(223,61,50,0.2)] transition-all duration-500 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      role="button"
                      tabIndex={0}
                      aria-label={`Ampliar imagem: ${item.title} (${item.year})`}
                      onClick={() => setLightboxIndex(idx)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxIndex(idx); } }}
                   >
                      <div className="absolute inset-0 bg-brand-900/20 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity"></div>
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60"></div>
                      
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white font-mono px-3 py-1 rounded-full border border-white/20 text-sm">
                         {item.year}
                      </div>
                   </div>
                </div>

              </div>
            ))}
          </div>
        </div>
        
        {/* Founders Grid */}
        {founders.length > 0 && (
        <div className="mt-40 relative">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/5 to-transparent pointer-events-none"></div>
           
           <div className="relative z-10 text-center mb-16">
               <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                  <Award size={32} />
               </div>
               <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-4">{settings.foundedYear ? `Os Visionários de ${settings.foundedYear}` : "Os Sócios Fundadores"}</h2>
               <div className="w-24 h-1 bg-amber-500/50 mx-auto rounded-full mb-6"></div>
               <p className="text-amber-700/70 dark:text-amber-200/60 max-w-2xl mx-auto text-lg font-light italic">
                 "Honramos a memória e a audácia daqueles que, com poucos recursos mas muita vontade, lançaram as sementes do que somos hoje."
               </p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {founders.map((founder, i) => (
                 <div key={i} className="group relative bg-white dark:bg-black/40 border border-slate-900/5 dark:border-white/5 hover:border-amber-500/40 rounded-xl p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.2)] cursor-default overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full border border-amber-500/20 bg-amber-900/10 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:text-amber-500 dark:group-hover:text-amber-300 group-hover:border-amber-400/50 transition-colors">
                            <span className="font-serif font-bold text-xl">{founder.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                             <div className="text-xs text-amber-700/70 dark:text-amber-500/60 uppercase tracking-widest font-mono mb-0.5">Sócio Fundador</div>
                             <h3 className="text-slate-800 dark:text-slate-200 font-serif font-medium leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{founder}</h3>
                        </div>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-16 flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm">
                 <Scroll size={16} className="text-amber-500"/>
                 <span>{settings.foundersNote}</span>
              </div>
           </div>
        </div>
        )}

      </div>

      <Lightbox
        images={milestones.map((m) => ({ src: m.image, alt: m.title, caption: `${m.year} — ${m.title}` }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
};
