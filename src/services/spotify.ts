// Spotify Integration Service

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
  private parseHashToken() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        this.accessToken = token;
        localStorage.setItem('lullo:spotify_token', token);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }

  // Initiate Spotify OAuth Implicit Grant flow
  public loginWithSpotify(clientId = this.clientId, redirectUri = window.location.origin) {
    if (!clientId) {
      alert('Please enter your Spotify Client ID first.');
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

  // Instant public Spotify URL resolution (works without token via local server resolver)
  public async resolveSpotifyUrl(url: string): Promise<{ name: string; desc: string; cover?: string; tracks: { id: string; title: string; artist: string; dur: number; audioUrl?: string }[] } | null> {
    try {
      const res = await fetch(`/api/spotify-resolve?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Parse Spotify playlist/track URL
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
