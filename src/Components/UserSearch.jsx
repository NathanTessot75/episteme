import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserSearch = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            // Search in public.profiles
            // Note: This relies on the profiles being populated.
            // Since we just created the table, only NEW users will have profiles automatically.
            // Existing users might need a backfill, but for now we assume new data.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email')
                .ilike('email', `%${query}%`)
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mb-10">
            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un utilisateur par email..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? "..." : "Trouver"}
                </button>
            </form>

            {searched && (
                <div className="space-y-2">
                    {results.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">Aucun utilisateur trouvé.</div>
                    ) : (
                        results.map(user => (
                            <Link
                                key={user.id}
                                to={`/user/${user.id}`}
                                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{user.email.split('@')[0]}</h4>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearch;
