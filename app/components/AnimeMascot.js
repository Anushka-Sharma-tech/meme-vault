'use client';
import { useState, useEffect } from 'react';

const DEFAULT_MASCOT = {
  name: 'Joseph Joestar',
  image: '/joseph.png',
  about: 'Next you are going to say... let\'s look at some memes!'
};

const DEFAULT_POPULAR_CHARACTERS = [
  { name: 'Mikasa Ackerman', malId: 40881, image: 'https://cdn.myanimelist.net/images/characters/9/118823.jpg', about: 'I will follow you anywhere.' },
  { name: 'Satoru Gojo', malId: 164471, image: 'https://cdn.myanimelist.net/images/characters/15/429402.jpg', about: 'Don\'t worry, I\'m the strongest.' },
  { name: 'Naruto Uzumaki', image: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg', about: 'Believe it! Let\'s find some memes!' },
  { name: 'Levi Ackerman', image: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg', about: 'Tch. Let\'s get this over with.' },
  { name: 'Monkey D. Luffy', image: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg', about: 'I\'m gonna be the Meme King!' }
];

function proxiedImage(url) {
  if (!url || url.startsWith('/')) return url || DEFAULT_MASCOT.image;
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
}

function imageCandidates(url) {
  if (!url) return [DEFAULT_MASCOT.image];
  if (url.startsWith('/')) return [url];

  return [
    url,
    proxiedImage(url),
    DEFAULT_MASCOT.image
  ];
}

function SmartImage({ src, alt, className }) {
  const [index, setIndex] = useState(0);
  const candidates = imageCandidates(src);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  return (
    <img
      src={candidates[index]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        setIndex(current => Math.min(current + 1, candidates.length - 1));
      }}
      className={className}
    />
  );
}

export default function AnimeMascot() {
  const [activeMascot, setActiveMascot] = useState(DEFAULT_MASCOT);
  const [popularCharacters, setPopularCharacters] = useState(DEFAULT_POPULAR_CHARACTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bubbleText, setBubbleText] = useState('Double click my frame to search any anime character!');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMascot = localStorage.getItem('userMascot');
    if (savedMascot) {
      try {
        setActiveMascot(JSON.parse(savedMascot));
      } catch {
        localStorage.removeItem('userMascot');
      }
    }

    const refreshPopularImages = async () => {
      const refreshed = [];

      for (const char of DEFAULT_POPULAR_CHARACTERS) {
        if (!char.malId) {
          refreshed.push(char);
          continue;
        }

        try {
          const res = await fetch(`https://api.jikan.moe/v4/characters/${char.malId}`);
          const data = await res.json();

          refreshed.push({
            ...char,
            image:
              data?.data?.images?.webp?.image_url ||
              data?.data?.images?.jpg?.image_url ||
              char.image,
            about: data?.data?.about?.split('\n')[0] || char.about
          });
        } catch {
          refreshed.push(char);
        }

        await new Promise(resolve => setTimeout(resolve, 350));
      }

      setPopularCharacters(refreshed);
    };

    refreshPopularImages();
  }, []);

  const saveMascot = (char) => {
    const nextMascot = {
      name: char.name,
      image: char.image || DEFAULT_MASCOT.image,
      about: char.about || 'Ready for action!'
    };

    setActiveMascot(nextMascot);
    setBubbleText(`${nextMascot.name} selected!`);
    setShowMenu(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('userMascot', JSON.stringify(nextMascot));
    }
  };

  const resetMascot = () => {
    setActiveMascot(DEFAULT_MASCOT);
    setBubbleText('Mascot reset to default!');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('userMascot');
    }

    setShowMenu(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const searchCharacter = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(searchQuery)}&limit=8`);
      const data = await res.json();

      if (data.data) {
        setSearchResults(data.data.map(char => ({
          name: char.name,
          image:
            char.images?.webp?.image_url ||
            char.images?.jpg?.image_url ||
            DEFAULT_MASCOT.image,
          about: char.about ? char.about.split('\n')[0] : 'Ready for action!'
        })));
      }
    } catch (err) {
      console.error(err);
    }

    setSearching(false);
  };

  const displayList = searchResults.length > 0 ? searchResults : popularCharacters;

  return (
    <div className="fixed left-8 top-[14%] z-40 pointer-events-auto select-none w-72">
      <div className="relative flex flex-col items-center gap-20">
        <div className="relative z-20 w-full min-h-[96px] bg-zinc-900 border-2 border-orange-500/70 px-4 py-5 rounded-2xl shadow-[0_14px_28px_rgba(0,0,0,0.75)] flex flex-col items-center justify-center text-center">
          <span className="text-orange-500 text-[11px] uppercase tracking-widest font-black mb-1">
            {activeMascot.name}
          </span>

          <span className="text-zinc-100 text-xs font-bold leading-snug">
            {bubbleText}
          </span>

          <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-b-2 border-r-2 border-orange-500/70 rotate-45 rounded-sm" />
        </div>

        <div
          onClick={() => setBubbleText(activeMascot.about)}
          onDoubleClick={() => setShowMenu(!showMenu)}
          className="relative z-10 w-48 h-48 rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.9)] flex items-center justify-center cursor-pointer group hover:border-orange-500 transition-all overflow-hidden shrink-0"
        >
          <SmartImage
            src={activeMascot.image}
            alt={activeMascot.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />

          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-[9px] font-black tracking-widest uppercase bg-orange-600 px-3 py-1 rounded-full">
              Double Click Search
            </span>
          </div>
        </div>

        {showMenu && (
          <div className="absolute top-full mt-4 z-30 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl w-full text-left animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Find Character
              </span>

              <button
                onClick={resetMascot}
                className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
              >
                Reset Default
              </button>
            </div>

            <form onSubmit={searchCharacter} className="flex gap-1 mb-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === '') setSearchResults([]);
                }}
                className="w-full bg-black border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
              />

              <button
                type="submit"
                className="bg-orange-600 text-white font-bold px-3 rounded-lg text-xs"
              >
                {searching ? '...' : 'Go'}
              </button>
            </form>

            {searchResults.length === 0 && !searching && (
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest px-1 mb-1 mt-3 border-b border-zinc-800 pb-1">
                Trending Choices
              </div>
            )}

            {searchResults.length > 0 && !searching && (
              <div className="text-[9px] text-green-500 font-bold uppercase tracking-widest px-1 mb-1 mt-3 border-b border-zinc-800 pb-1">
                Search Results
              </div>
            )}

            <div className="flex flex-col gap-1 max-h-44 overflow-y-auto scrollbar-hide">
              {searching ? (
                <div className="text-[10px] text-zinc-500 text-center py-4 font-bold italic animate-pulse">
                  Summoning character...
                </div>
              ) : displayList.map((char, i) => (
                <div
                  key={`${char.name}-${i}`}
                  onClick={() => saveMascot(char)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer group transition-colors"
                >
                  <SmartImage
                    src={char.image}
                    alt={char.name}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-700 bg-zinc-900 shadow-md shrink-0"
                  />

                  <span className="text-zinc-300 text-[10px] font-bold group-hover:text-orange-400 truncate">
                    {char.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}