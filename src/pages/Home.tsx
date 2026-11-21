import React from 'react';
import { useStore, storeActions } from '../store';
import { Vinyl } from '../components/Vinyl';
import { CircularGoal, WeekBars } from '../components/Charts';
import { FonoLogo } from '../components/FonoLogo';
import { Icon } from '../ui/icons';
import { formatMinutes, formatDuration, greeting } from '../ui/format';
import { tactile } from '../services/tactileFeedback';
import {
  getTotalHoursListened,
  getTodayListeningMinutes,
  getWeeklyListeningBars,
  getGenreBreakdown,
  getStreakInfo
} from '../services/statsEngine';

export interface HomeProps {
  onNavigate: (route: string) => void;
  onOpenVideoModal: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenVideoModal }) => {
  const store = useStore();
  const player = store.player;
  const isPlaying = player.playing;

  const currentTrack = player.kind === 'track'
    ? store.tracks.find(t => t.id === player.id)
    : null;

  const currentEpisode = player.kind === 'episode'
    ? store.episodes.find(e => e.id === player.id)
    : null;

  const album = currentTrack ? store.albums.find(a => a.id === currentTrack.album) : null;
  const artist = currentTrack ? store.artists.find(a => a.id === currentTrack.artist) : null;
  const cover = album?.cover || (currentTrack?.cover ? currentTrack.cover : 'pour');

  // Real dynamic stats calculation from actual listening history
  const totalSongsPlayed = store.history.length;
  const lovedTracks = store.tracks.filter(t => t.loved);
  const totalHours = getTotalHoursListened(store.history);
  const todayMinutes = getTodayListeningMinutes(store.history);
  const dailyGoal = store.goal || 30;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  // Real Weekly listening bar data
  const weekBars = getWeeklyListeningBars(store.history);
  const weekTotalMinutes = weekBars.reduce((acc, b) => acc + b.v, 0);
  const weekAvgMinutes = Math.round(weekTotalMinutes / 7);

  // Real Genre breakdown
  const genres = getGenreBreakdown(store.history || [], store.tracks || []);

  // Real Streak
  const streakInfo = getStreakInfo(store.history || []);

  const handleShuffleLoved = () => {
    if (!lovedTracks || lovedTracks.length === 0) return;
    const ids = lovedTracks.map(t => t.id);
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    storeActions.playTrack(randomId, ids);
  };

  const recentTracks = (store.history || [])
    .slice(0, 4)
    .map(h => (store.tracks || []).find(t => t.id === h.k))
    .filter(Boolean) as typeof store.tracks;

  const upNextTracks = (player.queue || [])
    .slice((player.queue || []).indexOf(player.id) + 1, (player.queue || []).indexOf(player.id) + 5)
    .map(id => (store.tracks || []).find(t => t.id === id))
    .filter(Boolean) as typeof store.tracks;

  const fallbackMix = {
    id: 'mix1',
    name: 'Daily Mix',
    cover: 'pour',
    tracks: [] as string[]
  };
  const dailyMix1 = (store.playlists && store.playlists.length > 0)
    ? (store.playlists.find(p => p.id === 'mix1') || store.playlists[0])
    : fallbackMix;

  const firstName = store.profile?.name ? (store.profile.name.split(' ')[0] || 'Listener') : 'Listener';
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="page home">
      {/* Top Greeting Header */}
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>{greeting()}, {firstName}</h1>
        </div>
        <p className="pagehead__sub">
          {todayDateStr} · {(lovedTracks || []).length} loved songs, {(store.playlists || []).filter(p => p.mine).length} playlists
        </p>
      </header>

      {/* Google OAuth Compliance & Public Purpose Showcase (Required for Google Verification) */}
      <section
        className="card mb-6"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, rgba(240, 144, 100, 0.08) 100%)',
          borderRadius: 'var(--r-lg)',
          border: '1.5px solid var(--line)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)'
        }}
        aria-label="About FONO lofi application and purpose"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="mark" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <FonoLogo size={26} />
            </span>
            <h2 className="title title--sm m-0" style={{ letterSpacing: '-0.02em', fontSize: '20px', fontWeight: 800 }}>
              FONO lofi
            </h2>
            <span className="badge badge--pill bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5">
              ✓ Open Access · No Login Required
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs muted-ink font-semibold">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">
              Privacy Policy ↗
            </a>
            <span>·</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">
              Terms of Service ↗
            </a>
          </div>
        </div>

        <p className="text-xs m-0 mb-3" style={{ lineHeight: 1.6, color: 'var(--ink)' }}>
          <strong>Application Purpose:</strong> FONO lofi is a free ambient focus and study music player that helps students, writers, and developers concentrate, relax, and achieve deep focus. Listen immediately to curated lo-fi instrumental beats, study timers, and analog soundscapes with <strong>zero registration required</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line text-2xs muted-ink">
          <div className="flex flex-wrap items-center gap-3">
            <span>🎵 <strong>Free Streaming:</strong> All tracks & timers available instantly without an account</span>
            <span>🔒 <strong>Optional Google Sign-In:</strong> Only needed if you wish to sync custom playlist vaults</span>
          </div>
          <span style={{ opacity: 0.9, fontWeight: 600 }}>
            🛡️ Google API Terms Compliant · No AI NCII
          </span>
        </div>
      </section>

      {/* home__top: Stage Card (left 1.65fr) + 4 KPI Tiles (right 1fr) */}
      <div className="home__top">
        {/* Stage Card */}
        <section className="card stage" aria-label="Now playing">
          <div className="stage__text">
            <span className="stage__badge">
              <span className={`stage__dot${isPlaying ? ' is-pulsing' : ''}`} aria-hidden="true" />
              {isPlaying ? 'Now spinning' : 'Paused'}
            </span>

            <h2 className="stage__title">
              {currentTrack?.title || currentEpisode?.title || (store.tracks.length === 0 ? 'Your Room is Ready' : 'Steam & Static')}
            </h2>

            <p className="stage__sub">
              {currentTrack ? (
                <>
                  <button
                    type="button"
                    className="link-subtle"
                    onClick={() => onNavigate('library')}
                  >
                    {artist?.name || currentTrack.artist}
                  </button>
                  {' · '}
                  <span className="muted-ink">{album?.title || 'Single'}</span>
                </>
              ) : currentEpisode ? (
                store.shows.find(s => s.id === currentEpisode.show)?.name || 'Podcast'
              ) : store.tracks.length === 0 ? (
                'Upload your personal music files or import YouTube tracks to start spinning'
              ) : (
                'Juniper Hollow · Steam & Static'
              )}
            </p>

            <div className="stage__btns">
              {store.tracks.length === 0 ? (
                <button
                  type="button"
                  className="btn btn--primary btn--lg magnetic"
                  onClick={() => {
                    tactile.click('click');
                    onNavigate('library');
                  }}
                >
                  <Icon name="plus" size="sm" />
                  <span>Upload Your Songs</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--lg magnetic"
                  onClick={() => {
                    tactile.click('snap');
                    storeActions.togglePlay();
                  }}
                >
                  <Icon name={isPlaying ? 'pause' : 'play'} size="sm" />
                  <span>{isPlaying ? 'Pause' : 'Play something'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn--lg btn--soft"
                onClick={() => {
                  tactile.click('click');
                  handleShuffleLoved();
                }}
                title="Shuffle loved tracks"
              >
                <Icon name="shuffle" size="xs" />
                <span>Shuffle loved</span>
              </button>

              <button
                type="button"
                className="btn btn--lg btn--soft"
                onClick={() => {
                  tactile.click('click');
                  onNavigate('plus');
                }}
                title="Open VIP AI DJ Studio"
              >
                <Icon name="sparkles" size="xs" />
                <span>✨ AI Mood DJ</span>
              </button>

              {currentTrack?.youtubeId && (
                <button
                  type="button"
                  className="btn btn--lg btn--ghost"
                  onClick={() => {
                    tactile.click('click');
                    onOpenVideoModal();
                  }}
                  title="Watch YouTube video"
                >
                  <Icon name="video" size="xs" />
                  <span>Watch Video</span>
                </button>
              )}
            </div>

            <div className="stage__goal">
              <CircularGoal
                value={todayMinutes / dailyGoal}
                size={54}
                stroke={6}
                label="Today's listening goal"
              >
                <b className="stage__goalpct">
                  {goalPercent}
                  <small>%</small>
                </b>
              </CircularGoal>

              <span className="stage__goaltxt">
                <b>{formatMinutes(todayMinutes)} today</b>
                <small>
                  {todayMinutes >= dailyGoal
                    ? 'Daily goal met. Nice.'
                    : `${formatMinutes(dailyGoal - todayMinutes)} to your ${dailyGoal}-minute goal`}
                </small>
              </span>
            </div>
          </div>

          <div className="stage__deck">
            <Vinyl
              size={276}
              cover={cover}
              isPlaying={isPlaying}
              skin={store.prefs.vipSkin || 'obsidian'}
            />
          </div>

          <span className="stage__leaf" aria-hidden="true" />
        </section>

        {/* 4 KPI Tiles (2x2 Grid) */}
        <div className="tiles" role="list" aria-label="This month">
          <a
            className="kpi kpi--sage"
            href="#stats"
            role="listitem"
            onClick={(e) => { e.preventDefault(); onNavigate('stats'); }}
          >
            <span className="kpi__ico">
              <Icon name="music" />
            </span>
            <span className="kpi__label">Songs played</span>
            <span className="kpi__value">{totalSongsPlayed}</span>
            <span className="kpi__foot">
              {totalSongsPlayed > 0 ? (
                <span><b>{totalSongsPlayed}</b> played</span>
              ) : (
                <span className="muted">Play to start log</span>
              )}
            </span>
          </a>

          <a
            className="kpi kpi--peach"
            href="#loved"
            role="listitem"
            onClick={(e) => { e.preventDefault(); onNavigate('loved'); }}
          >
            <span className="kpi__ico">
              <Icon name="heart" />
            </span>
            <span className="kpi__label">Loved songs</span>
            <span className="kpi__value">{lovedTracks.length}</span>
            <span className="kpi__foot">
              <span><b>{lovedTracks.length}</b> tracks</span>
            </span>
          </a>

          <a
            className="kpi kpi--butter"
            href="#stats"
            role="listitem"
            onClick={(e) => { e.preventDefault(); onNavigate('stats'); }}
          >
            <span className="kpi__ico">
              <Icon name="clock" />
            </span>
            <span className="kpi__label">Hours listened</span>
            <span className="kpi__value">{totalHours}h</span>
            <span className="kpi__foot">
              <span><b>{weekTotalMinutes}m</b> this week</span>
            </span>
          </a>

          <a
            className="kpi kpi--mist"
            href="#stats"
            role="listitem"
            onClick={(e) => { e.preventDefault(); onNavigate('stats'); }}
          >
            <span className="kpi__ico">
              <Icon name="flame" />
            </span>
            <span className="kpi__label">Current streak</span>
            <span className="kpi__value">{streakInfo.current}</span>
            <span className="kpi__foot">
              {streakInfo.current === 1 ? '1 day streak' : `${streakInfo.current} days in a row`} · best {streakInfo.best}
            </span>
          </a>
        </div>
      </div>

      {/* home__mid: Your listening week chart (1.45fr) + Genre mix (1fr) */}
      <div className="home__mid">
        {/* Weekly listening chart */}
        <section className="card week" aria-labelledby="h-week">
          <div className="chead">
            <div className="chead__text">
              <h2 id="h-week">Your listening</h2>
              <p>
                {formatMinutes(weekTotalMinutes)} in the last 7 days · avg {formatMinutes(weekAvgMinutes)} a day ·{' '}
                <span className="wkey">
                  <i />
                  {dailyGoal}-min goal
                </span>
              </p>
            </div>
          </div>
          <WeekBars
            bars={weekBars}
            goal={dailyGoal}
            label="Minutes listened"
          />
        </section>

        {/* Genre Mix */}
        <section className="card genres" aria-labelledby="h-genres">
          <div className="chead">
            <div className="chead__text">
              <h2 id="h-genres">Your genre mix</h2>
              <p>{totalSongsPlayed} plays in 30 days</p>
            </div>
          </div>

          <div className="gmix">
            <div className="gmix__rows">
              {genres.map(g => (
                <div key={g.id} className="gmix__row">
                  <span className="gmix__name">{g.label}</span>
                  <div className="gmix__track">
                    <i
                      className="gmix__bar"
                      style={{ width: `${g.pct}%`, background: g.color }}
                    />
                  </div>
                  <span className="gmix__pct">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* home__low: Played recently + Up next + Daily mix */}
      <div className="home__low">
        {/* Played Recently */}
        <section className="card recent" aria-labelledby="h-recent">
          <div className="chead">
            <div className="chead__text">
              <h2 id="h-recent">Played recently</h2>
            </div>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onNavigate('library')}
            >
              See all
            </button>
          </div>

          <ul className="rlist">
            {recentTracks.map(t => {
              const alb = store.albums.find(a => a.id === t.album);
              const art = store.artists.find(a => a.id === t.artist);
              const tCover = alb?.cover || 'pour';
              const isCur = player.id === t.id;

              return (
                <li key={t.id} className={isCur ? 'is-cur' : ''}>
                  <img
                    src={`/photos/306-lullo/${tCover}.jpg`}
                    alt=""
                    className="cover"
                    width={50}
                    height={50}
                    loading="lazy"
                  />
                  <span className="cell__text">
                    <b>{t.title}</b>
                    <small>{art?.name || t.artist}</small>
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon"
                    onClick={() => storeActions.playTrack(t.id)}
                    title={`Play ${t.title}`}
                  >
                    <Icon name={isCur && isPlaying ? 'pause' : 'play'} size="xs" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Up Next */}
        <section className="card next" aria-labelledby="h-next">
          <div className="chead">
            <div className="chead__text">
              <h2 id="h-next">Up next</h2>
              <p>{currentTrack ? `After “${currentTrack.title}”` : 'Your queue'}</p>
            </div>
          </div>

          {upNextTracks.length > 0 ? (
            <ol className="nlist">
              {upNextTracks.map((t, idx) => {
                const art = store.artists.find(a => a.id === t.artist);
                return (
                  <li key={t.id}>
                    <span className="nlist__n">{idx + 1}</span>
                    <span className="cell__text">
                      <b>{t.title}</b>
                      <small>{art?.name || t.artist}</small>
                    </span>
                    <small className="muted">{formatDuration(t.dur)}</small>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="muted" style={{ padding: '16px 0' }}>
              Nothing queued. Pick a mix and it carries on from there.
            </p>
          )}
        </section>

        {/* Daily Mix */}
        <section className="card mixes" aria-labelledby="h-mix">
          <div className="chead">
            <div className="chead__text">
              <h2 id="h-mix">Daily mix</h2>
            </div>
          </div>

          <a
            className="mixcard"
            href={`#playlist:${dailyMix1?.id || 'mix1'}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`playlist:${dailyMix1?.id || 'mix1'}`);
            }}
          >
            <img
              className="mixcard__img"
              src={`/photos/306-lullo/${dailyMix1?.cover || 'pour'}.jpg`}
              alt=""
              width={480}
              height={480}
              loading="lazy"
            />
            <span className="mixcard__text">
              <b>{dailyMix1?.name || 'Daily mix'}</b>
              <small>{dailyMix1?.tracks?.length || 0} songs</small>
            </span>
            <button
              type="button"
              className="btn btn--primary btn--icon mixcard__play"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (dailyMix1?.tracks && dailyMix1.tracks.length > 0) {
                  storeActions.playTrack(dailyMix1.tracks[0], dailyMix1.tracks);
                }
              }}
              title="Play mix"
              disabled={!dailyMix1?.tracks || dailyMix1.tracks.length === 0}
            >
              <Icon name="play" size="sm" />
            </button>
          </a>
        </section>
      </div>

      {/* Fresh finds banner at bottom */}
      <section className="fresh" aria-label="Fresh finds">
        <span className="fresh__star" aria-hidden="true">
          <Icon name="sparkles" />
        </span>
        <span className="fresh__text">
          <b>Fresh finds are in</b>
          <small>New songs picked from what you love</small>
        </span>
        <span className="fresh__covers" aria-hidden="true">
          {store.tracks.slice(0, 4).map(t => {
            const alb = store.albums.find(a => a.id === t.album);
            const cov = alb?.cover || 'pour';
            return (
              <img
                key={t.id}
                src={`/photos/306-lullo/${cov}.jpg`}
                alt=""
                className="cover"
                width={40}
                height={40}
                loading="lazy"
              />
            );
          })}
        </span>
        <button
          type="button"
          className="btn fresh__btn magnetic"
          onClick={() => onNavigate('playlist:fresh')}
        >
          <span>Explore now</span>
          <Icon name="arrowR" size="xs" />
        </button>
      </section>

      {/* Public Footer for Google Verification & Trust */}
      <footer className="mt-8 pt-6 pb-12 border-t border-line text-xs muted-ink flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-ink">
          <span>🎧 FONO lofi</span>
          <span className="font-normal muted-ink">— Ambient Focus & Study Companion</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
          <span>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>
          <span>·</span>
          <a href="mailto:support@fono-lofi.vercel.app" className="hover:underline">support@fono-lofi.vercel.app</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
