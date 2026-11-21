import React from 'react';
import { useStore, storeActions } from '../store';
import { Vinyl } from './Vinyl';
import { Icon } from '../ui/icons';
import { formatDuration } from '../ui/format';

export interface MobileNowPlayingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVideoModal: () => void;
}

export const MobileNowPlayingSheet: React.FC<MobileNowPlayingSheetProps> = ({
  isOpen,
  onClose,
  onOpenVideoModal
}) => {
  const store = useStore();
  const player = store.player;
  const isPlaying = player.playing;

  const currentTrack = player.kind === 'track'
    ? store.tracks.find(t => t.id === player.id)
    : null;

  const album = currentTrack ? store.albums.find(a => a.id === currentTrack.album) : null;
  const artist = currentTrack ? store.artists.find(a => a.id === currentTrack.artist) : null;
  const cover = album?.cover || (currentTrack?.cover ? currentTrack.cover : 'pour');
  const duration = currentTrack ? currentTrack.dur : 240;

  if (!isOpen) return null;

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose}>
      <div
        className="mobile-sheet card"
        role="dialog"
        aria-modal="true"
        aria-label="Now playing"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-sheet__handle-wrap" onClick={onClose}>
          <div className="mobile-sheet__handle" />
        </div>

        <div className="mobile-sheet__head">
          <span className="badge badge--pill">Now Playing</span>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="down" size="sm" />
          </button>
        </div>

        <div className="mobile-sheet__vinyl-wrap">
          <Vinyl size={240} cover={cover} isPlaying={isPlaying} />
        </div>

        <div className="mobile-sheet__meta">
          <div className="flex-1">
            <h2 className="title title--md">{currentTrack?.title || 'Nothing playing'}</h2>
            <p className="page-sub">{artist?.name || currentTrack?.artist} · {album?.title || 'Single'}</p>
          </div>
          {currentTrack && (
            <button
              type="button"
              className={`btn btn--ghost btn--icon${currentTrack.loved ? ' is-loved' : ''}`}
              onClick={() => storeActions.toggleLoved(currentTrack.id)}
            >
              <Icon name="heart" size="sm" />
            </button>
          )}
        </div>

        {/* Video button if YouTube track */}
        {currentTrack?.youtubeId && (
          <button
            type="button"
            className="btn btn--soft w-full mb-4 flex items-center justify-center gap-2"
            onClick={() => {
              onClose();
              onOpenVideoModal();
            }}
          >
            <Icon name="video" size="xs" />
            <span>Watch Live YouTube Video</span>
          </button>
        )}

        {/* Timeline Scrubber */}
        <div className="dock__scrub mb-4">
          <span className="dock__time">{formatDuration(player.pos)}</span>
          <div className="scrub">
            <input
              type="range"
              className="scrub__range"
              min={0}
              max={duration}
              step={0.5}
              value={player.pos}
              onChange={(e) => storeActions.seek(parseFloat(e.target.value))}
            />
            <span
              className="scrub__bar"
              style={{ width: `${Math.min(100, (player.pos / duration) * 100)}%` }}
            />
          </div>
          <span className="dock__time">{formatDuration(duration)}</span>
        </div>

        {/* Controls */}
        <div className="mobile-sheet__controls flex justify-center items-center gap-4">
          <button
            type="button"
            className={`btn btn--ghost btn--icon${player.shuffle ? ' is-active' : ''}`}
            onClick={() => storeActions.toggleShuffle()}
          >
            <Icon name="shuffle" size="xs" />
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => storeActions.prevTrack()}
          >
            <Icon name="prev" size="md" />
          </button>

          <button
            type="button"
            className="btn btn--primary btn--icon p-4"
            onClick={() => storeActions.togglePlay()}
          >
            <Icon name={isPlaying ? 'pause' : 'play'} size="lg" />
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => storeActions.nextTrack()}
          >
            <Icon name="next" size="md" />
          </button>

          <button
            type="button"
            className={`btn btn--ghost btn--icon${player.repeat !== 'off' ? ' is-active' : ''}`}
            onClick={() => storeActions.cycleRepeat()}
          >
            <Icon name="repeat" size="xs" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNowPlayingSheet;
