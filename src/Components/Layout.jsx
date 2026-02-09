import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Compass, Layout as LayoutIcon } from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg">
              <span className="font-bold text-lg">ε</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Épistémé</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/')}`}>
              <LayoutIcon size={18} />
              Accueil
            </Link>
            <Link to="/library" className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/library')}`}>
              <BookOpen size={18} />
              Bibliothèque
            </Link>
            <Link to="/explore" className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/explore')}`}>
              <Compass size={18} />
              Explorer
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;