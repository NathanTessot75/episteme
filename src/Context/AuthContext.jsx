import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier la session actuelle au démarrage
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Supabase getSession aborted (likely cancelled request). Ignoring.');
        } else {
          console.error('Error checking session:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 2. Écouter les changements (Connexion, Déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fonctions d'action
  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Erreur lors de la déconnexion Supabase (ignorée):", error);
    } finally {
      // Dans tous les cas, on nettoie l'état local
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);