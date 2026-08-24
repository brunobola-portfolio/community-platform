import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Calendar, Share2, Volume2, Clock, Tag, Loader2 } from 'lucide-react';
import { Button, Badge } from '../components/ui/UIComponents';
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { sanitizeHtml } from '../utils/security';
import { playBase64Audio } from '../utils/audio';

interface PostDetailsProps {
   postId: string;
   onBack: () => void;
}

/** Estimate reading time from the article body (~200 words/min, pt average). */
const computeReadTime = (html: string): string => {
   const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
   return `${Math.max(1, Math.round(words / 200))} min`;
};

export const PostDetailsPage: React.FC<PostDetailsProps> = ({ postId, onBack }) => {
   const { posts, settings } = useData();
   const navigate = useNavigate();
   const ttsAction = useAction(api.ai.tts);
   const [isNarrating, setIsNarrating] = useState(false);
   const summary = posts.find(p => p.id === postId || p.slug === postId);
   // Full content loads on demand: the site-wide subscription only carries summaries
   const fullPost = useQuery(api.posts.getBySlug, summary?.slug ? { slug: summary.slug } : 'skip');
   const post = useMemo(() => {
      if (!summary) return undefined;
      if (!fullPost) return summary;
      return { ...summary, content: fullPost.content };
   }, [summary, fullPost]);
   const isContentLoading = Boolean(summary) && fullPost === undefined && !summary?.content;

   // Related posts (moved from JSX to top-level hook)
   const relatedPosts = useMemo(() => {
      if (!post) return [];
      return posts
         .filter(p => p.category === post.category && p.id !== post.id)
         .slice(0, 3);
   }, [post, posts]);

   const handleNarrate = async () => {
      if (!post || isNarrating) return;

      setIsNarrating(true);
      try {
         // Strip HTML and limit text length to prevent excessive API costs
         const plainText = post.content.replace(/<[^>]*>/g, '').slice(0, 2000);
         const prompt = `Lê este artigo de notícias de forma clara e profissional: Título: ${post.title}. Conteúdo: ${post.excerpt}. Texto completo: ${plainText}`;

         const result = await ttsAction({ text: prompt, voiceName: 'Puck' });
         await playBase64Audio(result.audioBase64, () => setIsNarrating(false));
      } catch (e) {
         console.error("TTS Error:", e);
         setIsNarrating(false);
      }
   };

   const handleShare = useCallback(async () => {
      if (!post) return;
      const shareData = {
         title: post.title,
         text: post.excerpt,
         url: window.location.href,
      };
      try {
         if (navigator.share) {
            await navigator.share(shareData);
         } else {
            await navigator.clipboard.writeText(window.location.href);
         }
      } catch (e) {
         // User cancelled share or clipboard failed -- fallback silently
         try {
            await navigator.clipboard.writeText(window.location.href);
         } catch {
            // Clipboard not available
         }
      }
   }, [post]);

   if (!post) return <div className="pt-40 text-center text-slate-900 dark:text-white">Notícia não encontrada.</div>;

   return (
      <div className="bg-slate-50 dark:bg-dark-bg min-h-screen pb-24 selection:bg-brand-500/30">
         <title>{`${post.title} — ${settings.siteName}`}</title>
         {/* Cinematic Hero Header */}
         <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
            <div className="absolute top-8 left-8 z-50">
               <Button variant="glass" size="sm" onClick={onBack} className="gap-2 rounded-full px-6 backdrop-blur-xl border-white/20 bg-black/20 hover:bg-black/40">
                  <ArrowLeft size={16} /> Voltar
               </Button>
            </div>

            <div className="absolute inset-0">
               <img src={post.coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop'} alt={post.title} className="w-full h-full object-cover brightness-[0.5] scale-105" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent"></div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end z-30 px-6 pb-20 md:pb-32">
               <div className="max-w-4xl mx-auto w-full">
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                     <Badge className="bg-brand-600 text-white border-none shadow-md px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {post.category}
                     </Badge>
                     <div className="flex items-center gap-2 text-slate-300 text-sm font-medium bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                        <Clock size={14} className="text-brand-400" />
                        {post.content ? computeReadTime(post.content) : post.readTime || '1 min'} de leitura
                     </div>
                     <button
                        onClick={handleNarrate}
                        disabled={isNarrating}
                        className="flex items-center gap-2 bg-brand-500/20 text-brand-700 dark:text-brand-400 px-5 py-1.5 rounded-full border border-brand-500/30 hover:bg-brand-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                     >
                        {isNarrating ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                        {isNarrating ? 'A Narrar...' : 'Ouvir Artigo'}
                     </button>
                  </div>

                  <h1 className="text-4xl md:text-7xl font-serif font-black text-white leading-[1.1] mb-8 drop-shadow-2xl">
                     {post.title}
                  </h1>

                  {/* Author Header Info */}
                  <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
                     <div className="w-14 h-14 rounded-full border-2 border-brand-500/50 p-0.5 shadow-xl">
                        <img
                           src={post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'A')}&background=DF3D32&color=fff`}
                           alt={post.author}
                           className="w-full h-full rounded-full object-cover"
                        />
                     </div>
                     <div>
                        <div className="text-white font-bold text-lg">{post.author || `Equipa ${settings.siteName}`}</div>
                        <div className="text-brand-400 text-sm font-medium">{post.authorRole || 'Associação'}</div>
                     </div>
                     <div className="ml-auto hidden md:flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar size={16} className="text-brand-500/60" />
                        {new Date(post.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Article Content */}
         <div className="max-w-4xl mx-auto px-6 relative z-30 -mt-16 md:-mt-24">
            <div className="bg-white dark:bg-[#111] border border-slate-900/10 dark:border-white/10 rounded-[2.5rem] md:rounded-[4rem] px-8 py-12 md:p-20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
               <div className="max-w-2xl mx-auto">
                  <p className="text-xl md:text-3xl text-slate-800 dark:text-slate-200 font-light leading-relaxed mb-16 italic opacity-90 border-l-4 border-brand-500 pl-8">
                     {post.excerpt}
                  </p>

                  <article className="prose prose-xl dark:prose-invert prose-headings:font-serif prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-loose prose-strong:text-slate-900 dark:prose-strong:text-white prose-a:text-brand-600 dark:prose-a:text-brand-400 hover:prose-a:text-brand-700 dark:hover:prose-a:text-brand-300 transition-all prose-img:rounded-3xl prose-blockquote:border-brand-500 prose-blockquote:bg-brand-500/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-2xl prose-blockquote:font-light">
                     {isContentLoading
                        ? <div className="flex items-center gap-3 text-slate-500 py-12"><Loader2 size={18} className="animate-spin" /> A carregar artigo…</div>
                        : <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />}
                  </article>

                  <div className="mt-20 pt-12 border-t border-slate-900/5 dark:border-white/5">
                     <div className="flex flex-wrap items-center justify-between gap-8">
                        <div className="flex flex-wrap gap-2">
                           <Badge variant="outline" className="text-slate-500 dark:text-slate-400 border-slate-900/10 dark:border-white/10 px-4 py-1 rounded-full flex items-center gap-2">
                              <Tag size={12} className="text-brand-500" /> Tags:
                           </Badge>
                           {(post.tags || [settings.siteName, 'Comunidade']).map((tag: string) => (
                              <Badge key={tag} className="bg-slate-900/5 dark:bg-white/5 hover:bg-brand-500/20 text-brand-700 dark:text-brand-400 border border-slate-900/10 dark:border-white/10 px-4 py-1 rounded-full cursor-default transition-colors">
                                 {tag}
                              </Badge>
                           ))}
                        </div>
                        <div className="flex items-center gap-4">
                           <Button
                              variant="glass"
                              className="rounded-full px-8 bg-brand-500/10 hover:bg-brand-500 text-brand-600 hover:text-white dark:text-brand-400 dark:hover:text-white border-brand-500/30 transition-all font-semibold"
                              onClick={handleShare}
                           >
                              Partilhar <Share2 size={18} className="ml-2" />
                           </Button>
                        </div>
                     </div>
                  </div>

                  {/* Author Bio Section (Mobile Friendly) */}
                  <div className="mt-16 p-8 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                     <img
                        src={post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'A')}&background=DF3D32&color=fff`}
                        alt={post.author}
                        loading="lazy"
                        className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-brand-500/20"
                     />
                     <div>
                        <h3 className="text-slate-900 dark:text-white font-serif font-bold text-xl mb-1">Escrito por {post.author || `Equipa ${settings.siteName}`}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                           Membro ativo da associação dedicado a partilhar as novidades e desenvolvimentos da nossa comunidade.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Related Posts Section */}
         {relatedPosts.length > 0 && (
            <div className="max-w-6xl mx-auto px-6 mt-32 pb-24">
               <div className="flex items-center gap-4 mb-12">
                  <div className="h-px flex-1 bg-slate-900/10 dark:bg-white/10"></div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white whitespace-nowrap px-4">
                     Recomendados para Si
                  </h2>
                  <div className="h-px flex-1 bg-slate-900/10 dark:bg-white/10"></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map(p => (
                     <div
                        key={p.id}
                        onClick={() => { window.scrollTo(0, 0); navigate(`/blog/${p.slug}`); }}
                        className="group cursor-pointer bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-3xl overflow-hidden hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] transition-all"
                     >
                        <div className="aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                           <img
                              src={p.coverUrl || 'https://images.unsplash.com/photo-1495020689067-958852a7735e?w=800&q=80'}
                              alt={p.title}
                              loading="lazy"
                              onError={(e) => {
                                 (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495020689067-958852a7735e?w=800&q=80';
                              }}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           />
                        </div>
                        <div className="p-6">
                           <Badge className="bg-brand-500 text-white border-none shadow-md mb-3 text-[10px]">{p.category}</Badge>
                           <h3 className="text-slate-900 dark:text-white font-bold line-clamp-2 mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{p.title}</h3>
                           <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{p.excerpt}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Navigation Bottom */}
         <div className="max-w-4xl mx-auto px-6 mt-12 flex justify-center pb-24">
            <Button variant="outline" className="rounded-full px-12 py-6 border-slate-900/10 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={onBack}>
               <ArrowLeft size={18} className="mr-2" /> Voltar para o Blog
            </Button>
         </div>
      </div>
   );
};

/**
 * Router wrapper for PostDetailsPage.
 * Uses useParams() to extract the post identifier from the URL
 * instead of receiving it as a prop.
 */
export const PostDetailsPageWrapper: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <div className="pt-40 text-center text-slate-900 dark:text-white">Notícia não encontrada.</div>;
  }

  return (
    <PostDetailsPage
      postId={slug}
      onBack={() => navigate('/blog')}
    />
  );
};
