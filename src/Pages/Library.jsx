import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { supabase } from '../supabaseClient';
import {
  FileText, Trash2, Calendar, Upload, Heart,
  Layers, Plus, FolderOpen, ArrowRight, Loader2
} from 'lucide-react';
import PageTransition from '../Components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

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

// --- COMPOSANT CARTE ---
const LibraryCard = ({ article, isUpload, onDelete }) => (
  <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between h-full hover:-translate-y-1 duration-300">
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center text-purple-600 dark:text-blue-300">
          <FileText size={24} />
        </div>
        {isUpload && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(article.id); }}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <Link to={`/article/${article.id}`} className="block">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md font-bold">{article.domain || 'Général'}</span>
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md"><Calendar size={12} /> {article.year || 'N/A'}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
          {stripMarkdown(article.summary) || "Aucun résumé."}
        </p>
      </Link>
    </div>
    <Link to={`/article/${article.id}`} className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700/50 flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-80">
      Lire l'analyse <ArrowRight size={14} className="text-purple-600 dark:text-blue-400" />
    </Link>
  </div>
);

const Library = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('uploads');

  // --- NOUVEAU : GESTION DES CATÉGORIES ---
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const CATEGORIES = ["Tout", "Informatique", "Physique", "Biologie", "Médecine", "Mathématiques", "Sciences Sociales", "Économie", "Histoire", "Environnement", "Ingénierie", "Psychologie", "Philosophie"];

  const [myArticles, setMyArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // Reset la catégorie quand on change d'onglet principal
  useEffect(() => {
    setSelectedCategory('Tout');
  }, [activeTab]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    console.log("Fetching data for user:", user.id);
    try {
      const { data: uploads, error: uploadsError } = await supabase.from('articles').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (uploadsError) throw uploadsError;
      console.log("Uploads loaded:", uploads?.length);

      if (uploads) setMyArticles(uploads);

      const { data: favs, error: favsError } = await supabase.from('favorites').select('article_id, articles(*)').eq('user_id', user.id).order('created_at', { ascending: false });
      if (favsError) throw favsError;

      if (favs) setFavorites(favs.map(f => f.articles).filter(Boolean));

      const { data: lists, error: listsError } = await supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (listsError) throw listsError;

      if (lists) setPlaylists(lists);
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn("Fetch aborted in Library:", err);
      } else {
        console.error("Error fetching library data:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAllData(); else setLoading(false); }, [user]);

  // Fonction de filtrage
  const filterList = (list) => {
    if (selectedCategory === 'Tout') return list;
    return list.filter(item => (item.domain || 'Non classé') === selectedCategory);
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm("Supprimer ?")) return;
    setMyArticles(prev => prev.filter(a => a.id !== id));
    await supabase.from('articles').delete().eq('id', id);
  };
  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const { data } = await supabase.from('playlists').insert([{ title: newPlaylistName, user_id: user.id }]).select().single();
    if (data) { setPlaylists([data, ...playlists]); setNewPlaylistName(''); }
  };
  const deletePlaylist = async (id) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('playlists').delete().eq('id', id);
    setPlaylists(playlists.filter(p => p.id !== id));
  };

  const TABS = [
    { id: 'uploads', label: 'Mes Uploads', icon: Upload },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'playlists', label: 'Collections', icon: Layers },
  ];

  if (!user) return <div className="text-center py-20 dark:text-white">Connectez-vous.</div>;
  if (loading) return <div className="flex justify-center h-[50vh] items-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto py-8 px-4 md:px-0 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Ma Bibliothèque</h1>
          <p className="text-slate-500 dark:text-slate-400">Gérez vos contenus, favoris et dossiers.</p>



          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
              <p className="font-bold">Erreur de chargement :</p>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{error}</pre>
              <button
                onClick={fetchAllData}
                className="mt-2 text-xs bg-red-100 dark:bg-red-800/50 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* ONGLETS PRINCIPAUX */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={16} style={isActive ? { stroke: "url(#gradient-icon)" } : {}} />
                  <span className={isActive ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" : ""}>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* --- BARRE DE CATÉGORIES (RUBRIQUES) --- */}
        {/* On ne l'affiche que pour Uploads et Favorites */}
        {(activeTab === 'uploads' || activeTab === 'favorites') && (
          <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600'}
                  `}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">

            {/* UPLOADS */}
            {activeTab === 'uploads' && (
              <motion.div key="uploads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filterList(myArticles).length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 mb-6">
                      {selectedCategory === 'Tout' ? "Aucun article uploadé." : `Aucun article dans "${selectedCategory}".`}
                    </p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                      <Plus size={18} /> Analyser un PDF
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterList(myArticles).map(a => <LibraryCard key={a.id} article={a} isUpload={true} onDelete={handleDeleteArticle} />)}
                  </div>
                )}
              </motion.div>
            )}

            {/* FAVORIS */}
            {activeTab === 'favorites' && (
              <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filterList(favorites).length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    {selectedCategory === 'Tout' ? "Aucun favori." : `Aucun favori dans "${selectedCategory}".`}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterList(favorites).map(a => <LibraryCard key={a.id} article={a} isUpload={false} />)}
                  </div>
                )}
              </motion.div>
            )}

            {/* PLAYLISTS (Pas de filtre catégories ici) */}
            {activeTab === 'playlists' && (
              <motion.div key="playlists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={createPlaylist} className="flex gap-2 mb-8 max-w-md mx-auto md:mx-0">
                  <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder="Nouvelle collection..." className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none dark:text-white" />
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg"><Plus size={20} /></button>
                </form>
                {playlists.length === 0 ? <div className="text-center py-20 text-slate-400">Créez des collections.</div> : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map(list => (
                      <div key={list.id} className="group relative bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-purple-100 dark:border-slate-700 hover:shadow-xl hover:shadow-purple-100/50 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1">
                        <button onClick={() => deletePlaylist(list.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 size={16} /></button>
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-200 dark:shadow-none group-hover:scale-105 transition-transform duration-300"><FolderOpen size={26} /></div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">{list.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wide font-medium">Créée le {new Date(list.created_at).toLocaleDateString()}</p>
                        <Link to={`/playlist/${list.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-80 transition-all">Ouvrir le dossier <ArrowRight size={14} className="text-purple-600 dark:text-blue-400" /></Link>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

export default Library;