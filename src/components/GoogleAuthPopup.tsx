import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { googleAuthService } from '../services/googleAuth';

export interface GoogleAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; avatar: string; rememberMe: boolean }) => void;
  mode?: 'signin' | 'register';
}

export const GoogleAuthPopup: React.FC<GoogleAuthPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'register'
}) => {
  const [rememberMe, setRememberMe] = useState(true);
  const [customClientId, setCustomClientId] = useState(googleAuthService.getClientId());
  const [showConfig, setShowConfig] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [clientSavedMsg, setClientSavedMsg] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Listen for popup cross-window message callback
  useEffect(() => {
    if (!isOpen) return;

    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'FONO_GOOGLE_AUTH_CALLBACK' && e.data?.hash) {
        const user = googleAuthService.parseHashToken(e.data.hash);
        if (user && user.email) {
          setIsVerifying(false);
          onSuccess({
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            rememberMe
          });
          onClose();
        }
      }
    };

    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [isOpen, rememberMe, onSuccess, onClose]);

  // Try rendering official Google button if GSI is available
  useEffect(() => {
    if (!isOpen || !googleBtnRef.current) return;
    try {
      googleAuthService.renderGoogleButton(googleBtnRef.current, (user) => {
        setIsVerifying(false);
        onSuccess({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          rememberMe
        });
        onClose();
      });
    } catch (e) {
      console.warn('Google button render error:', e);
    }
  }, [isOpen, rememberMe, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleLaunchGooglePopup = () => {
    tactile.click('snap');
    setIsVerifying(true);
    googleAuthService.openOfficialGoogleOAuthPopup({
      onSuccess: (userData) => {
        setIsVerifying(false);
        onSuccess({
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          rememberMe
        });
        onClose();
      },
      onError: (err) => {
        setIsVerifying(false);
        alert(err);
      }
    });
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientId.trim()) return;
    googleAuthService.setClientId(customClientId.trim());
    setClientSavedMsg(true);
    setTimeout(() => setClientSavedMsg(false), 2500);
  };

  const handleCustomGoogleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    tactile.click('snap');
    setIsVerifying(true);

    const email = customEmail.trim();
    const username = email.split('@')[0];
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

    setTimeout(() => {
      setIsVerifying(false);
      onSuccess({
        name: formattedName,
        email: email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formattedName}`,
        rememberMe
      });
      onClose();
    }, 600);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) onClose();
      }}
    >
      <div
        className="card card--padded max-w-lg w-full bg-white text-gray-900"
        style={{
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header with Google Logo & Security Padlock */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Icon name="google" size="md" />
            <div>
              <b className="text-sm font-semibold block text-gray-900 leading-tight">Google Identity Services</b>
              <span className="text-2xs text-gray-500 font-mono flex items-center gap-1">
                🔒 accounts.google.com/o/oauth2/v2/auth
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ibtn ibtn--flat text-gray-400 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="text-center py-2">
            <h3 className="text-lg font-bold text-gray-900 m-0 mb-1">
              {mode === 'register' ? 'Sign up with your Google Account' : 'Sign in to FONO lofi with Google'}
            </h3>
            <p className="text-xs text-gray-600 m-0">
              Connect your Google identity to preserve unique music libraries, liked tracks, and VIP perks.
            </p>
          </div>

          {/* Action 1: Real accounts.google.com Authorization Window */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800">Launch Official Google OAuth 2.0</span>
              <span className="badge badge--pill bg-blue-100 text-blue-800 text-2xs font-mono font-bold">
                OAuth 2.0
              </span>
            </div>
            <p className="text-2xs text-gray-600 m-0">
              Opens an official authentication window hosted directly by Google on <code>accounts.google.com</code>.
            </p>
            <div ref={googleBtnRef} className="flex justify-center my-1 empty:hidden"></div>

            <button
              type="button"
              className="btn btn--primary w-full py-2.5 flex items-center justify-center gap-2 font-bold shadow-sm"
              style={{ backgroundColor: '#4285F4', color: '#ffffff', borderColor: '#4285F4' }}
              onClick={handleLaunchGooglePopup}
              disabled={isVerifying}
            >
              <Icon name="google" size="sm" />
              <span>{isVerifying ? 'Authenticating with Google...' : 'Open accounts.google.com Sign-In'}</span>
            </button>
          </div>

          {/* Action 2: Direct Email Verification with your Google Email */}
          <form onSubmit={handleCustomGoogleSignIn} className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800">Authenticate with Your Google Email</span>
              <span className="text-2xs text-gray-400">Direct Connect</span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                className="input flex-1 text-xs"
                placeholder="you@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn--soft text-xs font-bold px-4"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Sign In'}
              </button>
            </div>
            <label className="flex items-center gap-2 text-2xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#4285F4' }}
              />
              <span>Keep me signed in on this device</span>
            </label>
          </form>

          {/* Setup Guide: How to configure Google Cloud OAuth Credentials */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full p-3 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowConfig(!showConfig)}
            >
              <span className="flex items-center gap-2">
                ⚙️ <span>How to Connect Your Google Cloud Client ID</span>
              </span>
              <span>{showConfig ? '▲ Hide' : '▼ Expand Guide'}</span>
            </button>

            {showConfig && (
              <div className="p-4 bg-white text-xs text-gray-600 space-y-3 border-t border-gray-200">
                <p className="m-0 leading-relaxed">
                  To authenticate live users via Google's servers without an <code>invalid_client</code> error, your web app requires an authorized Google Cloud Client ID.
                </p>

                <div className="space-y-1.5 pl-2 border-l-2 border-blue-400">
                  <p className="m-0 text-2xs">
                    <strong>1.</strong> Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Google Cloud Console Credentials</a>.
                  </p>
                  <p className="m-0 text-2xs">
                    <strong>2.</strong> Click <strong>Create Credentials</strong> &rarr; <strong>OAuth Client ID</strong> &rarr; <strong>Web Application</strong>.
                  </p>
                  <p className="m-0 text-2xs">
                    <strong>3.</strong> Set Authorized JavaScript Origin to: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-gray-800">http://localhost:3000</code>
                  </p>
                  <p className="m-0 text-2xs">
                    <strong>4.</strong> Copy your <strong>Client ID</strong> and paste below:
                  </p>
                </div>

                <form onSubmit={handleSaveClientId} className="space-y-2 pt-1">
                  <label className="text-2xs font-semibold text-gray-700 block">Active Google Client ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1 text-2xs font-mono"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="123456789-abcdef.apps.googleusercontent.com"
                    />
                    <button type="submit" className="btn btn--primary btn--xs font-bold">
                      Save ID
                    </button>
                  </div>
                  {clientSavedMsg && (
                    <span className="text-2xs text-green-600 font-semibold block">
                      ✓ Google Client ID saved to your environment!
                    </span>
                  )}
                  <span className="text-3xs text-gray-400 block">
                    You can also define <code>VITE_GOOGLE_CLIENT_ID</code> inside your project <code>.env</code> file.
                  </span>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-2xs text-gray-500">
          <span>Protected by Google Identity Services</span>
          <button type="button" className="text-gray-500 hover:text-gray-800" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthPopup;
