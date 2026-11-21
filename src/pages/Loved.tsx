import React from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration, formatMinutes, formatNumber } from '../ui/format';

export interface LovedProps {
  onNavigate: (route: string) => void;
}

export const Loved: React.FC<LovedProps> = ({ onNavigate }) => {
  const store = useStore();
  const player = store.player;
  const lovedTracks = store.tracks.filter(t => t.loved);

  const totalSecs = lovedTracks.reduce((acc, t) => acc + t.dur, 0);
  const totalMins = Math.round(totalSecs / 60);

  // Extract covers for the 4-card hero stack
  const lovedCovers = lovedTracks.slice(0, 4).map(t => {
    const alb = store.albums.find(a => a.id === t.album);
    return alb?.cover || 'sunset';
  });
  while (lovedCovers.length < 4) {
    lovedCovers.push(['sunset', 'latte', 'linen', 'moss'][lovedCovers.length]);
  }

  const handlePlayAll = () => {
    if (lovedTracks.length > 0) {
      storeActions.playTrack(lovedTracks[0].id, lovedTracks.map(t => t.id));
    }
  };

  const handleShuffle = () => {
    if (lovedTracks.length > 0) {
      const randIdx = Math.floor(Math.random() * lovedTracks.length);
      storeActions.playTrack(lovedTracks[randIdx].id, lovedTracks.map(t => t.id));
      if (!player.shuffle) storeActions.toggleShuffle();
    }
  };

  return (
    <div className="page loved">
      {/* Authentic Lullo lovehero */}
      <header className="lovehero">
        <div className="lovehero__stack" aria-hidden="true">
          {lovedCovers.map((cov, i) => (
            <img
              key={i}
              src={`/photos/306-lullo/${cov}.jpg`}
              alt=""
              className={`lovehero__c lovehero__c--${i}`}
            />
          ))}
        </div>

        <div className="lovehero__text">
          <b>Loved songs</b>
          <small>{lovedTracks.length} tracks · {formatMinutes(totalMins)} of your favorite music</small>
        </div>

        <div className="lovehero__btns">
          <button
            type="button"
            className="btn btn--primary btn--lg magnetic"
            disabled={lovedTracks.length === 0}
            onClick={handlePlayAll}
          >
            <Icon name="play" />
            <span>Play all</span>
          </button>

          <button
            type="button"
            className="btn btn--soft btn--lg magnetic"
            disabled={lovedTracks.length === 0}
            onClick={handleShuffle}
          >
            <Icon name="shuffle" />
            <span>Shuffle</span>
          </button>
        </div>
      </header>

      {/* Tracks List */}
      <section className="card card--flush lib">
        {lovedTracks.length === 0 ? (
          <div className="text-center p-8">
            <p className="muted">No loved songs yet. Click the heart on any track to save it here.</p>
            <button
              type="button"
              className="btn btn--primary mt-3"
              onClick={() => onNavigate('library')}
            >
              Explore library
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

            {lovedTracks.map((track, idx) => {
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
                  onDoubleClick={() => storeActions.playTrack(track.id, lovedTracks.map(t => t.id))}
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
                          storeActions.playTrack(track.id, lovedTracks.map(t => t.id));
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
                    className="love is-on"
                    onClick={() => storeActions.toggleLoved(track.id)}
                    aria-label="Remove from loved"
                  >
                    <Icon name="heart" />
                  </button>

                  <div className="trow__dur">{formatDuration(track.dur)}</div>

                  <div className="trow__more">
                    <button
                      type="button"
                      className="ibtn ibtn--flat"
                      aria-label="Add to queue"
                      onClick={() => storeActions.addToQueue(track.id)}
                      title="Add to queue"
                    >
                      <Icon name="dots" />
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

export default Loved;
