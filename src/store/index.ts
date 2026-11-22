import { useSyncExternalStore } from 'react';
import { AppData, Track, Episode, Playlist, UserPrefs, UserProfile, PaymentMethod, BillingInvoice } from '../types';
import { getInitialData, INITIAL_PAYMENT_METHODS, INITIAL_INVOICES, INITIAL_TRACKS } from './initialData';
import { audioEngine } from '../services/audioEngine';
import { youtubeService } from '../services/youtube';
import { coverResolver } from '../services/coverResolver';
import { tactile } from '../services/tactileFeedback';
import { ambientAudio } from '../services/ambientAudio';
import { redeemService, RedeemResult } from '../services/redeemService';

const STORAGE_KEY = 'fono:data';
const LEGACY_STORAGE_KEY = 'lullo:data';

const DATA_VERSION_KEY = 'fono:data_version';
const CURRENT_VERSION = 'fono_lofi_v1';

function loadStoredData(): AppData {
  const initial = getInitialData();
  initial.plan = "free";

  if (typeof window === "undefined") return initial;

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    const ver = localStorage.getItem(DATA_VERSION_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const merged: AppData = {
          ...initial,
          ...parsed,
          prefs: { ...initial.prefs, ...(parsed.prefs || {}) },
          profile: { ...initial.profile, ...(parsed.profile || {}) },
          player: {
            ...initial.player,
            ...(parsed.player || {}),
            playing: false,
            pos: 0
          },
          tracks: Array.isArray(parsed.tracks) && parsed.tracks.length > 0 ? parsed.tracks : initial.tracks,
          albums: Array.isArray(parsed.albums) && parsed.albums.length > 0 ? parsed.albums : initial.albums,
          artists: Array.isArray(parsed.artists) && parsed.artists.length > 0 ? parsed.artists : initial.artists,
          playlists: Array.isArray(parsed.playlists) && parsed.playlists.length > 0 ? parsed.playlists : initial.playlists,
          episodes: Array.isArray(parsed.episodes) ? parsed.episodes : initial.episodes,
          shows: Array.isArray(parsed.shows) ? parsed.shows : initial.shows,
          paymentMethods: Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0 ? parsed.paymentMethods : initial.paymentMethods,
          invoices: Array.isArray(parsed.invoices) && parsed.invoices.length > 0 ? parsed.invoices : initial.invoices,
          history: Array.isArray(parsed.history) ? parsed.history : [],
          plan: parsed.plan || "free"
        };

        // When version changes or migrating from old lullo cache:
        // Wipe phantom guest state (VIP, loved tracks, history)
        if (ver !== CURRENT_VERSION) {
          merged.history = [];
          merged.tracks.forEach((t: any) => {
            t.plays = 0;
            // Unregistered guests start with clean slate
            if (!merged.profile?.isRegistered) {
              t.loved = false;
            }
          });
          if (!merged.profile?.isRegistered) {
            merged.plan = "free";
            merged.profile.email = "guest@fono.fm";
            merged.profile.name = "Guest Listener";
            merged.profile.handle = "guest";
          }
          localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
        }

        merged.tracks.forEach((t: any, i: number) => {
          if (!t.audioUrl || t.audioUrl.includes("pixabay.com")) {
            const idx = (i % 5) + 1;
            t.audioUrl = `/audio/lofi-${idx}.wav`;
          }
          if (t.youtubeId === "4xDzrJKXOOY" || t.youtubeId === "BMukn885GYw" || t.youtubeId === "lP26UCnoH9s") {
            t.youtubeId = "jfKfPfyJRdk";
          }
        });

        // Restore durable authenticated session if present
        try {
          const savedSession = localStorage.getItem('fono:user_session') || localStorage.getItem('lullo:user_session');
          if (savedSession) {
            const auth = JSON.parse(savedSession);
            if (auth && auth.isRegistered) {
              merged.profile = {
                ...merged.profile,
                isRegistered: true,
                name: auth.name || merged.profile.name,
                email: auth.email || merged.profile.email,
                handle: auth.handle || merged.profile.handle,
                provider: auth.provider || merged.profile.provider
              };
              if (auth.plan) merged.plan = auth.plan;
            }
          }
        } catch {}

        // STRICT GUEST GUARANTEE: Guests can NEVER have VIP plan or phantom favorites
        if (!merged.profile?.isRegistered) {
          merged.plan = "free";
          merged.tracks.forEach((t: any) => { t.loved = false; });
          merged.history = [];
        }

        if (merged.player) {
          if (merged.player.pos > 3600 || isNaN(merged.player.pos)) {
            merged.player.pos = 0;
          }
        }

        return merged;
      }
    }
  } catch (e) {
    console.error("Failed to parse stored fono data:", e);
  }

  if (typeof window !== "undefined") {
    try {
      const savedSession = localStorage.getItem('fono:user_session') || localStorage.getItem('lullo:user_session');
      if (savedSession) {
        const auth = JSON.parse(savedSession);
        if (auth && auth.isRegistered) {
          initial.profile = {
            ...initial.profile,
            isRegistered: true,
            name: auth.name || initial.profile.name,
            email: auth.email || initial.profile.email,
            handle: auth.handle || initial.profile.handle,
            provider: auth.provider || initial.profile.provider
          };
          if (auth.plan) initial.plan = auth.plan;
        }
      }
    } catch {}
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
  }
  return initial;
}

let currentData: AppData = loadStoredData();
const listeners = new Set<() => void>();

// Synchronize state across tabs, popups, and OAuth redirects
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === 'fono:user_session' || event.key === LEGACY_STORAGE_KEY) {
      currentData = loadStoredData();
      listeners.forEach(fn => fn());
    }
  });

  try {
    const authChannel = new BroadcastChannel('fono_auth_channel');
    authChannel.onmessage = (event) => {
      if (event.data?.type === 'LOGIN' && event.data?.profile) {
        currentData = loadStoredData();
        listeners.forEach(fn => fn());
      } else if (event.data?.type === 'LOGOUT') {
        currentData = loadStoredData();
        listeners.forEach(fn => fn());
      }
    };
  } catch {}
}

function emitChange() {
  currentData = {
    ...currentData,
    player: { ...currentData.player },
    tracks: [...currentData.tracks],
    paymentMethods: currentData.paymentMethods ? [...currentData.paymentMethods] : [],
    invoices: currentData.invoices ? [...currentData.invoices] : []
  };
  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(currentData);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }
  listeners.forEach(fn => fn());
}

// Hook to subscribe to store changes
export function useStore(): AppData {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => currentData,
    () => currentData
  );
}

// Connect AudioEngine callbacks with accurate listening accumulation
let lastPosSecond = -1;
let currentListenSession = {
  trackId: '',
  accumulatedSeconds: 0,
  lastPos: 0,
  scrobbled: false
};

function flushListeningSession() {
  if (currentListenSession.accumulatedSeconds >= 10 && !currentListenSession.scrobbled && currentListenSession.trackId) {
    currentData.history.unshift({
      k: currentListenSession.trackId,
      t: Date.now(),
      s: Math.round(currentListenSession.accumulatedSeconds)
    });
    currentListenSession.scrobbled = true;
    emitChange();
  }
}

if (typeof window !== 'undefined') {
  audioEngine.setCallbacks({
    onTimeUpdate: (curTime) => {
      currentData.player.pos = curTime;
      const sec = Math.floor(curTime);

      // Track active listening time
      if (currentData.player.playing && currentData.player.id) {
        if (currentListenSession.trackId !== currentData.player.id) {
          flushListeningSession();
          currentListenSession = {
            trackId: currentData.player.id,
            accumulatedSeconds: 0,
            lastPos: curTime,
            scrobbled: false
          };
        } else {
          const delta = curTime - currentListenSession.lastPos;
          if (delta > 0 && delta < 2.5) {
            currentListenSession.accumulatedSeconds += delta;
          }
          currentListenSession.lastPos = curTime;

          // Scrobble rule: When user reaches 30 seconds of listening, record official play
          if (currentListenSession.accumulatedSeconds >= 30 && !currentListenSession.scrobbled) {
            currentListenSession.scrobbled = true;
            currentData.history.unshift({
              k: currentListenSession.trackId,
              t: Date.now(),
              s: Math.round(currentListenSession.accumulatedSeconds)
            });
            const tr = currentData.tracks.find(t => t.id === currentListenSession.trackId);
            if (tr) tr.plays = (tr.plays || 0) + 1;
            emitChange();
          } else if (currentListenSession.scrobbled && currentData.history[0]?.k === currentListenSession.trackId) {
            // Update duration periodically every 5 seconds
            if (sec % 5 === 0) {
              currentData.history[0].s = Math.round(currentListenSession.accumulatedSeconds);
            }
          }
        }
      }

      if (sec !== lastPosSecond) {
        lastPosSecond = sec;
        emitChange();
      }
    },
    onStateChange: (playing) => {
      if (!playing) {
        flushListeningSession();
      }
      if (currentData.player.playing !== playing) {
        currentData.player.playing = playing;
        emitChange();
      }
    },
    onEnded: () => {
      const trackId = currentData.player.id;
      const track = currentData.tracks.find(t => t.id === trackId);
      if (track) {
        if (!currentListenSession.scrobbled) {
          currentData.history.unshift({
            k: track.id,
            t: Date.now(),
            s: Math.round(currentListenSession.accumulatedSeconds || track.dur)
          });
          track.plays = (track.plays || 0) + 1;
        } else if (currentData.history[0]?.k === track.id) {
          currentData.history[0].s = Math.round(currentListenSession.accumulatedSeconds || track.dur);
        }
      }
      currentListenSession.scrobbled = true;
      currentListenSession.accumulatedSeconds = 0;

      // Repeat handling or next track
      if (currentData.player.repeat === 'one') {
        const item = currentData.tracks.find(t => t.id === currentData.player.id) ||
                     currentData.episodes.find(e => e.id === currentData.player.id);
        if (item) audioEngine.playTrack(item, 0);
      } else {
        storeActions.nextTrack();
      }
    }
  });
}

export const storeActions = {
  // Playback
  addTrack(track: Track) {
    if (!currentData.tracks.some(t => t.id === track.id)) {
      currentData.tracks.push(track);
      emitChange();
    }
  },

  addTracks(tracks: Track[]) {
    let added = false;
    for (const track of tracks) {
      if (!currentData.tracks.some(t => t.id === track.id)) {
        currentData.tracks.push(track);
        added = true;
      }
    }
    if (added) emitChange();
  },

  playTrack(trackId: string, queue?: string[]) {
    let track = currentData.tracks.find(t => t.id === trackId);
    if (!track) {
      const fallback = INITIAL_TRACKS.find(t => t.id === trackId);
      if (fallback) {
        currentData.tracks.push(fallback);
        track = fallback;
      } else {
        return;
      }
    }

    currentData.player.kind = 'track';
    currentData.player.id = trackId;
    currentData.player.pos = 0;
    currentData.player.playing = true;
    if (queue && queue.length > 0) {
      currentData.player.queue = queue.slice();
    } else if (!currentData.player.queue.includes(trackId)) {
      currentData.player.queue.push(trackId);
    }

    audioEngine.playTrack(track, 0);
    emitChange();
  },

  playEpisode(episodeId: string) {
    const ep = currentData.episodes.find(e => e.id === episodeId);
    if (!ep) return;

    currentData.player.kind = 'episode';
    currentData.player.id = episodeId;
    currentData.player.pos = ep.progress || 0;
    currentData.player.playing = true;

    audioEngine.playTrack(ep, ep.progress || 0);
    emitChange();
  },

  togglePlay() {
    const isPlaying = !currentData.player.playing;
    currentData.player.playing = isPlaying;

    if (isPlaying) {
      const item = currentData.player.kind === 'track'
        ? currentData.tracks.find(t => t.id === currentData.player.id)
        : currentData.episodes.find(e => e.id === currentData.player.id);
      
      if (item) {
        audioEngine.playTrack(item, currentData.player.pos);
      } else {
        audioEngine.resume();
      }
    } else {
      audioEngine.pause();
    }
    emitChange();
  },

  nextTrack() {
    const { queue, id, shuffle, repeat } = currentData.player;
    if (queue.length === 0) return;

    let nextIndex = 0;
    const currentIndex = queue.indexOf(id);

    if (shuffle) {
      let rand = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && rand === currentIndex) {
        rand = (rand + 1) % queue.length;
      }
      nextIndex = rand;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          currentData.player.playing = false;
          audioEngine.pause();
          emitChange();
          return;
        }
      }
    }

    const nextId = queue[nextIndex];
    storeActions.playTrack(nextId);
  },

  prevTrack() {
    const { queue, id, pos } = currentData.player;
    // If more than 3 seconds in, seek to beginning
    if (pos > 3) {
      storeActions.seek(0);
      return;
    }

    const currentIndex = queue.indexOf(id);
    if (currentIndex <= 0) {
      storeActions.seek(0);
      return;
    }

    const prevId = queue[currentIndex - 1];
    storeActions.playTrack(prevId);
  },

  seek(seconds: number) {
    currentData.player.pos = seconds;
    audioEngine.seek(seconds);
    emitChange();
  },

  setVolume(vol: number) {
    currentData.player.volume = Math.max(0, Math.min(1, vol));
    audioEngine.setVolume(vol);
    emitChange();
  },

  toggleShuffle() {
    currentData.player.shuffle = !currentData.player.shuffle;
    emitChange();
  },

  cycleRepeat() {
    const states: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const next = states[(states.indexOf(currentData.player.repeat) + 1) % states.length];
    currentData.player.repeat = next;
    emitChange();
  },

  toggleLoved(trackId: string) {
    const track = currentData.tracks.find(t => t.id === trackId);
    if (track) {
      track.loved = !track.loved;
      track.lovedAt = track.loved ? Date.now() : undefined;
      emitChange();
    }
  },

  addToQueue(trackId: string) {
    if (!currentData.player.queue.includes(trackId)) {
      currentData.player.queue.push(trackId);
      emitChange();
    }
  },

  toggleFollowArtist(artistId: string) {
    const artist = currentData.artists.find(a => a.id === artistId);
    if (artist) {
      artist.followed = !artist.followed;
      emitChange();
    }
  },

  toggleShowVideo() {
    currentData.player.showVideo = !currentData.player.showVideo;
    emitChange();
  },

  // Playlists
  createPlaylist(name: string, desc = '', cover = 'living'): Playlist {
    const id = 'pl-' + Date.now();
    const newPlaylist: Playlist = {
      id,
      name,
      desc,
      cover,
      mine: true,
      made: Date.now(),
      tracks: []
    };
    currentData.playlists.push(newPlaylist);
    emitChange();
    return newPlaylist;
  },

  addTrackToPlaylist(playlistId: string, trackId: string) {
    const pl = currentData.playlists.find(p => p.id === playlistId);
    if (pl && !pl.tracks.includes(trackId)) {
      pl.tracks.push(trackId);
      emitChange();
    }
  },

  removeTrackFromPlaylist(playlistId: string, trackId: string) {
    const pl = currentData.playlists.find(p => p.id === playlistId);
    if (pl) {
      pl.tracks = pl.tracks.filter(t => t !== trackId);
      emitChange();
    }
  },

  reorderPlaylistTracks(playlistId: string, newTracks: string[]) {
    const pl = currentData.playlists.find(p => p.id === playlistId);
    if (pl) {
      pl.tracks = newTracks;
      emitChange();
    }
  },

  deletePlaylist(playlistId: string) {
    currentData.playlists = currentData.playlists.filter(p => p.id !== playlistId);
    emitChange();
  },

  deleteTrack(trackId: string) {
    currentData.tracks = currentData.tracks.filter(t => t.id !== trackId);
    currentData.playlists.forEach(pl => {
      pl.tracks = pl.tracks.filter(t => t !== trackId);
    });
    if (currentData.player.id === trackId) {
      storeActions.nextTrack();
    }
    emitChange();
  },

  // YouTube Track Import
  async importYouTubeTrack(inputUrlOrId: string, targetPlaylistId?: string): Promise<Track | null> {
    const parsed = youtubeService.parseUrl(inputUrlOrId);
    if (!parsed?.videoId) return null;

    const videoId = parsed.videoId;
    const existing = currentData.tracks.find(t => t.youtubeId === videoId);
    if (existing) {
      if (targetPlaylistId) {
        storeActions.addTrackToPlaylist(targetPlaylistId, existing.id);
      }
      return existing;
    }

    const info = await youtubeService.fetchVideoInfo(videoId);
    const newTrack: Track = {
      id: `yt-${videoId}`,
      title: info.title,
      artist: info.author,
      album: 'youtube',
      genre: 'lofi',
      dur: 240, // Standard placeholder duration until streamed
      loved: false,
      youtubeId: videoId,
      cover: info.thumbnail
    };

    currentData.tracks.push(newTrack);

    if (targetPlaylistId) {
      storeActions.addTrackToPlaylist(targetPlaylistId, newTrack.id);
    } else {
      // Add to default YouTube playlist
      const ytPl = currentData.playlists.find(p => p.id === 'youtube-lofi');
      if (ytPl) ytPl.tracks.push(newTrack.id);
    }

    emitChange();
    return newTrack;
  },

  // Instant Spotify Playlist Import via URL
  async importSpotifyPlaylistUrl(spotifyUrl: string): Promise<Playlist | null> {
    const data = await import('../services/spotify').then(m => m.spotifyService.resolveSpotifyUrl(spotifyUrl));
    if (!data || !data.tracks || data.tracks.length === 0) return null;

    const trackIds: string[] = [];
    for (const t of data.tracks) {
      const trackId = `sp-${t.id}`;
      const cached = coverResolver.getCachedCover(t.title, t.artist, t.id);
      const initialCover = cached || coverResolver.getFallbackCover(t.title, t.artist);

      let existing = currentData.tracks.find(tr => tr.id === trackId);
      if (!existing) {
        existing = {
          id: trackId,
          title: t.title,
          artist: t.artist,
          album: data.name,
          genre: 'pop',
          dur: t.dur,
          loved: false,
          spotifyId: t.id,
          audioUrl: t.audioUrl || undefined,
          cover: initialCover
        };
        currentData.tracks.push(existing);
      } else if (existing.cover === data.cover) {
        existing.cover = initialCover;
      }

      trackIds.push(trackId);

      // Async unique artwork resolution from Spotify oEmbed & iTunes
      coverResolver.resolveCover(t.title, t.artist, t.id).then(resolved => {
        if (existing && resolved && existing.cover !== resolved) {
          existing.cover = resolved;
          emitChange();
        }
      });
    }

    const newPlaylist: Playlist = {
      id: `sp-pl-${Date.now()}`,
      name: data.name,
      desc: data.desc || `Imported Spotify Playlist (${data.tracks.length} songs)`,
      cover: 'living',
      mine: true,
      made: Date.now(),
      tracks: trackIds,
      isSpotify: true
    };

    currentData.playlists.push(newPlaylist);
    emitChange();
    return newPlaylist;
  },

  // Settings & Theme
  setTheme(theme: 'light' | 'dark' | 'system') {
    currentData.prefs.theme = theme;
    localStorage.setItem('lullo:theme', JSON.stringify(theme));
    const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#1a1511' : '#fcecdc');
    emitChange();
  },

  setSidebarRail(rail: boolean) {
    currentData.prefs.sidebarRail = rail;
    localStorage.setItem('lullo:rail', rail ? '1' : '0');
    if (rail) {
      document.documentElement.classList.add('is-rail');
    } else {
      document.documentElement.classList.remove('is-rail');
    }
    emitChange();
  },

  updatePrefs(prefs: Partial<UserPrefs>) {
    currentData.prefs = { ...currentData.prefs, ...prefs };
    emitChange();
  },

  updateProfile(profile: Partial<UserProfile>) {
    currentData.profile = { ...currentData.profile, ...profile };
    emitChange();
  },

  setPlan(plan: 'free' | 'plus' | 'duo') {
    currentData.plan = plan;
    emitChange();
  },

  setVipSkin(skin: 'obsidian' | 'latte' | 'matcha' | 'neon') {
    currentData.prefs.vipSkin = skin;
    emitChange();
  },

  toggleHifiAudio() {
    currentData.prefs.hifiAudio = !currentData.prefs.hifiAudio;
    emitChange();
  },

  toggleTactileSound() {
    const next = currentData.prefs.tactileSound !== false ? false : true;
    currentData.prefs.tactileSound = next;
    tactile.setEnabled(next);
    emitChange();
  },

  setAmbientLevels(levels: { rain: number; crackle: number; cafe: number }) {
    currentData.prefs.ambientLevels = levels;
    ambientAudio.setRain(levels.rain);
    ambientAudio.setCrackle(levels.crackle);
    ambientAudio.setCafe(levels.cafe);
    emitChange();
  },

  exportData(): string {
    const exportPayload = {
      app: 'FONO lofi Listening Room',
      version: '2.0',
      exportDate: new Date().toISOString(),
      profile: currentData.profile,
      prefs: currentData.prefs,
      goal: currentData.goal,
      plan: currentData.plan,
      history: currentData.history,
      playlists: currentData.playlists,
      tracks: currentData.tracks
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `fono-library-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return jsonStr;
  },

  importData(jsonString: string): { success: boolean; tracksCount: number; playlistsCount: number; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid backup file: Root must be a JSON object.');
      }

      let importedTracks = 0;
      if (Array.isArray(parsed.tracks)) {
        for (const t of parsed.tracks) {
          if (!t.id || !t.title) continue;
          const idx = currentData.tracks.findIndex(existing => existing.id === t.id);
          if (idx >= 0) {
            currentData.tracks[idx] = { ...currentData.tracks[idx], ...t };
          } else {
            currentData.tracks.push(t);
          }
          importedTracks++;
        }
      }

      let importedPlaylists = 0;
      if (Array.isArray(parsed.playlists)) {
        for (const pl of parsed.playlists) {
          if (!pl.id || !pl.name) continue;
          const idx = currentData.playlists.findIndex(existing => existing.id === pl.id);
          if (idx >= 0) {
            currentData.playlists[idx] = pl;
          } else {
            currentData.playlists.push(pl);
          }
          importedPlaylists++;
        }
      }

      if (Array.isArray(parsed.history)) {
        const existingTimestamps = new Set(currentData.history.map(h => `${h.k}-${h.t}`));
        for (const h of parsed.history) {
          if (h.k && h.t && !existingTimestamps.has(`${h.k}-${h.t}`)) {
            currentData.history.push(h);
          }
        }
        currentData.history.sort((a, b) => b.t - a.t);
      }

      if (parsed.profile) {
        currentData.profile = { ...currentData.profile, ...parsed.profile };
      }
      if (parsed.prefs) {
        currentData.prefs = { ...currentData.prefs, ...parsed.prefs };
      }
      if (typeof parsed.goal === 'number') {
        currentData.goal = parsed.goal;
      }

      emitChange();
      return {
        success: true,
        tracksCount: importedTracks,
        playlistsCount: importedPlaylists,
        message: `Successfully restored ${importedPlaylists} playlists and ${importedTracks} tracks!`
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to parse backup JSON file');
    }
  },

  setGoal(minutes: number) {
    currentData.goal = minutes;
    emitChange();
  },

  enrichAlbumCovers() {
    healAndEnrichCovers();
  },

  // Authentication & Clean Registration (User Request)
  registerUser({
    name,
    email,
    provider,
    avatar,
    rememberMe = true
  }: {
    name: string;
    email: string;
    provider: 'google' | 'apple' | 'email';
    avatar?: string;
    rememberMe?: boolean;
  }) {
    const userId = `usr-${Date.now()}`;
    const cleanName = (name && name !== 'Guest Listener') ? name : (email ? email.split('@')[0] : 'New Listener');
    const handle = (cleanName || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');

    currentData.profile = {
      id: userId,
      name: cleanName,
      handle: handle || 'listener',
      email: email || `${handle}@listening.room`,
      city: 'Online',
      avatar,
      bio: 'Lo-Fi enthusiast and late-night focus producer ☕',
      provider,
      isRegistered: true,
      registeredAt: Date.now(),
      rememberMe,
      redeemedCodes: []
    };

    if (typeof window !== 'undefined') {
      const sess = JSON.stringify({
        isRegistered: true,
        name: currentData.profile.name,
        email: currentData.profile.email,
        handle: currentData.profile.handle,
        provider: currentData.profile.provider,
        plan: currentData.plan
      });
      localStorage.setItem('fono:user_session', sess);
      localStorage.setItem('lullo:user_session', sess);
      if (rememberMe) {
        localStorage.setItem('fono:remember_me', 'true');
        localStorage.setItem('lullo:remember_me', 'true');
      }
      try {
        const authChannel = new BroadcastChannel('fono_auth_channel');
        authChannel.postMessage({ type: 'LOGIN', profile: currentData.profile });
      } catch {}
    }

    // User directive: Delete all default songs when user registers so each has unique uploaded songs
    currentData.tracks = [];
    currentData.playlists = [
      {
        id: 'mix1',
        name: 'My Upload Vault',
        desc: 'Personal music vault for your uploaded tracks and audio files',
        cover: 'pour',
        mine: true,
        made: Date.now(),
        tracks: []
      }
    ];
    currentData.albums = [];
    currentData.artists = [];
    currentData.history = [];
    currentData.player.id = '';
    currentData.player.playing = false;
    currentData.player.queue = [];
    currentData.player.pos = 0;
    audioEngine.pause();

    emitChange();
    return currentData.profile;
  },

  loginUser({
    name,
    email,
    provider,
    avatar,
    rememberMe = true
  }: {
    name: string;
    email: string;
    provider: 'google' | 'apple' | 'email';
    avatar?: string;
    rememberMe?: boolean;
  }) {
    const derivedHandle = (name || email.split('@')[0] || 'listener').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = (name && name !== 'Guest Listener') ? name : (email ? email.split('@')[0] : 'Listener');

    currentData.profile = {
      ...currentData.profile,
      name: cleanName,
      email: email || currentData.profile.email,
      handle: (currentData.profile.handle === 'guest' || !currentData.profile.handle) ? derivedHandle : currentData.profile.handle,
      avatar: avatar || currentData.profile.avatar,
      provider,
      rememberMe,
      isRegistered: true
    };
    if (typeof window !== 'undefined') {
      const sess = JSON.stringify({
        isRegistered: true,
        name: currentData.profile.name,
        email: currentData.profile.email,
        handle: currentData.profile.handle,
        provider: currentData.profile.provider,
        plan: currentData.plan
      });
      localStorage.setItem('fono:user_session', sess);
      localStorage.setItem('lullo:user_session', sess);
      if (rememberMe) {
        localStorage.setItem('fono:remember_me', 'true');
        localStorage.setItem('lullo:remember_me', 'true');
      }
      try {
        const authChannel = new BroadcastChannel('fono_auth_channel');
        authChannel.postMessage({ type: 'LOGIN', profile: currentData.profile });
      } catch {}
    }
    emitChange();
    return currentData.profile;
  },

  logoutUser() {
    currentData.plan = 'free';
    currentData.profile = {
      name: 'Guest Listener',
      email: 'guest@fono.fm',
      handle: 'guest',
      city: 'Online Room',
      avatar: undefined,
      provider: undefined,
      rememberMe: false,
      isRegistered: false
    };
    currentData.history = [];
    currentData.tracks.forEach((t: any) => { t.loved = false; });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fono:remember_me');
      localStorage.removeItem('fono:user_session');
      localStorage.removeItem('lullo:remember_me');
      localStorage.removeItem('lullo:user_session');
      try {
        const authChannel = new BroadcastChannel('fono_auth_channel');
        authChannel.postMessage({ type: 'LOGOUT' });
      } catch {}
    }
    if (currentData.tracks.length === 0) {
      currentData.tracks = INITIAL_TRACKS.slice();
    }
    emitChange();
  },

  // Code Redemption
  redeemGiftCode(code: string): RedeemResult {
    const alreadyRedeemed = currentData.profile.redeemedCodes || [];
    const result = redeemService.redeem(code, alreadyRedeemed);
    if (result.success) {
      if (!currentData.profile.redeemedCodes) currentData.profile.redeemedCodes = [];
      currentData.profile.redeemedCodes.push(result.code);
      if (result.plan) currentData.plan = result.plan;
      if (result.skin) currentData.prefs.vipSkin = result.skin;
      if (result.hifi) currentData.prefs.hifiAudio = true;
      emitChange();
    }
    return result;
  },

  // Upload Local Audio Files (.mp3, .wav, .m4a, .flac)
  async uploadLocalAudioFiles(files: FileList | File[]): Promise<Track[]> {
    const fileArray = Array.from(files);
    const newTracks: Track[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      let title = rawName;
      let artist = currentData.profile.name || 'Local Artist';

      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const objectUrl = URL.createObjectURL(file);

      const duration = await new Promise<number>((resolve) => {
        const tempAudio = new Audio();
        tempAudio.src = objectUrl;
        tempAudio.addEventListener('loadedmetadata', () => {
          resolve(Math.round(tempAudio.duration) || 180);
        });
        tempAudio.addEventListener('error', () => {
          resolve(180);
        });
        setTimeout(() => resolve(180), 1000);
      });

      const fallbackCover = coverResolver.getFallbackCover(title, artist);

      const track: Track = {
        id: `local-${Date.now()}-${i}`,
        title,
        artist,
        album: 'My Uploads',
        genre: 'lofi',
        dur: duration,
        loved: false,
        audioUrl: objectUrl,
        cover: fallbackCover
      };

      currentData.tracks.push(track);
      newTracks.push(track);
    }

    let uploadsPlaylist = currentData.playlists.find(p => p.id === 'pl-uploads');
    if (!uploadsPlaylist) {
      uploadsPlaylist = {
        id: 'pl-uploads',
        name: 'My Uploaded Songs',
        desc: 'Local audio files uploaded directly to your listening room',
        cover: 'living',
        mine: true,
        made: Date.now(),
        tracks: []
      };
      currentData.playlists.unshift(uploadsPlaylist);
    }

    newTracks.forEach(t => {
      if (!uploadsPlaylist!.tracks.includes(t.id)) {
        uploadsPlaylist!.tracks.push(t.id);
      }
    });

    if (!currentData.player.playing && newTracks.length > 0) {
      storeActions.playTrack(newTracks[0].id, newTracks.map(t => t.id));
    }

    emitChange();
    return newTracks;
  },

  // Payment Methods & Billing
  addPaymentMethod(method: Omit<PaymentMethod, 'id' | 'addedAt'>): PaymentMethod {
    if (!currentData.paymentMethods) currentData.paymentMethods = [];
    const id = `pm-${method.type}-${Date.now()}`;
    const isFirst = currentData.paymentMethods.length === 0;
    const newPm: PaymentMethod = {
      ...method,
      id,
      isDefault: method.isDefault ?? isFirst,
      addedAt: Date.now()
    };
    if (newPm.isDefault) {
      currentData.paymentMethods.forEach(pm => { pm.isDefault = false; });
    }
    currentData.paymentMethods.unshift(newPm);
    emitChange();
    return newPm;
  },

  removePaymentMethod(id: string) {
    if (!currentData.paymentMethods) return;
    const removedWasDefault = currentData.paymentMethods.find(pm => pm.id === id)?.isDefault;
    currentData.paymentMethods = currentData.paymentMethods.filter(pm => pm.id !== id);
    if (removedWasDefault && currentData.paymentMethods.length > 0) {
      currentData.paymentMethods[0].isDefault = true;
    }
    emitChange();
  },

  setDefaultPaymentMethod(id: string) {
    if (!currentData.paymentMethods) return;
    currentData.paymentMethods.forEach(pm => {
      pm.isDefault = (pm.id === id);
    });
    emitChange();
  },

  processPayment({
    planId,
    planName,
    amount,
    methodId,
    newMethod
  }: {
    planId: 'free' | 'plus' | 'duo';
    planName: string;
    amount: string;
    methodId?: string;
    newMethod?: Omit<PaymentMethod, 'id' | 'addedAt'>;
  }): BillingInvoice {
    if (!currentData.paymentMethods) currentData.paymentMethods = [];
    if (!currentData.invoices) currentData.invoices = [];

    let label = 'Credit Card';
    if (newMethod) {
      const added = storeActions.addPaymentMethod(newMethod);
      if (added.type === 'apple_pay') label = 'Apple Pay (Touch ID)';
      else if (added.type === 'google_pay') label = `Google Pay (${added.walletEmail || '1-Click'})`;
      else if (added.type === 'alipay') label = 'AlipayHK (香港支付寶)';
      else label = `${(added.brand || 'card').toUpperCase()} ending in ${added.last4 || '4242'}`;
    } else if (methodId) {
      const pm = currentData.paymentMethods.find(p => p.id === methodId);
      if (pm) {
        if (pm.type === 'apple_pay') label = 'Apple Pay (Touch ID)';
        else if (pm.type === 'google_pay') label = `Google Pay (${pm.walletEmail || '1-Click'})`;
        else if (pm.type === 'alipay') label = 'AlipayHK (香港支付寶)';
        else label = `${(pm.brand || 'card').toUpperCase()} ending in ${pm.last4 || '4242'}`;
      }
    }

    currentData.plan = planId;

    const invoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      date: Date.now(),
      amount,
      planId,
      planName,
      paymentMethodLabel: label,
      status: 'paid',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    currentData.invoices.unshift(invoice);
    emitChange();
    return invoice;
  },

  clearListeningData() {
    currentData.history = [];
    currentData.tracks.forEach(t => { t.plays = 0; });
    currentListenSession = {
      trackId: '',
      accumulatedSeconds: 0,
      lastPos: 0,
      scrobbled: false
    };
    emitChange();
  },

  resetData() {
    currentData = getInitialData();
    localStorage.removeItem(STORAGE_KEY);
    emitChange();
  }
};

// Auto-heal duplicate playlist covers on existing imported tracks
export function healAndEnrichCovers() {
  if (typeof window === 'undefined') return;

  const playlistCovers = new Set(
    currentData.playlists
      .map(p => p.cover)
      .filter((c): c is string => typeof c === 'string' && (c.startsWith('http') || c.length > 20))
  );

  const coverCounts: Record<string, number> = {};
  for (const t of currentData.tracks) {
    if (t.cover) {
      coverCounts[t.cover] = (coverCounts[t.cover] || 0) + 1;
    }
  }

  let updated = false;

  for (const track of currentData.tracks) {
    const isSharedPlaylistCover = track.cover && playlistCovers.has(track.cover);
    const isOverduplicated = track.cover && track.cover.startsWith('http') && (coverCounts[track.cover] > 2);
    const isSpotifyPlaceholder = track.id.startsWith('sp-') && (isSharedPlaylistCover || isOverduplicated || !track.cover);

    if (isSharedPlaylistCover || isOverduplicated || isSpotifyPlaceholder) {
      // First assign deterministic varied bundled cover so none look identical
      const fallback = coverResolver.getFallbackCover(track.title, track.artist);
      if (track.cover !== fallback) {
        track.cover = fallback;
        updated = true;
      }

      // Then fetch authentic album artwork in background from Spotify oEmbed & iTunes
      coverResolver.resolveCover(track.title, track.artist, track.spotifyId).then(realCover => {
        if (realCover && track.cover !== realCover) {
          track.cover = realCover;
          emitChange();
        }
      });
    }

    // Auto-resolve full length YouTube stream for all Spotify tracks so they never cut off at 30s
    if (!track.youtubeId) {
      youtubeService.searchVideo(`${track.artist} ${track.title} audio`).then(ytId => {
        if (ytId && !track.youtubeId) {
          track.youtubeId = ytId;
          emitChange();
        }
      });
    }
  }

  if (updated) {
    emitChange();
  }
}

if (typeof window !== 'undefined') {
  // Expose for runtime inspection
  // Expose for runtime inspection
  (window as any).__storeActions = storeActions;
  (window as any).__audioEngine = audioEngine;
  (window as any).__currentData = currentData;
  // Heal tracks on start
  setTimeout(healAndEnrichCovers, 100);
}
