import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('search')?.toLowerCase() || '';

  // 🔥 THE 100% GLITCH-FREE LOCAL VAULT 
  // Contains only the 62 files successfully downloaded to your /public/sounds/ folder.
  const allSounds = [
    // --- TOP TIER VIRAL & ANIME ---
    { id: '1', title: 'Giorno Theme (Il Vento D\'oro)', audioUrl: '/sounds/giorno.mp3', author: 'Anime' },
    { id: '2', title: 'Vine Boom', audioUrl: '/sounds/vine-boom.mp3', author: 'Classic' },
    { id: '3', title: 'Metal Gear Alert (!)', audioUrl: '/sounds/metal-gear.mp3', author: 'Gaming' },
    { id: '4', title: 'Directed By Robert B Weide', audioUrl: '/sounds/robert-weide.mp3', author: 'Curb' },
    { id: '5', title: 'FAHH (Hub Intro)', audioUrl: '/sounds/fahh.mp3', author: 'Internet' },
    { id: '6', title: 'Oh No No No Laugh', audioUrl: '/sounds/oh-no-laugh.mp3', author: 'TikTok' },
    { id: '7', title: 'Nani?! (Omae Wa Mou)', audioUrl: '/sounds/nani.mp3', author: 'Anime' },
    { id: '8', title: 'Bruh Sound Effect', audioUrl: '/sounds/bruh.mp3', author: 'Classic' },
    { id: '9', title: 'Roblox Oof', audioUrl: '/sounds/roblox-oof.mp3', author: 'Gaming' },
    { id: '10', title: 'Among Us Impostor Reveal', audioUrl: '/sounds/among-us.mp3', author: 'Gaming' },
    
    // --- INDIAN DESI & COMEDY ---
    { id: '11', title: 'Modi Ji - Waah Kya Scene Hai', audioUrl: '/sounds/waah-kya-scene.mp3', author: 'Politics' },
    { id: '12', title: 'Samay Raina - Supreme Leader', audioUrl: '/sounds/samay.mp3', author: 'Comedy' },
    { id: '13', title: 'Tauba Tauba Tauba', audioUrl: '/sounds/tauba.mp3', author: 'Desi' },
    { id: '14', title: 'Paisa Hi Paisa Hoga', audioUrl: '/sounds/paisa.mp3', author: 'Bollywood' },
    { id: '15', title: 'Elvish Bhai (Systumm)', audioUrl: '/sounds/elvish.mp3', author: 'Desi' },
    { id: '16', title: 'Bole Jo Koyal (Thala)', audioUrl: '/sounds/bole-jo-koyal.mp3', author: 'Desi' },
    
    // --- GAMING & INTERNET CLASSICS ---
    { id: '17', title: 'Mission Passed (GTA)', audioUrl: '/sounds/mission-passed.mp3', author: 'Gaming' },
    { id: '18', title: 'You Died (Dark Souls)', audioUrl: '/sounds/you-died.mp3', author: 'Gaming' },
    { id: '19', title: 'Minecraft Oof', audioUrl: '/sounds/minecraft-oof.mp3', author: 'Gaming' },
    { id: '20', title: 'Suiii (Ronaldo)', audioUrl: '/sounds/suiii.mp3', author: 'Sports' },
    { id: '21', title: 'Fart Reverb', audioUrl: '/sounds/fart-reverb.mp3', author: 'Classic' },
    { id: '22', title: 'To Be Continued', audioUrl: '/sounds/to-be-continued.mp3', author: 'Anime' },
    { id: '23', title: 'Run Meme', audioUrl: '/sounds/run.mp3', author: 'Classic' },
    { id: '24', title: 'Coffin Dance', audioUrl: '/sounds/coffin-dance.mp3', author: 'Music' },
    { id: '25', title: 'Slap Sound', audioUrl: '/sounds/slap.mp3', author: 'Classic' },
    { id: '26', title: 'Windows XP Error', audioUrl: '/sounds/windows-error.mp3', author: 'Tech' },
    { id: '27', title: 'FBI Open Up!', audioUrl: '/sounds/fbi.mp3', author: 'Classic' },
    { id: '28', title: 'Emotional Damage', audioUrl: '/sounds/emotional-damage.mp3', author: 'TikTok' },
    { id: '29', title: 'Bing Chilling', audioUrl: '/sounds/bing-chilling.mp3', author: 'TikTok' },
    { id: '30', title: 'Sad Violin', audioUrl: '/sounds/sad-violin.mp3', author: 'MLG' },
    { id: '31', title: 'Crickets Chirping', audioUrl: '/sounds/crickets.mp3', author: 'Awkward' },
    { id: '32', title: 'Illuminati Confirmed', audioUrl: '/sounds/illuminati.mp3', author: 'MLG' },
    { id: '33', title: 'Taco Bell Bong', audioUrl: '/sounds/taco-bell.mp3', author: 'Commercial' },
    { id: '34', title: 'Nyan Cat', audioUrl: '/sounds/nyan-cat.mp3', author: 'Internet' },
    { id: '35', title: 'Wow (Anime)', audioUrl: '/sounds/anime-wow.mp3', author: 'Anime' },
    { id: '36', title: 'Baka Mitai (Dame Da Ne)', audioUrl: '/sounds/baka-mitai.mp3', author: 'Gaming' },
    { id: '37', title: 'Megalovania', audioUrl: '/sounds/sans.mp3', author: 'Gaming' },
    
    // --- RAPID FIRE MEMES ---
    { id: '38', title: 'Let Him Cook', audioUrl: '/sounds/let-him-cook.mp3', author: 'Internet' },
    { id: '39', title: 'Bonk (Doge)', audioUrl: '/sounds/bonk.mp3', author: 'Internet' },
    { id: '40', title: 'Hell Naw To The Naw Naw', audioUrl: '/sounds/hell-naw.mp3', author: 'Classic' },
    { id: '41', title: 'Yamete Kudasai', audioUrl: '/sounds/yamete.mp3', author: 'Anime' },
    { id: '42', title: 'Ara Ara', audioUrl: '/sounds/ara-ara.mp3', author: 'Anime' },
    { id: '43', title: 'GigaChad Theme', audioUrl: '/sounds/gigachad.mp3', author: 'TikTok' },
    { id: '44', title: 'Sigma Male Grindset', audioUrl: '/sounds/sigma.mp3', author: 'TikTok' },
    { id: '45', title: 'Discord Call', audioUrl: '/sounds/discord.mp3', author: 'Tech' },
    { id: '46', title: 'Nokia Arabic Ringtone', audioUrl: '/sounds/nokia.mp3', author: 'Classic' },
    { id: '47', title: 'Mario Jump', audioUrl: '/sounds/mario-jump.mp3', author: 'Gaming' },
    { id: '48', title: 'Pacman Death', audioUrl: '/sounds/pacman-die.mp3', author: 'Gaming' },
    { id: '49', title: 'CSGO Bomb Planted', audioUrl: '/sounds/bomb-planted.mp3', author: 'Gaming' },
    { id: '50', title: 'Wasted (GTA)', audioUrl: '/sounds/wasted.mp3', author: 'Gaming' },
    { id: '51', title: 'Seinfeld Theme', audioUrl: '/sounds/seinfeld.mp3', author: 'TV' },
    { id: '52', title: 'X-Files Theme', audioUrl: '/sounds/x-files.mp3', author: 'TV' },
    { id: '53', title: 'Ba Dum Tss', audioUrl: '/sounds/ba-dum-tss.mp3', author: 'Classic' },
    { id: '54', title: 'Aww (Crowd)', audioUrl: '/sounds/aww.mp3', author: 'Classic' },
    { id: '55', title: 'Boo (Crowd)', audioUrl: '/sounds/boo.mp3', author: 'Classic' },
    { id: '56', title: 'Duck Quack', audioUrl: '/sounds/quack.mp3', author: 'Animals' },
    { id: '57', title: 'Eagle Screech', audioUrl: '/sounds/eagle.mp3', author: 'Animals' },
    { id: '58', title: 'Hallelujah', audioUrl: '/sounds/hallelujah.mp3', author: 'Music' },
    { id: '59', title: 'MLG Airhorn', audioUrl: '/sounds/airhorn.mp3', author: 'MLG' },
    { id: '60', title: 'Nelson Haha', audioUrl: '/sounds/nelson-haha.mp3', author: 'TV' },
    { id: '61', title: 'Wrong Buzzer', audioUrl: '/sounds/buzzer.mp3', author: 'Game Show' },
    { id: '62', title: 'FNAF Jumpscare', audioUrl: '/sounds/fnaf.mp3', author: 'Gaming' }
  ];

  // Search filter logic
  const filteredSounds = query 
    ? allSounds.filter(s => s.title.toLowerCase().includes(query) || s.author.toLowerCase().includes(query))
    : allSounds;

  return NextResponse.json({ sounds: filteredSounds });
}