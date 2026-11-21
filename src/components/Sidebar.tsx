import React from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { FonoLogo } from './FonoLogo';
import { tactile } from '../services/tactileFeedback';

export interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenFinder: () => void;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenCreatePlaylist,
  onOpenFinder,
  onOpenAuth
}) => {
  const store = useStore();
  const lovedCount = store.tracks.filter(t => t.loved).length;
  const isRail = store.prefs.sidebarRail;
  const isDark = store.prefs.theme === 'dark';

  const nav = (route: string) => {
    tactile.click('click');
    onNavigate(route);
  };

  return (
    <aside className="side" aria-label="Sidebar">
      {/* Brand & Rail Collapse */}
      <div className="side__head">
        <a
          className="brand"
          href="#home"
          aria-label="FONO lofi — Home"
          onClick={(e) => {
            e.preventDefault();
            nav('home');
          }}
        >
          <span className="mark">
            <FonoLogo size={40} />
          </span>
          <span className="brand__text">
            <b>FONO <span style={{ fontSize: '10px', verticalAlign: 'middle', textTransform: 'uppercase', background: 'var(--coral, #ea7349)', color: '#fff', padding: '2px 6px', borderRadius: '999px', letterSpacing: '0.06em', marginLeft: '3px' }}>lofi</span></b>
            <small>Analog listening room</small>
          </span>
        </a>

        <button
          type="button"
          className="collapse"
          aria-label={isRail ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={isRail}
          onClick={() => storeActions.setSidebarRail(!isRail)}
        >
          <Icon name="panel" />
        </button>
      </div>

      {/* Main Snav */}
      <nav className="snav" aria-label="Main">
        <div className="snav__group">
          <span className="side__group">Listen</span>

          <button
            type="button"
            className="snav__item"
            data-id="home"
            aria-current={currentRoute === 'home' ? 'page' : undefined}
            onClick={() => nav('home')}
          >
            <Icon name="logo" />
            <span className="snav__label">Home</span>
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="profile"
            aria-current={currentRoute === 'profile' ? 'page' : undefined}
            onClick={() => nav('profile')}
          >
            <Icon name="user" />
            <span className="snav__label">Profile</span>
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="library"
            aria-current={currentRoute === 'library' ? 'page' : undefined}
            onClick={() => nav('library')}
          >
            <Icon name="music" />
            <span className="snav__label">Library</span>
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="playlists"
            aria-current={currentRoute === 'playlists' ? 'page' : undefined}
            onClick={() => nav('playlists')}
          >
            <Icon name="playlist" />
            <span className="snav__label">Playlists</span>
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="podcasts"
            aria-current={currentRoute === 'podcasts' ? 'page' : undefined}
            onClick={() => nav('podcasts')}
          >
            <Icon name="podcast" />
            <span className="snav__label">Podcasts</span>
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="loved"
            aria-current={currentRoute === 'loved' ? 'page' : undefined}
            onClick={() => nav('loved')}
          >
            <Icon name="heart" />
            <span className="snav__label">Loved songs</span>
            {lovedCount > 0 && <span className="snav__count">{lovedCount}</span>}
          </button>

          <button
            type="button"
            className="snav__item"
            data-id="stats"
            aria-current={currentRoute === 'stats' ? 'page' : undefined}
            onClick={() => nav('stats')}
          >
            <Icon name="flame" />
            <span className="snav__label">Listening stats</span>
          </button>
        </div>

        {/* Quick Search & Import */}
        <div className="snav__group">
          <span className="side__group">Search & Add</span>
          <button
            type="button"
            className="snav__item"
            onClick={onOpenFinder}
          >
            <Icon name="search" />
            <span className="snav__label">Search & Import</span>
            <span className="snav__count">⌘K</span>
          </button>
        </div>

        {/* Playlists */}
        <div className="snav__group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 6 }}>
            <span className="side__group">Playlists</span>
            <button
              type="button"
              className="ibtn ibtn--flat"
              style={{ width: 24, height: 24, padding: 0 }}
              onClick={onOpenCreatePlaylist}
              title="Create playlist"
            >
              <Icon name="plus" size="xs" />
            </button>
          </div>

          {store.playlists.map(pl => {
            const active = currentRoute === `playlist:${pl.id}`;
            return (
              <button
                key={pl.id}
                type="button"
                className="snav__item"
                data-id={`playlist:${pl.id}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => nav(`playlist:${pl.id}`)}
              >
                <Icon name="playlist" size="xs" />
                <span className="snav__label">{pl.name}</span>
                {pl.isYouTube && <span className="badge badge--pill" style={{ fontSize: 9, padding: '1px 5px', color: '#ff0000' }}>YT</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer: Plus & Profile */}
      <div className="side__foot">
        {store.plan === 'plus' || store.plan === 'duo' ? (
          <button
            type="button"
            className="side__plus is-plus"
            onClick={() => nav('plus')}
            title="VIP Max Active — All features unlocked with zero ads"
          >
            <span className="side__plus-ico">
              <Icon name="crown" />
            </span>
            <span className="side__plus-text">
              <b>VIP Max Active</b>
              <small>Zero ads · Lossless 24-bit · Unlimited</small>
              <span className="side__plus-btn">VIP Member</span>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="side__plus"
            onClick={() => nav('plus')}
            title="Upgrade to FONO VIP"
          >
            <span className="side__plus-ico">
              <Icon name="crown" />
            </span>
            <span className="side__plus-text">
              <b>Upgrade to VIP</b>
              <small>Lossless 24-bit · AI DJ · No Ads</small>
              <span className="side__plus-btn">Get VIP</span>
            </span>
          </button>
        )}

        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            className="side__me flex-1"
            onClick={() => {
              tactile.click('click');
              nav('profile');
            }}
            aria-label="View My Profile"
            title={`View Profile for ${store.profile?.name || 'My Profile'}`}
          >
            {store.profile?.avatar ? (
              <img
                src={store.profile.avatar}
                alt=""
                className="avatar avatar--online"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span className="avatar avatar--online">
                {(store.profile?.name || 'U').charAt(0)}
              </span>
            )}
            <span className="cell__text">
              <b>{store.profile?.name || 'My Profile'}</b>
              <small>
                {store.profile?.isRegistered ? `@${store.profile?.handle || 'user'}` : 'My Profile'}
              </small>
            </span>
          </button>

          <button
            type="button"
            className="ibtn ibtn--flat"
            style={{ width: 32, height: 32, padding: 0 }}
            onClick={() => nav('settings')}
            title="Open Settings"
            aria-label="Settings"
          >
            <Icon name="gear" size="sm" />
          </button>

          <button
            type="button"
            className="ibtn ibtn--flat text-red-500 hover:text-red-600 hover:bg-red-50/50"
            style={{ width: 32, height: 32, padding: 0 }}
            onClick={() => {
              tactile.click('click');
              if (confirm('Log out of your session?')) {
                storeActions.logoutUser();
                nav('home');
              }
            }}
            title="Log Out"
            aria-label="Log Out"
          >
            <Icon name="logout" size="sm" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
