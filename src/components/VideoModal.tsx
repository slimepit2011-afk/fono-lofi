import React from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const store = useStore();
  const player = store.player;
  const currentTrack = store.tracks.find(t => t.id === player.id);
  const youtubeId = currentTrack?.youtubeId;

  if (!isOpen || !youtubeId) return null;

  return (
    <div className="video-backdrop" onClick={onClose}>
      <div
        className="video-modal card modal"
        role="dialog"
        aria-modal="true"
        aria-label="YouTube Video Screen"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="video-modal__head">
          <div className="video-modal__info">
            <span className="badge badge--pill video-modal__badge">
              <Icon name="youtube" size="xs" />
              YouTube Video
            </span>
            <h3 className="video-modal__title">{currentTrack.title}</h3>
            <span className="video-modal__sub">
              {store.artists.find(a => a.id === currentTrack.artist)?.name || currentTrack.artist}
            </span>
          </div>

          <div className="video-modal__actions">
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={onClose}
              title="Close video view (audio keeps playing)"
              aria-label="Close video"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        </div>

        <div className="video-modal__screen">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.origin : ''
            )}&playsinline=1`}
            title={currentTrack.title}
            className="video-modal__iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <div className="video-modal__foot">
          <span className="muted-ink">
            Watching live video in sync with your spinning vinyl record.
          </span>
          <div className="video-modal__ctrls">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => storeActions.togglePlay()}
            >
              <Icon name={player.playing ? 'pause' : 'play'} size="xs" />
              {player.playing ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;
