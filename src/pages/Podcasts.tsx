import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration, timeAgo } from '../ui/format';

export interface PodcastsProps {
  onNavigate: (route: string) => void;
}

export const Podcasts: React.FC<PodcastsProps> = ({ onNavigate }) => {
  const store = useStore();
  const player = store.player;
  const [selectedShow, setSelectedShow] = useState<string>('all');

  const filteredEpisodes = store.episodes.filter(ep => {
    if (selectedShow !== 'all' && ep.show !== selectedShow) return false;
    return true;
  });

  return (
    <div className="page podcasts">
      {/* Page Header */}
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>Podcasts</h1>
        </div>
        <p className="pagehead__sub">
          Calm conversations, music lore, and late night stories · {store.shows.length} shows, {store.episodes.length} episodes
        </p>
      </header>

      {/* Shows Grid */}
      <div className="shows">
        {store.shows.map(show => {
          const isSelected = selectedShow === show.id;
          const showEps = store.episodes.filter(e => e.show === show.id);

          return (
            <article
              key={show.id}
              className={`card show${isSelected ? ' is-selected' : ''}`}
            >
              <a
                href="#show"
                className="show__open"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedShow(isSelected ? 'all' : show.id);
                }}
              >
                <img
                  src={`/photos/306-lullo/${show.cover}.jpg`}
                  alt=""
                  className="cover"
                  loading="lazy"
                />
              </a>

              <div className="show__text">
                <span className="badge badge--pill">{show.topic}</span>
                <b>{show.name}</b>
                <small>{show.host}</small>
                <small>{show.about}</small>
              </div>

              <div className="show__foot">
                <small>{showEps.length} episodes</small>
                <button
                  type="button"
                  className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setSelectedShow(isSelected ? 'all' : show.id)}
                >
                  {isSelected ? 'Selected' : 'Filter show'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Episodes Section */}
      <section className="card card--flush mt-6 p-6" style={{ marginTop: '24px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, margin: 0 }}>
            {selectedShow === 'all'
              ? 'All Episodes'
              : `${store.shows.find(s => s.id === selectedShow)?.name} Episodes`}
          </h2>
          {selectedShow !== 'all' && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setSelectedShow('all')}
            >
              Show all episodes
            </button>
          )}
        </div>

        <ul className="eplist">
          {filteredEpisodes.map(ep => {
            const show = store.shows.find(s => s.id === ep.show);
            const cover = show?.cover || 'lamp';
            const isCur = player.kind === 'episode' && player.id === ep.id;
            const isPlaying = isCur && player.playing;
            const progressRatio = ep.progress ? Math.min(1, ep.progress / ep.dur) : 0;

            return (
              <li
                key={ep.id}
                className={`ep${isCur ? ' is-cur' : ''}${progressRatio >= 0.95 ? ' is-done' : ''}`}
              >
                <img
                  src={`/photos/306-lullo/${cover}.jpg`}
                  alt=""
                  className="cover"
                  loading="lazy"
                />

                <div className="ep__text">
                  <b>{ep.title}</b>
                  <div className="ep__meta">
                    <small>{show?.name}</small>
                    <small>·</small>
                    <small>{formatDuration(ep.dur)}</small>
                    <small>·</small>
                    <small>{timeAgo(ep.t)}</small>
                    {progressRatio > 0 && (
                      <span className="ep__bar" title={`${Math.round(progressRatio * 100)}% listened`}>
                        <i style={{ transform: `scaleX(${progressRatio})` }} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="ep__acts">
                  <button
                    type="button"
                    className="ctrl magnetic"
                    onClick={() => {
                      if (isCur) {
                        storeActions.togglePlay();
                      } else {
                        storeActions.playEpisode(ep.id);
                      }
                    }}
                    aria-label={isPlaying ? 'Pause episode' : 'Play episode'}
                  >
                    <Icon name={isPlaying ? 'pause' : 'play'} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default Podcasts;
