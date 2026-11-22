import React, { useState, useEffect } from 'react';
import { useStore, storeActions } from './store';
import { Sidebar } from './components/Sidebar';
import { Dock } from './components/Dock';
import { Finder } from './components/Finder';
import { VideoModal } from './components/VideoModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { MobileNowPlayingSheet } from './components/MobileNowPlayingSheet';
import { AuthModal } from './components/AuthModal';
import { FonoLogo } from './components/FonoLogo';
import { Icon } from './ui/icons';
import { tactile } from './services/tactileFeedback';
import { googleAuthService } from './services/googleAuth';

// Pages
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Playlists } from './pages/Playlists';
import { PlaylistDetail } from './pages/PlaylistDetail';
import { Podcasts } from './pages/Podcasts';
import { Loved } from './pages/Loved';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { Plus } from './pages/Plus';
import { Profile } from './pages/Profile';
import { Help } from './pages/Help';

// Styles
import './styles/main.css';
import './styles/home.css';
import './styles/library.css';
import './styles/playlists.css';
import './styles/podcasts.css';
import './styles/stats.css';
import './styles/settings.css';
import './styles/plus.css';
import './styles/profile.css';
import './styles/help.css';
import './styles/app-custom.css';

export const App: React.FC = () => {
  const store = useStore();
  
  const getInitialRoute = () => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.includes('access_token') || hash.includes('id_token')) {
        return 'profile';
      }
      if (hash) return hash;
    }
    return 'home';
  };

  const [route, setRouteState] = useState<string>(getInitialRoute);

  const setRoute = (newRoute: string) => {
    setRouteState(newRoute);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${newRoute}`;
    }
  };

  // Global Google OAuth Handlers (Popup opener, cross-window BroadcastChannel, & direct redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;

    // Handle token return from Google OAuth
    if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
      const user = googleAuthService.parseHashToken(hash);
      if (user && user.email) {
        storeActions.loginUser({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          provider: 'google',
          rememberMe: true
        });

        // 1. Broadcast to opener and peer windows
        googleAuthService.broadcastLogin(user);

        // 2. PostMessage to opener if available
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'FONO_GOOGLE_AUTH_CALLBACK', hash, user }, window.location.origin);
          } catch (e) {
            console.warn('Failed to communicate with opener window', e);
          }
        }

        // 3. Clean URL hash and seamlessly transition to profile page (never close window on user)
        window.history.replaceState(null, '', window.location.pathname);
        setRoute('profile');
      }
    }

    // Listen for postMessage from popup windows
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'FONO_GOOGLE_AUTH_CALLBACK') {
        const user = e.data?.user || (e.data?.hash ? googleAuthService.parseHashToken(e.data.hash) : null);
        if (user && user.email) {
          storeActions.loginUser({
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: 'google',
            rememberMe: true
          });
          setRoute('profile');
        }
      }
    };
    window.addEventListener('message', handleMsg);

    // Listen for BroadcastChannel sync
    let authChan: BroadcastChannel | null = null;
    try {
      authChan = new BroadcastChannel('fono_auth_channel');
      authChan.onmessage = (e) => {
        if (e.data?.type === 'GOOGLE_AUTH_SUCCESS' && e.data?.user) {
          setRoute('profile');
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('message', handleMsg);
      if (authChan) {
        try { authChan.close(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash && hash !== route) {
        setRouteState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [route]);

  // Modals state
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('register');

  const openAuth = (mode: 'signin' | 'register' = 'register') => {
    tactile.click('click');
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const isDark = store.prefs.theme === 'dark';

  // Initialize theme and rail
  useEffect(() => {
    const t = store.prefs.theme;
    const dark = t === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : t === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (store.prefs.sidebarRail) {
      document.documentElement.classList.add('is-rail');
    } else {
      document.documentElement.classList.remove('is-rail');
    }
  }, [store.prefs.theme, store.prefs.sidebarRail]);

  // Dynamic FONO title
  useEffect(() => {
    const currentTrack = store.tracks.find(t => t.id === store.player.id);
    if (store.player.playing && currentTrack) {
      document.title = `▶ ${currentTrack.title} — FONO lofi`;
    } else {
      document.title = `${getRouteTitle()} · FONO lofi`;
    }
  }, [store.player.playing, store.player.id, route]);

  // Global keyboard shortcuts (Space, ArrowLeft, ArrowRight, L, M, ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        storeActions.togglePlay();
      } else if (e.key === 'ArrowRight' && !e.metaKey) {
        e.preventDefault();
        storeActions.nextTrack();
      } else if (e.key === 'ArrowLeft' && !e.metaKey) {
        e.preventDefault();
        storeActions.prevTrack();
      } else if (e.key.toLowerCase() === 'l') {
        if (store.player.id) {
          storeActions.toggleLoved(store.player.id);
        }
      } else if (e.key.toLowerCase() === 'm') {
        storeActions.setVolume(store.player.volume > 0 ? 0 : 0.85);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.player.id, store.player.volume]);

  // Route title formatting for breadcrumb
  const getRouteTitle = () => {
    if (route.startsWith('playlist:')) {
      const plId = route.split(':')[1];
      const pl = store.playlists.find(p => p.id === plId);
      return pl?.name || 'Playlist';
    }
    const titles: Record<string, string> = {
      home: 'Home',
      library: 'Library',
      playlists: 'Playlists',
      podcasts: 'Podcasts',
      loved: 'Loved songs',
      stats: 'Listening stats',
      settings: 'Settings',
      plus: 'Plans',
      profile: 'My Profile',
      help: 'Help'
    };
    return titles[route] || 'Home';
  };

  const renderPage = () => {
    if (route.startsWith('playlist:')) {
      const plId = route.split(':')[1];
      return (
        <PlaylistDetail
          playlistId={plId}
          onNavigate={setRoute}
          onOpenFinder={() => setIsFinderOpen(true)}
        />
      );
    }

    switch (route) {
      case 'home':
        return <Home onNavigate={setRoute} onOpenVideoModal={() => setIsVideoModalOpen(true)} />;
      case 'library':
        return <Library onNavigate={setRoute} />;
      case 'playlists':
        return (
          <Playlists
            onNavigate={setRoute}
            onOpenCreateModal={() => setIsCreatePlaylistOpen(true)}
          />
        );
      case 'podcasts':
        return <Podcasts onNavigate={setRoute} />;
      case 'loved':
        return <Loved onNavigate={setRoute} />;
      case 'stats':
        return <Stats />;
      case 'settings':
        return <Settings onOpenAuth={openAuth} onNavigate={setRoute} />;
      case 'plus':
        return <Plus onOpenAuth={openAuth} />;
      case 'profile':
        return <Profile onNavigate={setRoute} onOpenAuth={openAuth} />;
      case 'help':
        return <Help />;
      default:
        return <Home onNavigate={setRoute} onOpenVideoModal={() => setIsVideoModalOpen(true)} />;
    }
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={route}
        onNavigate={setRoute}
        onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        onOpenFinder={() => setIsFinderOpen(true)}
        onOpenAuth={openAuth}
      />

      {/* Main Column */}
      <div className="main">
        {/* Top Header Bar */}
        <header className="top">
          <div className="top__in">
            <button
              type="button"
              className="ibtn ibtn--flat top__menu"
              aria-label="Toggle rail"
              onClick={() => storeActions.setSidebarRail(!store.prefs.sidebarRail)}
            >
              <Icon name="menu" />
            </button>

            <a
              className="brand top__brand"
              href="#home"
              onClick={(e) => { e.preventDefault(); setRoute('home'); }}
            >
              <span className="mark">
                <FonoLogo size={32} />
              </span>
            </a>

            <nav className="crumbs" aria-label="Breadcrumb">
              <span>FONO lofi</span>
              <Icon name="chevR" />
              {route.startsWith('playlist:') ? (
                <>
                  <a href="#playlists" onClick={(e) => { e.preventDefault(); setRoute('playlists'); }}>
                    Playlists
                  </a>
                  <Icon name="chevR" />
                  <b>{getRouteTitle()}</b>
                </>
              ) : (
                <b>{getRouteTitle()}</b>
              )}
            </nav>

            <span className="top__title">{getRouteTitle()}</span>

            {/* Header Tools */}
            <div className="tools">
              <button
                type="button"
                className="searchpill"
                onClick={() => setIsFinderOpen(true)}
                aria-label="Search songs, artists, videos"
              >
                <Icon name="search" />
                <span className="searchpill__txt">Search songs, artists, YouTube…</span>
                <span className="kbd">⌘K</span>
              </button>

              <button
                type="button"
                className="ibtn top__theme"
                aria-label="Toggle theme"
                onClick={() => storeActions.setTheme(isDark ? 'light' : 'dark')}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              >
                <Icon name={isDark ? 'sun' : 'moon'} />
              </button>

              <button
                type="button"
                className="ibtn top__user"
                aria-label="User profile & account"
                onClick={() => setRoute('profile')}
                title={`Profile: ${store.profile?.name || 'My Profile'} (@${store.profile?.handle || 'user'})`}
                style={{ width: '40px', height: '40px' }}
              >
                {store.profile?.avatar ? (
                  <img
                    src={store.profile.avatar}
                    alt={store.profile?.name || 'User'}
                    className="avatar avatar--online"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span className="avatar avatar--online" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                    {(store.profile?.name || 'U').charAt(0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="content" id="main">
          <div className="view">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Fixed Bottom Player Dock */}
      <Dock
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
        onOpenMobileSheet={() => setIsMobileSheetOpen(true)}
      />

      {/* Global Modals */}
      <Finder
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
        onNavigate={setRoute}
      />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreated={(newId) => setRoute(`playlist:${newId}`)}
      />

      <MobileNowPlayingSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default App;
