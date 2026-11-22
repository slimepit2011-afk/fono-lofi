import React, { useState, useEffect, useRef } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { spotifyService } from '../services/spotify';
import { tactile } from '../services/tactileFeedback';
import { RedeemCodeSection } from '../components/RedeemCodeSection';
import { BillingSection } from '../components/BillingSection';
import { googleAuthService } from '../services/googleAuth';
import { appleAuthService } from '../services/appleAuth';
import { paymentGatewayService } from '../services/paymentGateway';

export interface SettingsProps {
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onNavigate?: (route: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenAuth, onNavigate }) => {
  const store = useStore();
  const prefs = store.prefs;
  const profile = store.profile;

  // Spotify state
  const [spotifyTab, setSpotifyTab] = useState<'url' | 'oauth'>('url');
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [isUrlImporting, setIsUrlImporting] = useState(false);
  const [urlImportMsg, setUrlImportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [spotifyClientId, setSpotifyClientId] = useState(prefs.spotifyClientId || spotifyService.getClientId() || '');
  const [spotifyUser, setSpotifyUser] = useState<{ id: string; display_name: string; email: string; images: { url: string }[] } | null>(null);
  const [isOAuthSyncing, setIsOAuthSyncing] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<string | null>(null);

  // YouTube state
  const [ytUrl, setYtUrl] = useState('');
  const [ytStatus, setYtStatus] = useState<string | null>(null);

  // Library Backup & Restore (Item 4)
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google, Apple & Stripe Developer Credentials
  const [googleClientIdInput, setGoogleClientIdInput] = useState(googleAuthService.getClientId());
  const [appleServicesIdInput, setAppleServicesIdInput] = useState(appleAuthService.getServicesId());
  const [stripeLinkInput, setStripeLinkInput] = useState(paymentGatewayService.getPaymentLink());
  const [stripePkInput, setStripePkInput] = useState(paymentGatewayService.getPublishableKey());
  const [devConfigSavedMsg, setDevConfigSavedMsg] = useState<string | null>(null);

  // Developer Gateways visibility (hidden by default for public users)
  const [showDevGateways, setShowDevGateways] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('dev') === '1' ||
      params.get('admin') === '1' ||
      window.location.hash.includes('dev') ||
      localStorage.getItem('fono:show_dev_gateways') === 'true'
    );
  });
  const [devClicks, setDevClicks] = useState(0);

  const handleSaveDevGateways = (e: React.FormEvent) => {
    e.preventDefault();
    tactile.click('snap');
    googleAuthService.setClientId(googleClientIdInput.trim());
    appleAuthService.setServicesId(appleServicesIdInput.trim());
    paymentGatewayService.setPaymentLink(stripeLinkInput.trim());
    paymentGatewayService.setPublishableKey(stripePkInput.trim());
    setDevConfigSavedMsg('✓ Google OAuth, Apple ID, and Stripe credentials saved successfully!');
    setTimeout(() => setDevConfigSavedMsg(null), 3500);
  };

  const handleExportBackup = () => {
    tactile.click('click');
    try {
      storeActions.exportData();
      setBackupMsg({
        type: 'ok',
        text: `Export complete! Downloaded JSON backup with ${store.tracks.length} tracks and ${store.playlists.length} playlists.`
      });
    } catch (err: any) {
      setBackupMsg({ type: 'err', text: 'Export failed: ' + err.message });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = storeActions.importData(content);
        tactile.click('snap');
        setBackupMsg({ type: 'ok', text: res.message });
      } catch (err: any) {
        setBackupMsg({ type: 'err', text: 'Restore failed: ' + err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Check if Spotify user is already logged in
  useEffect(() => {
    if (spotifyService.isConnected()) {
      spotifyService.getCurrentUser().then(user => {
        if (user) setSpotifyUser(user);
      });
    }
  }, []);

  const handleImportSpotifyUrl = async (urlToImport: string) => {
    if (!urlToImport.trim()) return;
    setIsUrlImporting(true);
    setUrlImportMsg(null);
    try {
      const pl = await storeActions.importSpotifyPlaylistUrl(urlToImport.trim());
      if (pl) {
        setUrlImportMsg({
          type: 'ok',
          text: `Success! Imported "${pl.name}" with ${pl.tracks.length} tracks. Open "Playlists" to listen!`
        });
        setSpotifyUrlInput('');
      } else {
        setUrlImportMsg({
          type: 'err',
          text: 'Could not extract playlist. Make sure it is a valid Spotify playlist link.'
        });
      }
    } catch (err: any) {
      setUrlImportMsg({
        type: 'err',
        text: 'Import failed: ' + err.message
      });
    } finally {
      setIsUrlImporting(false);
    }
  };

  const handleSpotifyOAuthConnect = () => {
    if (!spotifyClientId.trim()) {
      alert('Please enter your Spotify Client ID first.');
      return;
    }
    spotifyService.setCredentials(spotifyClientId.trim());
    storeActions.updatePrefs({ spotifyClientId: spotifyClientId.trim() });
    spotifyService.loginWithSpotify(spotifyClientId.trim());
  };

  const handleSyncPrivatePlaylists = async () => {
    setIsOAuthSyncing(true);
    setOauthStatus('Syncing your private Spotify playlists...');
    try {
      const playlists = await spotifyService.getUserPlaylists();
      if (!playlists || playlists.length === 0) {
        setOauthStatus('No playlists found or session expired. Try reconnecting.');
        setIsOAuthSyncing(false);
        return;
      }

      let count = 0;
      for (const spPl of playlists.slice(0, 5)) {
        const tracks = await spotifyService.getPlaylistTracks(spPl.id);
        const trackIds: string[] = [];

        for (const t of tracks.slice(0, 20)) {
          const trackId = `sp-${t.id}`;
          if (!store.tracks.find(tr => tr.id === trackId)) {
            store.tracks.push({
              id: trackId,
              title: t.name,
              artist: t.artists.map(a => a.name).join(', '),
              album: t.album.name,
              genre: 'pop',
              dur: Math.round(t.duration_ms / 1000),
              loved: false,
              spotifyId: t.id,
              audioUrl: t.preview_url || undefined,
              cover: t.album.images[0]?.url || 'living'
            });
          }
          trackIds.push(trackId);
        }

        store.playlists.push({
          id: `sp-pl-${spPl.id}`,
          name: spPl.name,
          desc: spPl.description || `Synced from Spotify (${tracks.length} songs)`,
          cover: 'living',
          mine: true,
          made: Date.now(),
          tracks: trackIds,
          isSpotify: true
        });
        count++;
      }

      setOauthStatus(`Done! Synced ${count} playlists from your Spotify account.`);
    } catch (err: any) {
      setOauthStatus('Sync failed: ' + err.message);
    } finally {
      setIsOAuthSyncing(false);
    }
  };

  const handleImportYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;
    setYtStatus('Resolving YouTube video...');
    try {
      const track = await storeActions.importYouTubeTrack(ytUrl.trim());
      if (track) {
        setYtStatus(`Imported "${track.title}"! Playing now...`);
        storeActions.playTrack(track.id);
        setYtUrl('');
      } else {
        setYtStatus('Could not find YouTube video from URL.');
      }
    } catch (err: any) {
      setYtStatus('YouTube error: ' + err.message);
    }
  };

  return (
    <div className="page settings">
      <header className="pagehead">
        <div className="pagehead__title">
          <h1>Settings & connections</h1>
        </div>
        <p className="pagehead__sub">
          Connect Spotify, YouTube streaming, appearance, and audio preferences
        </p>
      </header>

      <div className="setgrid">
        {/* Left Column: Spotify Connection Center */}
        <div className="setcol">
          {/* Spotify Hub */}
          <section className="card card--padded mb-6" style={{ border: '2px solid rgba(30, 215, 96, 0.35)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="spotify" size="md" />
                <h2 className="title title--sm">Spotify Connection Center</h2>
              </div>
              <span className={`badge badge--pill ${spotifyService.isConnected() ? 'text-green-700 bg-green-100' : ''}`}>
                {spotifyService.isConnected() ? '● Connected' : '○ Standby'}
              </span>
            </div>

            {/* Sub-tabs: Instant URL vs Account Login */}
            <div className="chips mb-4" role="tablist">
              <button
                type="button"
                className={`chip${spotifyTab === 'url' ? ' is-active' : ''}`}
                onClick={() => setSpotifyTab('url')}
              >
                ⚡ Instant URL Import (No Login)
              </button>
              <button
                type="button"
                className={`chip${spotifyTab === 'oauth' ? ' is-active' : ''}`}
                onClick={() => setSpotifyTab('oauth')}
              >
                🔗 Connect Account (OAuth)
              </button>
            </div>

            {/* TAB 1: Instant URL Import */}
            {spotifyTab === 'url' && (
              <div className="tab-pane">
                <p className="text-xs muted-ink mb-3">
                  Paste any public Spotify Playlist or Track link. FONO extracts all tracks, artwork, and audio previews immediately with <strong>zero setup required</strong>.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleImportSpotifyUrl(spotifyUrlInput);
                  }}
                  className="mb-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={spotifyUrlInput}
                      onChange={(e) => setSpotifyUrlInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn--primary btn--sm"
                      disabled={isUrlImporting || !spotifyUrlInput.trim()}
                    >
                      {isUrlImporting ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </form>

                {urlImportMsg && (
                  <div className={`label ${urlImportMsg.type === 'ok' ? 'label--ink text-green-700' : 'text-red-700'} mb-3`}>
                    {urlImportMsg.text}
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-xs font-semibold block mb-2 muted-ink">Try sample Spotify playlists:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      onClick={() => handleImportSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')}
                    >
                      Top Hits (50 songs)
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      onClick={() => handleImportSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM')}
                    >
                      Lo-Fi Beats (50 songs)
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--xs"
                      onClick={() => handleImportSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DX4t95PAs1EpY')}
                    >
                      Jazz Vibes (50 songs)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Full Spotify OAuth Login */}
            {spotifyTab === 'oauth' && (
              <div className="tab-pane">
                {spotifyUser ? (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      {spotifyUser.images?.[0] ? (
                        <img src={spotifyUser.images[0].url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                          {spotifyUser.display_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <b>Connected as {spotifyUser.display_name}</b>
                        <p className="text-xs text-green-800 m-0">{spotifyUser.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={isOAuthSyncing}
                        onClick={handleSyncPrivatePlaylists}
                      >
                        {isOAuthSyncing ? 'Syncing...' : 'Sync My Private Playlists'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          spotifyService.logout();
                          setSpotifyUser(null);
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="p-3 mb-4 rounded-lg bg-stone-100 text-xs">
                      <b className="block mb-1">How to connect your private Spotify:</b>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>
                          Open{' '}
                          <a
                            href="https://developer.spotify.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline font-semibold"
                          >
                            developer.spotify.com/dashboard ↗
                          </a>
                        </li>
                        <li>Click <strong>Create App</strong> (Name: <em>FONO lofi</em>).</li>
                        <li>
                          Set <strong>Redirect URI</strong> to: <code className="bg-white px-1 py-0.5 rounded border">http://localhost:3000</code>
                        </li>
                        <li>Copy your <strong>Client ID</strong> and paste below:</li>
                      </ol>
                    </div>

                    <div className="field mb-3">
                      <span className="field__label">Spotify Client ID</span>
                      <input
                        type="text"
                        className="input"
                        placeholder="Paste your 32-character Spotify Client ID"
                        value={spotifyClientId}
                        onChange={(e) => setSpotifyClientId(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn--primary w-full flex items-center justify-center gap-2"
                      onClick={handleSpotifyOAuthConnect}
                    >
                      <Icon name="spotify" size="xs" />
                      <span>Log in & Authorize with Spotify</span>
                    </button>
                  </div>
                )}

                {oauthStatus && (
                  <div className="label label--ink mt-3">{oauthStatus}</div>
                )}
              </div>
            )}
          </section>

          {/* YouTube Streaming Hub */}
          <section className="card card--padded mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="youtube" size="md" />
              <h2 className="title title--sm">YouTube Video & Audio Hub</h2>
            </div>
            <p className="text-xs muted-ink mb-4">
              Play any YouTube video with audio synced directly to your spinning vinyl record. You can watch the live video on stage or listen in background.
            </p>

            <form onSubmit={handleImportYouTube} className="mb-4">
              <label className="field">
                <span className="field__label">Import YouTube Video</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                  />
                  <button type="submit" className="btn btn--primary btn--sm">
                    Play
                  </button>
                </div>
              </label>
            </form>

            {ytStatus && (
              <div className="label label--ink mb-3">{ytStatus}</div>
            )}

            <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              YouTube IFrame API Ready (No API Key Required)
            </div>
          </section>

          {/* VIP Max & Artwork Enhancement */}
          <section className="card card--padded mb-6" style={{ background: 'var(--t-butter)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="crown" />
                <h2 className="title title--sm" style={{ margin: 0 }}>VIP Max & Album Artwork</h2>
              </div>
              <span className="badge badge--pill" style={{ background: store.plan === 'plus' || store.plan === 'duo' ? 'var(--accent)' : 'var(--line)', color: store.plan === 'plus' || store.plan === 'duo' ? 'var(--accent-ink)' : 'var(--ink)', fontWeight: 700 }}>
                {store.plan === 'plus' || store.plan === 'duo' ? '👑 VIP Max Active' : 'Free Listener'}
              </span>
            </div>
            <p className="text-xs muted-ink mb-3">
              {store.plan === 'plus' || store.plan === 'duo'
                ? 'Your account is upgraded to VIP Max. Lossless audio is unlocked, all advertisements are completely disabled, and each track\'s authentic unique album cover is automatically retrieved.'
                : 'You are on the Free Listener tier. Upgrade to VIP Max to unlock lossless audio, ambient mixer, and custom turntable skins.'}
            </p>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                tactile.click('click');
                storeActions.enrichAlbumCovers();
                alert('Scanning and enriching all playlist tracks with unique high-resolution album covers!');
              }}
            >
              <Icon name="sparkles" size="xs" />
              <span>Resolve & Refresh Unique Album Covers</span>
            </button>
          </section>

          {/* Item 4: Library Backup & Export / Restore */}
          <section className="card card--padded mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="sparkles" />
              <h2 className="title title--sm" style={{ margin: 0 }}>Library Backup & Cloud Export</h2>
            </div>
            <p className="text-xs muted-ink mb-3">
              Export your entire listening library, custom playlists, favorite tracks, and listening milestones into a portable JSON backup file. Restore anytime on any device.
            </p>

            <div className="flex gap-3 mb-3">
              <button
                type="button"
                className="btn btn--primary btn--sm flex items-center gap-2"
                onClick={handleExportBackup}
              >
                <Icon name="check" size="xs" />
                <span>Export Library (.json)</span>
              </button>

              <button
                type="button"
                className="btn btn--soft btn--sm flex items-center gap-2"
                onClick={() => {
                  tactile.click('click');
                  fileInputRef.current?.click();
                }}
              >
                <span>Restore from Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {backupMsg && (
              <div
                className={`p-3 rounded text-xs mt-2 ${
                  backupMsg.type === 'ok'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
                style={{ borderRadius: 'var(--r-sm)' }}
              >
                {backupMsg.text}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Preferences & Audio Engine */}
        <div className="setcol">
          {/* Appearance */}
          <section className="card card--padded mb-6">
            <h2 className="title title--sm mb-4">Appearance</h2>

            <div className="field">
              <span className="field__label">Color Theme</span>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map(th => (
                  <button
                    key={th}
                    type="button"
                    className={`btn btn--sm ${prefs.theme === th ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => storeActions.setTheme(th)}
                  >
                    <Icon name={th === 'dark' ? 'moon' : th === 'light' ? 'sun' : 'sparkles'} size="xs" />
                    <span className="capitalize">{th}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field mt-4 flex justify-between items-center">
              <div>
                <b className="block">Compact Sidebar (Rail Mode)</b>
                <span className="text-xs muted-ink">Collapse sidebar into icon rail</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.sidebarRail}
                onChange={(e) => storeActions.setSidebarRail(e.target.checked)}
                className="toggle-switch"
              />
            </div>
          </section>

          {/* Listening Goal & Playback */}
          <section className="card card--padded mb-6">
            <h2 className="title title--sm mb-4">Audio & Goals</h2>

            <div className="field">
              <div className="flex justify-between items-center mb-1">
                <span className="field__label">Daily Listening Goal</span>
                <b>{store.goal} minutes</b>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={store.goal}
                onChange={(e) => {
                  store.goal = parseInt(e.target.value);
                  storeActions.updatePrefs({});
                }}
                className="scrub__range w-full"
              />
            </div>

            <div className="field mt-4">
              <span className="field__label">Crossfade Between Tracks</span>
              <div className="flex gap-2">
                {[0, 2, 4, 8].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    className={`btn btn--xs ${prefs.crossfade === sec ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => {
                      tactile.click('switch');
                      storeActions.updatePrefs({ crossfade: sec });
                    }}
                  >
                    {sec === 0 ? 'Off' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactile Sound Feedback */}
            <div className="field mt-4 flex justify-between items-center">
              <div>
                <b className="block">Tactile Sound Effects</b>
                <span className="text-xs muted-ink">Physical acoustic click feedback on button presses</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.tactileSound !== false}
                onChange={() => storeActions.toggleTactileSound()}
                className="toggle-switch"
              />
            </div>

            {/* Studio Hi-Fi Lossless Warmth */}
            <div className="field mt-4 flex justify-between items-center">
              <div>
                <b className="block">Studio Hi-Fi Warmth (VIP)</b>
                <span className="text-xs muted-ink">320kbps analog simulation & lowpass stereo enhancement</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.hifiAudio !== false}
                onChange={() => {
                  tactile.click('switch');
                  storeActions.toggleHifiAudio();
                }}
                className="toggle-switch"
              />
            </div>

            {/* Turntable Skin Selector */}
            <div className="field mt-4">
              <span className="field__label">Turntable Vinyl Skin (VIP)</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { id: 'obsidian', label: 'Obsidian Matte' },
                  { id: 'latte', label: 'Warm Latte' },
                  { id: 'matcha', label: 'Emerald Matcha' },
                  { id: 'neon', label: 'Tokyo Dusk' }
                ].map(skin => (
                  <button
                    key={skin.id}
                    type="button"
                    className={`btn btn--xs ${(prefs.vipSkin || 'obsidian') === skin.id ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => {
                      tactile.click('click');
                      storeActions.setVipSkin(skin.id as any);
                    }}
                  >
                    {skin.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Payment Methods & Billing (User Request) */}
          <BillingSection className="mb-6" />

          {/* Redeem Gift / Promo Code (User Request) */}
          <RedeemCodeSection className="mb-6" />

          {/* Legitimate Developer Gateways: Google OAuth & Stripe Live (Hidden for public users; unlocked via ?dev=1 or 5x version click) */}
          {showDevGateways && (
            <section className="card card--padded mb-6" style={{ border: '1px solid var(--line)' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    ⚡
                  </div>
                  <div>
                    <h2 className="title title--sm m-0">Developer Gateways & Credentials</h2>
                    <small className="muted-ink">Official Google OAuth 2.0 & Stripe Live Processing</small>
                  </div>
                </div>
                <span className="badge badge--pill bg-purple-100 text-purple-800 text-2xs font-bold">
                  Production Config
                </span>
              </div>

              <p className="text-xs muted-ink mb-4 leading-relaxed">
                Connect your official Google Cloud Client ID for <code>accounts.google.com</code> logins, and your Stripe Payment Link for <code>buy.stripe.com</code> card, Apple Pay, and Google Pay processing.
              </p>

              <form onSubmit={handleSaveDevGateways} className="space-y-4 text-xs">
                {/* Google OAuth Section */}
                <div className="p-3 rounded-xl bg-well border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <b className="flex items-center gap-1.5 text-ink">
                      <Icon name="google" size="xs" /> Google OAuth 2.0 Client ID
                    </b>
                    <span className={`badge badge--pill text-2xs ${googleClientIdInput ? 'bg-green-100 text-green-800' : 'bg-line muted-ink'}`}>
                      {googleClientIdInput ? '✓ Configured' : 'Needs Client ID'}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input--sm w-full font-mono text-xs"
                    placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                    value={googleClientIdInput}
                    onChange={(e) => setGoogleClientIdInput(e.target.value)}
                  />
                  <div className="flex justify-between items-center pt-1 text-2xs muted-ink">
                    <span>Registered for origin <code>https://fono-lofi.vercel.app</code></span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline font-semibold"
                    >
                      Google Cloud Console &rarr;
                    </a>
                  </div>
                </div>

                {/* Apple ID OAuth Section */}
                <div className="p-3 rounded-xl bg-well border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <b className="flex items-center gap-1.5 text-ink">
                      <Icon name="apple" size="xs" /> Sign in with Apple (Services ID)
                    </b>
                    <span className={`badge badge--pill text-2xs ${appleServicesIdInput ? 'bg-green-100 text-green-800' : 'bg-line muted-ink'}`}>
                      {appleServicesIdInput ? '✓ Configured' : 'Needs Services ID'}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input--sm w-full font-mono text-xs"
                    placeholder="e.g. com.fonolofi.web.auth"
                    value={appleServicesIdInput}
                    onChange={(e) => setAppleServicesIdInput(e.target.value)}
                  />
                  <div className="flex justify-between items-center pt-1 text-2xs muted-ink">
                    <span>Authorized for origin <code>https://fono-lofi.vercel.app</code></span>
                    <a
                      href="https://developer.apple.com/account/resources/identifiers"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline font-semibold"
                    >
                      Apple Developer Portal &rarr;
                    </a>
                  </div>
                </div>

                {/* Stripe Payment Link Section */}
                <div className="p-3 rounded-xl bg-well border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <b className="flex items-center gap-1.5 text-ink">
                      <Icon name="creditCard" size="xs" /> Stripe Payment Link URL
                    </b>
                    <span className={`badge badge--pill text-2xs ${stripeLinkInput ? 'bg-green-100 text-green-800' : 'bg-line muted-ink'}`}>
                      {stripeLinkInput ? '✓ Active Link' : 'Needs Link'}
                    </span>
                  </div>
                  <input
                    type="url"
                    className="input input--sm w-full font-mono text-xs"
                    placeholder="https://buy.stripe.com/... or test link https://buy.stripe.com/test_..."
                    value={stripeLinkInput}
                    onChange={(e) => setStripeLinkInput(e.target.value)}
                  />
                  <div className="flex justify-between items-center pt-1 text-2xs muted-ink">
                    <span>Enables Credit Cards, Apple Pay, & Google Pay automatically</span>
                    <a
                      href="https://dashboard.stripe.com/payment-links/create"
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline font-semibold"
                    >
                      Stripe Payment Links &rarr;
                    </a>
                  </div>
                </div>

                {/* Stripe Publishable Key */}
                <div className="p-3 rounded-xl bg-well border border-line space-y-2">
                  <div className="flex justify-between items-center">
                    <b className="flex items-center gap-1.5 text-ink">
                      <Icon name="lock" size="xs" /> Stripe Publishable Key (Optional)
                    </b>
                    <span className={`badge badge--pill text-2xs ${stripePkInput ? 'bg-green-100 text-green-800' : 'bg-line muted-ink'}`}>
                      {stripePkInput ? '✓ Key Saved' : 'Optional'}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input input--sm w-full font-mono text-xs"
                    placeholder="pk_live_... or pk_test_..."
                    value={stripePkInput}
                    onChange={(e) => setStripePkInput(e.target.value)}
                  />
                </div>

                {devConfigSavedMsg && (
                  <div className="p-2.5 rounded-lg bg-green-50 text-green-800 font-semibold text-xs border border-green-200">
                    {devConfigSavedMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn btn--primary btn--sm font-bold flex-1">
                    Save Credentials
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => paymentGatewayService.openRealStripeCheckout()}
                  >
                    Test Stripe Portal &rarr;
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Profile & Reset */}
          <section className="card card--padded">
            <div className="flex justify-between items-center mb-4">
              <h2 className="title title--sm m-0">Listener Account</h2>
              <span className={`badge badge--pill ${profile.isRegistered ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {profile.isRegistered ? `✓ Active (${profile.provider || 'email'})` : 'Guest Session'}
              </span>
            </div>

            <div className="p-3 bg-well rounded-xl mb-4 text-xs">
              <b className="block text-ink">{profile.name}</b>
              <span className="muted-ink">{profile.email}</span>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                type="button"
                className="btn btn--soft btn--sm flex-1 font-semibold"
                onClick={() => {
                  tactile.click('click');
                  onNavigate?.('profile');
                }}
              >
                👤 View Profile
              </button>
              <button
                type="button"
                className="btn btn--soft btn--sm flex-1 font-semibold"
                onClick={() => {
                  tactile.click('click');
                  onOpenAuth?.(profile.isRegistered ? 'signin' : 'register');
                }}
              >
                {profile.isRegistered ? 'Switch Account' : 'Register with Google / Apple'}
              </button>
              <button
                type="button"
                className="btn btn--soft btn--sm text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 font-semibold"
                onClick={() => {
                  tactile.click('click');
                  if (confirm('Are you sure you want to log out of your session?')) {
                    storeActions.logoutUser();
                    alert('Logged out successfully.');
                    onNavigate?.('home');
                  }
                }}
              >
                <Icon name="logout" size="xs" />
                <span>Log Out</span>
              </button>
            </div>

            <div className="field mb-3">
              <span className="field__label">Display Name</span>
              <input
                type="text"
                className="input"
                value={profile.name}
                onChange={(e) => storeActions.updateProfile({ name: e.target.value })}
              />
            </div>
            <div className="field mb-4">
              <span className="field__label">Handle</span>
              <input
                type="text"
                className="input"
                value={profile.handle}
                onChange={(e) => storeActions.updateProfile({ handle: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn--soft w-full"
                onClick={() => {
                  if (confirm('Clear all listening history and restart your stats counter at 0? (Playlists & songs will be kept)')) {
                    storeActions.clearListeningData();
                    alert('Listening stats have been reset to 0! Play songs to start fresh real-time logging.');
                  }
                }}
              >
                Clear Listening History & Stats (Restart at 0)
              </button>

              <button
                type="button"
                className="btn btn--ghost text-red-600 w-full"
                onClick={() => {
                  if (confirm('Reset all music data and restore initial demo state?')) {
                    storeActions.resetData();
                    window.location.reload();
                  }
                }}
              >
                Reset to Defaults
              </button>

              <div className="pt-3 border-t border-line text-center text-xs muted-ink flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center gap-3">
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Privacy Policy ↗
                  </a>
                  <span>·</span>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Terms of Service ↗
                  </a>
                </div>
                <span
                  className="cursor-pointer select-none text-2xs opacity-40 hover:opacity-80 transition-opacity"
                  onClick={() => {
                    const next = devClicks + 1;
                    setDevClicks(next);
                    if (next >= 5) {
                      const nextState = !showDevGateways;
                      setShowDevGateways(nextState);
                      localStorage.setItem('fono:show_dev_gateways', String(nextState));
                      setDevClicks(0);
                      tactile.click('snap');
                    }
                  }}
                  title="FONO lofi Web Release"
                >
                  FONO lofi v1.0.0 {showDevGateways ? '· [Dev Config Active]' : ''}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
