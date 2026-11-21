import React, { useState } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';

export interface AppleAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; avatar: string; rememberMe: boolean }) => void;
  mode?: 'signin' | 'register';
}

export const AppleAuthPopup: React.FC<AppleAuthPopupProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [emailOption, setEmailOption] = useState<'share' | 'hide'>('share');
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [customAppleId, setCustomAppleId] = useState('');

  if (!isOpen) return null;

  const resolvedAppleId = customAppleId.trim() || 'apple.user@icloud.com';
  const privateRelayEmail = `${resolvedAppleId.split('@')[0]}.privaterelay@appleid.com`;

  const handleAuthorize = () => {
    tactile.click('snap');
    setIsAuthorizing(true);

    setTimeout(() => {
      setAuthSuccess(true);
      tactile.click('snap');

      const name = resolvedAppleId.split('@')[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      setTimeout(() => {
        setIsAuthorizing(false);
        onSuccess({
          name: formattedName,
          email: emailOption === 'share' ? resolvedAppleId : privateRelayEmail,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formattedName}`,
          rememberMe
        });
        onClose();
      }, 700);
    }, 1000);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAuthorizing) onClose();
      }}
    >
      <div
        className="apple-auth-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          backgroundColor: '#1c1c1e',
          color: '#f5f5f7',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif'
        }}
      >
        <div style={{ padding: '32px 32px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="apple" size="md" />
              <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>appleid.apple.com</span>
            </div>
            {!isAuthorizing && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#86868b',
                  padding: '4px'
                }}
                aria-label="Close"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <Icon name="apple" size="lg" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 6px', color: '#ffffff' }}>
              Sign in with Apple
            </h2>
            <p style={{ fontSize: '13px', color: '#86868b', margin: 0 }}>
              Use your Apple ID to sign in to <strong>FONO lofi Room</strong>.
            </p>
          </div>

          {/* Account Details Box */}
          <div
            style={{
              backgroundColor: '#2c2c2e',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#86868b' }}>Apple ID</span>
              <input
                type="email"
                placeholder="you@icloud.com"
                value={customAppleId}
                onChange={(e) => setCustomAppleId(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '4px 8px',
                  textAlign: 'right',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#86868b', display: 'block', marginBottom: '8px' }}>
                Email Preferences
              </span>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#ffffff',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="apple-email-opt"
                  checked={emailOption === 'share'}
                  onChange={() => setEmailOption('share')}
                  style={{ accentColor: '#0071e3' }}
                />
                <span>Share My Email ({resolvedAppleId})</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="apple-email-opt"
                  checked={emailOption === 'hide'}
                  onChange={() => setEmailOption('hide')}
                  style={{ accentColor: '#0071e3' }}
                />
                <span>Hide My Email (Private Relay)</span>
              </label>
            </div>
          </div>

          {/* KEEP ME SIGNED IN TOGGLE (User Request) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#2c2c2e',
              borderRadius: '12px',
              marginBottom: '20px'
            }}
          >
            <span style={{ fontSize: '13px', color: '#ffffff' }}>Keep me signed in</span>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#0071e3', cursor: 'pointer' }}
            />
          </div>

          {/* Biometrics Scan Button */}
          <button
            type="button"
            disabled={isAuthorizing}
            onClick={handleAuthorize}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 20px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isAuthorizing ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s ease'
            }}
          >
            {authSuccess ? (
              <>
                <span style={{ color: '#34c759', fontWeight: 700 }}>✓</span>
                <span>Verified with Touch ID</span>
              </>
            ) : isAuthorizing ? (
              <span>Touch ID Sensor Active...</span>
            ) : (
              <>
                <Icon name="apple" size="sm" />
                <span>Continue with Touch ID</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppleAuthPopup;
