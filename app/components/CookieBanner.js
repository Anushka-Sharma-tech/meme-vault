'use client';
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('memeVault_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('memeVault_cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 p-4 z-[200] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="text-zinc-300 text-center sm:text-left">
        We use essential cookies and local storage to keep you logged in and secure your chat session. By continuing to use MemeMascot, you agree to our <a href="/privacy" className="text-orange-400 hover:underline">Privacy Policy</a>.
      </div>
      <button 
        onClick={acceptCookies}
        className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg whitespace-nowrap transition-colors"
      >
        Got it!
      </button>
    </div>
  );
}