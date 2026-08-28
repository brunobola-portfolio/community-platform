
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Calendar, ArrowRight, X, Sparkles, Clock } from 'lucide-react';
import { Badge, Button } from '../components/ui/UIComponents';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { categoryColorClass } from '../utils/categoryColors';

export const BlogPage: React.FC<{ onViewPost: (id: string) => void }> = ({ onViewPost }) => {
   const { posts, categories, isLoading, settings } = useData();
   const [searchTerm, setSearchTerm] = useState('');
   const [inputValue, setInputValue] = useState('');
   const [activeFilter, setActiveFilter] = useState('Todos');

   // Debounce search input (500ms)
   useEffect(() => {
      const timer = setTimeout(() => setSearchTerm(inputValue), 500);
      return () => clearTimeout(timer);
   }, [inputValue]);

   // Calculate counts for UX
   const categoryCounts = useMemo(() => categories.reduce((acc, cat) => {
      acc[cat.name] = posts.filter(p => p.category === cat.name).length;
      return acc;
   }, {} as Record<string, number>), [posts, categories]);

   // Solid category color per pill (photo overlays need solid bg, not translucent, for legibility)
   const categoryColorMap = useMemo(() => categories.reduce((acc, cat) => {
      acc[cat.name] = categoryColorClass(cat.color);
      return acc;
   }, {} as Record<string, string>), [categories]);

   // Filter logic
   const filteredPosts = useMemo(() => {
      const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const search = normalize(searchTerm);

      return posts.filter(post => {
         const title = normalize(post.title);
         const excerpt = normalize(post.excerpt);
         const matchesSearch = !searchTerm || title.includes(search) || excerpt.includes(search);
         const matchesCategory = activeFilter === 'Todos' || post.category === activeFilter;
         return matchesSearch && matchesCategory;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [posts, searchTerm, activeFilter]);

   const featuredPost = useMemo(() => {
      return posts.length > 0 ? [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
   }, [posts]);

   const displayPosts = useMemo(() => {
      if (!featuredPost || searchTerm || activeFilter !== 'Todos') return filteredPosts;
      return filteredPosts.filter(p => p.id !== featuredPost.id);
   }, [filteredPosts, featuredPost, searchTerm, activeFilter]);

   return (
      <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg">
         <title>{`Blog & Notícias — ${settings.siteName}`}</title>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="text-center mb-16 animate-fade-in-up">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                  <Sparkles size={12} />
                  <span>Jornal da Associação</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-serif text-slate-900 dark:text-white mb-6 tracking-tight">Blog & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-400 to-purple-500 dark:to-purple-300">Notícias</span></h1>
               <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                  Histórias, conquistas e momentos que definem a nossa comunidade.
               </p>
            </div>

            {/* Featured Post Hero */}
            {featuredPost && !searchTerm && activeFilter === 'Todos' && (
               <div
                  className="relative group mb-20 rounded-[2.5rem] overflow-hidden bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 cursor-pointer hover:border-brand-500/30 transition-all duration-500 animate-fade-in-up shadow-2xl"
                  onClick={() => onViewPost(featuredPost.slug || featuredPost.id)}
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 dark:from-dark-bg/90 dark:via-dark-bg/40 to-transparent z-10"></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                     <div className="relative z-20 p-10 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-6">
                           <Badge className={`${categoryColorMap[featuredPost.category] || 'bg-brand-600'} border-none text-white px-4 py-1.5 shadow-md`}>{featuredPost.category}</Badge>
                           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                              <Calendar size={14} className="text-brand-600 dark:text-brand-400" />
                              <span>{new Date(featuredPost.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                           </div>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-6 leading-[1.1] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                           {featuredPost.title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 line-clamp-3 leading-relaxed max-w-xl">
                           {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center gap-6">
                           <Button size="lg" className="rounded-full px-8 bg-slate-900 text-white hover:bg-brand-500 hover:text-white dark:bg-white dark:text-black dark:hover:bg-brand-500 dark:hover:text-white transition-all font-semibold">
                              Ler Artigo Completo
                           </Button>
                           <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                 <Clock size={16} className="text-brand-600 dark:text-brand-400" />
                                 <span className="text-sm font-medium">{featuredPost.readTime || '5 min'} de leitura</span>
                              </div>
                              <div className="w-px h-4 bg-slate-900/10 dark:bg-white/10"></div>
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">por {featuredPost.author || `Equipa ${settings.siteName}`}</div>
                           </div>
                        </div>
                     </div>
                     <div className="relative h-full min-h-[300px] lg:min-h-0">
                        <img
                           src={featuredPost.coverUrl || '/placeholder.jpg'}
                           alt={featuredPost.title}
                           className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                           onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop';
                           }}
                        />
                        <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                  </div>
               </div>
            )}

            {/* Unified Control Deck */}
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
                        placeholder="Pesquisar artigos..."
                        aria-label="Pesquisar artigos"
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

               {/* Category chips — horizontal scroll bar */}
               <div className="flex items-center w-full max-w-3xl bg-white/70 dark:bg-dark-surface/70 border border-slate-900/10 dark:border-white/10 rounded-2xl px-2.5 py-2 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                     <button
                        onClick={() => setActiveFilter('Todos')}
                        aria-pressed={activeFilter === 'Todos'}
                        className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                           activeFilter === 'Todos'
                              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30'
                              : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5'
                        }`}
                     >
                        Tudo
                        <span className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded-full leading-none ${activeFilter === 'Todos' ? 'bg-brand-500/25 text-brand-600 dark:text-brand-300' : 'bg-slate-900/5 dark:bg-white/5 text-slate-500'}`}>
                           {posts.length}
                        </span>
                     </button>

                     {categories.map(cat => {
                        const count = categoryCounts[cat.name] || 0;
                        return (
                           <button
                              key={cat.id}
                              onClick={() => setActiveFilter(cat.name)}
                              aria-pressed={activeFilter === cat.name}
                              disabled={count === 0}
                              className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                                 activeFilter === cat.name
                                    ? 'bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white border-brand-500/50 shadow-sm shadow-brand-500/10'
                                    : count > 0
                                       ? 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/5 dark:hover:text-white dark:hover:bg-white/5'
                                       : 'text-slate-400 dark:text-slate-600 border-transparent opacity-40 cursor-default'
                              }`}
                           >
                              <span className={`w-2 h-2 rounded-full ${categoryColorClass(cat.color)} shrink-0`}></span>
                              {cat.name}
                              <span className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded-full leading-none ${activeFilter === cat.name ? 'bg-slate-900/10 text-slate-900 dark:bg-white/20 dark:text-white' : 'bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-slate-600'}`}>
                                 {count}
                              </span>
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* Active filter result count */}
               {(searchTerm || activeFilter !== 'Todos') && (
                  <p className="text-xs text-slate-500 self-start ml-1 animate-fade-in-up">
                     <span className="text-slate-600 dark:text-slate-300 font-medium">{filteredPosts.length}</span> artigo{filteredPosts.length !== 1 ? 's' : ''} encontrado{filteredPosts.length !== 1 ? 's' : ''}
                     {searchTerm && <> para &ldquo;<span className="text-slate-600 dark:text-slate-300">{searchTerm}</span>&rdquo;</>}
                  </p>
               )}
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in-up [animation-delay:0.2s]">
               {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                     <PostCardSkeleton key={i} />
                  ))
               ) : (<>
               {displayPosts.map((post) => (
                  <article
                     key={post.id}
                     className="group flex flex-col h-full bg-white dark:bg-dark-surface border border-slate-900/5 dark:border-white/5 rounded-[2rem] overflow-hidden hover:border-brand-500/20 transition-all duration-500 cursor-pointer"
                     tabIndex={0}
                     onClick={() => onViewPost(post.slug || post.id)}
                     onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewPost(post.slug || post.id); } }}
                  >
                     {/* Image Container */}
                     <div className="relative h-64 overflow-hidden">
                        <img
                           src={post.coverUrl || '/placeholder.jpg'}
                           alt={post.title}
                           loading="lazy"
                           className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                           onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop';
                           }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-dark-surface via-transparent to-transparent opacity-60"></div>

                        {/* Compact Badge */}
                        <div className="absolute top-4 left-4">
                           <div className={`inline-flex items-center px-3 py-1.5 rounded-full shadow-md ${categoryColorMap[post.category] || 'bg-brand-600'}`}>
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{post.category}</span>
                           </div>
                        </div>

                        <div className="absolute bottom-4 left-4">
                           <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50/60 dark:bg-dark-bg/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                              {new Date(post.date).toLocaleDateString('pt-PT', { month: 'short', day: '2-digit' })}
                           </div>
                        </div>
                     </div>

                     {/* Content Wrapper */}
                     <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-4 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
                           {post.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-8 flex-1">
                           {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-900/5 dark:border-white/5">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-900/10 dark:border-white/10">
                                 <img
                                    src={post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'A')}&background=DF3D32&color=fff`}
                                    alt={post.author}
                                    className="w-full h-full object-cover"
                                 />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                 {post.author || 'Equipa'}
                              </span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
                                 <Clock size={12} />
                                 {post.readTime || '5 min'}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-900/5 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                                 <ArrowRight size={14} />
                              </div>
                           </div>
                        </div>
                     </div>
                  </article>
               ))}

               {displayPosts.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center bg-slate-900/[0.02] dark:bg-white/[0.02] rounded-[3rem] border border-slate-900/5 dark:border-white/5 border-dashed">
                     <div className="w-24 h-24 bg-white dark:bg-dark-surface rounded-full flex items-center justify-center mb-8 shadow-inner border border-slate-900/5 dark:border-white/5 text-slate-300 dark:text-slate-700">
                        <Search size={40} />
                     </div>
                     <h3 className="text-2xl text-slate-900 dark:text-white font-serif mb-3">Sem notícias encontradas</h3>
                     <p className="text-slate-500 text-center max-w-sm leading-relaxed">
                        Não encontrámos artigos para a sua pesquisa. Tente utilizar termos mais gerais ou limpe os filtros.
                     </p>
                     <Button
                        variant="ghost"
                        onClick={() => { setActiveFilter('Todos'); setInputValue(''); setSearchTerm(''); }}
                        className="mt-8 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                     >
                        Limpar Todos os Filtros
                     </Button>
                  </div>
               )}
               </>)}
            </div>

         </div>
      </div>
   );
};

/**
 * Router wrapper for BlogPage.
 * Bridges React Router navigation to the legacy prop-based interface.
 */
export const BlogPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  return (
    <BlogPage
      onViewPost={(id: string) => {
        navigate(`/blog/${id}`);
      }}
    />
  );
};
