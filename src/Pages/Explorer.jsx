import React, { useState, useEffect } from 'react';
import { Search, Loader2, Compass, Sparkles, BookOpen, ArrowRight, TrendingUp, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchResearchTimeline } from '../Services/openaiService';
import Timeline from '../Components/Timeline';
import PageTransition from '../Components/PageTransition';
import { supabase } from '../supabaseClient';
import { useAuth } from '../Context/AuthContext';

// --- UTILS ---
const stripMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/#+\s/g, "")       // Titres
    .replace(/\*\*/g, "")       // Gras
    .replace(/\*/g, "")         // Italique / Puces
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Liens
    .replace(/`/g, "")          // Code
    .replace(/>\s/g, "")        // Citations
    .replace(/\n\s*\n/g, " ")   // Sauts de ligne multiples
    .trim();
};

const Explorer = () => {
  const [query, setQuery] = useState('');
  const [timelineData, setTimelineData] = useState([]);
  const [feedArticles, setFeedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Charger le feed social au montage
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        let queryBuilder = supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        // Si connecté, on NE montre PAS ses propres articles
        if (user) {
          queryBuilder = queryBuilder.neq('user_id', user.id);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;
        setFeedArticles(data || []);
      } catch (err) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          console.warn("Fetch aborted in Explorer:", err);
        } else {
          console.error("Erreur chargement feed:", err);
        }
      } finally {
        setLoadingFeed(false);
      }
    };

    fetchFeed();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setTimelineData([]);

    try {
      const data = await searchResearchTimeline(query);
      setTimelineData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = (article) => {
    navigate(`/article/${article.id}`, { state: { article } });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">

        {/* EN-TÊTE FIXE */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 rounded-3xl mb-4 shadow-lg shadow-purple-200/50 dark:shadow-none border border-white dark:border-slate-600">
            <Compass size={40} className="text-transparent stroke-purple-600 dark:stroke-purple-300" style={{ stroke: "url(#gradient-icon)" }} />
            <Compass size={40} className="absolute text-purple-600 dark:text-purple-300" />
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white transition-colors">
            Explorer le Savoir
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
            Découvrez les dernières analyses partagées par la communauté.
          </p>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="max-w-2xl mx-auto mb-16 relative z-10">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ou recherchez une timeline (ex: Big Bang)..."
              className="w-full px-6 py-4 pl-14 text-lg bg-white dark:bg-slate-800 dark:text-white border-2 border-gray-200 dark:border-slate-700 rounded-full focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 transition-all shadow-sm group-hover:shadow-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors" size={24} />

            <button
              type="submit"
              disabled={loading || !query}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-purple-200 dark:hover:shadow-none hover:opacity-90"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span>Explorer</span>
            </button>
          </form>
        </div>

        {/* --- ZONE D'AFFICHAGE --- */}

        {(loading || timelineData.length > 0) ? (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-slate-400 animate-pulse">Génération de la timeline...</p>
              </div>
            ) : (
              <Timeline events={timelineData} />
            )}
          </div>
        ) : (
          // --- FEED SOCIAL ---
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-2 px-4 md:px-0 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">
              <TrendingUp size={14} />
              <span>Derniers ajouts de la communauté</span>
            </div>

            {loadingFeed ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : feedArticles.length === 0 ? (
              <div className="text-center py-20 text-slate-400">Encore aucune publication. Soyez le premier !</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0">
                {feedArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => openArticle(article)}
                    className="group text-left bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
                  >
                    <div className="p-6 pb-2">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                            {article.year || 'N/A'}
                          </span>
                          <span className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold truncate max-w-[100px]">
                            {article.domain || 'Général'}
                          </span>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600 dark:text-blue-300 p-2 rounded-lg">
                          <BookOpen size={16} className="text-purple-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 italic mb-4">
                        <User size={14} />
                        <span className="truncate">{Array.isArray(article.authors) ? article.authors[0] : article.authors}</span>
                      </div>
                    </div>

                    <div className="px-6 pb-6 flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        {stripMarkdown(article.summary || article.full_analysis)}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 group-hover:opacity-80">
                        Lire l'analyse
                      </span>
                      <ArrowRight size={14} className="text-purple-600 dark:text-blue-400 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default Explorer;