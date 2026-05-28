'use client';
// app/components/GlobalChat.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const FORBIDDEN_WORDS = [
  'fuck','fucking','fucker','bitch','asshole','cunt','bastard','slut','whore',
  'dick','cock','pussy','nigger','faggot','retard','shit','bullshit',
  'chutiya','madarchod','behenchod','bsdk','randi','bhen ke laude','lawde',
  'bhosdike','gaandu','haramzada','harami','saala','kamine','bhosdi','lund',
  'maa ki aankh','teri maa ki','bakrichod','kutte','kamina','hijra',
  'kill you','murder you','rape you','stab you','shoot you','beat you up',
  'bash you','slice you','break your bones','smash your face','hurt you badly',
  'i will kill you','i will murder you','i will rape you','i will stab you',
  'i will shoot you','i will beat you','i will hurt you',
  'i am going to kill you','i am going to murder you','i am going to rape you',
  'i am going to stab you','i am going to shoot you','i am going to beat you',
  'gonna kill you','gonna murder you','gonna rape you','gonna stab you',
  'gonna shoot you','gonna beat you','will fuck you up','fuck you up',
  'tujhe chod doonga','teri maa ki choot','betichod',
];

const THREAT_PHRASES = [
  'kill you','murder you','rape you','stab you','shoot you','beat you up',
  'bash you','slice you','break your bones','smash your face','hurt you badly',
  'i will kill you','i will murder you','i will rape you','i will stab you',
  'i will shoot you','i will beat you','i will hurt you',
  'i am going to kill you','i am going to murder you','i am going to rape you',
  'i am going to stab you','i am going to shoot you','i am going to beat you',
  'gonna kill you','gonna murder you','gonna rape you','gonna stab you',
  'gonna shoot you','gonna beat you','will fuck you up','fuck you up',
];

function containsForbidden(text) {
  const lower = text.toLowerCase();
  return FORBIDDEN_WORDS.some(w => lower.includes(w));
}

function containsThreat(text) {
  const lower = text.toLowerCase();
  return THREAT_PHRASES.some(p => lower.includes(p));
}

function getChatUsername(profile, user) {
  const meta = user?.user_metadata || {};

  return (
    profile?.username ||
    meta.username ||
    meta.display_name ||
    meta.displayName ||
    meta.name ||
    meta.full_name ||
    meta.fullName ||
    ''
  ).trim();
}

function getVisibleAfter(profileCreatedAt) {
  const joinedAt = new Date(profileCreatedAt);
  const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return joinedAt > lastDay ? joinedAt : lastDay;
}

function formatMessageTime(createdAt) {
  if (!createdAt) return '';

  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GlobalChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [anonAlias, setAnonAlias] = useState('');
  const [showAliasInput, setShowAliasInput] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [chatError, setChatError] = useState('');
  const [mentionCount, setMentionCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [clearedBefore, setClearedBefore] = useState(null);
  const [chatNoticeSeen, setChatNoticeSeen] = useState(true);

  const endRef = useRef(null);
  const messageRefs = useRef({});
  const channelRef = useRef(null);
  const profileRef = useRef(null);
  const userSessionRef = useRef(null);

  const myUsername = getChatUsername(profile, userSession?.user);

  const clearStorageKey = userSession?.user?.id
    ? `global_chat_cleared_before_${userSession.user.id}`
    : 'global_chat_cleared_before_guest';

  const noticeStorageKey = userSession?.user?.id
    ? `global_chat_notice_seen_${userSession.user.id}`
    : null;

  useEffect(() => {
    profileRef.current = profile;
    userSessionRef.current = userSession;
  }, [profile, userSession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedClearTime = localStorage.getItem(clearStorageKey);
    if (savedClearTime) setClearedBefore(savedClearTime);
  }, [clearStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !noticeStorageKey) {
      setChatNoticeSeen(true);
      return;
    }

    setChatNoticeSeen(localStorage.getItem(noticeStorageKey) === 'true');
  }, [noticeStorageKey]);

  useEffect(() => {
    const userId = userSession?.user?.id;
    if (!userId) return;

    const channelName = `profile-update-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const profileChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [userSession?.user?.id]);

  useEffect(() => {
    const loadProfile = async (session) => {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, username_edit_count, warnings, blocks, permanent_ban, unblock_date, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile load failed:', error);
        return;
      }

      if (data) setProfile(data);
    };

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserSession(session);
      await loadProfile(session);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      loadProfile(session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!profile?.created_at) {
        setMessages([]);
        return;
      }

      const visibleAfter = getVisibleAfter(profile.created_at);

      const { error: deleteError } = await supabase.rpc('delete_old_global_chat_messages');
      if (deleteError) {
        console.warn('Old chat cleanup skipped:', deleteError.message);
      }

      const { data, error } = await supabase
        .from('global_chat')
        .select('*')
        .gte('created_at', visibleAfter.toISOString())
        .order('created_at', { ascending: true })
        .limit(60);

      if (error) {
        console.error('Global chat load failed:', error);
        setMessages([]);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();
  }, [profile?.created_at]);

  useEffect(() => {
    const channelId = `global-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'global_chat' },
        (payload) => {
          const msg = payload.new;
          const currentProfile = profileRef.current;
          const currentName = getChatUsername(
            currentProfile,
            userSessionRef.current?.user
          );

          if (currentProfile?.created_at) {
            const visibleAfter = getVisibleAfter(currentProfile.created_at);
            if (new Date(msg.created_at) < visibleAfter) return;
          }

          setMessages(prev => {
            const tempIdx = prev.findIndex(
              m => String(m.id).startsWith('temp-') && m.message === msg.message
            );

            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = msg;
              return next;
            }

            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (
            currentName &&
            !msg.is_anon &&
            msg.message.toLowerCase().includes(`@${currentName.toLowerCase()}`)
          ) {
            setMentionCount(c => c + 1);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const scrollToMessage = useCallback((id) => {
    const el = messageRefs.current[id];

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-flash');
      setTimeout(() => el.classList.remove('highlight-flash'), 1500);
    }
  }, []);

  const markChatNoticeSeen = () => {
    setChatNoticeSeen(true);

    if (typeof window !== 'undefined' && noticeStorageKey) {
      localStorage.setItem(noticeStorageKey, 'true');
    }
  };

  const send = async (e) => {
    e.preventDefault();

    const text = newMessage.trim();
    if (!text) return;

    setChatError('');

    if (!userSession) {
      setChatError('Sign in to chat.');
      return;
    }

    const now = new Date();

    if (profile?.permanent_ban) {
      setChatError('You are permanently banned from chat.');
      return;
    }

    if (profile?.unblock_date && new Date(profile.unblock_date) > now) {
      const hoursLeft = Math.ceil((new Date(profile.unblock_date) - now) / 3600000);
      setChatError(`You are blocked for ${hoursLeft} more hour(s).`);
      return;
    }

    const isThreaten = containsThreat(text);
    const isForbid = containsForbidden(text);

    if (isThreaten || isForbid) {
      const isThreatMultiplier = isThreaten ? 2 : 1;
      let warnings = (profile?.warnings || 0) + isThreatMultiplier;
      let blocks = profile?.blocks || 0;
      let permBan = false;
      let unblockDate = null;

      if (warnings >= 3) {
        blocks += 1;
        warnings = 0;

        if (blocks >= 3) {
          permBan = true;
        } else {
          unblockDate = new Date(Date.now() + 2 * 86400000).toISOString();
        }
      }

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ warnings, blocks, permanent_ban: permBan, unblock_date: unblockDate })
        .eq('id', userSession.user.id)
        .select('id, username, username_edit_count, warnings, blocks, permanent_ban, unblock_date, created_at')
        .maybeSingle();

      if (updatedProfile) setProfile(updatedProfile);

      if (permBan) {
        setChatError('Permanently banned for repeated violations.');
      } else if (unblockDate) {
        setChatError(`Blocked for 2 days. ${blocks}/3 blocks.`);
      } else {
        setChatError(`Warning ${warnings}/3 - message blocked.`);
      }

      setNewMessage('');
      return;
    }

    const realName = getChatUsername(profile, userSession.user);

    if (!isAnon && !realName) {
      console.log('No chat username found. Profile:', profile);
      console.log('User metadata:', userSession.user.user_metadata || {});

      setChatError('Username not found. Please check your profile setup.');
      return;
    }

    const displayName = isAnon
      ? `Incognito ${anonAlias.trim() || 'Ghost'}`
      : realName;

    const tempId = `temp-${Date.now()}`;

    const tempMsg = {
      id: tempId,
      message: text,
      user_id: userSession.user.id,
      anon_username: displayName,
      is_anon: isAnon,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    const { data: insertedMsg, error } = await supabase
      .from('global_chat')
      .insert([{
        message: text,
        user_id: userSession.user.id,
        anon_username: displayName,
        is_anon: isAnon,
      }])
      .select()
      .single();

    if (error) {
      console.error('Global chat send failed:', error);

      setMessages(prev => prev.filter(m => m.id !== tempId));
      setChatError(error.message || 'Message could not be sent.');
      setNewMessage(text);
      return;
    }

    if (insertedMsg) {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? insertedMsg : m)
      );
    }
  };

  const clearChat = () => {
    const clearedAt = new Date().toISOString();

    setClearedBefore(clearedAt);
    setMessages([]);
    setCleared(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem(clearStorageKey, clearedAt);
    }

    setTimeout(() => setCleared(false), 3000);
  };

  const openChat = () => {
    setIsOpen(true);
    setMentionCount(0);
  };

  const visibleMessages = clearedBefore
    ? messages.filter(m => m.created_at > clearedBefore)
    : messages;

  const isRestricted = profile?.permanent_ban ||
    (profile?.unblock_date && new Date(profile.unblock_date) > new Date());

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none text-xs">
      {!isOpen && (
        <div className="relative">
          {mentionCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-lg z-10">
              {mentionCount > 9 ? '9+' : mentionCount}
            </span>
          )}

          <button
            onClick={openChat}
            className="w-14 h-14 rounded-full bg-orange-600 text-white font-black text-xl shadow-[0_0_24px_rgba(249,115,22,0.45)] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          >
            Chat
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="w-80 md:w-96 h-[500px] bg-[#0e0e10] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ animation: 'chatSlideIn 0.25s cubic-bezier(0.32,0.72,0,1)' }}
        >
          <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white font-black text-[10px] tracking-widest uppercase">
                Live Global Chat
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                title="Clear chat permanently for you"
                className="bg-red-600/15 border border-red-500/50 text-red-300 hover:bg-red-600 hover:text-white transition-colors text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wide"
              >
                Clear
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors"
              >
                x
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-zinc-950 scroll-smooth">
            {userSession && !chatNoticeSeen && (
              <div className="text-[10px] text-orange-200 bg-orange-500/10 border border-orange-500/30 rounded-xl p-2 mb-2 leading-snug">
                Global chat only shows messages from after you joined MemeVault. Messages show timestamps and auto-delete after 24 hours.
                <button
                  onClick={markChatNoticeSeen}
                  className="block mt-1 text-orange-400 hover:text-orange-300 font-bold"
                >
                  Got it
                </button>
              </div>
            )}

            {cleared && (
              <div className="text-center text-zinc-500 text-[10px] py-4">
                Chat cleared for you. Others still see messages.
              </div>
            )}

            {visibleMessages.length === 0 && !cleared && (
              <div className="text-center text-zinc-700 text-[10px] py-8">
                No messages yet. Say hi!
              </div>
            )}

            {visibleMessages.map(msg => {
              const isMentioned =
                myUsername &&
                !msg.is_anon &&
                msg.message.toLowerCase().includes(`@${myUsername.toLowerCase()}`);

              const isTemp = String(msg.id).startsWith('temp-');

              return (
                <div
                  key={msg.id}
                  ref={el => { if (el) messageRefs.current[msg.id] = el; }}
                  className={`p-3 rounded-2xl shadow-lg max-w-[72%] break-words transition-all
                    ${userSession?.user && msg.user_id === userSession.user.id
                      ? `bg-orange-700 text-white ml-auto font-medium ${isTemp ? 'opacity-60' : ''}`
                      : 'bg-zinc-800 text-zinc-100 mr-auto border border-zinc-700'
                    }
                    ${isMentioned ? 'ring-2 ring-red-400 animate-pulse' : ''}`
                  }
                >
                  <span className="block text-[9px] text-white/80 uppercase tracking-widest font-black mb-1">
                    {msg.anon_username}
                  </span>

                  <span className="text-sm font-semibold leading-relaxed">
                    <MessageWithTags
                      text={msg.message}
                      myUsername={myUsername}
                      allMessages={visibleMessages}
                      onTagClick={scrollToMessage}
                    />
                  </span>

                  <div className="text-[8px] text-white/50 mt-1">
                    {formatMessageTime(msg.created_at)}
                  </div>

                  {isMentioned && (
                    <div className="text-[8px] text-red-200 uppercase font-bold mt-1">
                      Mentioned
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={endRef} />
          </div>

          <div className="bg-zinc-900 border-t border-zinc-800 p-3 shrink-0 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              {userSession && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnon}
                    onChange={e => {
                      setIsAnon(e.target.checked);
                      setShowAliasInput(e.target.checked);
                    }}
                    className="accent-orange-500 w-3 h-3 cursor-pointer"
                  />

                  <span className={`text-[10px] font-bold ${isAnon ? 'text-orange-400' : 'text-zinc-500'}`}>
                    Incognito
                  </span>
                </label>
              )}

              {profile && !profile.permanent_ban && (
                <div className="flex items-center gap-0.5" title={`${profile.warnings || 0}/3 warnings`}>
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < (profile.warnings || 0) ? 'bg-red-500' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                  <span className="text-[8px] text-zinc-600 ml-1">warns</span>
                </div>
              )}
            </div>

            {isAnon && showAliasInput && (
              <input
                type="text"
                maxLength={20}
                placeholder="Your incognito alias (optional)..."
                value={anonAlias}
                onChange={e => setAnonAlias(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-white text-[10px] placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            )}

            {chatError && (
              <p className="text-red-400 text-[10px] font-medium px-1 leading-tight">
                {chatError}
              </p>
            )}

            <form onSubmit={send} className="flex gap-2 justify-end">
              <input
                suppressHydrationWarning
                type="text"
                placeholder={
                  !userSession ? 'Sign in to chat...' :
                  isRestricted ? 'You are restricted...' :
                  isAnon ? `Incognito ${anonAlias || 'Ghost'} - type message...` :
                  '@username or message...'
                }
                disabled={!userSession || !!isRestricted}
                value={newMessage}
                onChange={e => {
                  setNewMessage(e.target.value);
                  setChatError('');
                }}
                className="w-[82%] bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 disabled:opacity-40 transition-colors text-[11px]"
              />

              <button
                type="submit"
                disabled={!userSession || !!isRestricted || !newMessage.trim()}
                className="bg-orange-700 hover:bg-orange-600 disabled:opacity-40 text-white font-bold px-3 rounded-xl transition-colors shrink-0"
              >
                ↑
              </button>
            </form>

            {userSession && !isAnon && (
              <p className="text-[8px] text-zinc-700 px-0.5">
                Type @username to tag. Incognito users cannot be tagged.
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .highlight-flash {
          animation: flashHighlight 1.5s ease-out;
        }

        @keyframes flashHighlight {
          0%   { background-color: rgba(249,115,22,0.35); }
          100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
}

function MessageWithTags({ text, myUsername, allMessages, onTagClick }) {
  const parts = text.split(/(@\w+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith('@')) return <span key={i}>{part}</span>;

        const taggedName = part.slice(1);
        const isMe = myUsername && taggedName.toLowerCase() === myUsername.toLowerCase();

        const targetMsg = [...allMessages]
          .reverse()
          .find(m =>
            !m.is_anon &&
            m.anon_username?.toLowerCase() === taggedName.toLowerCase()
          );

        return (
          <span
            key={i}
            onClick={() => targetMsg && onTagClick(targetMsg.id)}
            className={`font-bold cursor-pointer px-0.5 rounded transition-colors ${
              isMe
                ? 'text-orange-200 bg-orange-900/40 hover:bg-orange-900/60'
                : targetMsg
                  ? 'text-sky-300 hover:text-sky-200'
                  : 'text-zinc-500 cursor-default'
            }`}
            title={targetMsg ? `Jump to ${taggedName}'s message` : `${taggedName} not found`}
          >
            {part}
          </span>
        );
      })}
    </>
  );
}