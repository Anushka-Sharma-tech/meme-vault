'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './utils/supabase';
import MemeCard from './components/MemeCard';
import ProfilePanel from './components/ProfilePanel';
import SoundCard from './components/SoundCard';
import AuthModal from './components/AuthModal';
import AnimeMascot from './components/AnimeMascot';
import GlobalChat from './components/GlobalChat';

function decodeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replaceAll('&amp;', '&');
}

function isUsableImageUrl(url) {
  if (!url) return false;

  const blocked = ['self', 'default', 'nsfw', 'spoiler'];
  if (blocked.includes(url)) return false;

  return (
    url.startsWith('http') ||
    url.startsWith('/') ||
    url.startsWith('data:image')
  );
}

function getMemeImageUrl(meme) {
  if (!meme) return '';

  const candidates = [
    meme.image,
    meme.url_overridden_by_dest,
    meme.preview?.images?.[0]?.source?.url,
    meme.preview?.images?.[0]?.resolutions?.at(-1)?.url,
    meme.thumbnail,
    meme.url,
  ]
    .map(decodeImageUrl)
    .filter(isUsableImageUrl);

  return candidates[0] || '';
}

function getRenderedCardImageUrl(cardEl) {
  const img = cardEl?.querySelector('img');

  if (img?.currentSrc) return img.currentSrc;
  if (img?.src) return img.src;

  const bgEl = cardEl?.querySelector('[style*="background-image"]');
  const bg = bgEl?.style?.backgroundImage;
  const match = bg?.match(/url\(["']?(.*?)["']?\)/);

  return match?.[1] || '';
}

export default function Home() {
  const [memes, setMemes] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('MEMES');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [selectedMemeImageUrl, setSelectedMemeImageUrl] = useState('');
  const [lightboxImageError, setLightboxImageError] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const observerRef = useRef(null);

  const CATEGORIES = ['MEMES', 'AUDIO MEMES', 'MATHS', 'SCIENCE', 'TECH', 'CHESS', 'LOVE', 'POLITICS', 'INDIAN SERIAL', 'INDIAN PARENTS'];

  const fetchFeed = async (category, append = false, token = '', query = '') => {
    if (!append) setLoading(true);
    else setFetchingMore(true);

    try {
      if (category === 'AUDIO MEMES') {
        const res = await fetch(`/api/audio-memes?search=${encodeURIComponent(query)}&page=${append ? 2 : 1}`);
        const data = await res.json();
        setSounds(prev => append ? [...prev, ...(data.sounds || [])] : (data.sounds || []));
        setMemes([]);
      } else {
        const res = await fetch(`/api/memes?category=${encodeURIComponent(category)}&after=${token}&search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setMemes(prev => append ? [...prev, ...(data.memes || [])] : (data.memes || []));
        setNextPageToken(data.nextPage || null);
        setSounds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed('MEMES');
    supabase.auth.getSession().then(({ data: { session } }) => setUserSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUserSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || fetchingMore || !nextPageToken || activeCategory === 'AUDIO MEMES') return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchFeed(activeCategory, true, nextPageToken, searchInput);
      }
    }, { rootMargin: '200px', threshold: 0.1 });

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextPageToken, loading, fetchingMore, activeCategory, searchInput]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      fetchFeed(activeCategory, false, '', searchInput);
    }
  };

  const openLightbox = (meme, event) => {
    const renderedImageUrl = getRenderedCardImageUrl(event.currentTarget);
    const dataImageUrl = getMemeImageUrl(meme);

    setLightboxImageError(false);
    setSelectedMemeImageUrl(renderedImageUrl || dataImageUrl);
    setSelectedMeme(meme);
  };

  const closeLightbox = () => {
    setSelectedMeme(null);
    setSelectedMemeImageUrl('');
    setLightboxImageError(false);
  };

  return (
    <main suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#121212] text-zinc-200 font-sans relative overflow-x-hidden">
      <header className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/60 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-10 w-full sm:max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter drop-shadow-md whitespace-nowrap">
            Meme<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Mascot</span>
          </h1>

          <div className="flex-1 w-full sm:w-auto flex sm:max-w-xl bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-700/50 shadow-inner focus-within:border-orange-500 transition-colors">
            <span className="pl-3 sm:pl-4 pr-2 flex items-center text-zinc-500">🔍</span>
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Type & press Enter to search memes..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full bg-transparent px-2 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="relative flex gap-4 items-center shrink-0">
          {userSession ? (
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-sm uppercase shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:scale-105 transition-transform"
            >
              {userSession.user.email[0]}
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold text-sm shadow-lg hover:border-orange-500 hover:text-orange-400 transition-all"
            >
              Sign In
            </button>
          )}

          {showProfile && userSession && (
            <div className="absolute right-0 top-full mt-3 z-50">
              <ProfilePanel closePanel={() => setShowProfile(false)} />
            </div>
          )}
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:pl-[340px] lg:pr-8 py-6 flex flex-wrap gap-2 select-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setSearchInput('');
              fetchFeed(cat);
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider transition-all shadow-sm ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] border-transparent'
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex">
        <div className="hidden lg:block lg:w-[340px] shrink-0" />

        <div className="flex-1 px-4 sm:px-6 lg:pr-10 pb-16">
          {loading && memes.length === 0 && sounds.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl h-72" />
              ))}
            </div>
          ) : !loading && memes.length === 0 && sounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <span className="text-4xl mb-3">📭</span>
              <p className="font-bold">No results found.</p>
            </div>
          ) : (
            <>
              {activeCategory === 'AUDIO MEMES' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {sounds.map(sound => <SoundCard key={sound.id} sound={sound} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {memes.map((meme, i) => (
                    <div
                      key={`${meme.id}-${i}`}
                      className="cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={(e) => openLightbox(meme, e)}
                    >
                      <MemeCard meme={meme} />
                    </div>
                  ))}
                </div>
              )}

              <div ref={observerRef} className="h-12 w-full flex items-center justify-center text-xs sm:text-sm text-zinc-500 mt-8 font-medium italic">
                {fetchingMore && activeCategory !== 'AUDIO MEMES' ? 'Summoning the next wave of memes...' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox Modal - only used for normal meme cards, not audio memes */}
      {selectedMeme && (() => {
        const memeImageUrl = selectedMemeImageUrl || getMemeImageUrl(selectedMeme);

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in"
            onClick={closeLightbox}
          >
            <div
              className="relative w-full max-w-5xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {memeImageUrl && !lightboxImageError ? (
                <img
                  src={memeImageUrl}
                  alt={selectedMeme.title || 'Meme'}
                  referrerPolicy="no-referrer"
                  onError={() => setLightboxImageError(true)}
                  className="max-h-[82vh] max-w-full object-contain rounded-xl border border-zinc-800 shadow-2xl bg-zinc-950"
                />
              ) : (
                <div className="max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center shadow-2xl">
                  <p className="text-sm font-bold text-zinc-300 mb-4">
                    This meme image could not be loaded here.
                  </p>

                  {(selectedMeme.url || selectedMemeImageUrl) && (
                    <a
                      href={selectedMemeImageUrl || selectedMeme.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex px-5 py-2 rounded-full bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 transition-colors"
                    >
                      Open original
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={closeLightbox}
                className="mt-6 px-8 py-2 bg-zinc-800 text-white font-bold rounded-full hover:bg-orange-600 transition-all"
              >
                Close ✕
              </button>
            </div>
          </div>
        );
      })()}

      <AnimeMascot />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <GlobalChat />
    </main>
  );
}