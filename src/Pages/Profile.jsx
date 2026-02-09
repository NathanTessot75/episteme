import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
  Heart, Layers, LogOut, FileText, 
  Calendar, ArrowRight, FolderOpen, Mail 
} from 'lucide-react';
import PageTransition from '../Components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

const ArticleCard = ({ article }) => (
  <div className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between h-full">
    <div>
      <div className="flex justify-between items-start mb-3">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600 dark:text-blue-300 p-2.5 rounded-xl">
          <FileText size={20} className="text-purple-600 dark:text-blue-400" />
        </div>
      </div>
      <Link to={`/article/${article.id}`} className="block">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 transition-colors">
          {article.title}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
           <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md font-bold">{article.domain}</span>
           <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md"><Calendar size={12} /> {article.year}</span>
        </div>
      </Link>
    </div>
    <Link to={`/article/${article.id}`} className="mt-4 flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-80">
      Relire <ArrowRight size={14} className="text-purple-600" />
    </Link>
  </div>
);

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites'); 
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  const CATEGORIES = ["Tous", "Informatique", "Physique", "Biologie", "Médecine", "Mathématiques", "Sciences Sociales", "Économie", "Histoire", "Environnement", "Ingénierie", "Psychologie", "Philosophie"];

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    const fetchData = async () => {
      setLoading(true);
      const [favData, listData] = await Promise.all([
        supabase.from('favorites').select('article_id, articles(*)').eq('user_id', user.id),
        supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (favData.data) setFavorites(favData.data.map(f => f.articles).filter(Boolean));
      if (listData.data) setPlaylists(listData.data);
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const handleLogout = async () => { await signOut(); navigate('/auth'); };
  const filterList = (list) => { if (selectedCategory === 'Tous') return list; return list.filter(a => (a.domain || 'Non classé') === selectedCategory); };

  if (!user) return null;
  if (loading) return <div className="flex justify-center h-[50vh] items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto pt-8 px-4 md:px-0 pb-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm mb-12 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-200 dark:shadow-none flex-shrink-0">
             <span className="text-4xl font-bold">{user.email.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Mon Profil</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400 mb-6 font-medium"><Mail size={16} /> {user.email}</div>
            <div className="flex gap-4 justify-center md:justify-start">
               <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                 <span className="block text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">{favorites.length}</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Favoris</span>
               </div>
               <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                 <span className="block text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">{playlists.length}</span>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Collections</span>
               </div>
            </div>
          </div>
          <button onClick={handleLogout} className="px-6 py-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"><LogOut size={18} /> Déconnexion</button>
        </div>

        <div className="flex justify-center mb-8">
           <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl inline-flex relative">
              {[
                { id: 'favorites', label: 'Mes Favoris', icon: Heart },
                { id: 'playlists', label: 'Mes Collections', icon: Layers },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all z-10">
                    <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      <tab.icon size={16} className={isActive ? "text-purple-600" : ""} /> {tab.label}
                    </span>
                    {isActive && <motion.div layoutId="profileTab" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  </button>
                )
              })}
           </div>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'favorites' && (
              <motion.div key="favs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                   {CATEGORIES.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'}`}>{cat}</button>)}
                </div>
                {favorites.length === 0 ? <div className="text-center py-20 text-slate-400">Aucun favori.</div> : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filterList(favorites).map(a => <ArticleCard key={a.id} article={a} />)}</div>
                )}
              </motion.div>
            )}

            {activeTab === 'playlists' && (
              <motion.div key="lists" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 {playlists.length === 0 ? <div className="text-center py-20 text-slate-400">Aucune collection.</div> : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* 👇 STYLE DÉGRADÉ POUR LES CARTES PROFIL AUSSI 👇 */}
                      {playlists.map(list => (
                        <div key={list.id} className="group relative bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-purple-100 dark:border-slate-700 hover:shadow-lg transition-all hover:-translate-y-1">
                           
                           <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-200 dark:shadow-none">
                             <FolderOpen size={26} />
                          </div>

                          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">
                             {list.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                             Créée le {new Date(list.created_at).toLocaleDateString()}
                          </p>

                          <Link to={`/playlist/${list.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                            Ouvrir le dossier <ArrowRight size={14} className="text-purple-600" />
                          </Link>
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

export default Profile;