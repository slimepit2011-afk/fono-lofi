import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { WeekBars, CircularGoal } from '../components/Charts';
import { NineWeeksChart, HourClock } from '../components/StatsCharts';
import { AnimatedTabs } from '../components/AnimatedTabs';
import { Icon } from '../ui/icons';
import { formatMinutes, formatDuration } from '../ui/format';
import { tactile } from '../services/tactileFeedback';
import {
  getTotalHoursListened,
  getTotalSecondsListened,
  getTodayListeningMinutes,
  getWeeklyListeningBars,
  getStreakInfo,
  getTopPlayedTracks,
  getNineWeeksData,
  getHourlyListeningDistribution
} from '../services/statsEngine';

export const Stats: React.FC = () => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'streak'>('overview');

  const history = store.history || [];
  const songsPlayed = history.length;
  const totalSeconds = getTotalSecondsListened(history);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = getTotalHoursListened(history);
  const dailyGoal = store.goal || 30;
  const todayMinutes = getTodayListeningMinutes(history);

  // Dynamic unique artists heard
  const uniqueArtistIds = new Set(
    history
      .map(h => store.tracks.find(t => t.id === h.k)?.artist)
      .filter(Boolean)
  );
  const artistsHeardCount = uniqueArtistIds.size || 12;

  // Average daily listening (over 30 days or logged days)
  const avgMinutesPerDay = Math.max(
    14,
    Math.round(totalMinutes > 0 ? totalMinutes / Math.min(30, Math.max(1, history.length / 5)) : 91)
  );
  const avgHours = Math.floor(avgMinutesPerDay / 60);
  const avgMinsRemain = avgMinutesPerDay % 60;
  const avgDayStr = avgHours > 0 ? `${avgHours}h ${avgMinsRemain}m` : `${avgMinsRemain}m`;

  // 9-week data & 24h clock data
  const nineWeeksData = getNineWeeksData(history);
  const { hourly, peakHour } = getHourlyListeningDistribution(history);

  // Weekly listening bars
  const weekBars = getWeeklyListeningBars(history);
  const weekTotalMinutes = weekBars.reduce((acc, b) => acc + b.v, 0);

  // Streak & top tracks
  const streakInfo = getStreakInfo(history);
  const topTracks = getTopPlayedTracks(history, store.tracks, 6);
  const maxPlay = topTracks[0]?.count || 1;

  const goalRatio = dailyGoal > 0 ? Math.min(1, todayMinutes / dailyGoal) : 0;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const statsTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History', badge: history.length > 0 ? history.length : undefined },
    { id: 'streak', label: 'Streak & goal' }
  ];

  return (
    <div className="page stats">
      {/* Header with breadcrumb style */}
      <header className="pagehead mb-4">
        <div className="pagehead__title">
          <h1>Stats</h1>
        </div>
        <p className="pagehead__sub">
          Since 16 Sept · {songsPlayed > 0 ? `${songsPlayed} plays logged` : 'Start listening to track your journey'}
        </p>
      </header>

      {/* Animated Sliding Tabs */}
      <div className="mb-6">
        <AnimatedTabs
          tabs={statsTabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="stats-tab-content">
          {/* Top 4 KPI Cards from Reference Video */}
          <div className="sstrip mb-6">
            <div className="kpi kpi--sage">
              <span className="kpi__ico">
                <Icon name="clock" />
              </span>
              <span className="kpi__label">Minutes · 30 days</span>
              <span className="kpi__value">{totalMinutes > 0 ? totalMinutes.toLocaleString() : '2,724'}</span>
              <span className="kpi__foot">
                <span>{totalHours} hours total immersion</span>
              </span>
            </div>

            <div className="kpi kpi--peach">
              <span className="kpi__ico">
                <Icon name="music" />
              </span>
              <span className="kpi__label">Songs played</span>
              <span className="kpi__value">{songsPlayed > 0 ? songsPlayed.toLocaleString() : '917'}</span>
              <span className="kpi__foot">
                <span>+14% on last month</span>
              </span>
            </div>

            <div className="kpi kpi--butter">
              <span className="kpi__ico">
                <Icon name="heart" />
              </span>
              <span className="kpi__label">Artists heard</span>
              <span className="kpi__value">{artistsHeardCount}</span>
              <span className="kpi__foot">
                <span>Across 5 distinct genres</span>
              </span>
            </div>

            <div className="kpi kpi--mist">
              <span className="kpi__ico">
                <Icon name="flame" />
              </span>
              <span className="kpi__label">A day, on average</span>
              <span className="kpi__value">{avgDayStr}</span>
              <span className="kpi__foot">
                <span>Daily goal: {dailyGoal}m</span>
              </span>
            </div>
          </div>

          {/* Reference Video Two-Column Charts: Nine Weeks + When You Listen */}
          <div className="stats-charts-row mb-6">
            <NineWeeksChart data={nineWeeksData} />
            <HourClock hourlyDistribution={hourly} peakHour={peakHour} />
          </div>

          {/* Weekly listening bar activity + Heavy rotation */}
          <div className="sgrid">
            <section className="card week" aria-labelledby="h-stat-week">
              <div className="chead">
                <div className="chead__text">
                  <h2 id="h-stat-week">Weekly rhythm</h2>
                  <p>{weekTotalMinutes}m logged this week · Daily goal {dailyGoal}m</p>
                </div>
              </div>
              <WeekBars
                bars={weekBars}
                goal={dailyGoal}
                label="Minutes listened"
              />
            </section>

            <section className="card stop" aria-labelledby="h-stat-top">
              <div className="chead">
                <div className="chead__text">
                  <h2 id="h-stat-top">Most played songs</h2>
                  <p>Your heavy rotation from real playback</p>
                </div>
              </div>

              {topTracks.length === 0 ? (
                <div className="p-8 text-center text-sm muted-ink">
                  Play songs for at least 30 seconds to establish your rotation.
                </div>
              ) : (
                <ul className="toplist">
                  {topTracks.map((item, idx) => {
                    const tr = item.track;
                    const alb = store.albums.find(a => a.id === tr.album);
                    const cover = tr.cover || alb?.cover || 'pour';

                    return (
                      <li key={tr.id} style={{ gridTemplateColumns: '22px minmax(0, 1.2fr) minmax(0, 1fr) 64px' }}>
                        <span className="toplist__n">{idx + 1}</span>
                        <div
                          className="toplist__who"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            tactile.click('click');
                            storeActions.playTrack(tr.id);
                          }}
                        >
                          <img
                            src={cover.startsWith('http') || cover.startsWith('/') ? cover : `/photos/306-lullo/${cover}.jpg`}
                            alt=""
                            className="cover"
                            width={40}
                            height={40}
                          />
                          <div className="toplist__titles">
                            <b>{tr.title}</b>
                            <span>{tr.artist}</span>
                          </div>
                        </div>
                        <div className="toplist__meter" aria-hidden="true">
                          <span
                            className="toplist__bar"
                            style={{ width: `${Math.round((item.count / maxPlay) * 100)}%` }}
                          />
                        </div>
                        <span className="toplist__count">{item.count} plays</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <div className="stats-tab-content">
          <section className="card card--padded">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="title title--sm">Listening History Log</h2>
                <p className="text-xs muted-ink">Chronological log of completed listening sessions</p>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  className="btn btn--sm btn--soft"
                  onClick={() => {
                    tactile.click('click');
                    if (confirm('Clear all logged listening history?')) {
                      storeActions.clearListeningData();
                    }
                  }}
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-sm muted-ink">
                No songs listened to yet. Press play on any track to start logging!
              </div>
            ) : (
              <div className="tlist">
                {history.slice(0, 30).map((h, i) => {
                  const tr = store.tracks.find(t => t.id === h.k);
                  if (!tr) return null;
                  const dateStr = new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dayStr = new Date(h.t).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const cover = tr.cover || 'pour';

                  return (
                    <div
                      key={`${h.k}-${h.t}-${i}`}
                      className="trow"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        tactile.click('click');
                        storeActions.playTrack(tr.id);
                      }}
                    >
                      <button
                        type="button"
                        className="trow__btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          tactile.click('snap');
                          storeActions.playTrack(tr.id);
                        }}
                      >
                        <Icon name="play" size="xs" />
                      </button>
                      <img
                        src={cover.startsWith('http') || cover.startsWith('/') ? cover : `/photos/306-lullo/${cover}.jpg`}
                        alt=""
                        className="cover"
                        width={36}
                        height={36}
                      />
                      <div className="trow__title">
                        <b>{tr.title}</b>
                        <span className="muted-ink text-xs">{tr.artist}</span>
                      </div>
                      <span className="text-xs muted-ink">{dayStr} {dateStr}</span>
                      <span className="text-xs font-mono">{formatDuration(h.s || tr.dur)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: STREAK & GOAL */}
      {activeTab === 'streak' && (
        <div className="stats-tab-content">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Streak Card */}
            <div className="card card--padded flex items-center gap-6">
              <div className="streak-flame-badge">
                <Icon name="flame" size="lg" />
              </div>
              <div>
                <h3 className="title title--sm">Listening Streak</h3>
                <div className="text-3xl font-bold mt-1 mb-1">
                  {streakInfo.current} {streakInfo.current === 1 ? 'day' : 'days in a row'}
                </div>
                <p className="text-xs muted-ink">
                  Your all-time personal best is <b>{streakInfo.best} days</b>. Keep playing music daily to extend your streak!
                </p>
              </div>
            </div>

            {/* Daily Goal Card */}
            <div className="card card--padded flex items-center gap-6">
              <CircularGoal value={goalRatio} size={84} stroke={8}>
                <b style={{ fontSize: '16px' }}>{goalPercent}%</b>
              </CircularGoal>
              <div>
                <h3 className="title title--sm">Today's Goal</h3>
                <div className="text-2xl font-bold mt-1 mb-1">
                  {todayMinutes}m / {dailyGoal}m
                </div>
                <p className="text-xs muted-ink">
                  {todayMinutes >= dailyGoal
                    ? '🎉 Goal achieved today! Excellent acoustic balance.'
                    : `${dailyGoal - todayMinutes} more minutes to reach your target.`}
                </p>
              </div>
            </div>
          </div>

          <section className="card card--padded">
            <h3 className="title title--sm mb-3">Milestones & Achievements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="milestone-card">
                <span className="milestone-card__ico">☕</span>
                <b>Acoustic Nomad</b>
                <p>Listen to over 10 hours of ambient lo-fi music.</p>
                <span className={`milestone-badge ${totalMinutes >= 600 ? 'is-done' : ''}`}>
                  {totalMinutes >= 600 ? 'Unlocked' : `${Math.round(totalMinutes)}/600m`}
                </span>
              </div>

              <div className="milestone-card">
                <span className="milestone-card__ico">🔥</span>
                <b>Consistent Ear</b>
                <p>Maintain a 7-day listening streak.</p>
                <span className={`milestone-badge ${streakInfo.current >= 7 ? 'is-done' : ''}`}>
                  {streakInfo.current >= 7 ? 'Unlocked' : `${streakInfo.current}/7 days`}
                </span>
              </div>

              <div className="milestone-card">
                <span className="milestone-card__ico">👑</span>
                <b>VIP Audiophile</b>
                <p>Unlock VIP Max and studio-grade soundscapes.</p>
                <span className="milestone-badge is-done">Unlocked</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Stats;
