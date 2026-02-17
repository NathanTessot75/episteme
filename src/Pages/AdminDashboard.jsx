import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../Context/AuthContext';
import { Check, X, Shield, Globe, GraduationCap, Clock } from 'lucide-react';
import PageTransition from '../Components/PageTransition';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user) return;
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (data?.is_admin) {
            setIsAdmin(true);
            fetchRequests();
        } else {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('verification_requests')
            .select('*, profiles:user_id(email)') // assuming relationships, or just user_id
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        setRequests(data || []);
        setLoading(false);
    };

    const handleAction = async (requestId, userId, status) => {
        // Optimistic update
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));

        try {
            // 1. Update Request Status
            const { error: reqError } = await supabase
                .from('verification_requests')
                .update({ status })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. If Approved, Upgrade User
            if (status === 'approved') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ is_premium: true })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

        } catch (err) {
            console.error(err);
            alert("Erreur lors de la mise à jour.");
            fetchRequests(); // Revert on error
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;

    if (!isAdmin) return (
        <div className="p-20 text-center text-red-500 font-bold text-xl">
            <Shield size={48} className="mx-auto mb-4" />
            Accès non autorisé.
        </div>
    );

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto py-10 px-6">
                <h1 className="text-3xl font-bold mb-8 dark:text-white flex items-center gap-3">
                    <Shield className="text-purple-600" /> Dashboard Admin
                </h1>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase">
                                <tr>
                                    <th className="p-6">Utilisateur</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6">Preuve (URL / Email)</th>
                                    <th className="p-6">Date</th>
                                    <th className="p-6 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-slate-400">Aucune demande en attente.</td>
                                    </tr>
                                )}
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-6 dark:text-gray-300 font-medium">
                                            {req.user_id} <br />
                                            <span className='text-xs text-slate-400'>ID</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${req.provider === 'ResearchGate'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                }`}>
                                                {req.provider === 'ResearchGate' ? <Globe size={12} /> : <GraduationCap size={12} />}
                                                {req.provider}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <a href={req.profile_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline max-w-[200px] truncate block" title={req.profile_url}>
                                                {req.profile_url}
                                            </a>
                                        </td>
                                        <td className="p-6 text-slate-500 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {req.status === 'pending' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(req.id, req.user_id, 'approved')}
                                                        className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                                        title="Approuver"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, req.user_id, 'rejected')}
                                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                        title="Rejeter"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`font-bold text-sm ${req.status === 'approved' ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    {req.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default AdminDashboard;
