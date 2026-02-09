import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Trash2, FileText, Calendar, ArrowRight, FolderOpen, Loader2 } from 'lucide-react';
import PageTransition from '../Components/PageTransition';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaylistDetails();
  }, [id]);

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer la Playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // "maybeSingle" évite le crash si pas de résultat

      if (playlistError) throw playlistError;
      if (!playlistData) throw new Error("Playlist introuvable");

      setPlaylist(playlistData);

      // 2. Récupérer les articles
      const { data: itemsData, error: itemsError } = await supabase
        .from('playlist_items')
        .select('id, added_at, articles(*)') 
        .eq('playlist_id', id)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;

      if (itemsData) {
        // On filtre pour éviter les articles supprimés (qui seraient null)
        const validItems = itemsData
          .filter(i => i.articles !== null)
          .map(i => ({ ...i.articles, link_id: i.id }));
        setItems(validItems);
      }
    } catch (err) {
      console.error("Erreur chargement playlist:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromPlaylist = async (linkId) => {
    if (!confirm("Retirer cet article de la collection ?")) return;
    await supabase.from('playlist_items').delete().eq('id', linkId);
    setItems(items.filter(item => item.link_id !== linkId));
  };

  const deleteEntirePlaylist = async () => {
    if (!confirm("Supprimer définitivement ce dossier ?")) return;
    await supabase.from('playlists').delete().eq('id', id);
    navigate('/library');
  };

  // --- RENDUS DE SÉCURITÉ (Pour éviter la page blanche) ---
  
  if (loading) {
    return (
      <div className="flex justify-center h-[50vh] items-center gap-2 text-purple-600">
        <Loader2 className="animate-spin" size={32} />
        <span className="font-bold">Chargement...</span>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-red-500 mb-2">Erreur</h2>
        <p className="text-gray-500 mb-6">{error || "Impossible de charger le dossier."}</p>
        <Link to="/library" className="px-4 py-2 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  // --- RENDU NORMAL ---
  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto pt-8 px-4 md:px-0 pb-20">
        
        <Link to="/library" className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-8 font-medium">
          <ArrowLeft size={18} /> Retour à la bibliothèque
        </Link>

        {/* HEADER */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-purple-100 dark:border-slate-700">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <FolderOpen size={36} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
                {playlist.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {items.length} article{items.length > 1 ? 's' : ''} • Créée le {new Date(playlist.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button 
            onClick={deleteEntirePlaylist}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors border border-gray-200 dark:border-slate-600"
          >
            <Trash2 size={18} /> Supprimer le dossier
          </button>
        </div>

        {/* LISTE */}
        {items.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-xl font-bold text-slate-400 mb-6">Ce dossier est vide.</p>
            <Link to="/explorer" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
              Trouver des articles
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(article => (
              <div key={article.id} className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between h-full relative">
                
                <button 
                  onClick={(e) => { e.preventDefault(); removeFromPlaylist(article.link_id); }}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 border border-gray-100 z-10"
                  title="Retirer du dossier"
                >
                  <Trash2 size={14} />
                </button>

                <Link to={`/article/${article.id}`} className="block">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2.5 rounded-xl">
                      <FileText size={20} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md font-bold">{article.domain || 'Général'}</span>
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                      <Calendar size={12} /> {article.year || 'N/A'}
                    </span>
                  </div>
                </Link>

                <Link to={`/article/${article.id}`} className="mt-4 flex items-center gap-2 text-sm font-bold text-purple-600 hover:underline">
                  Lire l'analyse <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default PlaylistDetail;