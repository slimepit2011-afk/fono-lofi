import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { formatDuration, formatNumber } from '../ui/format';
import { Genre, Track } from '../types';
import { AnimatedTabs } from '../components/AnimatedTabs';
import { tactile } from '../services/tactileFeedback';
import { AudioUploader } from '../components/AudioUploader';

export interface LibraryProps {
  onNavigate: (route: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onNavigate }) => {
  const store = useStore();
  const player = store.player;

  const [activeTab, setActiveTab] = useState<'songs' | 'albums' | 'artists'>('songs');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'album' | 'plays' | 'dur'>('title');

  // Filter tracks
  const filteredTracks = store.tracks.filter(t => {
    if (selectedGenre !== 'all' && t.genre !== selectedGenre) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const artist = store.artists.find(a => a.id === t.artist)?.name || t.artist;
    const album = store.albums.find(a => a.id === t.album)?.title || '';
    return t.title.toLowerCase().includes(q) || artist.toLowerCase().includes(q) || album.toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'album') return (a.album || '').localeCompare(b.album || '');
    if (sortBy === 'plays') return (b.plays || 0) - (a.plays || 0);
    if (sortBy === 'dur') return b.dur - a.dur;
    return 0;
  });

  // Filter albums
  const filteredAlbums = store.albums.filter(a => {
    if (selectedGenre !== 'all' && a.genre !== selectedGenre) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const artist = store.artists.find(art => art.id === a.artist)?.name || a.artist;
    return a.title.toLowerCase().includes(q) || artist.toLowerCase().includes(q);
  });

  // Filter artists
  const filteredArtists = store.artists.filter(a => {
    if (selectedGenre !== 'all' && a.genre !== selectedGenre) return false;
    if (!search.trim()) return true;
    return a.name.toLowerCase().includes(search.toLowerCase());
  });

  const genres: { id: Genre | 'all'; label: string }[] = [
    { id: 'all', label: 'All genres' },
    { id: 'lofi', label: 'Lo-fi' },
    { id: 'pop', label: 'Pop' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'hiphop', label: 'Hip hop' },
    { id: 'rock', label: 'Rock' }
  ];

  const counts: Record<string, number> = {
    all: store.tracks.length,
    lofi: store.tracks.filter(t => t.genre === 'lofi').length,
    pop: store.tracks.filter(t => t.genre === 'pop').length,
    jazz: store.tracks.filter(t => t.genre === 'jazz').length,
    hiphop: store.tracks.filter(t => t.genre === 'hiphop').length,
    rock: store.tracks.filter(t => t.genre === 'rock').length
  };

  const handlePlayAll = () => {
    if (filteredTracks.length > 0) {
      tactile.click('snap');
      storeActions.playTrack(filteredTracks[0].id, filteredTracks.map(t => t.id));
    }
  };

  return (
    <div className="page library">
      {/* Header */}
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>Library</h1>
        </div>
        <p className="pagehead__sub">
          Your entire collection of music and creators · {store.tracks.length} songs, {store.albums.length} albums, {store.artists.length} artists
        </p>
      </header>

      {/* Animated Sliding Subtabs */}
      <div className="mb-4">
        <AnimatedTabs
          tabs={[
            { id: 'songs', label: 'Songs', badge: store.tracks.length },
            { id: 'albums', label: 'Albums', badge: store.albums.length },
            { id: 'artists', label: 'Artists', badge: store.artists.length }
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />
      </div>

      {/* Toolbar: Search + Sort + Play all */}
      <div className="toolbar">
        <div className="inwrap">
          <Icon name="search" />
          <input
            type="search"
            className="input"
            placeholder={`Search ${activeTab}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={`Search ${activeTab}`}
          />
        </div>

        {activeTab === 'songs' && (
          <select
            className="select select--sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort songs"
          >
            <option value="title">Sort by title</option>
            <option value="artist">Sort by artist</option>
            <option value="album">Sort by album</option>
            <option value="plays">Sort by plays</option>
            <option value="dur">Sort by duration</option>
          </select>
        )}

        <span className="toolbar__spacer" />

        <AudioUploader compact />

        {activeTab === 'songs' && (
          <button
            type="button"
            className="btn btn--primary magnetic"
            onClick={handlePlayAll}
            disabled={filteredTracks.length === 0}
          >
            <Icon name="play" />
            <span>Play all</span>
          </button>
        )}
      </div>

      {/* Genre Filter Chips */}
      <div className="chips" role="tablist" aria-label="Genre filter">
        {genres.map(g => (
          <button
            key={g.id}
            type="button"
            className="chip"
            role="tab"
            aria-pressed={selectedGenre === g.id}
            onClick={() => {
              tactile.click('tap');
              setSelectedGenre(g.id);
            }}
          >
            {g.id !== 'all' && (
              <span
                className="chip__dot"
                style={{ background: `var(--g-${g.id})` }}
              />
            )}
            <span>{g.label}</span>
            <span className="badge">{counts[g.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      {activeTab === 'songs' && store.tracks.length === 0 ? (
        <div className="empty-library-upload mb-6">
          <AudioUploader />
        </div>
      ) : activeTab === 'songs' ? (
        <section className="card card--flush lib">
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

            {filteredTracks.length === 0 ? (
              <li className="p-8 text-center muted">
                No songs match your search or filter.
              </li>
            ) : (
              filteredTracks.map((track, idx) => {
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
                    onDoubleClick={() => storeActions.playTrack(track.id, filteredTracks.map(t => t.id))}
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
                            storeActions.playTrack(track.id, filteredTracks.map(t => t.id));
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
                        aria-label="Add to queue"
                        onClick={() => storeActions.addToQueue(track.id)}
                        title="Add to queue"
                      >
                        <Icon name="dots" />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      ) : null}

      {activeTab === 'albums' && (
        <div className="covgrid">
          {filteredAlbums.map(alb => {
            const albArtist = store.artists.find(a => a.id === alb.artist);
            const albTracks = store.tracks.filter(t => t.album === alb.id);

            return (
              <article key={alb.id} className="cov">
                <a
                  href="#album"
                  className="cov__link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (albTracks[0]) storeActions.playTrack(albTracks[0].id, albTracks.map(t => t.id));
                  }}
                >
                  <img
                    src={`/photos/306-lullo/${alb.cover}.jpg`}
                    alt=""
                    className="cov__img"
                    loading="lazy"
                  />
                </a>
                <button
                  type="button"
                  className="cov__play magnetic"
                  aria-label={`Play ${alb.title}`}
                  onClick={() => {
                    if (albTracks[0]) storeActions.playTrack(albTracks[0].id, albTracks.map(t => t.id));
                  }}
                >
                  <Icon name="play" />
                </button>
                <span className="cov__t">{alb.title}</span>
                <span className="cov__s">{albArtist?.name} · {alb.year}</span>
              </article>
            );
          })}
        </div>
      )}

      {activeTab === 'artists' && (
        <div className="argrid">
          {filteredArtists.map(art => {
            const artTracks = store.tracks.filter(t => t.artist === art.id);

            return (
              <article key={art.id} className="acard card">
                <a
                  href="#artist"
                  className="acard__open"
                  onClick={(e) => {
                    e.preventDefault();
                    if (artTracks[0]) storeActions.playTrack(artTracks[0].id, artTracks.map(t => t.id));
                  }}
                >
                  <img
                    src={`/photos/306-lullo/${art.cover}.jpg`}
                    alt=""
                    className="acard__img cover cover--round"
                    loading="lazy"
                  />
                </a>
                <b>{art.name}</b>
                <small>{art.genre} · {formatNumber(art.listeners)} listeners</small>
                <button
                  type="button"
                  className={`btn btn--sm ${art.followed ? 'btn--soft' : 'btn--ghost'}`}
                  onClick={() => storeActions.toggleFollowArtist(art.id)}
                >
                  {art.followed ? 'Following' : 'Follow'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;
