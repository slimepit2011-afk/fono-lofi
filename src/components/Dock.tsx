import React, { useState, useEffect, useRef } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration } from '../ui/format';
import { audioEngine } from '../services/audioEngine';
import { tactile } from '../services/tactileFeedback';

export interface DockProps {
  onOpenVideoModal: () => void;
  onOpenMobileSheet: () => void;
}

export const Dock: React.FC<DockProps> = ({ onOpenVideoModal, onOpenMobileSheet }) => {
  const store = useStore();
  const player = store.player;
  const isPlaying = player.playing;

  const currentTrack = player.kind === 'track'
    ? store.tracks.find(t => t.id === player.id)
    : null;

  const currentEpisode = player.kind === 'episode'
    ? store.episodes.find(e => e.id === player.id)
    : null;

  const [currentTime, setCurrentTime] = useState(player.pos || 0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const dragProgressRef = useRef(0);
  const isDraggingRef = useRef(false);
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const seekLockUntilRef = useRef<number>(0);

  const duration = currentTrack ? currentTrack.dur : (currentEpisode ? currentEpisode.dur : 240);
  const rawProgress = duration > 0 ? currentTime / duration : 0;
  const progress = isDragging ? dragProgress : Math.max(0, Math.min(1, rawProgress));

  // Sync currentTime with player.pos when track changes or external seek occurs
  useEffect(() => {
    if (!isDraggingRef.current && Date.now() >= seekLockUntilRef.current) {
      setCurrentTime(player.pos || 0);
    }
  }, [player.id, player.pos]);

  // High-precision live ticker while playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isDragging) {
      interval = setInterval(() => {
        if (Date.now() < seekLockUntilRef.current || isDraggingRef.current) return;
        const liveTime = audioEngine.getCurrentTime();
        if (liveTime >= 0) {
          setCurrentTime(liveTime);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDragging]);

  const calcProgressFromEvent = (e: { clientX: number }) => {
    if (!scrubBarRef.current) return dragProgressRef.current;
    const rect = scrubBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const ratio = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    setIsDragging(true);
    const p = calcProgressFromEvent(e);
    dragProgressRef.current = p;
    setDragProgress(p);
    setCurrentTime(p * duration);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const p = calcProgressFromEvent(e);
    dragProgressRef.current = p;
    setDragProgress(p);
    setCurrentTime(p * duration);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    setIsDragging(false);
    const p = calcProgressFromEvent(e);
    const finalP = !isNaN(p) && p >= 0 ? p : dragProgressRef.current;
    const targetTime = Math.max(0, Math.min(duration, finalP * duration));
    seekLockUntilRef.current = Date.now() + 1500;
    setCurrentTime(targetTime);
    storeActions.seek(targetTime);
  };

  // Global safety tracking & release so cursor can drag across the entire browser viewport
  useEffect(() => {
    const handleGlobalPointerMove = (e: MouseEvent | PointerEvent) => {
      if (!isDraggingRef.current) return;
      const p = calcProgressFromEvent(e);
      dragProgressRef.current = p;
      setDragProgress(p);
      setCurrentTime(p * duration);
    };

    const handleGlobalPointerUp = (e: MouseEvent | PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        const p = calcProgressFromEvent(e);
        const finalP = !isNaN(p) && p >= 0 ? p : dragProgressRef.current;
        const targetTime = Math.max(0, Math.min(duration, finalP * duration));
        seekLockUntilRef.current = Date.now() + 1500;
        setCurrentTime(targetTime);
        storeActions.seek(targetTime);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
    };
  }, [duration]);

  const album = currentTrack ? store.albums.find(a => a.id === currentTrack.album) : null;
  const cover = album?.cover || 'pour';
  const coverSrc = currentTrack?.cover?.startsWith('http') || currentTrack?.cover?.startsWith('/')
    ? currentTrack.cover
    : `/photos/306-lullo/${cover}.jpg`;

  const isLoved = currentTrack ? currentTrack.loved : false;
  const hasYouTube = !!currentTrack?.youtubeId;

  return (
    <section className={`player${isPlaying ? ' is-playing' : ''}`} aria-label="Player">
      {/* Left: Track / Episode Metadata */}
      <div className="pmeta">
        <button
          type="button"
          className="pmeta__cov"
          aria-label="Open album cover"
          onClick={onOpenMobileSheet}
        >
          <img
            src={coverSrc}
            alt=""
            className="cover"
            width={48}
            height={48}
            loading="lazy"
          />
        </button>

        <span className="pmeta__text cell__text">
          <b>{currentTrack?.title || currentEpisode?.title || 'Nothing playing'}</b>
          <small>
            {currentTrack
              ? store.artists.find(a => a.id === currentTrack.artist)?.name || currentTrack.artist
              : currentEpisode
              ? store.shows.find(s => s.id === currentEpisode.show)?.name || 'Podcast'
              : 'Pick a song to start'}
          </small>
        </span>

        {currentTrack && (
          <button
            type="button"
            className={`btn btn--ghost btn--icon trow__love${isLoved ? ' is-loved' : ''}`}
            onClick={() => {
              tactile.click('tap');
              storeActions.toggleLoved(currentTrack.id);
            }}
            title={isLoved ? 'Remove from loved' : 'Love track'}
            aria-label={isLoved ? 'Loved' : 'Love'}
          >
            <Icon name="heart" size="xs" />
          </button>
        )}
      </div>

      {/* Middle: Playback controls & Scrubber */}
      <div className="player__mid">
        <div className="ctrls" role="group" aria-label="Playback">
          <button
            type="button"
            className={`ctrl${player.shuffle ? ' is-on' : ''}`}
            aria-pressed={player.shuffle}
            aria-label="Shuffle"
            onClick={() => {
              tactile.click('switch');
              storeActions.toggleShuffle();
            }}
          >
            <Icon name="shuffle" />
          </button>

          <button
            type="button"
            className="ctrl"
            aria-label="Previous"
            onClick={() => {
              tactile.click('tap');
              storeActions.prevTrack();
            }}
          >
            <Icon name="prev" />
          </button>

          <button
            type="button"
            className="ctrl ctrl--play"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={() => {
              tactile.click('snap');
              storeActions.togglePlay();
            }}
          >
            <Icon name={isPlaying ? 'pause' : 'play'} />
          </button>

          <button
            type="button"
            className="ctrl"
            aria-label="Next"
            onClick={() => {
              tactile.click('tap');
              storeActions.nextTrack();
            }}
          >
            <Icon name="next" />
          </button>

          <button
            type="button"
            className={`ctrl${player.repeat !== 'off' ? ' is-on' : ''}`}
            aria-label={`Repeat: ${player.repeat}`}
            onClick={() => {
              tactile.click('switch');
              storeActions.cycleRepeat();
            }}
          >
            <Icon name="repeat" />
            {player.repeat === 'one' && <span className="ctrl__one">1</span>}
          </button>
        </div>

        {/* Scrubber timeline */}
        <div className="scrub">
          <span className="scrub__t">{formatDuration(isDragging ? dragProgress * duration : currentTime)}</span>
          <div
            ref={scrubBarRef}
            className={`scrub__bar${isDragging ? ' is-drag' : ''}`}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <span className="scrub__track">
              <span
                className="scrub__fill"
                style={{ transform: `scaleX(${progress})` }}
              />
            </span>
            <span
              className="scrub__knob"
              style={{ left: `calc(${progress * 100}% - 7px)` }}
            />
          </div>
          <span className="scrub__t">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right: End tools (Video viewer & Volume) */}
      <div className="player__end">
        {hasYouTube && (
          <button
            type="button"
            className="ibtn ibtn--flat"
            aria-label="Watch video"
            title="Watch YouTube video screen"
            onClick={onOpenVideoModal}
          >
            <Icon name="video" />
          </button>
        )}

        <label className="vol">
          <Icon name={player.volume === 0 ? 'mute' : 'volume'} />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(player.volume * 100)}
            aria-label="Volume"
            onChange={(e) => storeActions.setVolume(Number(e.target.value) / 100)}
            style={{ '--v': player.volume } as any}
          />
        </label>
      </div>

      {/* Mobile Tap Targets */}
      <button
        type="button"
        className="player__open"
        aria-label="Open the player"
        onClick={onOpenMobileSheet}
      />

      <button
        type="button"
        className="player__mplay"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={() => storeActions.togglePlay()}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} />
      </button>

      <div className="player__mline" aria-hidden="true">
        <div className="scrub scrub--compact">
          <div className="scrub__bar">
            <span
              className="scrub__fill"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dock;
