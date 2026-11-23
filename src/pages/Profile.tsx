import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { GuestAvatar } from '../components/GuestAvatar';
import { tactile } from '../services/tactileFeedback';
import { formatDuration } from '../ui/format';
import { AudioUploader } from '../components/AudioUploader';
import { googleAuthService } from '../services/googleAuth';

export interface ProfileProps {
  onNavigate?: (route: string) => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
}

const AVATAR_PRESETS = [
  { id: 'vinyl', label: '📻 Vintage Vinyl', url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=160&h=160&fit=crop' },
  { id: 'coffee', label: '☕ Warm Latte', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=160&h=160&fit=crop' },
  { id: 'producer', label: '🎧 Studio Deck', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=160&fit=crop' },
  { id: 'sunset', label: '🌅 Tokyo Sunset', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=160&h=160&fit=crop' },
  { id: 'matcha', label: '🍵 Matcha Zen', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=160&h=160&fit=crop' },
  { id: 'cat', label: '🐱 Studio Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&h=160&fit=crop&crop=face' },
  { id: 'sakura', label: '🌸 Sakura Chill', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=160&h=160&fit=crop' },
  { id: 'midnight', label: '🌙 Midnight Walk', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&h=160&fit=crop' }
];

export const Profile: React.FC<ProfileProps> = ({ onNavigate, onOpenAuth }) => {
  const store = useStore();
  const profile = store.profile || {
    name: 'Guest Listener',
    handle: 'guest',
    email: 'guest@fono.fm',
    city: 'Online Room',
    isRegistered: false,
    provider: 'guest'
  };

  const isRegistered = !!profile.isRegistered;
  const isVip = isRegistered && (store.plan === 'plus' || store.plan === 'duo');
  const isFounder = !!profile.redeemedCodes?.some(c => c.toUpperCase().includes('FOUNDER'));

  // Stats calculation
  const totalSecondsListened = store.history ? store.history.reduce((acc, item) => acc + (item.s || 0), 0) : 0;
  const totalMinutesListened = Math.round(totalSecondsListened / 60);
  const totalPlays = store.tracks ? store.tracks.reduce((acc, t) => acc + (t.plays || 0), 0) : 0;
  const lovedCount = store.tracks ? store.tracks.filter(t => t.loved).length : 0;
  const uploadedTracks = store.tracks ? store.tracks.filter(t => t.id.startsWith('local-') || t.album === 'My Uploads') : [];

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || 'Guest Listener');
  const [editHandle, setEditHandle] = useState(profile.handle || 'guest');
  const [editBio, setEditBio] = useState(profile.bio || 'Lo-Fi enthusiast and late-night focus producer ☕');
  const [editCity, setEditCity] = useState(profile.city || 'Online Room');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar || AVATAR_PRESETS[0].url);
  const [savedToast, setSavedToast] = useState(false);

  // Logout confirmation inline modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Uploader visibility
  const [showUploader, setShowUploader] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    tactile.click('snap');
    storeActions.updateProfile({
      name: editName.trim() || profile.name,
      handle: editHandle.trim() || profile.handle,
      bio: editBio.trim(),
      city: editCity.trim(),
      avatar: selectedAvatar
    });
    setIsEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleToggleRememberMe = () => {
    tactile.click('click');
    const next = !profile.rememberMe;
    storeActions.updateProfile({ rememberMe: next });
    if (typeof window !== 'undefined') {
      if (next) {
        localStorage.setItem('lullo:remember_me', 'true');
      } else {
        localStorage.removeItem('lullo:remember_me');
      }
    }
  };

  const handleLogout = () => {
    tactile.click('snap');
    storeActions.logoutUser();
    setShowLogoutConfirm(false);
    onNavigate?.('home');
  };

  const handleDeleteUploadedTrack = (trackId: string, trackTitle: string) => {
    if (confirm(`Remove "${trackTitle}" from your uploaded audio vault?`)) {
      tactile.click('tap');
      storeActions.deleteTrack(trackId);
    }
  };

  const currentAvatar = profile.avatar || selectedAvatar;

  return (
    <div className="page profile">
      {/* Toast Notification */}
      {savedToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '13px'
          }}
        >
          <span>✓</span>
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="profile-hero">
        <div className="profile-hero__content">
          <div className="profile-hero__identity">
            <div className="profile-hero__avatar-wrap">
              {profile.avatar || isRegistered ? (
                <img
                  src={currentAvatar}
                  alt={profile.name}
                  className="profile-hero__avatar"
                />
              ) : (
                <div className="profile-hero__avatar" style={{ padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GuestAvatar size={76} />
                </div>
              )}
              <span
                className={`profile-hero__status-dot ${
                  isRegistered ? 'profile-hero__status-dot--verified' : 'profile-hero__status-dot--guest'
                }`}
                title={isRegistered ? 'Verified Account Active' : 'Guest Session Temporary'}
              />
            </div>

            <div className="profile-hero__meta">
              <div className="profile-hero__title-row">
                <h1 className="profile-hero__name">{profile.name}</h1>
                <span className="profile-hero__handle">@{profile.handle}</span>
                <span
                  className={`profile-hero__badge ${
                    isVip || isFounder ? 'profile-hero__badge--vip' : 'profile-hero__badge--free'
                  }`}
                >
                  {isFounder ? '👑 FOUNDER 1129' : isVip ? (store.plan === 'duo' ? '👑 DUO MIX' : '👑 VIP MAX') : isRegistered ? 'FREE MEMBER' : 'FREE GUEST'}
                </span>
              </div>

              <p className="profile-hero__bio">
                {isFounder
                  ? '👑 FONO lofi Founder Pass 1129 · Full acoustic room privileges unlocked.'
                  : isRegistered
                  ? profile.bio || 'Cozy acoustic listener in the FONO room.'
                  : 'You are listening as a temporary guest. Sign in to save your custom uploads, liked songs, and playlists.'}
              </p>

              <div className="profile-hero__foot">
                <span>📍 {profile.city || 'Online Room'} · {profile.email}</span>
                <span>·</span>
                <span>{isRegistered ? 'Registered Member' : 'Session Temporary'}</span>
              </div>
            </div>
          </div>

          <div className="profile-hero__actions">
            {!isRegistered ? (
              <>
                <button
                  type="button"
                  className="btn btn--primary btn--sm font-bold flex items-center gap-2 shadow-sm"
                  style={{
                    backgroundColor: 'var(--coral, #f09064)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}
                  onClick={() => {
                    tactile.click('click');
                    googleAuthService.signInWithGoogle({
                      onSuccess: (userData) => {
                        storeActions.loginUser({
                          name: userData.name,
                          email: userData.email,
                          avatar: userData.avatar,
                          provider: 'google',
                          rememberMe: true
                        });
                      },
                      onError: () => {
                        onOpenAuth?.('signin');
                      }
                    });
                  }}
                >
                  <Icon name="google" size="xs" />
                  <span>Sign In with Google</span>
                </button>
                <button
                  type="button"
                  className="btn btn--soft btn--sm font-semibold"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '13px'
                  }}
                  onClick={() => {
                    tactile.click('click');
                    onOpenAuth?.('register');
                  }}
                >
                  <span>Create Account</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn--soft btn--sm font-medium"
                  onClick={() => {
                    tactile.click('click');
                    setIsEditing(!isEditing);
                  }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  type="button"
                  className="btn btn--soft btn--sm text-red-600 hover:bg-red-50 flex items-center gap-1 font-semibold"
                  onClick={() => {
                    tactile.click('click');
                    setShowLogoutConfirm(true);
                  }}
                >
                  <Icon name="logout" size="xs" />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Profile Editor Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}
          >
            <h3 className="title title--sm" style={{ marginBottom: '14px' }}>Edit Profile & Persona</h3>

            {/* Avatar Persona Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Choose Avatar Persona
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = selectedAvatar === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      style={{
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
                        backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--well)',
                        textAlign: 'left'
                      }}
                      onClick={() => {
                        tactile.click('click');
                        setSelectedAvatar(p.url);
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.label}
                        </span>
                        {isSelected && <small style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>Selected ✓</small>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div className="field">
                <label className="field__label">Display Name</label>
                <input
                  type="text"
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label">Handle</label>
                <input
                  type="text"
                  className="input"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <label className="field__label">About / Bio</label>
              <input
                type="text"
                className="input"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Share your favorite vibe or music motto"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--sm font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. VIP PROMOTIONAL BANNER (FOR GUESTS / FREE) */}
      {!isVip && (
        <section className="profile-vip-banner">
          <div className="profile-vip-banner__info">
            <div className="profile-vip-banner__icon">
              <Icon name="crown" size="md" />
            </div>
            <div className="profile-vip-banner__text">
              <h3>Unlock FONO VIP Max Experience</h3>
              <p>Enjoy lossless 24-bit audio, AI vibe curator, vinyl disc finishes, and ad-free listening forever.</p>
            </div>
          </div>

          <div className="profile-vip-banner__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm font-bold shadow-sm"
              onClick={() => {
                tactile.click('snap');
                onNavigate?.('plus');
              }}
            >
              👑 Redeem VIP Voucher
            </button>
            <button
              type="button"
              className="btn btn--soft btn--sm font-medium"
              onClick={() => onNavigate?.('plus')}
            >
              Learn More
            </button>
          </div>
        </section>
      )}

      {/* 3. 4-KPI METRICS TILES */}
      <div className="profile-kpis">
        <div className="profile-kpi-card">
          <div className="profile-kpi-card__icon">⏱️</div>
          <div className="profile-kpi-card__value">{totalMinutesListened} mins</div>
          <div className="profile-kpi-card__label">Listening Time</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-card__icon">🎧</div>
          <div className="profile-kpi-card__value">{totalPlays} plays</div>
          <div className="profile-kpi-card__label">Tracks Played</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-card__icon">🎵</div>
          <div className="profile-kpi-card__value">{uploadedTracks.length} tracks</div>
          <div className="profile-kpi-card__label">My Audio Vault</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-card__icon">❤️</div>
          <div className="profile-kpi-card__value">{lovedCount} favorites</div>
          <div className="profile-kpi-card__label">Loved Tracks</div>
        </div>
      </div>

      {/* 4. ACCOUNT SECURITY & CREDENTIALS CARD */}
      <section className="profile-security-card">
        <div className="profile-security-card__head">
          <div className="profile-security-card__head-left">
            <Icon name="shieldCheck" size="sm" />
            <span>Account Security & Credentials</span>
          </div>
          <span
            className={`badge badge--pill text-2xs font-bold ${
              isRegistered ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isRegistered ? 'Verified Cloud Session' : 'Guest Mode (Local)'}
          </span>
        </div>

        <div className="profile-security-card__rows">
          <div className="profile-security-card__row">
            <span className="profile-security-card__label">Authentication Provider</span>
            <span className="profile-security-card__val">
              {profile.provider === 'google' && <Icon name="google" size="xs" />}
              {profile.provider === 'apple' && <Icon name="apple" size="xs" />}
              <span>
                {profile.provider === 'google' ? 'Google OAuth 2.0' :
                 profile.provider === 'apple' ? 'Apple ID Biometrics' :
                 profile.provider === 'email' ? 'Email & Password' : 'Guest Session'}
              </span>
            </span>
          </div>

          <div className="profile-security-card__row">
            <span className="profile-security-card__label">Primary Email</span>
            <span className="profile-security-card__val font-mono">{profile.email}</span>
          </div>

          <div className="profile-security-card__row">
            <div>
              <b className="block text-ink">Keep Me Signed In on this Device</b>
              <span className="text-2xs muted-ink">Restores your profile & playlists automatically</span>
            </div>
            <input
              type="checkbox"
              checked={!!profile.rememberMe}
              onChange={handleToggleRememberMe}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>

          <div className="profile-security-card__row">
            <div>
              <b className="block text-ink">Active Session Status</b>
              <span className="text-2xs muted-ink">
                {isRegistered ? 'Session linked to authenticated cloud account' : 'Standard listening room session'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isRegistered ? (
                <button
                  type="button"
                  className="btn btn--primary btn--xs font-bold"
                  onClick={() => {
                    tactile.click('click');
                    onOpenAuth?.('signin');
                  }}
                >
                  Sign In
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--soft btn--xs text-red-600 hover:bg-red-50 flex items-center gap-1 font-semibold"
                  onClick={() => {
                    tactile.click('click');
                    setShowLogoutConfirm(true);
                  }}
                >
                  <Icon name="logout" size="xs" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. UPLOADED TRACKS VAULT */}
      <section className="profile-vault-card">
        <div className="profile-vault-card__head">
          <div>
            <h3 className="profile-vault-card__title">My Uploaded Tracks Vault</h3>
            <span className="profile-vault-card__sub">
              {uploadedTracks.length} personal {uploadedTracks.length === 1 ? 'song' : 'songs'} in your private library
            </span>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--sm font-bold"
            onClick={() => {
              tactile.click('click');
              setShowUploader(!showUploader);
            }}
          >
            {showUploader ? 'Hide Uploader' : '+ Upload Audio File'}
          </button>
        </div>

        {showUploader && (
          <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', border: '1.5px dashed var(--accent)', background: 'var(--accent-soft)' }}>
            <AudioUploader
              onSuccess={() => {
                setShowUploader(false);
              }}
            />
          </div>
        )}

        {uploadedTracks.length === 0 ? (
          <div style={{ padding: '28px', borderRadius: '12px', border: '1px dashed var(--line)', textAlign: 'center', background: 'var(--well)' }}>
            <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>📁</span>
            <b style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: 'var(--ink)' }}>No uploaded songs yet</b>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', maxWidth: '380px', margin: '0 auto 12px auto' }}>
              Drag and drop your own MP3, WAV, or M4A audio files into your listening room.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--sm font-bold"
              onClick={() => setShowUploader(true)}
            >
              Upload Audio File
            </button>
          </div>
        ) : (
          <div>
            {uploadedTracks.map((track) => {
              const isCurrentPlaying = store.player.id === track.id && store.player.playing;
              return (
                <div key={track.id} className="profile-track-item">
                  <div className="profile-track-item__left">
                    <button
                      type="button"
                      className={`btn btn--icon ${isCurrentPlaying ? 'btn--primary' : 'btn--ghost'}`}
                      onClick={() => {
                        tactile.click('snap');
                        if (isCurrentPlaying) {
                          storeActions.togglePlay();
                        } else {
                          storeActions.playTrack(track.id);
                        }
                      }}
                      aria-label={`Play ${track.title}`}
                      style={{ width: '34px', height: '34px', minWidth: '34px', borderRadius: '50%' }}
                    >
                      <Icon name={isCurrentPlaying ? 'pause' : 'play'} size="xs" />
                    </button>

                    <div className="profile-track-item__meta">
                      <span className="profile-track-item__title">{track.title}</span>
                      <span className="profile-track-item__sub">{track.artist}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--muted)' }}>
                      {formatDuration(track.dur)}
                    </span>
                    <button
                      type="button"
                      className={`ibtn ${track.loved ? 'is-loved' : ''}`}
                      onClick={() => {
                        tactile.click('click');
                        storeActions.toggleLoved(track.id);
                      }}
                      aria-label="Love track"
                      title={track.loved ? 'Remove from loved' : 'Love track'}
                    >
                      <Icon name={track.loved ? 'heartFilled' : 'heart'} size="xs" />
                    </button>
                    <button
                      type="button"
                      className="ibtn text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteUploadedTrack(track.id, track.title)}
                      aria-label="Delete track"
                      title="Delete uploaded track"
                    >
                      <Icon name="trash" size="xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Navigation Footer Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--muted)', paddingTop: '8px' }}>
        <button
          type="button"
          className="btn btn--soft btn--xs"
          onClick={() => onNavigate?.('settings')}
        >
          ⚙️ Open Settings
        </button>
        <button
          type="button"
          className="btn btn--soft btn--xs"
          onClick={() => onNavigate?.('plus')}
        >
          👑 Manage VIP Membership
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '16px'
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="card card--padded max-w-sm w-full text-center"
            style={{ borderRadius: 'var(--r-lg)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>👋</span>
            <h3 className="title title--sm" style={{ marginBottom: '4px' }}>Log Out of FONO lofi?</h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
              Are you sure you want to log out? Your account status will revert to Free Guest, and private uploads will be safely archived until you sign back in.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ flex: 1 }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                style={{ flex: 1, backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff', fontWeight: 700 }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal containers */}
    </div>
  );
};

export default Profile;
