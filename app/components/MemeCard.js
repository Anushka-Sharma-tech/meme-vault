'use client';
import { useState } from 'react';

export default function MemeCard({ meme }) {
  const [imageError, setImageError] = useState(false);

  // If a specific media node link is broken, fall back to a clean safe placeholder graphic
  const sourceImage = imageError 
    ? 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?w=500&auto=format&fit=crop&q=60' 
    : meme.imageUrl;

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-zinc-700 transition-all duration-300 flex flex-col h-full group">
      
      {/* Media Window Container Box */}
      <div className="w-full aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center">
        <img 
          src={sourceImage} 
          alt={meme.title || 'Meme Box Asset'} 
          onError={() => setImageError(true)}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102"
          loading="lazy"
        />
        
        {/* Subtle source indicator badge matching your sketch design rules */}
        <span className="absolute bottom-2 right-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded">
          Reddit
        </span>
      </div>

      {/* Meta Content Metadata Panel Section */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          <h3 className="text-zinc-100 text-xs font-bold line-clamp-2 leading-snug tracking-tight group-hover:text-white transition-colors">
            {meme.title || 'Untitled Stream Element'}
          </h3>
          <p className="text-zinc-500 text-[10px] mt-1 truncate">
            By <span className="font-semibold text-zinc-400">u/{meme.author || 'Anonymous'}</span>
          </p>
        </div>

        {/* Premium interactive action footer panel */}
        <div className="flex items-center justify-between border-t border-zinc-850 pt-2.5 mt-auto">
          <button 
            onClick={() => window.open(meme.permalink, '_blank')}
            className="text-zinc-400 hover:text-orange-500 font-bold text-[10px] tracking-wide uppercase transition-colors cursor-pointer"
          >
            🔗 Open Source Link
          </button>
          
          <a 
            href={sourceImage} 
            download={`MemeVault-${meme.id}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
          >
            ⬇ Download
          </a>
        </div>
      </div>

    </div>
  );
}