// High Quality Unique Cover Art Resolver
// Fetches real album artwork from Spotify oEmbed & iTunes Search API with local caching

const CACHE_KEY = 'lullo:cover_cache';
const BUNDLED_COVERS = [
  'pour', 'sunset', 'cabin', 'ember', 'tide', 'lamp',
  'garden', 'pagoda', 'dune', 'shot', 'moss', 'white',
  'latte', 'linen', 'roast', 'living', 'chair', 'hchair',
  'sofa', 'throw', 'detail'
];

function getStoredCache(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCache(cache: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // quota exceeded or storage blocked
  }
}

const memoryCache = new Map<string, string>(Object.entries(getStoredCache()));
const inflight = new Map<string, Promise<string | null>>();

function getFallbackCover(title: string, artist: string): string {
  let hash = 0;
  const str = `${title}-${artist}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % BUNDLED_COVERS.length;
  return `/photos/306-lullo/${BUNDLED_COVERS[idx]}.jpg`;
}

export const coverResolver = {
  getCachedCover(title: string, artist: string, spotifyId?: string): string | null {
    const key = spotifyId ? `sp:${spotifyId}` : `${title}::${artist}`.toLowerCase();
    return memoryCache.get(key) || null;
  },

  async resolveCover(title: string, artist: string, spotifyId?: string): Promise<string> {
    const key = spotifyId ? `sp:${spotifyId}` : `${title}::${artist}`.toLowerCase();
    
    // Check in-memory / localStorage cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }

    // Check inflight request to deduplicate simultaneous requests
    if (inflight.has(key)) {
      const res = await inflight.get(key);
      if (res) return res;
    }

    const promise = (async (): Promise<string | null> => {
      // 1. Try Spotify oEmbed if spotifyId available
      if (spotifyId) {
        try {
          const res = await fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${spotifyId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.thumbnail_url) {
              return data.thumbnail_url;
            }
          }
        } catch (e) {
          // Fall through to iTunes
        }
      }

      // 2. Try iTunes Search API (free, CORS-enabled, official Apple CDN)
      try {
        const cleanTitle = title.replace(/\(feat\..*?\)/gi, '').replace(/\(with.*?\)/gi, '').trim();
        const cleanArtist = artist.split(',')[0].trim();
        const term = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
        if (itunesRes.ok) {
          const data = await itunesRes.json();
          const art = data.results?.[0]?.artworkUrl100;
          if (art) {
            // Upgrade resolution to 600x600 high fidelity
            return art.replace('100x100bb', '600x600bb');
          }
        }
      } catch (e) {
        // Fall through to fallback
      }

      return null;
    })();

    inflight.set(key, promise);
    const resolvedUrl = await promise;
    inflight.delete(key);

    const finalCover = resolvedUrl || getFallbackCover(title, artist);
    memoryCache.set(key, finalCover);
    
    // Periodically sync back to storage
    const stored = getStoredCache();
    stored[key] = finalCover;
    saveCache(stored);

    return finalCover;
  },

  getFallbackCover
};
