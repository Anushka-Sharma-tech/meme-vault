'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// 🚀 The exact logic from GlobalChat to find the real username
function resolveUsername(profile, user) {
  const meta = user?.user_metadata || {};
  const name = 
    profile?.username || 
    meta.username || 
    meta.display_name || 
    meta.name || 
    meta.full_name || 
    '';
  
  return name.trim() || user?.email?.split('@')[0] || 'Guest';
}

export default function ProfilePanel({ closePanel }) {
  const [userData, setUserData] = useState({
    id: null,
    username: '', // This will hold the instantly resolved name
    changeCount: 0
  });
  
  const [tempUsername, setTempUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // 1. INSTANT LOAD: Get the user session from local cache
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const user = session.user;
      
      // Instantly resolve the username using metadata BEFORE the DB fetch
      const instantName = resolveUsername(null, user);
      
      setUserData(prev => ({ ...prev, id: user.id, username: instantName }));
      setTempUsername(instantName);

      // 2. BACKGROUND FETCH: Get edit limits from profiles table
      const { data } = await supabase
        .from('profiles')
        .select('id, username, username_change_count')
        .eq('id', user.id)
        .maybeSingle();
      
      // Re-resolve in case the DB has a newer edited username
      const finalName = resolveUsername(data, user);
      
      setUserData({
        id: user.id,
        username: finalName,
        changeCount: data?.username_change_count || 0
      });
      setTempUsername(finalName);
      setIsLoaded(true);
    };
    
    loadProfile();
  }, []);

  const saveUsername = async () => {
    if (userData.changeCount >= 2) {
      alert("You have reached your lifetime limit of 2 username changes.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: tempUsername, 
        username_change_count: userData.changeCount + 1 
      })
      .eq('id', userData.id);

    if (!error) {
      // Sync the auth metadata as well, so future sessions know the new name
      await supabase.auth.updateUser({ data: { username: tempUsername } });
      window.location.reload(); 
    } else {
      alert("Error: " + error.message);
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const limitReached = userData.changeCount >= 2;

  return (
    <div className="w-80 bg-[#121214] border border-zinc-800 p-5 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex flex-col gap-5 text-xs text-zinc-300 animate-fade-in origin-top-right relative z-50">
      
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <h4 className="font-bold text-orange-500 uppercase tracking-wide">Workspace Console</h4>
        <button onClick={closePanel} className="bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded-md flex items-center justify-center cursor-pointer">✕</button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
        <img 
          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData.username}`} 
          className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 shadow-md" 
          alt="avatar"
        />
        
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <input 
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="w-full bg-zinc-900 text-white font-bold text-sm px-2 py-1 rounded border border-orange-500 focus:outline-none"
              placeholder="New username..."
              maxLength={20}
            />
          ) : (
            <p className="text-white font-black text-[15px] truncate">
              {userData.username}
            </p>
          )}
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider mt-1">Studio Creator</p>
        </div>
      </div>

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button onClick={saveUsername} disabled={isSaving} className="flex-1 py-2 bg-orange-600 text-white font-bold rounded-lg uppercase">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg uppercase font-bold hover:bg-zinc-700">Cancel</button>
          </>
        ) : (
          <button 
            onClick={() => setIsEditing(true)} 
            disabled={limitReached || !isLoaded}
            className={`w-full py-2 rounded-lg font-bold uppercase transition-all ${
              limitReached 
                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {limitReached ? 'Limit Reached (2/2)' : 'Edit Username'}
          </button>
        )}
      </div>

      <button onClick={handleSignOut} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold uppercase hover:bg-red-600 hover:text-white transition-all cursor-pointer">
        Sign Out
      </button>
    </div>
  );
}