import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration, formatMinutes, formatNumber } from '../ui/format';

export interface PlaylistDetailProps {
  playlistId: string;
  onNavigate: (route: string) => void;
  onOpenFinder: () => void;
}

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  playlistId,
  onNavigate,
  onOpenFinder
}) => {
  const store = useStore();
  const player = store.player;
  const playlist = store.playlists.find(p => p.id === playlistId);

  const [ytInput, setYtInput] = useState('');
  const [importingYt, setImportingYt] = useState(false);
  const [showAddYt, setShowAddYt] = useState(false);

  if (!playlist) {
    return (
      <div className="page playlist">
        <div className="card p-8 text-center">
          <h2>Playlist not found</h2>
          <p className="muted">This playlist may have been deleted.</p>
          <button
            type="button"
            className="btn btn--primary mt-4"
            onClick={() => onNavigate('playlists')}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  const tracks = playlist.tracks
    .map(tid => store.tracks.find(t => t.id === tid))
    .filter(Boolean) as typeof store.tracks;

  const totalSecs = tracks.reduce((acc, t) => acc + t.dur, 0);
  const totalMins = Math.round(totalSecs / 60);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      storeActions.playTrack(tracks[0].id, playlist.tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const randIdx = Math.floor(Math.random() * tracks.length);
      storeActions.playTrack(tracks[randIdx].id, playlist.tracks);
      if (!player.shuffle) storeActions.toggleShuffle();
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    storeActions.removeTrackFromPlaylist(playlist.id, trackId);
  };

  const handleAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytInput.trim()) return;
    setImportingYt(true);
    try {
      const track = await storeActions.importYouTubeTrack(ytInput.trim(), playlist.id);
      if (track) {
        setYtInput('');
        setShowAddYt(false);
      }
    } finally {
      setImportingYt(false);
    }
  };

  return (
    <div className="page playlist">
      {/* Authentic Lullo plhero */}
      <header className="plhero">
        <img
          src={`/photos/306-lullo/${playlist.cover}.jpg`}
          alt=""
          className="plhero__img"
          width={196}
          height={196}
        />

        <div className="plhero__text">
          <span className="eyebrow">
            {playlist.mine ? 'Playlist' : 'Curated Mix'}
            {playlist.isYouTube && ' · YouTube'}
            {playlist.isSpotify && ' · Spotify'}
          </span>
          <h1>{playlist.name}</h1>
          <p>{playlist.desc || 'A curated soundscape for focus, calm, and contemplation.'}</p>
          <span className="plhero__meta">
            {store.profile.name} · {tracks.length} songs · {formatMinutes(totalMins)}
          </span>

          <div className="plhero__btns">
            <button
              type="button"
              className="btn btn--primary btn--lg magnetic"
              disabled={tracks.length === 0}
              onClick={handlePlayAll}
            >
              <Icon name="play" />
              <span>Play all</span>
            </button>

            <button
              type="button"
              className="btn btn--soft btn--lg magnetic"
              disabled={tracks.length === 0}
              onClick={handleShuffle}
            >
              <Icon name="shuffle" />
              <span>Shuffle</span>
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--lg"
              onClick={onOpenFinder}
              title="Add songs from Library or paste link"
            >
              <Icon name="plus" />
              <span>Add songs</span>
            </button>

            <button
              type="button"
              className="btn btn--ghost btn--lg"
              onClick={() => setShowAddYt(!showAddYt)}
              title="Add YouTube video to this playlist"
            >
              <Icon name="youtube" />
              <span>Import YouTube</span>
            </button>
          </div>
        </div>
      </header>

      {/* YouTube Import Drawer */}
      {showAddYt && (
        <form onSubmit={handleAddYouTube} className="card p-4 mb-4 flex gap-3 items-center">
          <Icon name="youtube" />
          <input
            type="text"
            className="input flex-1"
            placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
            value={ytInput}
            onChange={(e) => setYtInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={importingYt || !ytInput.trim()}
          >
            {importingYt ? 'Importing…' : 'Add to playlist'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowAddYt(false)}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Tracks Table */}
      <section className="card card--flush lib plist">
        {tracks.length === 0 ? (
          <div className="text-center p-8">
            <p className="muted">This playlist has no songs yet.</p>
            <button
              type="button"
              className="btn btn--primary mt-3"
              onClick={onOpenFinder}
            >
              Add songs from library
            </button>
          </div>
        ) : (
          <ul className="tlist tlist--head">
            <li className="trow trow--head">
              <span className="trow__n">#</span>
              <span className="trow__main">Title</span>
              <span className="trow__album">Album</span>
              <span className="trow__plays">Plays</span>
              <span className="trow__love" title="Loved">
                <Icon name="heart" />
              </span>
              <span className="trow__dur" title="Duration">
                <Icon name="clock" />
              </span>
              <span className="trow__more" />
            </li>

            {tracks.map((track, idx) => {
              const isCur = player.id === track.id;
              const isPlaying = isCur && player.playing;
              const artist = store.artists.find(a => a.id === track.artist);
              const album = store.albums.find(a => a.id === track.album);
              const cover = album?.cover || 'pour';
              const coverSrc = track.cover?.startsWith('http') || track.cover?.startsWith('/')
                ? track.cover
                : `/photos/306-lullo/${cover}.jpg`;

              return (
                <li
                  key={track.id}
                  className={`trow${isCur ? ' is-cur' : ''}`}
                  onDoubleClick={() => storeActions.playTrack(track.id, playlist.tracks)}
                >
                  <span className="trow__glow" />

                  <div className="trow__n">
                    <span className="trow__num">
                      {isPlaying ? (
                        <span className="wave-bars">
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <button
                      type="button"
                      className="trow__play"
                      onClick={() => {
                        if (isCur) {
                          storeActions.togglePlay();
                        } else {
                          storeActions.playTrack(track.id, playlist.tracks);
                        }
                      }}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      <Icon name={isPlaying ? 'pause' : 'play'} />
                    </button>
                  </div>

                  <div className="trow__main">
                    <img
                      src={coverSrc}
                      alt=""
                      className="cover"
                      width={40}
                      height={40}
                      loading="lazy"
                    />
                    <div className="cell__text">
                      <b>
                        {track.title}
                        {track.explicit && <span className="badge badge--pill trow__exp">E</span>}
                        {track.youtubeId && <span className="badge badge--pill trow__exp">YT</span>}
                      </b>
                      <small>{artist?.name || track.artist}</small>
                    </div>
                  </div>

                  <div className="trow__album">{album?.title || 'Single'}</div>
                  <div className="trow__plays">{formatNumber(track.plays || 0)}</div>

                  <button
                    type="button"
                    className={`love${track.loved ? ' is-on' : ''}`}
                    onClick={() => storeActions.toggleLoved(track.id)}
                    aria-label={track.loved ? 'Remove from loved' : 'Love'}
                  >
                    <Icon name="heart" />
                  </button>

                  <div className="trow__dur">{formatDuration(track.dur)}</div>

                  <div className="trow__more">
                    <button
                      type="button"
                      className="ibtn ibtn--flat"
                      aria-label="Remove from playlist"
                      onClick={() => handleRemoveTrack(track.id)}
                      title="Remove from playlist"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PlaylistDetail;
