import React from 'react';
import { GitCommit, GitPullRequest, GitMerge, CheckCircle, FileText, ExternalLink, Lock } from 'lucide-react';

const Timeline = ({ events }) => {
  if (!events || events.length === 0) return null;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Contradiction':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: GitPullRequest, label: 'Contradiction' };
      case 'Conciliation':
        return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: GitMerge, label: 'Conciliation' };
      default:
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: GitCommit, label: 'Découverte' };
    }
  };

  return (
    <div className="relative border-l-2 border-gray-200 dark:border-slate-800 ml-4 md:ml-6 my-8 space-y-8 transition-colors">
      {events.map((event, index) => {
        const style = getTypeStyle(event.type);
        const Icon = style.icon;

        return (
          <div key={index} className="relative pl-8 md:pl-12 group animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}>
            {/* Point sur la ligne */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${style.bg.replace('100', '500').replace('/30', '')}`}></div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-400 dark:text-slate-500">{event.year}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${style.bg} ${style.color}`}>
                  <Icon size={12} />
                  {style.label}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 transition-colors">{event.title}</h3>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-3">{event.author}</p>
              
              <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-4 transition-colors">
                {event.description}
              </p>

              {/* BOUTONS D'ACTION */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-slate-700">
                
                {event.pdfUrl ? (
                  <a 
                    href={event.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <FileText size={14} />
                    PDF Complet
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-500 text-xs font-medium cursor-not-allowed">
                    <Lock size={14} />
                    PDF non dispo
                  </span>
                )}

                <a 
                  href={event.semanticUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <ExternalLink size={14} />
                  Voir la source
                </a>
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="relative pl-8 md:pl-12">
        <div className="absolute -left-[11px] top-0 p-1 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-400 dark:text-slate-500">
          <CheckCircle size={14} />
        </div>
        <p className="text-sm text-gray-400 dark:text-slate-500 italic">Fin de la timeline</p>
      </div>
    </div>
  );
};

export default Timeline;