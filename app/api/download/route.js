// app/api/download/route.js
//
// Server-side image proxy.
// Fetches the image buffer on the server to bypass browser CORS restrictions,
// then streams it back to the client with download headers.
//
// GET /api/download?url=<encoded_image_url>&filename=<optional>

import { NextResponse } from 'next/server';

// Only proxy from these trusted domains (security allowlist)
const ALLOWED_DOMAINS = [
  'i.redd.it',
  'i.imgur.com',
  'preview.redd.it',
  'external-preview.redd.it',
  'i.imgflip.com',
  'picsum.photos',
  'images.unsplash.com',
];

function isAllowedDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl  = searchParams.get('url');
  const filename  = searchParams.get('filename') || 'meme.jpg';

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Decode the URL (was encoded in the client)
  let decodedUrl;
  try { decodedUrl = decodeURIComponent(imageUrl); }
  catch { return NextResponse.json({ error: 'Invalid URL encoding' }, { status: 400 }); }

  if (!isAllowedDomain(decodedUrl)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    const upstream = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'MemeVault/2.0',
        'Accept':     'image/*',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream error: ${upstream.status}` }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer      = await upstream.arrayBuffer();

    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'meme.jpg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length':      String(buffer.byteLength),
        'Cache-Control':       'public, max-age=86400',
      },
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}