import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { GoogleAuthPopup } from './GoogleAuthPopup';
import { AppleAuthPopup } from './AppleAuthPopup';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register'
}) => {
  const store = useStore();
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Popup states for authentic Google and Apple flows
  const [isGooglePopupOpen, setIsGooglePopupOpen] = useState(false);
  const [isApplePopupOpen, setIsApplePopupOpen] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSuccess = (userData: { name: string; email: string; avatar: string; rememberMe: boolean }) => {
    if (mode === 'register') {
      storeActions.registerUser({
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        provider: 'google',
        rememberMe: userData.rememberMe
      });
      setStatusMsg({
        type: 'ok',
        text: `Connected with Google! Welcome ${userData.name}. Unique private library initialized.`
      });
    } else {
      storeActions.loginUser({
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        provider: 'google',
        rememberMe: userData.rememberMe
      });
      setStatusMsg({
        type: 'ok',
        text: `Welcome back, ${userData.name}! Signed in via Google.`
      });
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleAppleSuccess = (userData: { name: string; email: string; avatar: string; rememberMe: boolean }) => {
    if (mode === 'register') {
      storeActions.registerUser({
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        provider: 'apple',
        rememberMe: userData.rememberMe
      });
      setStatusMsg({
        type: 'ok',
        text: `Apple ID Verified! Your private library is ready for unique uploads.`
      });
    } else {
      storeActions.loginUser({
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        provider: 'apple',
        rememberMe: userData.rememberMe
      });
      setStatusMsg({
        type: 'ok',
        text: `Welcome back, ${userData.name}! Authenticated via Apple ID.`
      });
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setStatusMsg({ type: 'err', text: 'Please enter both email and password.' });
      return;
    }

    tactile.click('snap');
    setIsLoading(true);
    setStatusMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'register') {
        const displayName = name.trim() || email.split('@')[0];
        storeActions.registerUser({
          name: displayName,
          email: email.trim(),
          provider: 'email',
          rememberMe
        });
        setStatusMsg({
          type: 'ok',
          text: `Account created for ${displayName}! Private library initialized with clean slate.`
        });
      } else {
        const displayName = email.split('@')[0];
        storeActions.loginUser({
          name: displayName,
          email: email.trim(),
          provider: 'email',
          rememberMe
        });
        setStatusMsg({
          type: 'ok',
          text: `Welcome back, ${displayName}! Signed in.`
        });
      }
      setTimeout(() => {
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <div className="finder-backdrop" onClick={onClose}>
      <div
        className="card modal auth-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px 32px',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="mark" style={{ width: '36px', height: '36px' }}>
              <Icon name="logo" />
            </span>
            <div>
              <h2 className="title title--sm m-0">
                {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <small className="muted-ink">FONO lofi Listening Room</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="pill-toggle w-full mb-5 flex" style={{ width: '100%' }}>
          <button
            type="button"
            className={`pill-toggle__btn flex-1 text-center ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => {
              tactile.click('tab');
              setMode('register');
              setStatusMsg(null);
            }}
          >
            Register (New Library)
          </button>
          <button
            type="button"
            className={`pill-toggle__btn flex-1 text-center ${mode === 'signin' ? 'is-active' : ''}`}
            onClick={() => {
              tactile.click('tab');
              setMode('signin');
              setStatusMsg(null);
            }}
          >
            Sign In
          </button>
        </div>

        {mode === 'register' && (
          <div className="p-3 mb-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
            💡 <strong>Unique Personal Library:</strong> When you register, default demo songs are wiped so your space is dedicated 100% to your own uploaded audio files and custom imports.
          </div>
        )}

        {/* 1-Click Social Auth Buttons */}
        <div className="space-y-3 mb-4">
          <button
            type="button"
            className="btn btn--soft w-full flex items-center justify-center gap-3 py-2.5 font-semibold text-sm"
            onClick={() => {
              tactile.click('click');
              setIsGooglePopupOpen(true);
            }}
            disabled={isLoading}
          >
            <Icon name="google" size="md" />
            <span>{mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>

          <button
            type="button"
            className="btn btn--soft w-full flex items-center justify-center gap-3 py-2.5 font-semibold text-sm"
            onClick={() => {
              tactile.click('click');
              setIsApplePopupOpen(true);
            }}
            disabled={isLoading}
          >
            <Icon name="apple" size="md" />
            <span>{mode === 'register' ? 'Sign up with Apple' : 'Continue with Apple'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-line" />
          <span className="text-2xs uppercase tracking-wider text-muted font-bold">or with email</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmitEmail} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold block mb-1">Your Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g. Maya Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold block mb-1">Email Address</label>
            <input
              type="email"
              className="input w-full"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Password</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="auth-keep-signed-in"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="auth-keep-signed-in" className="text-xs muted-ink cursor-pointer">
              Keep me signed in on this device
            </label>
          </div>

          <button
            type="submit"
            className="btn btn--primary w-full py-2.5 mt-2 font-bold"
            disabled={isLoading}
          >
            {isLoading
              ? 'Connecting...'
              : mode === 'register'
              ? 'Create Account & Start Fresh'
              : 'Sign In to Room'}
          </button>
        </form>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs mt-3 ${
              statusMsg.type === 'ok'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Authentic Popups */}
        <GoogleAuthPopup
          isOpen={isGooglePopupOpen}
          onClose={() => setIsGooglePopupOpen(false)}
          onSuccess={handleGoogleSuccess}
          mode={mode}
        />

        <AppleAuthPopup
          isOpen={isApplePopupOpen}
          onClose={() => setIsApplePopupOpen(false)}
          onSuccess={handleAppleSuccess}
          mode={mode}
        />
      </div>
    </div>
  );
};
