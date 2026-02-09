import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { Mail, Lock, Loader2, LogIn, UserPlus, Sparkles, ArrowRight } from 'lucide-react';
import PageTransition from '../Components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/'); 
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert("Compte créé ! Vérifiez vos emails ou connectez-vous.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Variantes d'animation pour les textes qui glissent
  const slideVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 }
  };

  return (
    <PageTransition>
      <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
        
        {/* FOND AMBIANT ANIMÉ */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-3xl -z-10" style={{ animationDelay: '2s' }}></div>

        {/* CARTE PRINCIPALE AVEC "layout" POUR REDIMENSIONNEMENT FLUIDE */}
        <motion.div 
          layout 
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl shadow-purple-100 dark:shadow-none border border-gray-100 dark:border-slate-800 w-full max-w-md relative z-10 backdrop-blur-sm"
        >
          
          <div className="text-center mb-8">
            {/* LOGO */}
            <motion.div 
              layout
              className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-purple-200 dark:shadow-none"
            >
              ε
            </motion.div>
            
            {/* TITRE QUI CHANGE */}
            <div className="h-16 relative flex flex-col items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "title-login" : "title-register"}
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="text-center absolute w-full"
                >
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                    {isLogin ? "Bon retour !" : "Rejoignez-nous"}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {isLogin ? "Accédez à votre espace scientifique" : "Commencez votre voyage d'apprentissage"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* MESSAGE D'ERREUR */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl text-center font-bold">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHAMPS INPUT */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:text-white font-medium placeholder:text-slate-400 text-sm"
                    placeholder="nom@exemple.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 ml-1">Mot de passe</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:text-white font-medium placeholder:text-slate-400 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* BOUTON D'ACTION PRINCIPAL AVEC ANIMATION FLUIDE */}
            <motion.button 
              layout
              type="submit" 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-4 relative overflow-hidden"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isLogin ? "btn-login" : "btn-register"}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                    <span>{isLogin ? "Se connecter" : "Créer un compte"}</span>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.button>
          </form>

          {/* PIED DE CARTE (SWITCH) */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={isLogin ? "switch-text-login" : "switch-text-reg"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-500 dark:text-slate-400 mb-2"
              >
                {isLogin ? "Première visite sur Épistémé ?" : "Vous avez déjà un compte ?"}
              </motion.p>
            </AnimatePresence>
            
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="group flex items-center gap-1 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-80 transition-all"
            >
              <AnimatePresence mode="wait">
                <motion.span
                   key={isLogin ? "link-create" : "link-connect"}
                   initial={{ x: -10, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   exit={{ x: 10, opacity: 0 }}
                   transition={{ duration: 0.2 }}
                >
                  {isLogin ? "Créer un compte gratuitement" : "Se connecter maintenant"}
                </motion.span>
              </AnimatePresence>
              <ArrowRight size={14} className="text-purple-600 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Auth;