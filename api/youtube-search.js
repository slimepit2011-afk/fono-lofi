// Vercel Serverless Function: YouTube Search Resolver
// Resolves videoId candidates for track titles and queries

const ytSearchCache = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const q = req.query?.q || (new URL(req.url, 'http://localhost')).searchParams.get('q');

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    if (ytSearchCache.has(q)) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json(ytSearchCache.get(q));
    }

    let candidates = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (response.ok) {
          const html = await response.text();
          const matches = [...html.matchAll(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g)];
          candidates = Array.from(new Set(matches.map(m => m[1])));
          if (candidates.length > 0) break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const videoId = candidates[0] || null;
    const result = { videoId, candidates: candidates.slice(0, 10) };

    if (videoId) {
      ytSearchCache.set(q, result);
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ videoId: null, candidates: [], error: err.message });
  }
}
