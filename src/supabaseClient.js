import { createClient } from '@supabase/supabase-js';

// On force les variables en string pour éviter les bugs si le .env est mal lu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.toString();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.toString();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERREUR : Les clés Supabase sont manquantes dans le fichier .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);