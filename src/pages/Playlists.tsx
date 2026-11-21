import React from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatMinutes } from '../ui/format';

export interface PlaylistsProps {
  onNavigate: (route: string) => void;
  onOpenCreateModal: () => void;
}

export const Playlists: React.FC<PlaylistsProps> = ({ onNavigate, onOpenCreateModal }) => {
  const store = useStore();
  const player = store.player;

  return (
    <div className="page playlists">
      {/* Page Header */}
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>Playlists</h1>
        </div>
        <p className="pagehead__sub">
          Custom mixes, imported YouTube videos, and daily selections · {store.playlists.length} playlists
        </p>
      </header>

      {/* Grid of Playlists */}
      <div className="pgrid">
        {/* New Playlist Card */}
        <button
          type="button"
          className="pnew magnetic"
          onClick={onOpenCreateModal}
          aria-label="Create new playlist"
        >
          <span className="pnew__ico">
            <Icon name="plus" />
          </span>
          <b>New playlist</b>
          <small>Curate your own sound</small>
        </button>

        {store.playlists.map(pl => {
          const trackCount = pl.tracks.length;
          const totalSecs = pl.tracks.reduce((acc, tid) => {
            const tr = store.tracks.find(t => t.id === tid);
            return acc + (tr?.dur || 0);
          }, 0);
          const totalMins = Math.round(totalSecs / 60);
          const isCurPlaying = player.playing && pl.tracks.includes(player.id);

          return (
            <article
              key={pl.id}
              className={`pcard${isCurPlaying ? ' is-on' : ''}`}
            >
              <a
                href={`#playlist-${pl.id}`}
                className="pcard__link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(`playlist:${pl.id}`);
                }}
              >
                <img
                  src={`/photos/306-lullo/${pl.cover}.jpg`}
                  alt=""
                  className="pcard__img"
                  loading="lazy"
                />
                <div className="pcard__text">
                  <b>{pl.name}</b>
                  <small>{pl.desc || 'Curated mix'}</small>
                  <small className="pcard__meta">
                    {trackCount} songs · {formatMinutes(totalMins)}
                    {pl.isYouTube && ' · YouTube'}
                    {pl.isSpotify && ' · Spotify'}
                  </small>
                </div>
              </a>

              <button
                type="button"
                className="pcard__play magnetic"
                aria-label={`Play ${pl.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pl.tracks.length > 0) {
                    storeActions.playTrack(pl.tracks[0], pl.tracks);
                  }
                }}
                disabled={pl.tracks.length === 0}
              >
                <Icon name="play" />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Playlists;
