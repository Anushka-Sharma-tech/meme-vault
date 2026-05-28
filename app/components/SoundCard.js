'use client';
import { useRef, useState, useEffect } from 'react';

export default function SoundCard({ sound }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Global event listener: Pauses this audio if another SoundCard starts playing
  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.detail.id !== sound.id && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };
    window.addEventListener('audio-played', handleGlobalPlay);
    return () => window.removeEventListener('audio-played', handleGlobalPlay);
  }, [sound.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Broadcast to all other cards to shut off
      window.dispatchEvent(new CustomEvent('audio-played', { detail: { id: sound.id } }));
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(err => {
          console.error("Audio playback prevented:", err);
          setIsPlaying(false);
        });
      }
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg hover:border-orange-500 transition-all flex flex-col justify-between group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1 group-hover:text-orange-400 transition-colors">
            {sound.title}
          </h3>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{sound.author}</p>
        </div>
        <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🎵</span>
      </div>

      <audio ref={audioRef} src={sound.audioUrl} onEnded={() => setIsPlaying(false)} preload="none" />

      <button 
        onClick={togglePlay}
        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
          isPlaying 
            ? 'bg-red-500/10 text-red-500 border border-red-500/50' 
            : 'bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
        }`}
      >
        {isPlaying ? '⏸ Stop Audio' : '▶ Play Sound'}
      </button>
    </div>
  );
}