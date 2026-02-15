import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../Context/AuthContext';
import { User, Send, MessageSquare } from 'lucide-react';
import PageTransition from '../Components/PageTransition';

const Messages = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingFriends, setLoadingFriends] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (user) fetchFriends();
    }, [user]);

    useEffect(() => {
        if (selectedFriend) {
            fetchMessages(selectedFriend.id);

            // Subscribe to new messages
            const channel = supabase
                .channel('realtime:messages')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `receiver_id=eq.${user.id}`, // Listen for messages sent TO me
                }, (payload) => {
                    if (payload.new.sender_id === selectedFriend.id) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `sender_id=eq.${user.id}`, // Listen for messages sent BY me (if multi-tab)
                }, (payload) => {
                    if (payload.new.receiver_id === selectedFriend.id) {
                        // Check duplication just in case
                        setMessages(prev => {
                            if (prev.find(m => m.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedFriend, user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchFriends = async () => {
        setLoadingFriends(true);
        try {
            // Get people I follow
            const { data: following } = await supabase
                .from('relationships')
                .select('following_id, profiles!relationships_following_id_fkey(*)')
                .eq('follower_id', user.id);

            // Map to a cleaner format
            const friendList = following?.map(f => f.profiles) || [];
            setFriends(friendList);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const fetchMessages = async (friendId) => {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedFriend) return;

        const msgContent = newMessage;
        setNewMessage(""); // Optimistic clear

        // Optimistic UI update (optional, usually safer to wait for DB confirmation or subscription)
        // But since we have subscription listening to "sender_id=eq.user.id", we can rely on that OR just manual push.
        // Let's manually push for instant feel, and de-dupe in subscription.

        /* 
           Actually, waiting for subscription is slightly slower. 
           Let's insert and rely on fetch/subscription for sync. 
        */

        const { data, error } = await supabase.from('direct_messages').insert([{
            sender_id: user.id,
            receiver_id: selectedFriend.id,
            content: msgContent
        }]).select().single();

        if (error) {
            console.error("Error sending message:", error);
        } else if (data) {
            setMessages(prev => [...prev, data]);
        }
    };

    if (!user) return null;

    return (
        <PageTransition>
            <div className="flex h-[calc(100vh-100px)] max-w-6xl mx-auto pt-4 pb-4 px-4 gap-4">

                {/* SIDEBAR: FRIENDS LIST */}
                <div className="w-1/3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
                            <User size={20} className="text-purple-600" /> Mes connexions
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingFriends ? (
                            <div className="text-center p-4 text-slate-400">Chargement...</div>
                        ) : friends.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm">
                                Vous ne suivez personne pour le moment.
                            </div>
                        ) : (
                            friends.map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedFriend?.id === friend.id
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                        {friend.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="font-bold truncate">{friend.email?.split('@')[0]}</p>
                                        <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden relative">
                    {!selectedFriend ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>Sélectionnez un ami pour discuter.</p>
                        </div>
                    ) : (
                        <>
                            {/* CHAT HEADER */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 shadow-sm z-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white">
                                    {selectedFriend.email?.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-lg dark:text-white">{selectedFriend.email?.split('@')[0]}</h3>
                            </div>

                            {/* MESSAGES LIST */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50" ref={scrollRef}>
                                {messages.length === 0 ? (
                                    <div className="text-center text-slate-400 mt-10 text-sm">Début de la conversation. Dites bonjour !</div>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe
                                                    ? 'bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-200 dark:shadow-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none shadow-sm'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* INPUT AREA */}
                            <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Écrivez un message..."
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-purple-500 rounded-xl outline-none transition-all dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    )}
                </div>

            </div>
        </PageTransition>
    );
};

export default Messages;
