// Vercel Serverless Function: Spotify Public Embed & Metadata Resolver
// Resolves playlists, tracks, and albums without requiring server secrets
// Extracts audio previews (.mp3), artwork, track names, and artist metadata

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const targetUrl = req.query?.url || (new URL(req.url, 'http://localhost')).searchParams.get('url');

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'Missing url parameter' });
    }

    // Validate Spotify URL
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    if (!parsedUrl.hostname.includes('spotify.com')) {
      return res.status(400).json({ success: false, error: 'Only open.spotify.com URLs are supported' });
    }

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const type = pathParts[0]; // 'playlist', 'track', 'album'
    const id = pathParts[1]?.split('?')[0];

    if (!type || !id) {
      return res.status(400).json({ success: false, error: 'Could not extract Spotify resource type or ID' });
    }

    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();
    const match = html.match(/<script id="(?:__NEXT_DATA__|initial-state)"[^>]*>(.*?)<\/script>/);

    if (!match) {
      return res.status(200).json({
        success: false,
        error: 'private_or_not_found',
        isPrivate: true,
        message: 'Could not retrieve Spotify data. The playlist or track may be private or unlisted on Spotify.'
      });
    }

    const data = JSON.parse(match[1]);

    // Check if Spotify returned 404 in pageProps
    if (data?.props?.pageProps?.status === 404) {
      return res.status(200).json({
        success: false,
        error: 'private_or_not_found',
        isPrivate: true,
        message: 'This Spotify playlist is set to Private or cannot be found. In your Spotify app or web player, tap "..." on the playlist and select "Make Public" (or share public link), or connect your Spotify account in Settings.'
      });
    }

    const entity = data?.props?.pageProps?.state?.data?.entity;
    if (!entity) {
      return res.status(200).json({
        success: false,
        error: 'not_found',
        message: 'Spotify resource not found or contains no playable tracks.'
      });
    }

    // Handle track list vs single track
    let rawTracks = [];
    if (type === 'track') {
      rawTracks = [{
        uri: entity.uri || `spotify:track:${id}`,
        title: entity.title || entity.name || 'Untitled Track',
        subtitle: entity.subtitle || entity.artist || 'Unknown Artist',
        duration: entity.duration || 180000,
        audioPreview: entity.audioPreview
      }];
    } else {
      rawTracks = entity.trackList || [];
    }

    if (!rawTracks || rawTracks.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'empty_playlist',
        message: 'This Spotify playlist does not contain any tracks.'
      });
    }

    const tracks = rawTracks.map((t, idx) => ({
      id: t.uri?.replace('spotify:track:', '') || `${id}-${idx}`,
      title: t.title || 'Untitled',
      artist: (t.subtitle || 'Unknown').replace(/\u00a0/g, ' '),
      dur: Math.round((t.duration || 180000) / 1000),
      audioUrl: t.audioPreview?.url || null
    }));

    const coverSources = entity.coverArt?.sources || [];
    const coverUrl = coverSources[0]?.url || null;

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({
      success: true,
      type,
      name: entity.name || entity.title || (type === 'track' ? 'Spotify Track' : 'Spotify Playlist'),
      desc: entity.subtitle || (type === 'track' ? 'Imported Spotify Track' : `Imported Spotify Playlist (${tracks.length} songs)`),
      cover: coverUrl,
      tracks
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'server_error', message: err.message });
  }
}
