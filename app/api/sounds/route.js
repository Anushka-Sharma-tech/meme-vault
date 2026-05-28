import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'trending';
  const page = searchParams.get('page') || '1';

  try {
    // Querying the massive, open-source MyInstants database dynamically
    const response = await fetch(
      `https://www.myinstants.com/api/v1/sounds/?search=${encodeURIComponent(query)}&page=${page}`,
      { headers: { 'User-Agent': 'memevault-app/1.0' } }
    );

    if (!response.ok) throw new Error('Failed to fetch global audio vault');
    const data = await response.json();

    // Map the deep data schema into our clean, reliable application contract
    const sounds = data.results.map(sound => ({
      id: sound.id.toString(),
      title: sound.name,
      audioUrl: sound.sound, // This links directly to their high-speed CDN .mp3 nodes
      category: 'Viral Clip',
      emoji: '🔊'
    }));

    // Return the sounds along with the next page link token for infinite scroll capability
    return NextResponse.json({ 
      sounds, 
      nextPage: data.next ? true : false 
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}