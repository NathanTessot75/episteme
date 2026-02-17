import React, { useState } from 'react';
import { X, Check, Globe, GraduationCap } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../Context/AuthContext';

const LinkAccountModal = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [provider, setProvider] = useState('ResearchGate');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError('');

        try {
            // 1. Insert request
            const { error: insertError } = await supabase
                .from('verification_requests')
                .insert([
                    {
                        user_id: user.id,
                        provider: provider,
                        profile_url: url
                    }
                ]);

            if (insertError) throw insertError;

            // 2. Demo Magic: Check if we were instantly approved?
            // In a real app we'd wait, but for the demo the trigger runs immediately.
            // We can also just assume success if no error for the "Request Sent" UI.

            // Let's check the profile to see if it was updated instantly (Trigger effect)
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', user.id)
                .single();

            if (profile?.is_premium) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess(); // Close and refresh
                }, 2000);
            } else {
                // Pending state
                setSuccess(true); // Still show success message for "Request Sent"
                setTimeout(onClose, 3000);
            }

        } catch (err) {
            console.error(err);
            setError("Erreur lors de l'envoi de la demande. Réessayez.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-8 text-center animate-bounce-in" onClick={e => e.stopPropagation()}>
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Compte lié !</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Vos accès Premium ont été débloqués. <br /> Profitez de la lecture.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl dark:text-white">Lier un compte académique</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X /></button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Prouvez votre statut de chercheur ou d'étudiant pour accéder gratuitement aux contenus premium.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            type="button"
                            onClick={() => setProvider('ResearchGate')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${provider === 'ResearchGate' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Globe size={24} />
                            <span className="font-bold text-sm">ResearchGate</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setProvider('University')}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${provider === 'University' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <GraduationCap size={24} />
                            <span className="font-bold text-sm">Université</span>
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            {provider === 'ResearchGate' ? 'Lien de votre profil' : 'Email universitaire'}
                        </label>
                        <input
                            type={provider === 'ResearchGate' ? 'url' : 'email'}
                            required
                            placeholder={provider === 'ResearchGate' ? 'https://www.researchgate.net/profile/...' : 'etudiant@univ.fr'}
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none dark:text-white transition-colors"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? "Vérification..." : "Valider mon statut"}
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                        Pour la démo, utilisez un lien contenant "researchgate.net".
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LinkAccountModal;
