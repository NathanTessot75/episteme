import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, BookOpen, Compass, Moon, Sun, LogIn } from 'lucide-react';
import { useApp } from '../Context/AppContext';
import { useAuth } from '../Context/AuthContext';

const Sidebar = () => {
  const { toggleTheme, darkMode } = useApp();
  const { user } = useAuth();

  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/library", icon: BookOpen, label: "Bibliothèque" },
    { to: "/explorer", icon: Compass, label: "Explorer" },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen flex-col sticky top-0 left-0 z-50 transition-colors duration-300">

      {/* DÉGRADÉ SVG */}
      <svg width="0" height="0" className="absolute block w-0 h-0 overflow-hidden">
        <defs>
          <linearGradient id="gradient-icon" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9333ea" offset="0%" />
            <stop stopColor="#2563eb" offset="100%" />
          </linearGradient>
        </defs>
      </svg>

      {/* LOGO */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm text-white">
            <span className="font-sans font-bold text-3xl pb-1 leading-none">ε</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Épistémé
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-purple-50 shadow-sm ring-1 ring-purple-100 dark:bg-slate-800 dark:ring-slate-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  style={isActive ? { stroke: "url(#gradient-icon)" } : {}}
                  className={isActive ? '' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors'}
                />
                <span className={isActive ? "font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" : ""}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
        {user ? (
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">Mon Profil</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </Link>
        ) : (
          /* 👇 BOUTON SE CONNECTER AVEC DÉGRADÉ AU SURVOL 👇 */
          <Link to="/auth" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white group transition-all duration-300 hover:shadow-lg hover:shadow-purple-200 dark:hover:shadow-none">
            <LogIn size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-white transition-colors" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors">Se connecter</span>
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <span className="text-xs font-bold flex items-center gap-2">
            {darkMode ? <Moon size={14} /> : <Sun size={14} />}
            {darkMode ? "Mode Nuit" : "Mode Jour"}
          </span>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${darkMode ? 'translate-x-4' : ''}`}></div>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;