import React, { createContext, useState, useContext, useEffect } from 'react';
import { extractTextFromPDF } from '../Services/fileService';
import { analyzeArticleWithAI, findSimilarArticles } from '../Services/openaiService';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext'; // <--- 1. IMPORT AJOUTÉ

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); // <--- 2. ON RÉCUPÈRE L'UTILISATEUR
  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]); // <--- NOUVEAU
  const [playlists, setPlaylists] = useState([]); // <--- NOUVEAU
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // --- GESTION DU MODE SOMBRE ---
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- 1. CHARGEMENT INITIAL (Depuis Supabase) ---
  useEffect(() => {
    // On ne charge rien si pas d'utilisateur (évite les erreurs)
    if (!user) {
      setLoadingInitial(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoadingInitial(true);
        // On lance les 3 requêtes en parallèle pour la vitesse
        const [articlesRes, favsRes, playlistsRes] = await Promise.all([
          supabase.from('articles').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('favorites').select('article_id, articles(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        if (articlesRes.error) throw articlesRes.error;
        if (favsRes.error) throw favsRes.error;
        if (playlistsRes.error) throw playlistsRes.error;

        // On formate les articles
        const formattedArticles = (articlesRes.data || []).map(article => ({
          ...article,
          detailed_analysis: { explanatory_sections: article.explanatory_sections },
          fileUrl: article.file_path ? supabase.storage.from('pdfs').getPublicUrl(article.file_path).data.publicUrl : null
        }));

        const formattedFavs = (favsRes.data || []).map(f => f.articles).filter(Boolean);

        setArticles(formattedArticles);
        setFavorites(formattedFavs);
        setPlaylists(playlistsRes.data || []);

      } catch (error) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.warn('Supabase fetch aborted in AppContext:', error);
        } else {
          console.error('Erreur chargement données utilisateur:', error.message);
        }
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchUserData();
  }, [user]); // Rechargement si l'utilisateur change

  // --- 2. PROCESSUS D'UPLOAD COMPLET ---
  const processNewArticle = async (file) => {
    if (!user) {
      alert("Veuillez vous connecter pour analyser un article.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // A. Lecture du fichier
      console.log("1. Lecture du PDF...");
      const text = await extractTextFromPDF(file);

      // B. Analyse IA (Résumé + Cours)
      console.log("2. Analyse IA...");
      const metadata = await analyzeArticleWithAI(text);

      // C. Recherche d'articles similaires
      console.log("2b. Recherche d'articles similaires...");
      const suggestions = await findSimilarArticles(metadata.title);

      // D. Upload du PDF vers Supabase Storage
      console.log("3. Upload du fichier vers Supabase Storage...");
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);

      if (uploadError) throw new Error("Erreur upload fichier : " + uploadError.message);

      // E. Sauvegarde des métadonnées dans la Table Supabase
      console.log("4. Sauvegarde en Base de Données...");

      const { data: insertedData, error: dbError } = await supabase
        .from('articles')
        .insert([
          {
            title: metadata.title,
            original_title: metadata.original_title,
            authors: metadata.authors, // Assurez-vous que c'est une string ou array selon votre BDD
            year: metadata.year,
            domain: metadata.domain,
            summary: metadata.summary,
            full_text: text,
            explanatory_sections: metadata.explanatory_sections,
            file_path: fileName,
            recommendations: suggestions,
            user_id: user.id // <--- 3. L'AJOUT CRUCIAL EST ICI !
          }
        ])
        .select();

      if (dbError) throw new Error("Erreur base de données : " + dbError.message);

      // F. Mise à jour de l'affichage local instantanée
      const newArticleFromDb = insertedData[0];
      const newArticleForState = {
        ...newArticleFromDb,
        detailed_analysis: { explanatory_sections: newArticleFromDb.explanatory_sections },
        fileUrl: supabase.storage.from('pdfs').getPublicUrl(fileName).data.publicUrl
      };

      setArticles(prev => [newArticleForState, ...prev]);
      return newArticleForState;

    } catch (error) {
      console.error(error);
      alert(`❌ ERREUR : ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppContext.Provider value={{
      articles, setArticles,
      favorites, setFavorites, // <--- EXPORTÉ
      playlists, setPlaylists, // <--- EXPORTÉ
      processNewArticle, isAnalyzing, loadingInitial,
      darkMode, toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);