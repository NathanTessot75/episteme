import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Home from './Pages/Home';
import Library from './Pages/Library';
import ArticleDetail from './Pages/ArticleDetail';
import Explorer from './Pages/Explorer';
import Auth from './Pages/Auth';
import Profile from './Pages/Profile';
import PlaylistDetail from './Pages/PlaylistDetail'; // <--- 1. IMPORT
import Sidebar from './Components/Sidebar';

function App() {
  const location = useLocation();

  return (
    <div className="flex bg-slate-50 min-h-screen dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300">
      
      <Sidebar />

      <div className="flex-1 p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* 👇 2. C'EST CETTE LIGNE QUI MANQUAIT 👇 */}
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;