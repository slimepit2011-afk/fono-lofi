// YouTube Player & Integration Service with robust fallback and candidate handling

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface SearchResult {
  videoId: string | null;
  candidates: string[];
}

class YouTubeService {
  private player: any = null;
  private isApiLoaded = false;
  private isPlayerReady = false;
  private pendingVideoId: string | null = null;
  private pendingSeekSeconds = 0;
  private shouldPlayOnReady = false;
  private stateChangeListeners: ((state: number) => void)[] = [];
  private errorListeners: ((code: number) => void)[] = [];
  private timeUpdateInterval: any = null;
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private currentVolume = 85;

  constructor() {
    this.loadIframeAPI();
  }

  private loadIframeAPI() {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      this.isApiLoaded = true;
      if (prevCallback) prevCallback();
      if (this.pendingVideoId) {
        this.createPlayer(this.pendingVideoId, this.pendingSeekSeconds);
      }
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }

  public initPlayer(containerId: string, videoId: string, onReady?: () => void) {
    this.createPlayer(videoId, 0, containerId, onReady);
  }

  private createPlayer(videoId: string, startSeconds = 0, containerId = 'lullo-yt-iframe', onReady?: () => void) {
    if (typeof window === 'undefined') return;

    if (!this.isApiLoaded || !window.YT || !window.YT.Player) {
      this.pendingVideoId = videoId;
      this.pendingSeekSeconds = startSeconds;
      return;
    }

    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = 'position:fixed;bottom:10px;right:10px;width:320px;height:180px;opacity:0.001;pointer-events:none;z-index:-9999;';
      document.body.appendChild(container);
    }

    // If player already exists and is initialized, reuse it via loadVideoById
    if (this.player && this.isPlayerReady && typeof this.player.loadVideoById === 'function') {
      try {
        this.player.loadVideoById({
          videoId: videoId,
          startSeconds: startSeconds
        });
        if (this.shouldPlayOnReady) {
          this.player.playVideo();
        }
        return;
      } catch (e) {
        console.warn('Reusing player failed, recreating:', e);
      }
    }

    this.isPlayerReady = false;
    try {
      this.player = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            this.isPlayerReady = true;
            try {
              event.target.setVolume(this.currentVolume);
              if (startSeconds > 0) {
                event.target.seekTo(startSeconds, true);
              }
              if (this.shouldPlayOnReady) {
                event.target.playVideo();
              }
            } catch (err) {
              console.warn('YouTube onReady playback error:', err);
            }
            if (onReady) onReady();
          },
          onStateChange: (event: any) => {
            // 1 = Playing, 2 = Paused, 0 = Ended, 3 = Buffering, -1 = Unstarted
            this.stateChangeListeners.forEach(fn => fn(event.data));
            if (event.data === 1) {
              this.startTimeTracking();
            } else if (event.data === 2 || event.data === 0) {
              this.stopTimeTracking();
            }
          },
          onError: (event: any) => {
            console.warn('YouTube Player error code:', event.data);
            this.errorListeners.forEach(fn => fn(event.data));
          }
        }
      });
    } catch (e) {
      console.warn('Error constructing YT.Player:', e);
    }
  }

  public loadVideo(videoId: string, startSeconds = 0) {
    this.pendingVideoId = videoId;
    this.pendingSeekSeconds = startSeconds;
    this.shouldPlayOnReady = true;

    if (!this.isApiLoaded || !window.YT || !window.YT.Player) {
      return;
    }

    if (this.player && this.isPlayerReady && typeof this.player.loadVideoById === 'function') {
      try {
        this.player.loadVideoById({
          videoId: videoId,
          startSeconds: startSeconds
        });
        this.player.playVideo();
        return;
      } catch (e) {
        console.warn('Failed to loadVideoById on existing player:', e);
      }
    }

    this.createPlayer(videoId, startSeconds);
  }

  public play() {
    this.shouldPlayOnReady = true;
    if (this.player && this.isPlayerReady && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
      } catch (e) {
        console.warn('YouTube playVideo failed:', e);
      }
    }
  }

  public pause() {
    this.shouldPlayOnReady = false;
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {
        console.warn('YouTube pauseVideo failed:', e);
      }
    }
  }

  public seekTo(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(seconds, true);
      } catch (e) {
        console.warn('YouTube seekTo failed:', e);
      }
    }
  }

  public setVolume(volume0to1: number) {
    this.currentVolume = Math.round(volume0to1 * 100);
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(this.currentVolume);
      } catch (e) {}
    }
  }

  public getCurrentTime(): number {
    try {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        const t = this.player.getCurrentTime();
        return typeof t === 'number' && !isNaN(t) ? t : 0;
      }
    } catch {}
    return 0;
  }

  public getDuration(): number {
    try {
      if (this.player && typeof this.player.getDuration === 'function') {
        const d = this.player.getDuration();
        return typeof d === 'number' && !isNaN(d) ? d : 0;
      }
    } catch {}
    return 0;
  }

  public onStateChange(listener: (state: number) => void) {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  public onError(listener: (code: number) => void) {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  public setOnTimeUpdate(callback: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = callback;
  }

  private startTimeTracking() {
    this.stopTimeTracking();
    this.timeUpdateInterval = setInterval(() => {
      if (this.onTimeUpdateCallback && this.player) {
        const time = this.getCurrentTime();
        const dur = this.getDuration();
        this.onTimeUpdateCallback(time, dur);
      }
    }, 250);
  }

  private stopTimeTracking() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // URL Parser for various YouTube links
  public parseUrl(input: string): { videoId?: string; playlistId?: string } | null {
    if (!input) return null;
    input = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return { videoId: input };
    }

    try {
      const url = new URL(input.startsWith('http') ? input : `https://${input}`);
      const list = url.searchParams.get('list');
      const v = url.searchParams.get('v');
      if (v) {
        return { videoId: v, playlistId: list || undefined };
      }
      if (url.hostname.includes('youtu.be')) {
        const id = url.pathname.slice(1).split('/')[0];
        if (id) return { videoId: id, playlistId: list || undefined };
      }
      if (url.pathname.includes('/embed/')) {
        const id = url.pathname.split('/embed/')[1]?.split('?')[0];
        if (id) return { videoId: id, playlistId: list || undefined };
      }
      if (list) {
        return { playlistId: list };
      }
    } catch {}

    return null;
  }

  // Fetch YouTube video details via oEmbed (No API key needed)
  public async fetchVideoInfo(videoId: string): Promise<{ title: string; author: string; thumbnail: string; duration?: number }> {
    const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'YouTube Video',
          author: data.author_name || 'YouTube Creator',
          thumbnail: data.thumbnail_url || defaultThumbnail
        };
      }
    } catch {}

    return {
      title: `YouTube Track (${videoId})`,
      author: 'YouTube',
      thumbnail: defaultThumbnail
    };
  }

  // Search YouTube for full length video/audio ID & candidates
  public async searchCandidates(query: string): Promise<SearchResult> {
    if (!query || !query.trim()) return { videoId: null, candidates: [] };
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          videoId: data.videoId || null,
          candidates: Array.isArray(data.candidates) ? data.candidates : (data.videoId ? [data.videoId] : [])
        };
      }
    } catch (e) {
      console.warn('YouTube search API error:', e);
    }
    return { videoId: null, candidates: [] };
  }

  public async searchVideo(query: string): Promise<string | null> {
    const res = await this.searchCandidates(query);
    return res.videoId;
  }
}

export const youtubeService = new YouTubeService();
