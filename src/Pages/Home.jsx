import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../Context/AppContext';
import PageTransition from '../Components/PageTransition';

const Home = () => {
  const { processNewArticle, isAnalyzing } = useApp();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      const newArticle = await processNewArticle(file);
      if (newArticle) {
        navigate(`/article/${newArticle.id}`);
      }
    } else {
      alert("Merci de déposer un fichier PDF uniquement.");
    }
  }, [processNewArticle, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-20 text-center space-y-12">
        
        {/* En-tête */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 border border-purple-100 dark:border-purple-800 rounded-full text-sm font-bold shadow-sm transition-colors">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-200">Nouvelle Version IA 2.0</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
            Comprenez la science <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
              en un clin d'œil.
            </span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
            Déposez un article scientifique PDF. Notre IA le lit, l'analyse et vous l'explique comme un professeur.
          </p>
        </div>

        {/* Zone de Drop */}
        <div 
          {...getRootProps()} 
          className={`
            relative group cursor-pointer transition-all duration-300 ease-out
            border-3 border-dashed rounded-3xl p-16
            flex flex-col items-center justify-center gap-6
            ${isDragActive 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.02]' 
              : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xl'}
          `}
        >
          <input {...getInputProps()} />
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 size={64} className="text-purple-600 dark:text-purple-400 animate-spin mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Analyse en cours...</h3>
              <p className="text-slate-500 dark:text-slate-400">Lecture du PDF, extraction des concepts et rédaction du cours...</p>
            </div>
          ) : (
            <>
              {/* 👇 CORRECTION COULEUR DU NUAGE 👇 */}
              <div className="p-6 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full group-hover:scale-110 transition-transform duration-300">
                <UploadCloud size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">
                  {isDragActive ? "Lâchez le fichier ici !" : "Cliquez ou glissez un PDF ici"}
                </h3>
                <p className="text-slate-400 font-medium">Supporte les fichiers PDF jusqu'à 20MB</p>
              </div>
            </>
          )}
        </div>

      </div>
    </PageTransition>
  );
};

export default Home;