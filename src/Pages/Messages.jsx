import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../Context/AuthContext';
import { User, Send, MessageCircle } from 'lucide-react';
import PageTransition from '../Components/PageTransition';

const Messages = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (user) fetchFriends();
    }, [user]);

    useEffect(() => {
        if (selectedFriend) {
            setLoadingMessages(true);
            fetchMessages(selectedFriend.id);
            markMessagesAsRead(selectedFriend.id); // <--- Mark as read immediately

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

    const markMessagesAsRead = async (friendId) => {
        await supabase
            .from('direct_messages')
            .update({ is_read: true })
            .eq('sender_id', friendId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
    };

    const fetchMessages = async (friendId) => {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
        setLoadingMessages(false);
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
            <div className="flex h-[calc(100vh-100px)] max-w-6xl mx-auto pt-4 pb-4 px-4 gap-6">

                {/* SIDEBAR: FRIENDS LIST */}
                <div className="w-1/3 md:w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800/50">
                        <h2 className="font-bold text-xl dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl text-white shadow-lg shadow-purple-200 dark:shadow-none">
                                <User size={20} />
                            </div>
                            Mes connexions
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loadingFriends ? (
                            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
                        ) : friends.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm italic">
                                Vous ne suivez personne pour le moment.
                            </div>
                        ) : (
                            friends.map(friend => (
                                <button
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className={`w-full group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${selectedFriend?.id === friend.id
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-200/50 dark:shadow-none translate-x-2'
                                        : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:shadow-lg border border-transparent hover:border-purple-100 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${selectedFriend?.id === friend.id
                                        ? 'bg-white/20 text-white backdrop-blur-sm'
                                        : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-500'
                                        }`}>
                                        {friend.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left overflow-hidden relative z-10">
                                        <p className={`font-bold truncate ${selectedFriend?.id === friend.id ? 'text-white' : 'group-hover:text-purple-600 dark:group-hover:text-purple-400'} transition-colors`}>
                                            {friend.email?.split('@')[0]}
                                        </p>
                                        <p className={`text-xs truncate ${selectedFriend?.id === friend.id ? 'text-purple-100' : 'text-slate-400'}`}>
                                            {friend.email}
                                        </p>
                                    </div>
                                    {selectedFriend?.id === friend.id && (
                                        <div className="absolute right-4 w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
                    {!selectedFriend ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <MessageCircle size={40} className="text-purple-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Vos messages</h3>
                            <p>Sélectionnez une connexion à gauche pour démarrer la discussion.</p>
                        </div>
                    ) : (
                        <>
                            {/* CHAT HEADER */}
                            <div className="p-4 border-b border-gray-100/50 dark:border-slate-800/50 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                                            {selectedFriend.email?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                        {selectedFriend.email?.split('@')[0]}
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    </h3>
                                    <p className="text-xs text-slate-400">En ligne</p>
                                </div>
                            </div>

                            {/* MESSAGES LIST */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50/50 via-transparent to-transparent dark:from-purple-900/10" ref={scrollRef}>
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">👋</span>
                                        </div>
                                        <p>Dites bonjour à {selectedFriend.email?.split('@')[0]} !</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === user.id;
                                        const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 group animate-in slide-in-from-bottom-2 duration-500`}>
                                                {!isMe && (
                                                    <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                        {selectedFriend.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                <div className={`max-w-[70%] px-5 py-3.5 rounded-3xl text-sm leading-relaxed relative ${isMe
                                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm shadow-lg shadow-purple-500/20'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-sm shadow-sm'
                                                    }`}>
                                                    {msg.content}
                                                    <span className={`text-[10px] absolute -bottom-5 ${isMe ? 'right-0 text-slate-400' : 'left-0 text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {isMe && (
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 border border-purple-200 dark:border-slate-600 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                        {user.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* INPUT AREA */}
                            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-100 dark:border-slate-800">
                                <form onSubmit={sendMessage} className="flex gap-3 items-center max-w-3xl mx-auto">
                                    <div className="flex-1 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={`Écrivez à ${selectedFriend.email?.split('@')[0]}...`}
                                            className="relative w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-500/50 rounded-full outline-none transition-all dark:text-white dark:placeholder-slate-500 shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        <Send size={20} className={newMessage.trim() ? 'translate-x-[2px] -translate-y-[2px]' : ''} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </PageTransition>
    );
};

export default Messages;
