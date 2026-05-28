import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'MEMES';
  const afterToken = searchParams.get('after') || '';
  const searchQuery = searchParams.get('search') || '';

  let subreddit = 'memes';
  if (category === 'MATHS') subreddit = 'mathmemes';
  if (category === 'SCIENCE') subreddit = 'sciencememes';
  if (category === 'TECH') subreddit = 'ProgrammerHumor';
  if (category === 'CHESS') subreddit = 'AnarchyChess';
  if (category === 'LOVE') subreddit = 'wholesomememes';
  if (category === 'POLITICS') subreddit = 'PoliticalHumor';
  
  // 🔥 Fixed: Routed to active image-heavy Indian meme communities
  if (category === 'INDIAN SERIAL') subreddit = 'DesiMemes'; 
  if (category === 'INDIAN PARENTS') subreddit = 'IndianDankMemes';

  try {
    let url = searchQuery 
      ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=on&limit=100&after=${afterToken}`
      : `https://www.reddit.com/r/${subreddit}/hot.json?limit=100&after=${afterToken}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ memes: [], nextPage: null });
    
    const data = await response.json();

    const memes = (data.data?.children || [])
      .filter(child => !child.data.is_video && !child.data.over_18 && child.data.url && (child.data.url.match(/\.(jpeg|jpg|gif|png)$/) != null))
      .map(child => ({
        id: child.data.name,
        title: child.data.title,
        imageUrl: child.data.url,
        author: child.data.author,
        permalink: `https://reddit.com${child.data.permalink}`
      }));

    return NextResponse.json({ memes: memes.slice(0, 30), nextPage: data.data?.after || null });
  } catch (error) {
    return NextResponse.json({ memes: [], nextPage: null });
  }
}