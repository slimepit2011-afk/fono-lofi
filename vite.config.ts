import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spotify-resolver',
      configureServer(server) {
        server.middlewares.use('/api/spotify-resolve', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const targetUrl = urlObj.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }

            // Convert open.spotify.com/playlist/ID to embed URL
            let embedUrl = targetUrl;
            if (targetUrl.includes('open.spotify.com')) {
              const u = new URL(targetUrl);
              const path = u.pathname;
              embedUrl = `https://open.spotify.com/embed${path}`;
            }

            const response = await fetch(embedUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
              }
            });

            const html = await response.text();
            const match = html.match(/<script id="(?:__NEXT_DATA__|initial-state)"[^>]*>(.*?)<\/script>/);

            if (!match) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Could not extract Spotify metadata' }));
              return;
            }

            const data = JSON.parse(match[1]);
            const entity = data?.props?.pageProps?.state?.data?.entity || {};
            const rawTracks = entity.trackList || [];

            const tracks = rawTracks.map((t: any) => ({
              id: t.uri?.replace('spotify:track:', '') || String(Math.random()),
              title: t.title || 'Untitled',
              artist: (t.subtitle || 'Unknown').replace(/\u00a0/g, ' '),
              dur: Math.round((t.duration || 180000) / 1000),
              audioUrl: t.audioPreview?.url || null
            }));

            const coverSources = entity.coverArt?.sources || [];
            const coverUrl = coverSources[0]?.url || null;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              name: entity.name || entity.title || 'Spotify Playlist',
              desc: entity.subtitle || 'Imported from Spotify',
              cover: coverUrl,
              tracks: tracks
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        // YouTube Search Resolver: Finds full length video & audio for any track
        const ytSearchCache = new Map<string, { videoId: string; candidates: string[] }>();
        server.middlewares.use('/api/youtube-search', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const q = urlObj.searchParams.get('q');

            if (!q) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing query parameter q' }));
              return;
            }

            if (ytSearchCache.has(q)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(ytSearchCache.get(q)));
              return;
            }

            let candidates: string[] = [];
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
                  if (candidates.length > 0) {
                    break;
                  }
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

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ videoId: null, candidates: [], error: err.message }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
