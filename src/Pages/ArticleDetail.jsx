import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Eye, BookOpen, ExternalLink,
  FileText, Sparkles, Heart, Layers, Plus, Check, X, Lightbulb, Info, Send, MessageCircle, Quote, Copy
} from 'lucide-react';
import { chatWithArticleAI } from '../Services/openaiService';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../Context/AppContext';
import { useAuth } from '../Context/AuthContext';
import { supabase } from '../supabaseClient';
import PageTransition from '../Components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

const ArticleDetail = () => {
  const { id } = useParams();
  const { articles, loadingInitial } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const featuredArticle = location.state?.article;

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // --- CHAT STATE ---
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [fetchedArticle, setFetchedArticle] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  // Priority: 1. Navigation State -> 2. Context (My Library) -> 3. Fetched Individually
  const article = featuredArticle || articles.find(a => a.id.toString() === id) || fetchedArticle;

  // Helper to identify static/demo articles vs real DB articles
  const isStaticFeatured = article?.id?.toString().startsWith('feat-');

  useEffect(() => {
    // If we have the article from state or context, do the side-effects
    // If we have the article from state or context, do the side-effects
    if (article) {
      if (!isStaticFeatured) { // Only fetch user-specific data if it's a real DB article
        fetchLikeData();
        if (user) {
          fetchPlaylists();
          fetchChatHistory();
        }
      }
    } else {
      // If we DON'T have the article, fetch it!
      const fetchArticleById = async () => {
        setLoadingArticle(true);
        const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
        if (data) {
          // Add fileUrl if needed
          const withUrl = {
            ...data,
            fileUrl: data.file_path ? supabase.storage.from('pdfs').getPublicUrl(data.file_path).data.publicUrl : null
          };
          setFetchedArticle(withUrl);
        }
        setLoadingArticle(false);
      };

      fetchArticleById();
    }
  }, [user, id, featuredArticle, articles]); // Added dependencies to re-run if needed

  const fetchLikeData = async () => {
    try {
      const { count } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('article_id', article.id);
      setLikeCount(count || 0);
      if (user) {
        const { data } = await supabase.from('favorites').select('id').eq('article_id', article.id).eq('user_id', user.id).maybeSingle();
        setIsLiked(!!data);
      }
    } catch (error) { console.error(error); }
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('article_chats')
        .select('*')
        .eq('article_id', article.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setChatMessages(data.map(msg => ({ role: msg.role, content: msg.content })));
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const toggleLike = async () => {
    if (!user) return alert("Connectez-vous pour liker !");
    if (isStaticFeatured) return alert("Article de démonstration (lecture seule).");
    if (isLiked) {
      const { error } = await supabase.from('favorites').delete().eq('article_id', article.id).eq('user_id', user.id);
      if (!error) { setIsLiked(false); setLikeCount(prev => Math.max(0, prev - 1)); }
    } else {
      const { error } = await supabase.from('favorites').insert([{ article_id: article.id, user_id: user.id }]);
      if (!error) { setIsLiked(true); setLikeCount(prev => prev + 1); }
    }
  };

  const fetchPlaylists = async () => {
    const { data } = await supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setUserPlaylists(data);
  };

  const createPlaylistAndAdd = async () => {
    if (!newPlaylistTitle.trim()) return;
    const { data } = await supabase.from('playlists').insert([{ title: newPlaylistTitle, user_id: user.id }]).select().single();
    if (data) { setUserPlaylists([data, ...userPlaylists]); setNewPlaylistTitle(""); addToPlaylist(data.id); }
  };

  const addToPlaylist = async (playlistId) => {
    if (isStaticFeatured) return alert("Article de démonstration (lecture seule).");
    const { error } = await supabase.from('playlist_items').insert([{ playlist_id: playlistId, article_id: article.id }]);
    if (error) setFeedbackMsg(error.code === '23505' ? "Déjà dans cette collection !" : "Erreur ajout.");
    else { setFeedbackMsg("Ajouté avec succès !"); setTimeout(() => { setShowPlaylistModal(false); setFeedbackMsg(""); }, 1000); }
  };

  // --- CITATION LOGIC ---
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationFormat, setCitationFormat] = useState('APA');
  const [copied, setCopied] = useState(false);

  // Local state for editing citation info
  const [citationData, setCitationData] = useState({
    authors: "",
    title: "",
    year: ""
  });

  useEffect(() => {
    if (showCitationModal && article) {
      setCitationData({
        authors: Array.isArray(article.authors) ? article.authors.join(", ") : article.authors || "Unknown",
        title: article.original_title || article.title,
        year: article.year || "n.d."
      });
    }
  }, [showCitationModal, article]);

  const generateCitation = (format) => {
    const { authors, title, year } = citationData;
    const url = window.location.href;

    switch (format) {
      case 'APA':
        return `${authors} (${year}). ${title}. Retrieved from ${url}`;
      case 'MLA':
        return `${authors}. "${title}." ${year}. Web.`;
      case 'BibTeX':
        // Simple BibTeX generation
        const authorTag = authors.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        return `@misc{${authorTag}${year},
  author = {${authors}},
  title = {${title}},
  year = {${year}},
  url = {${url}}
}`;
      default:
        return "";
    }
  };

  const copyCitation = () => {
    const text = generateCitation(citationFormat);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- CHAT LOGIC ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    // Save user message
    if (user && !isStaticFeatured) {
      supabase.from('article_chats').insert([{
        user_id: user.id,
        article_id: article.id,
        role: 'user',
        content: userMsg.content
      }]).then();
    }

    try {
      // Contexte allégé pour l'IA
      const context = {
        title: article.title,
        authors: Array.isArray(article.authors) ? article.authors.join(", ") : article.authors,
        year: article.year,
        summary: article.summary,
        full_text: article.full_text // Si dispo
      };

      const aiResponse = await chatWithArticleAI(userMsg.content, context, chatMessages.slice(-5));
      const aiMsg = { role: 'assistant', content: aiResponse };

      setChatMessages(prev => [...prev, aiMsg]);

      // Save AI response
      if (user && !isStaticFeatured) {
        supabase.from('article_chats').insert([{
          user_id: user.id,
          article_id: article.id,
          role: 'assistant',
          content: aiMsg.content
        }]).then();
      }

    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur est survenue lors de la communication avec l'IA." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- LE PARSEUR DE TEXTE MAGIQUE ---
  const renderRichText = (content) => {
    if (!content) return null;

    // On divise le texte en cherchant nos balises [TYPE: Titre :: Contenu]
    // Regex explication : On capture (TYPE), (Titre), et (Contenu)
    const regex = /\[(DEFINITION|EXEMPLE):\s*(.*?)\s*::\s*(.*?)\]/g;

    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Ajouter le texte normal avant la balise
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }

      // Ajouter la balise spéciale
      parts.push({
        type: match[1], // 'DEFINITION' ou 'EXEMPLE'
        title: match[2],
        body: match[3]
      });

      lastIndex = regex.lastIndex;
    }

    // Ajouter le reste du texte
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'text') {
        // Texte normal avec paragraphes
        return (
          <div key={idx} className="whitespace-pre-wrap mb-6 text-justify leading-loose text-slate-700 dark:text-slate-300 font-serif md:font-sans text-lg">
            {part.content}
          </div>
        );
      }

      if (part.type === 'DEFINITION') {
        return (
          <div key={idx} className="my-8 p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border-l-4 border-purple-500 shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider text-xs">
              <BookOpen size={16} /> Définition
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{part.title}</h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
              {part.body}
            </p>
          </div>
        );
      }

      if (part.type === 'EXEMPLE') {
        return (
          <div key={idx} className="my-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-purple-100 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lightbulb size={64} className="text-purple-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs">
                <Lightbulb size={16} /> Exemple Concret
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{part.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {part.body}
              </p>
            </div>
          </div>
        );
      }
      return null;
    });
  };


  if (loadingInitial && !featuredArticle) return <div className="flex justify-center h-[50vh] items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  if (!article) return <div className="text-center py-20">Article introuvable.</div>;

  const sections = article.detailed_analysis?.explanatory_sections || article.explanatory_sections;
  const recommendations = article.recommendations || [];

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto pb-20 pt-8 px-6 md:px-0 relative">

        <Link to={isStaticFeatured ? "/explorer" : "/library"} className="inline-flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors mb-8 font-medium">
          <ArrowLeft size={18} /> {isStaticFeatured ? "Retour" : "Bibliothèque"}
        </Link>

        {/* HEADER */}
        <header className="mb-16 border-b border-gray-200 dark:border-slate-800 pb-8">
          <div className="flex justify-between items-start mb-6">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold tracking-wide">
              {article.domain || "Science"}
            </span>
            {!isStaticFeatured && (
              <div className="flex gap-2">
                <button
                  onClick={toggleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isLiked
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/40 text-red-500 dark:text-red-300'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-300'
                    }`}
                >
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} /> <span className="font-bold text-sm">{likeCount}</span>
                </button>
                {user && (
                  <button onClick={() => setShowPlaylistModal(true)} className="p-3 rounded-full border border-gray-200 dark:border-slate-700 hover:text-purple-600 transition-colors">
                    <Layers size={20} />
                  </button>
                )}
                <button onClick={() => setShowCitationModal(true)} className="p-3 rounded-full border border-gray-200 dark:border-slate-700 hover:text-purple-600 transition-colors" title="Citer cet article">
                  <Quote size={20} />
                </button>
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">{article.title}</h1>
          <div className="flex items-center gap-8 text-lg text-gray-500">
            <div className="flex items-center gap-2"><User size={20} className="text-purple-500" /><p className="font-medium">{Array.isArray(article.authors) ? article.authors[0] : article.authors}</p></div>
            <div className="flex items-center gap-2"><Calendar size={20} className="text-blue-500" /><p>{article.year}</p></div>
          </div>
        </header>

        {/* CONTENU */}
        <div className="animate-slide-up space-y-16">
          {/* VUE MODE EXPERT (MARKDOWN STREAM) */}
          <div className="prose prose-lg max-w-none dark:prose-invert bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <ReactMarkdown>
              {article.full_analysis || article.summary || "Analyse en cours..."}
            </ReactMarkdown>
          </div>
        </div>

        {/* RECOMMANDATIONS */}
        {recommendations.length > 0 && (
          <div className="mt-24 pt-10 border-t border-gray-200 dark:border-slate-800">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 dark:text-white"><Sparkles className="text-blue-500" /> Pour aller plus loin</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.slice(0, 4).map((rec, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{rec.title}</h4>
                  <a href={rec.pdfUrl || rec.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-sm">Source <ExternalLink size={14} /></a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF */}
        <div className="mt-12 pt-10 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl mb-6 dark:text-white"><Eye className="text-gray-400" /><h3>Document original</h3></div>
          {article.fileUrl || article.pdfUrl ? (
            <div className="bg-gray-800 rounded-xl overflow-hidden h-[800px]"><iframe src={article.fileUrl || article.pdfUrl} className="w-full h-full" title="PDF" /></div>
          ) : <div className="p-6 bg-gray-50 text-center rounded-xl">Non disponible.</div>}
        </div>

        {/* MODAL */}
        {showPlaylistModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-4"><h3 className="font-bold text-lg dark:text-white">Collections</h3><button onClick={() => setShowPlaylistModal(false)}><X /></button></div>
              {feedbackMsg ? <div className="text-green-600 font-bold text-center py-4">{feedbackMsg}</div> : (
                <div className="space-y-2">
                  {userPlaylists.map(list => <button key={list.id} onClick={() => addToPlaylist(list.id)} className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold dark:text-white">{list.title}</button>)}
                  <div className="flex gap-2 pt-4"><input value={newPlaylistTitle} onChange={e => setNewPlaylistTitle(e.target.value)} placeholder="Nouvelle..." className="flex-1 p-2 border rounded-lg dark:bg-slate-800 dark:text-white" /><button onClick={createPlaylistAndAdd} className="bg-purple-600 text-white p-2 rounded-lg"><Plus /></button></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CITATION MODAL */}
        {showCitationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCitationModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl dark:text-white flex items-center gap-2">
                  <Quote className="text-purple-600" /> Citer cet article
                </h3>
                <button onClick={() => setShowCitationModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X /></button>
              </div>

              <div className="flex gap-2 mb-4">
                {['APA', 'MLA', 'BibTeX'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCitationFormat(fmt)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${citationFormat === fmt
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-200 dark:border-slate-800 mb-4 relative group">
                <pre className="whitespace-pre-wrap text-sm font-mono text-slate-700 dark:text-slate-300">
                  {generateCitation(citationFormat)}
                </pre>
                <button
                  onClick={copyCitation}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 text-slate-500 hover:text-purple-600 transition-colors"
                  title="Copier"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Vérifiez toujours les citations générées pour vous assurer qu'elles correspondent aux exigences de votre institution.
              </p>
            </div>
          </div>
        )}

        {/* BOUTON FLOTTANT CHAT */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          {showChat ? <X size={24} /> : <MessageCircle size={28} />}
        </button>

        {/* INTERFACE DE CHAT */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-24 right-8 z-40 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold flex items-center gap-2">
                <Sparkles size={18} /> Discuter avec l'article
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-slate-400 text-sm mt-10">
                    <p>Posez une question sur cet article.</p>
                    <p className="text-xs mt-2">Ex: "Quelle est la conclusion principale ?"</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-bl-none'
                      }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-gray-200 dark:border-slate-700">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Votre question..."
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
};

export default ArticleDetail;