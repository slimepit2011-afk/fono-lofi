// Unified Audio Engine: Coordinates HTML5 Audio & YouTube IFrame API
// Prioritizes direct full-length track playback with ZERO preview snippets or abrupt handovers.
// Features a high-precision Virtual Timeline Clock so seeking and scrubbing never reset to 0:00!

import { Track, Episode } from '../types';
import { youtubeService } from './youtube';

export type PlaybackType = 'html5' | 'youtube' | 'idle';

// High quality fallback streams
const AMBIENT_FALLBACK = '/audio/lofi-1.wav';

class AudioEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private currentTrack: Track | Episode | null = null;
  private currentType: PlaybackType = 'idle';
  private isPlaying = false;
  private volume = 0.85;

  private candidateQueue: string[] = [];
  private candidateIndex = 0;
  private isResolving = false;

  private onTimeUpdateCallback: ((currentTime: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onStateChangeCallback: ((playing: boolean) => void) | null = null;

  // Seamless seeking & precision virtual timeline clock
  private seekSettleTimeout: any = null;
  private pendingSeekPos: number | null = null;
  private virtualPos: number = 0;
  private virtualBaseTime: number = 0;
  private virtualStartTime: number = 0;
  private ytWatchdogTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initHtmlAudio();
      this.initYouTubeListener();
      this.initVirtualClockTicker();
    }
  }

  private getTrackDuration(): number {
    if (!this.currentTrack) return 240;
    return this.currentTrack.dur || 240;
  }

  private initHtmlAudio() {
    this.htmlAudio = new Audio();
    this.htmlAudio.preload = 'auto';

    this.htmlAudio.addEventListener('timeupdate', () => {
      if (this.pendingSeekPos !== null) return;
      if (this.currentType === 'html5' && this.onTimeUpdateCallback) {
        const cur = this.getCurrentTime();
        const maxDur = this.getTrackDuration();
        if (cur >= maxDur) {
          this.isPlaying = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
          if (this.onEndedCallback) this.onEndedCallback();
        } else {
          this.onTimeUpdateCallback(cur, maxDur);
        }
      }
    });

    this.htmlAudio.addEventListener('ended', () => {
      if (this.currentType === 'html5') {
        const cur = this.getCurrentTime();
        const maxDur = this.getTrackDuration();
        // If track duration is longer than the sound clip (e.g. 32s ambient loop on 154s track), loop smoothly
        if (cur < (maxDur - 1.5)) {
          if (this.htmlAudio) {
            this.htmlAudio.currentTime = 0;
            this.htmlAudio.play().catch(() => {});
          }
          return;
        }
        this.isPlaying = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        if (this.onEndedCallback) this.onEndedCallback();
      }
    });

    this.htmlAudio.addEventListener('error', (e) => {
      console.warn('HTML5 Audio error:', e);
      // If YouTube candidate is available, switch to YouTube
      if (this.candidateQueue.length > this.candidateIndex) {
        this.tryPlayYouTubeCandidate(this.candidateQueue[this.candidateIndex], this.getCurrentTime());
      } else if (this.currentTrack) {
        this.playHtml5(AMBIENT_FALLBACK, this.getCurrentTime());
      }
    });
  }

  private initYouTubeListener() {
    youtubeService.onStateChange((state) => {
      // state 1 = Playing
      if (state === 1) {
        this.clearYtWatchdog();
        this.isPlaying = true;
        this.currentType = 'youtube';
        this.stopHtml5();
        if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      } else if (state === 2) { // Paused
        if (this.currentType === 'youtube') {
          this.isPlaying = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        }
      } else if (state === 0) { // Ended
        if (this.currentType === 'youtube') {
          this.isPlaying = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
          if (this.onEndedCallback) this.onEndedCallback();
        }
      }
    });

    youtubeService.onError(async (errorCode) => {
      console.warn(`YouTube Player error ${errorCode} on candidate ${this.candidateQueue[this.candidateIndex]}`);
      
      // Try next candidate if available
      if (this.candidateIndex + 1 < this.candidateQueue.length) {
        this.candidateIndex++;
        const nextId = this.candidateQueue[this.candidateIndex];
        console.log(`Trying alternative YouTube candidate [${this.candidateIndex + 1}/${this.candidateQueue.length}]: ${nextId}`);
        this.tryPlayYouTubeCandidate(nextId, this.getCurrentTime());
        return;
      }

      // If all YouTube candidates failed or restricted (e.g. VEVO error 150):
      console.log('All YouTube candidates restricted or failed. Falling back to HTML5 stream.');
      if (this.currentTrack?.audioUrl) {
        this.playHtml5(this.currentTrack.audioUrl, this.getCurrentTime());
      } else {
        this.playHtml5(AMBIENT_FALLBACK, this.getCurrentTime());
      }
    });

    youtubeService.setOnTimeUpdate((time, dur) => {
      if (this.pendingSeekPos !== null) return;
      if (this.currentType === 'youtube' && this.onTimeUpdateCallback) {
        // If finite YouTube video with valid realistic timestamp:
        if (dur > 0 && dur < 7200 && time > 0 && time < 7200) {
          this.virtualPos = time;
          this.virtualBaseTime = time;
          this.virtualStartTime = performance.now();
          this.onTimeUpdateCallback(time, dur);
        } else {
          // Live stream or unconstrained: virtualize smoothly
          const cur = this.getCurrentTime();
          this.onTimeUpdateCallback(cur, this.getTrackDuration());
        }
      }
    });
  }

  private initVirtualClockTicker() {
    setInterval(() => {
      if (this.isPlaying && this.onTimeUpdateCallback && this.pendingSeekPos === null) {
        const cur = this.getCurrentTime();
        const maxDur = this.getTrackDuration();
        if (cur >= maxDur) {
          this.isPlaying = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
          if (this.onEndedCallback) this.onEndedCallback();
        } else {
          this.onTimeUpdateCallback(cur, maxDur);
        }
      }
    }, 250);
  }

  private clearYtWatchdog() {
    if (this.ytWatchdogTimer) {
      clearTimeout(this.ytWatchdogTimer);
      this.ytWatchdogTimer = null;
    }
  }

  private startYtWatchdog(pos: number) {
    this.clearYtWatchdog();
    this.ytWatchdogTimer = setTimeout(() => {
      if (this.isPlaying && this.currentType === 'youtube') {
        console.warn('[AudioEngine] YouTube candidate took >2500ms or was blocked. Seamlessly falling back to HTML5 stream.');
        this.clearYtWatchdog();
        if (this.currentTrack?.audioUrl) {
          this.playHtml5(this.currentTrack.audioUrl, pos);
        } else {
          this.playHtml5(AMBIENT_FALLBACK, pos);
        }
      }
    }, 2500);
  }

  private tryPlayYouTubeCandidate(videoId: string, startSeconds = 0) {
    if (!videoId) return;
    this.currentType = 'youtube';
    this.startYtWatchdog(startSeconds);
    youtubeService.setVolume(this.volume);
    youtubeService.loadVideo(videoId, startSeconds);
    youtubeService.play();
  }

  public async playTrack(item: Track | Episode, startSeconds = 0) {
    this.currentTrack = item;
    const initialPos = Math.max(0, startSeconds);
    this.virtualPos = initialPos;
    this.virtualBaseTime = initialPos;
    this.virtualStartTime = performance.now();
    this.pendingSeekPos = null;
    this.isPlaying = true;
    this.candidateQueue = [];
    this.candidateIndex = 0;

    // Stop any previously playing audio first to prevent any overlapping sound!
    this.stopHtml5();

    // Case 1: Podcast episode (audio-only content)
    if ('show' in item || !('artist' in item)) {
      if (item.audioUrl) {
        this.stopYouTube();
        this.playHtml5(item.audioUrl, initialPos);
      }
      return;
    }

    // Local user uploaded tracks: ALWAYS use HTML5 Audio!
    if (item.id.startsWith('local-') || item.audioUrl?.startsWith('blob:')) {
      if (item.audioUrl) {
        this.stopYouTube();
        this.playHtml5(item.audioUrl, initialPos);
      }
      return;
    }

    // Case 2: Music track with existing YouTube video ID
    const explicitYtId = ('youtubeId' in item && item.youtubeId) ? item.youtubeId : null;
    if (explicitYtId) {
      this.candidateQueue = [explicitYtId];
      this.tryPlayYouTubeCandidate(explicitYtId, initialPos);
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      return;
    }

    // Case 3: Spotify-imported track without pre-resolved YouTube ID
    this.isResolving = true;
    const title = 'title' in item ? item.title : '';
    const artist = 'artist' in item ? (typeof item.artist === 'string' ? item.artist : '') : '';
    const query = `${artist} ${title} audio`.trim();

    const searchResult = await youtubeService.searchCandidates(query);
    this.isResolving = false;

    // Check if the user selected a different track while searching
    if (this.currentTrack?.id !== item.id) return;

    if (searchResult.videoId) {
      if ('youtubeId' in item) {
        (item as any).youtubeId = searchResult.videoId;
      }
      this.candidateQueue = searchResult.candidates;
      this.tryPlayYouTubeCandidate(searchResult.videoId, initialPos);
    } else if (item.audioUrl) {
      this.playHtml5(item.audioUrl, initialPos);
    } else {
      this.playHtml5(AMBIENT_FALLBACK, initialPos);
    }

    if (this.onStateChangeCallback) this.onStateChangeCallback(true);
  }

  private playHtml5(url: string, startSeconds = 0) {
    this.clearYtWatchdog();
    this.currentType = 'html5';
    if (!this.htmlAudio) return;

    if (this.htmlAudio.src !== url) {
      this.htmlAudio.src = url;
    }
    this.htmlAudio.volume = this.volume;
    try {
      const clipDur = this.htmlAudio.duration || 32;
      this.htmlAudio.currentTime = (startSeconds % clipDur) || 0;
    } catch {}

    this.htmlAudio.play().then(() => {
      this.isPlaying = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    }).catch(err => {
      console.warn('HTML5 Audio play autoplay restriction:', err);
    });
  }

  public pause() {
    this.clearYtWatchdog();
    if (this.isPlaying) {
      this.virtualPos = this.getCurrentTime();
    }
    this.isPlaying = false;
    if (this.currentType === 'youtube') {
      youtubeService.pause();
    }
    this.stopHtml5();
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  public resume() {
    this.virtualBaseTime = this.virtualPos;
    this.virtualStartTime = performance.now();
    this.isPlaying = true;

    if (this.currentType === 'youtube') {
      youtubeService.play();
    } else if (this.currentType === 'html5' && this.htmlAudio) {
      this.htmlAudio.play().catch(() => {});
    } else if (this.currentTrack) {
      this.playTrack(this.currentTrack, this.virtualPos);
    }
    if (this.onStateChangeCallback) this.onStateChangeCallback(true);
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public seek(seconds: number) {
    const maxDur = this.getTrackDuration();
    const validSec = Math.max(0, Math.min(maxDur, seconds));

    this.virtualPos = validSec;
    this.virtualBaseTime = validSec;
    this.virtualStartTime = performance.now();
    this.pendingSeekPos = validSec;

    clearTimeout(this.seekSettleTimeout);
    this.seekSettleTimeout = setTimeout(() => {
      this.pendingSeekPos = null;
    }, 1200);

    if (this.currentType === 'youtube') {
      const ytDur = youtubeService.getDuration();
      if (ytDur > 0 && ytDur < 7200) {
        youtubeService.seekTo(validSec);
      }
    }

    if (this.htmlAudio) {
      try {
        const clipDur = this.htmlAudio.duration;
        if (clipDur && !isNaN(clipDur) && clipDur > 0) {
          const target = validSec % clipDur;
          this.htmlAudio.currentTime = Math.max(0, Math.min(clipDur - 0.2, target));
        } else {
          this.htmlAudio.currentTime = 0;
        }
        if (this.isPlaying) {
          this.htmlAudio.play().catch(() => {});
        }
      } catch (err) {
        console.warn('HTML5 seek error:', err);
      }
    }

    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(validSec, maxDur);
    }
  }

  public setVolume(vol0to1: number) {
    this.volume = Math.max(0, Math.min(1, vol0to1));
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.volume;
    }
    youtubeService.setVolume(this.volume);
  }

  public getCurrentTime(): number {
    if (this.pendingSeekPos !== null) {
      return this.pendingSeekPos;
    }
    const maxDur = this.getTrackDuration();

    if (this.currentType === 'youtube') {
      const ytTime = youtubeService.getCurrentTime();
      const ytDur = youtubeService.getDuration();
      if (ytTime > 0 && ytTime < 7200 && ytDur > 0 && ytDur < 7200) {
        return Math.min(ytTime, maxDur);
      }
    }

    if (!this.isPlaying) {
      return Math.min(this.virtualPos, maxDur);
    }

    const elapsed = (performance.now() - this.virtualStartTime) / 1000;
    const cur = this.virtualBaseTime + elapsed;
    return Math.max(0, Math.min(cur, maxDur));
  }

  public getDuration(): number {
    if (this.currentType === 'youtube') {
      const ytDur = youtubeService.getDuration();
      if (ytDur > 0 && ytDur < 7200) return ytDur;
    }
    return this.getTrackDuration();
  }

  public getCurrentType(): PlaybackType {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setCallbacks(callbacks: {
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onStateChange?: (playing: boolean) => void;
  }) {
    if (callbacks.onTimeUpdate) this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    if (callbacks.onEnded) this.onEndedCallback = callbacks.onEnded;
    if (callbacks.onStateChange) this.onStateChangeCallback = callbacks.onStateChange;
  }

  private stopHtml5() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
  }

  private stopYouTube() {
    youtubeService.pause();
  }
}

export const audioEngine = new AudioEngine();
