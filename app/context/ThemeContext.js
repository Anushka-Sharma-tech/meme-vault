'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const ThemeContext = createContext();

export const THEMES = {
  'dark-zinc': { bg: 'bg-[#0f0f0f]', text: 'text-white', border: 'border-zinc-800', accent: 'bg-orange-600', panel: 'bg-[#121212]' },
  'anime-naruto': { bg: 'bg-[#1a0f05]', text: 'text-amber-100', border: 'border-orange-950', accent: 'bg-orange-500', panel: 'bg-[#261507]' },
  'cyberpunk-neon': { bg: 'bg-[#050014]', text: 'text-cyan-400', border: 'border-fuchsia-900', accent: 'bg-fuchsia-600', panel: 'bg-[#0c0224]' },
  'light-clean': { bg: 'bg-zinc-50', text: 'text-zinc-900', border: 'border-zinc-200', accent: 'bg-blue-600', panel: 'bg-white' }
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark-zinc');

  useEffect(() => {
    async function loadUserTheme() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('active_theme').eq('id', user.id).single();
        if (data?.active_theme && THEMES[data.active_theme]) setThemeName(data.active_theme);
      }
    }
    loadUserTheme();
  }, []);

  const changeTheme = async (newTheme) => {
    if (!THEMES[newTheme]) return;
    setThemeName(newTheme);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ active_theme: newTheme }).eq('id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme: THEMES[themeName], themeName, changeTheme }}>
      <div className={`${THEMES[themeName].bg} ${THEMES[themeName].text} min-h-screen transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);