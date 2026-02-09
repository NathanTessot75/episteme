import React from 'react';
import { FileText, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article }) => {
  const { 
    id = 1, 
    title = "Titre inconnu", 
    authors = [], 
    domain = "Général", 
    year = "2024", 
    summary = "Pas de résumé disponible."
  } = article || {};

  return (
    <Link to={`/article/${id}`} className="block group h-full">
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-900/50 cursor-pointer h-full flex flex-col justify-between">
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 w-full">
            
            {/* --- CORRECTION ICI : Conteneur Icône --- */}
            {/* 1. shrink-0 : Empêche l'icône de s'écraser si le titre est long */}
            {/* 2. flex items-center justify-center : Centre l'icône parfaitement */}
            {/* 3. w-12 h-12 : Taille fixe pour éviter qu'elle ne "sorte" */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
               {/* Couleur unifiée : Violet en jour, Violet clair en nuit (plus de bleu) */}
               <FileText className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            
            <div className="space-y-2 w-full">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight">
                {title}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1">
                {Array.isArray(authors) ? authors.join(', ') : authors}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold border border-transparent dark:border-slate-600">
                  {domain}
                </span>
                <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 text-xs">
                  <Calendar size={12} />
                  <span>{year}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
        </div>

        {/* Footer de la carte */}
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700/50 flex justify-end">
           <ArrowRight className="text-gray-300 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" size={20} />
        </div>

      </div>
    </Link>
  );
};

export default ArticleCard;