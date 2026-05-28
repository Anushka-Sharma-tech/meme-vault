import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUBREDDITS = {
  MEMES: 'memes',
  MATHS: 'mathmemes',
  SCIENCE: 'sciencememes',
  TECH: 'ProgrammerHumor',
  CHESS: 'AnarchyChess',
  LOVE: 'wholesomememes',
  POLITICS: 'PoliticalHumor',
  'INDIAN SERIAL': 'DesiMemes',
  'INDIAN PARENTS': 'IndianDankMemes',
};

const USER_AGENT =
  process.env.REDDIT_USER_AGENT ||
  'web:com.memevault:v1.0.0 (by /u/anushka)';

let tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

async function getRedditToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) return '';

  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    console.error('Reddit OAuth failed:', response.status, await response.text());
    return '';
  }

  const data = await response.json();

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
}

function buildRedditPath({ subreddit, searchQuery, afterToken, useOAuth }) {
  const params = new URLSearchParams({
    limit: '100',
    raw_json: '1',
  });

  if (afterToken) params.set('after', afterToken);

  if (searchQuery) {
    params.set('q', searchQuery);
    params.set('restrict_sr', 'on');
    params.set('sort', 'hot');
    params.set('t', 'all');

    return `/r/${subreddit}/${useOAuth ? 'search' : 'search.json'}?${params}`;
  }

  return `/r/${subreddit}/${useOAuth ? 'hot' : 'hot.json'}?${params}`;
}

function decodeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replaceAll('&amp;', '&');
}

function isDirectImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function getGalleryImage(post) {
  const firstItem = post.gallery_data?.items?.[0];
  const mediaId = firstItem?.media_id;
  const media = mediaId ? post.media_metadata?.[mediaId] : null;

  return decodeUrl(media?.s?.u || media?.p?.at(-1)?.u || '');
}

function getPostImage(post) {
  const candidates = [
    post.url_overridden_by_dest,
    post.url,
    getGalleryImage(post),
    post.preview?.images?.[0]?.source?.url,
    post.preview?.images?.[0]?.resolutions?.at(-1)?.url,
    post.thumbnail,
  ]
    .map(decodeUrl)
    .filter(Boolean);

  return candidates.find(url => url.startsWith('http') && isDirectImage(url)) || '';
}

async function fetchRedditJson({ subreddit, searchQuery, afterToken }) {
  const token = await getRedditToken();
  const useOAuth = Boolean(token);

  const baseUrl = useOAuth
    ? 'https://oauth.reddit.com'
    : 'https://www.reddit.com';

  const path = buildRedditPath({
    subreddit,
    searchQuery,
    afterToken,
    useOAuth,
  });

  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Reddit fetch failed ${response.status}: ${text.slice(0, 180)}`);
  }

  return response.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || 'MEMES';
  const afterToken = searchParams.get('after') || '';
  const searchQuery = searchParams.get('search') || '';
  const subreddit = SUBREDDITS[category] || 'memes';

  try {
    const data = await fetchRedditJson({
      subreddit,
      searchQuery,
      afterToken,
    });

    const memes = (data.data?.children || [])
      .map(child => child.data)
      .filter(post => post && !post.is_video && !post.over_18)
      .map(post => {
        const image = getPostImage(post);

        return {
          id: post.name,
          title: post.title,
          image,
          imageUrl: image,
          url: image,
          author: post.author,
          permalink: `https://reddit.com${post.permalink}`,
        };
      })
      .filter(meme => meme.image);

    return NextResponse.json({
      memes: memes.slice(0, 30),
      nextPage: data.data?.after || null,
    });
  } catch (error) {
    console.error('Meme API failed:', error);

    return NextResponse.json({
      memes: [],
      nextPage: null,
      error: error.message,
    });
  }
}