
import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Target, Shield, Users, MapPin, Navigation, Mail, Phone, Clock, Send, CheckCircle2, Sparkles, LocateFixed, Search, RotateCw, ExternalLink, Volume2, Loader2, Heart, Trophy, Handshake, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Badge, cn } from '../components/ui/UIComponents';
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ConvexError } from 'convex/values';
import { playBase64Audio } from '../utils/audio';
import { useData } from '../context/DataContext';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  onContact: (subject: string) => void;
}

// Icon names stored in settings.aboutPillars resolve to Lucide components here;
// unknown names degrade to Target instead of breaking the render.
const PILLAR_ICONS: Record<string, LucideIcon> = {
  Target, Shield, Users, Heart, Trophy, Handshake, Star, Sparkles,
};

// Friendly copy for the stable ERR_* tokens thrown by convex/ai.ts actions.
// Unknown/missing tokens fall back to a generic retry message.
const GEO_ERROR_MESSAGES: Record<string, string> = {
  ERR_QUOTA: 'O assistente atingiu o limite diário de utilização. Volta a tentar mais tarde — entretanto podes explorar os eventos e novidades.',
  ERR_RATE_LIMIT: 'Muitos pedidos seguidos. Aguarda um momento e tenta novamente.',
  ERR_UNAVAILABLE: 'O assistente está temporariamente indisponível.',
};

const getGeoErrorMessage = (error: unknown): string => {
  let token = '';
  if (error instanceof ConvexError) {
    token = String(error.data);
  } else if (error instanceof Error) {
    token = error.message.match(/ERR_[A-Z_]+/)?.[0] ?? '';
  }
  return GEO_ERROR_MESSAGES[token] ?? 'Não foi possível obter resposta. Tenta novamente.';
};

// Internal component to handle Location logic using context
const LocationCommand: React.FC = () => {
  const { settings } = useData();
  const geoQueryAction = useAction(api.ai.geoQuery);
  const ttsAction = useAction(api.ai.tts);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const LOCATION = {
    lat: parseFloat(settings.latitude) || 39.515469,
    lon: parseFloat(settings.longitude) || -8.586681
  };
  const ADDRESS = settings.address || "Largo do Pavilhão, N° 1, Vale Alto, 2395-301 Minde";

  const askLocalAI = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setAiResponse(null);
    setAiError(false);
    try {
      const result = await geoQueryAction({ query });
      setAiResponse(result.text);
    } catch (e) {
      // Log once and never rethrow — the widget degrades gracefully instead
      // of leaving an unhandled rejection in the console.
      console.warn("Geo AI error:", e instanceof ConvexError ? e.data : e);
      setAiResponse(getGeoErrorMessage(e));
      setAiError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSpeak = async () => {
    if (!aiResponse) return;
    setIsSpeaking(true);
    try {
      const result = await ttsAction({ text: aiResponse });
      await playBase64Audio(result.audioBase64);
    } catch (e) {
      console.error("TTS Error:", e);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-slate-900/10 bg-white shadow-[0_32px_64px_-16px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-[#02040a] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-fade-in-up group/module">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">

        {/* Information Console */}
        <div className="lg:col-span-5 p-10 md:p-16 flex flex-col justify-between border-r border-slate-900/5 dark:border-white/5 bg-gradient-to-b from-slate-100/60 dark:from-dark-surface/50 to-transparent relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-3 mb-10">
               <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_10px_#df3d32]"></div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Vale Alto · Minde</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-slate-900 dark:text-white mb-10 leading-[1.05] tracking-tight">A Nossa <br/><span className="text-brand-600 dark:text-brand-400 italic">Casa</span></h2>

            <div className="space-y-8 mb-14">
              <div className="flex gap-6 group/item">
                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900/[0.03] border border-slate-900/10 text-brand-600 dark:bg-white/[0.03] dark:border-white/10 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover/item:border-brand-500/50 group-hover/item:bg-brand-500/5 transition-all shadow-xl">
                  <MapPin size={26} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Morada</span>
                  <p className="text-slate-900 dark:text-white text-lg font-medium leading-tight">{ADDRESS}</p>
                </div>
              </div>

              <div className="flex gap-6 group/item">
                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900/[0.03] border border-slate-900/10 text-brand-600 dark:bg-white/[0.03] dark:border-white/10 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover/item:border-brand-500/50 group-hover/item:bg-brand-500/5 transition-all shadow-xl">
                  <Clock size={26} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Horário</span>
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span> {settings.openingHours}
                  </p>
                </div>
              </div>
            </div>

            {/* Geo-Assistant Widget */}
            <div className="bg-slate-900/[0.03] dark:bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-7 border border-slate-900/10 dark:border-white/10 shadow-2xl relative overflow-hidden transition-all hover:border-brand-500/30">
               <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"></div>
               <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Como Chegar · Assistente</span>
                  </div>
                  {aiResponse && (
                    <button
                      onClick={handleSpeak}
                      aria-label="Ouvir resposta"
                      className={cn("p-2 rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-brand-600 dark:text-brand-400 transition-all", isSpeaking && "animate-pulse text-slate-900 dark:text-white bg-brand-500/20")}
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
               </div>
               <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Como chegar do Porto?"
                    aria-label="Pesquisar localização"
                    className="w-full bg-white dark:bg-black/40 border border-slate-900/10 dark:border-white/5 rounded-xl py-4 pl-5 pr-12 text-sm text-slate-900 dark:text-white focus:border-brand-500/40 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askLocalAI()}
                  />
                  <button
                    onClick={askLocalAI}
                    disabled={isSearching}
                    aria-label="Pesquisar"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-600 hover:text-slate-900 dark:text-brand-400 dark:hover:text-white transition-all disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={18}/> : <Search size={18}/>}
                  </button>
               </div>
               {aiResponse && (
                 aiError ? (
                   <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs p-3 rounded-xl animate-fade-in-up mt-2">
                      <p>{aiResponse}</p>
                      <p className="mt-1 text-amber-700/70 dark:text-amber-300/70">Podes sempre usar o botão Obter Direções ao lado.</p>
                   </div>
                 ) : (
                   <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed animate-fade-in-up italic mt-2">
                      {aiResponse}
                   </div>
                 )
               )}
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-slate-900/5 dark:border-white/5 flex items-center justify-between">
             <button
                onClick={() => { navigator.clipboard.writeText(`${LOCATION.lat}, ${LOCATION.lon}`); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                className="text-[10px] font-mono text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 group/coords"
             >
                {copied ? <CheckCircle2 size={12} className="text-green-500"/> : <LocateFixed size={12} className="group-hover/coords:scale-125 transition-transform"/>}
                {LOCATION.lat}, {LOCATION.lon}
             </button>
             <span className="text-[10px] font-mono text-slate-400 dark:text-slate-700 tracking-tighter">Alcanena · Santarém</span>
          </div>
        </div>

        {/* Visual Command (The Launch Area) */}
        <div className="lg:col-span-7 relative bg-slate-100 dark:bg-[#010205] flex items-center justify-center p-12 overflow-hidden">
           {/* High-aesthetic Satellite Context */}
           <div className="absolute inset-0 z-0">
             <img
               src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop"
               alt="Satellite Context"
               className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.15] group-hover/module:scale-105 transition-transform duration-[5s] grayscale brightness-100 contrast-100 dark:brightness-50 dark:contrast-125"
             />
             <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
             <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#02040a] via-transparent to-transparent"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#f1f5f9_90%)] dark:bg-[radial-gradient(circle_at_center,transparent_20%,#010205_90%)]"></div>
           </div>

           {/* Core Navigation Hub */}
           <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-12">
                 {/* Double Ring Animation */}
                 <div className="absolute inset-0 bg-brand-500 blur-[80px] opacity-20 animate-pulse"></div>
                 <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border border-slate-900/10 dark:border-white/5 flex items-center justify-center backdrop-blur-3xl shadow-[0_0_50px_rgba(15,23,42,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <div className="absolute inset-0 border border-brand-500/20 rounded-full animate-ping [animation-duration:3s]"></div>
                    <div className="absolute inset-4 border-2 border-dashed border-brand-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <MapPin size={64} className="text-brand-500 drop-shadow-[0_0_30px_rgba(223,61,50,0.8)]" fill="currentColor" />
                 </div>
              </div>

              <div className="text-center mb-12">
                 <h3 className="text-slate-900 dark:text-white text-3xl font-serif mb-2 tracking-tight">Pavilhão de Vale Alto</h3>
                 <p className="text-brand-600/70 dark:text-brand-400/60 text-xs font-bold uppercase tracking-[0.4em]">Largo do Pavilhão · Minde</p>
              </div>

              <a
                href={settings.mapsUrl || "https://maps.app.goo.gl/zzqN8LJMgkFKd2mn9"}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center gap-5 bg-brand-600 hover:bg-brand-500 text-white px-12 py-6 rounded-2xl font-bold shadow-[0_20px_50px_rgba(223,61,50,0.2)] transition-all hover:scale-105 active:scale-95"
              >
                <Navigation size={26} className="group-hover/btn:rotate-45 transition-transform duration-500" />
                <span className="text-lg tracking-widest uppercase">Obter Direções</span>
                <ExternalLink size={18} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
              </a>
           </div>

           {/* Telemetry Display */}
           <div className="absolute top-10 right-10 text-right hidden lg:block font-mono">
              <div className="text-[10px] text-slate-700 uppercase tracking-widest mb-1">Estado do Sinal</div>
              <div className="text-green-500 text-xs font-bold flex items-center justify-end gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> SISTEMA_ONLINE
              </div>
           </div>

           <div className="absolute bottom-10 right-10 text-right hidden lg:block font-mono">
              <div className="text-[10px] text-slate-400 dark:text-slate-700 uppercase tracking-widest mb-1">Código Postal</div>
              <div className="text-slate-700 dark:text-white text-xs font-bold">Vale Alto · 2395-301 Minde</div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ContactForm: React.FC = () => {
  const { settings } = useData();
  const [formState, setFormState] = useState({ name: '', email: '', subject: 'Geral', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const createContact = useMutation(api.contact.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createContact({
        name: formState.name.trim(),
        email: formState.email.trim(),
        subject: formState.subject.trim(),
        message: formState.message.trim(),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar a mensagem. Tente novamente.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-[3.5rem] p-10 md:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group/form">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
           <Badge className="mb-8 border-brand-500/20">Canais de Atendimento</Badge>
           <h2 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mb-10 leading-[1] tracking-tighter">Vamos criar o <span className="text-brand-600 dark:text-brand-400 italic">próximo</span> capítulo?</h2>
           <p className="text-slate-500 dark:text-slate-400 text-xl mb-14 font-light leading-relaxed max-w-md">
             Seja para uma proposta de parceria, inscrição como sócio ou reserva de espaço, a nossa equipa está disponível para o ouvir.
           </p>

           <div className="space-y-6">
             <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/5 dark:border-white/5 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.05] hover:border-brand-500/30 transition-all group/info">
               <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/20 transition-all group-hover/info:bg-brand-500 group-hover/info:text-white">
                 <Mail size={26}/>
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Email Institucional</div>
                  <div className="text-slate-900 dark:text-white text-lg font-medium">{settings.contactEmail}</div>
               </div>
             </div>
             {settings.phone && (
             <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/5 dark:border-white/5 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.05] hover:border-brand-500/30 transition-all group/info">
               <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/20 transition-all group-hover/info:bg-brand-500 group-hover/info:text-white">
                 <Phone size={26}/>
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Linha Direta</div>
                  <div className="text-slate-900 dark:text-white text-lg font-medium">{settings.phone}</div>
               </div>
             </div>
             )}
           </div>
        </div>

        <div className="relative">
          {success ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-8 border border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={48}/>
              </div>
              <h3 className="text-4xl font-serif text-slate-900 dark:text-white mb-4 tracking-tight">Comunicação Efetuada</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-light">A sua mensagem foi encriptada e enviada.</p>
              <Button variant="outline" className="mt-10 rounded-2xl px-12 h-14" onClick={() => setSuccess(false)}>Nova Mensagem</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/5 dark:bg-black/40 p-10 md:p-12 rounded-[3rem] border border-slate-900/10 dark:border-white/10 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Sua Identidade</label>
                <input required aria-label="Sua Identidade" value={formState.name} onChange={e=>setFormState({...formState, name: e.target.value})} className="w-full bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/5 dark:border-white/5 rounded-2xl p-5 text-slate-900 dark:text-white outline-none focus:border-brand-500/50 focus:bg-slate-900/10 dark:focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner" placeholder="Como devemos tratá-lo?"/>
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Email de Contacto</label>
                <input required type="email" aria-label="Email de Contacto" value={formState.email} onChange={e=>setFormState({...formState, email: e.target.value})} className="w-full bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/5 dark:border-white/5 rounded-2xl p-5 text-slate-900 dark:text-white outline-none focus:border-brand-500/50 focus:bg-slate-900/10 dark:focus:bg-white/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner" placeholder="exemplo@servidor.com"/>
              </div>
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Mensagem</label>
                <textarea required rows={4} aria-label="Mensagem" value={formState.message} onChange={e=>setFormState({...formState, message: e.target.value})} className="w-full bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/5 dark:border-white/5 rounded-2xl p-5 text-slate-900 dark:text-white outline-none focus:border-brand-500/50 focus:bg-slate-900/10 dark:focus:bg-white/10 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner" placeholder="O que tem em mente?"/>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full py-8 text-xl rounded-2xl h-16 shadow-[0_20px_40px_rgba(223,61,50,0.3)] bg-brand-600 hover:bg-brand-500" disabled={isSubmitting}>
                {isSubmitting ? <RotateCw className="animate-spin" /> : <><Send size={22} className="mr-3" /> Enviar Mensagem</>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onContact }) => {
  const { settings } = useData();
  const pillars = settings.aboutPillars ?? [];
  return (
    <div className="bg-slate-50 dark:bg-dark-bg min-h-screen">
      <title>{`Sobre Nós — ${settings.siteName}`}</title>
      <div className="pt-40 pb-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto space-y-48">

        {/* Modern Hero Section */}
        <div className="text-center animate-fade-in-up max-w-5xl mx-auto">
          <Badge className="mb-8 border-brand-500/30 px-6 py-2">{`Desde 1982 ao serviço de Vale Alto`}</Badge>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-slate-900 dark:text-white mb-10 leading-[0.95] tracking-tighter">
            A apoiar a <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-300 via-brand-500 dark:via-brand-300 to-purple-500 dark:to-purple-300 font-bold">Comunidade</span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-500 dark:text-slate-400 font-light leading-relaxed mb-16 max-w-4xl mx-auto">
            {settings.aboutMission}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
             <Button size="lg" className="rounded-2xl px-14 h-16 text-lg" onClick={() => onNavigate?.('history')}>
               Ver Legado
             </Button>
             <Button variant="glass" size="lg" className="rounded-2xl px-14 h-16 text-lg" onClick={() => onContact?.('Geral')}>
               Contactar Direção
             </Button>
          </div>
        </div>

        {/* Location Command Section */}
        <div className="space-y-16">
           <div className="max-w-3xl">
              <div className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-4 flex items-center gap-3">
                 <div className="w-12 h-px bg-brand-500"></div> Onde Estamos
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-8 tracking-tight leading-none">O Nosso Pavilhão</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-light leading-relaxed">No coração de Vale Alto, o pavilhão gimnodesportivo com 1170 m² dispõe de recinto desportivo, bancadas, cinco balneários, cozinha, bar e espaços de convívio.</p>
           </div>
           <LocationCommand />
        </div>

        {/* Pillars Grid (editable via Admin > Definições > Página Sobre) */}
        {pillars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {pillars.map((item, i) => {
              const Icon = PILLAR_ICONS[item.icon] ?? Target;
              return (
                <div key={i} className="bg-white dark:bg-dark-surface border border-slate-900/5 dark:border-white/5 p-14 rounded-[3.5rem] hover:border-brand-500/30 transition-all duration-700 group text-center relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-20 h-20 bg-brand-500/5 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-10 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-xl border border-slate-900/5 dark:border-white/5">
                    <Icon size={36} />
                  </div>
                  <h3 className="text-3xl font-serif text-slate-900 dark:text-white mb-6 tracking-tight leading-none">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-light">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Final Contact Section */}
        <div className="pb-32">
          <ContactForm />
        </div>

      </div>
    </div>
  );
};

/**
 * Router wrapper for AboutPage.
 * Bridges React Router navigation to the legacy prop-based interface.
 */
export const AboutPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { openContact } = useOutletContext<{ openContact: (subject: string) => void }>();

  return (
    <AboutPage
      onNavigate={(page: string) => {
        const pathMap: Record<string, string> = {
          home: '/', about: '/about', history: '/history', team: '/team',
          events: '/events', blog: '/blog', gallery: '/gallery',
        };
        navigate(pathMap[page] || '/');
      }}
      onContact={openContact}
    />
  );
};
