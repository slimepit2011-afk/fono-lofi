// Spotify Integration Service
// Official Spotify Web API + Serverless & Public Embed Resolution Engine

export interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylistItem {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
}

export interface SpotifyResolvedTrack {
  id: string;
  title: string;
  artist: string;
  dur: number;
  audioUrl?: string;
  cover?: string;
}

export interface SpotifyResolvedPayload {
  name: string;
  desc: string;
  cover?: string;
  tracks: SpotifyResolvedTrack[];
}

class SpotifyService {
  private clientId = '';
  private accessToken = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('lullo:spotify_token') || '';
      this.clientId = localStorage.getItem('lullo:spotify_client_id') || '';
      this.parseHashToken();
    }
  }

  public setCredentials(clientId: string, token?: string) {
    this.clientId = clientId;
    if (token) this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lullo:spotify_client_id', clientId);
      if (token) localStorage.setItem('lullo:spotify_token', token);
    }
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public isConnected(): boolean {
    return !!this.accessToken;
  }

  // Parse token from OAuth redirect: #access_token=...
  // CRITICAL GUARD: Only parse if this is genuinely a Spotify callback; NEVER intercept Google OAuth (id_token, openid)
  private parseHashToken() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=') && !hash.includes('id_token') && !hash.includes('accounts.google.com')) {
      const params = new URLSearchParams(hash.substring(1));
      const state = params.get('state');
      // Spotify auth initiated by FONO includes state or has no Google id_token
      if (state?.startsWith('spotify') || !params.has('id_token')) {
        const token = params.get('access_token');
        if (token) {
          this.accessToken = token;
          localStorage.setItem('lullo:spotify_token', token);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }

  // Initiate Spotify OAuth Implicit Grant flow
  public loginWithSpotify(clientId = this.clientId, redirectUri = window.location.origin) {
    if (!clientId) {
      alert('Please enter your Spotify Client ID first in Settings.');
      return;
    }
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-read-playback-state'
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
  }

  public logout() {
    this.accessToken = '';
    localStorage.removeItem('lullo:spotify_token');
  }

  // Generic Spotify API request
  private async request<T>(endpoint: string): Promise<T | null> {
    if (!this.accessToken) return null;
    try {
      const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      if (res.status === 401) {
        this.logout();
        return null;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Get current user profile
  public async getCurrentUser() {
    return this.request<{ id: string; display_name: string; email: string; images: { url: string }[] }>('/me');
  }

  // Get user's playlists
  public async getUserPlaylists(): Promise<SpotifyPlaylistItem[]> {
    const data = await this.request<{ items: SpotifyPlaylistItem[] }>('/me/playlists?limit=50');
    return data?.items || [];
  }

  // Get tracks from a playlist
  public async getPlaylistTracks(playlistId: string): Promise<SpotifyTrackItem[]> {
    const data = await this.request<{ items: { track: SpotifyTrackItem }[] }>(
      `/playlists/${playlistId}/tracks?limit=100`
    );
    return (data?.items || []).map(item => item.track).filter(Boolean);
  }

  // Instant Spotify URL resolution (supports public playlists, tracks, albums, plus private playlists with token)
  public async resolveSpotifyUrl(url: string): Promise<SpotifyResolvedPayload | null> {
    const parsed = this.parseUrl(url);

    // 1. If user is authenticated with Spotify OAuth in Settings, try official Web API first (reads private & collaborative playlists)
    if (this.isConnected() && parsed) {
      try {
        if (parsed.type === 'playlist') {
          const playlistData = await this.request<any>(`/playlists/${parsed.id}`);
          if (playlistData && playlistData.tracks?.items) {
            const tracks = playlistData.tracks.items
              .map((item: any) => item.track)
              .filter(Boolean)
              .map((t: any) => ({
                id: t.id,
                title: t.name || 'Untitled',
                artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
                dur: Math.round((t.duration_ms || 180000) / 1000),
                audioUrl: t.preview_url || undefined,
                cover: t.album?.images?.[0]?.url
              }));
            if (tracks.length > 0) {
              return {
                name: playlistData.name || 'Spotify Playlist',
                desc: playlistData.description || `Imported via official Spotify API (${tracks.length} tracks)`,
                cover: playlistData.images?.[0]?.url,
                tracks
              };
            }
          }
        } else if (parsed.type === 'track') {
          const trackData = await this.request<any>(`/tracks/${parsed.id}`);
          if (trackData) {
            return {
              name: trackData.name,
              desc: `Single by ${trackData.artists?.map((a: any) => a.name).join(', ') || 'Spotify Artist'}`,
              cover: trackData.album?.images?.[0]?.url,
              tracks: [{
                id: trackData.id,
                title: trackData.name,
                artist: trackData.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
                dur: Math.round((trackData.duration_ms || 180000) / 1000),
                audioUrl: trackData.preview_url || undefined,
                cover: trackData.album?.images?.[0]?.url
              }]
            };
          }
        }
      } catch (e) {
        console.warn('Spotify official API query failed, trying public resolver:', e);
      }
    }

    // 2. Query production serverless resolver /api/spotify-resolve
    try {
      const res = await fetch(`/api/spotify-resolve?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const text = await res.text();
        if (!text.startsWith('<')) {
          const data = JSON.parse(text);
          if (data.isPrivate || data.error === 'private_or_not_found') {
            throw new Error(data.message || 'This playlist is set to Private on Spotify. In Spotify, tap "..." on the playlist and select "Make Public", or connect your Spotify account in Settings.');
          }
          if (data.success && data.tracks && data.tracks.length > 0) {
            return {
              name: data.name,
              desc: data.desc,
              cover: data.cover,
              tracks: data.tracks
            };
          }
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Private') || err.message.includes('Make Public'))) {
        throw err;
      }
    }

    // 3. Fallback: Client-side CORS Proxy resolution directly to Spotify Embed
    if (parsed) {
      try {
        const embedTarget = `https://open.spotify.com/embed/${parsed.type}/${parsed.id}`;
        const proxyUrls = [
          `https://corsproxy.io/?${encodeURIComponent(embedTarget)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(embedTarget)}`
        ];

        for (const proxy of proxyUrls) {
          try {
            const resp = await fetch(proxy);
            if (!resp.ok) continue;
            const html = await resp.text();
            const match = html.match(/<script id="(?:__NEXT_DATA__|initial-state)"[^>]*>(.*?)<\/script>/);
            if (match) {
              const parsedJson = JSON.parse(match[1]);
              if (parsedJson?.props?.pageProps?.status === 404) {
                throw new Error('This Spotify playlist is set to Private or not found. In your Spotify app, tap "..." and choose "Make Public", or connect in Settings.');
              }
              const entity = parsedJson?.props?.pageProps?.state?.data?.entity;
              if (entity) {
                let rawTracks = parsed.type === 'track' ? [{
                  uri: entity.uri || `spotify:track:${parsed.id}`,
                  title: entity.title || entity.name,
                  subtitle: entity.subtitle || entity.artist,
                  duration: entity.duration,
                  audioPreview: entity.audioPreview
                }] : (entity.trackList || []);

                const tracks = rawTracks.map((t: any, idx: number) => ({
                  id: t.uri?.replace('spotify:track:', '') || `${parsed.id}-${idx}`,
                  title: t.title || 'Untitled',
                  artist: (t.subtitle || 'Unknown').replace(/\u00a0/g, ' '),
                  dur: Math.round((t.duration || 180000) / 1000),
                  audioUrl: t.audioPreview?.url || undefined
                }));

                if (tracks.length > 0) {
                  return {
                    name: entity.name || entity.title || 'Spotify Playlist',
                    desc: entity.subtitle || 'Imported from Spotify',
                    cover: entity.coverArt?.sources?.[0]?.url,
                    tracks
                  };
                }
              }
            }
          } catch (pe: any) {
            if (pe.message && (pe.message.includes('Private') || pe.message.includes('Make Public'))) throw pe;
          }
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('Private') || err.message.includes('Make Public'))) throw err;
      }
    }

    // Default informative throw if all resolutions were exhausted
    throw new Error('Could not extract Spotify playlist. Please ensure the playlist is Public on Spotify (open Spotify, tap "...", "Make Public"), or connect your Spotify account in Settings.');
  }

  // Parse Spotify playlist/track/album URL
  public parseUrl(input: string): { type: 'playlist' | 'track' | 'album'; id: string } | null {
    if (!input) return null;
    try {
      const url = new URL(input.startsWith('http') ? input : `https://${input}`);
      if (url.hostname.includes('spotify.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const type = parts[0] as 'playlist' | 'track' | 'album';
          const id = parts[1].split('?')[0];
          return { type, id };
        }
      }
    } catch {}
    return null;
  }
}

export const spotifyService = new SpotifyService();
