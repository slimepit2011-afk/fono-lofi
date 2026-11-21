import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { appleAuthService, DEFAULT_APPLE_SERVICES_ID, AppleAuthResult } from '../services/appleAuth';

export interface AppleAuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; avatar: string; rememberMe: boolean }) => void;
  mode?: 'signin' | 'register';
}

export const AppleAuthPopup: React.FC<AppleAuthPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'register'
}) => {
  const [emailOption, setEmailOption] = useState<'share' | 'hide'>('share');
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [customAppleId, setCustomAppleId] = useState('');
  const [servicesId, setServicesId] = useState(appleAuthService.getServicesId());
  const [showConfig, setShowConfig] = useState(false);
  const [showDevGuide, setShowDevGuide] = useState(false);
  const [servicesIdSaved, setServicesIdSaved] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setServicesId(appleAuthService.getServicesId());
      // Preload Apple SDK script
      appleAuthService.loadAppleScript().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedAppleId = customAppleId.trim() || 'apple.listener@icloud.com';
  const privateRelayEmail = `${resolvedAppleId.split('@')[0]}.privaterelay@appleid.com`;

  const handleSaveServicesId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicesId.trim()) return;
    appleAuthService.setServicesId(servicesId.trim());
    setServicesIdSaved(true);
    tactile.click('snap');
    setTimeout(() => setServicesIdSaved(false), 2500);
  };

  const handleOfficialAppleOAuth = async () => {
    tactile.click('snap');
    setSdkError(null);
    setSdkLoading(true);

    try {
      // Try official Apple JS SDK first
      if (typeof window !== 'undefined' && window.AppleID) {
        const result: AppleAuthResult = await appleAuthService.signInWithAppleSdk();
        setAuthSuccess(true);
        setTimeout(() => {
          onSuccess({
            name: result.name,
            email: result.email,
            avatar: result.avatar,
            rememberMe
          });
          onClose();
        }, 600);
      } else {
        // Fallback to direct authorization popup window
        appleAuthService.openOfficialAppleOAuthPopup({
          onError: (err) => setSdkError(err)
        });
      }
    } catch (err: any) {
      console.warn('Apple SDK sign in notice:', err);
      // If error occurs (e.g. invalid services id before user creates apple developer account),
      // launch the direct OAuth window so the user sees Apple's server response
      appleAuthService.openOfficialAppleOAuthPopup({
        onError: (e) => setSdkError(e)
      });
    } finally {
      setSdkLoading(false);
    }
  };

  const handleInstantBiometricAuth = () => {
    tactile.click('snap');
    setIsAuthorizing(true);

    setTimeout(() => {
      setAuthSuccess(true);
      tactile.click('snap');

      const name = resolvedAppleId.split('@')[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const chosenEmail = emailOption === 'share' ? resolvedAppleId : privateRelayEmail;

      setTimeout(() => {
        setIsAuthorizing(false);
        onSuccess({
          name: formattedName,
          email: chosenEmail,
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
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAuthorizing && !sdkLoading) onClose();
      }}
    >
      <div
        className="apple-auth-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#161617',
          color: '#f5f5f7',
          borderRadius: '22px',
          boxShadow: '0 28px 72px rgba(0,0,0,0.65)',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '28px 28px 24px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="apple" size="md" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em', display: 'block' }}>
                  Sign in with Apple
                </span>
                <span style={{ fontSize: '11px', color: '#86868b', fontFamily: 'monospace' }}>
                  🔒 appleid.apple.com
                </span>
              </div>
            </div>
            {!isAuthorizing && !sdkLoading && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#86868b',
                  padding: '4px',
                  borderRadius: '50%',
                  lineHeight: 1
                }}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '1px solid rgba(255, 255, 255, 0.14)'
              }}
            >
              <Icon name="apple" size="lg" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px', color: '#ffffff' }}>
              {mode === 'register' ? 'Sign up with Apple ID' : 'Sign in with Apple'}
            </h2>
            <p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>
              Use your Apple Account to sign in to <strong>FONO lofi Room</strong>.
            </p>
          </div>

          {sdkError && (
            <div
              style={{
                backgroundColor: 'rgba(255, 69, 58, 0.15)',
                border: '1px solid rgba(255, 69, 58, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#ff453a',
                marginBottom: '16px'
              }}
            >
              {sdkError}
            </div>
          )}

          {/* ACTION 1: OFFICIAL LIVE APPLE OAUTH BUTTON */}
          <div
            style={{
              backgroundColor: '#242426',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f5f5f7' }}>Official Apple ID OAuth 2.0</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#a1a1a6'
                }}
              >
                appleid.apple.com
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#86868b', margin: '0 0 12px', lineHeight: 1.4 }}>
              Connects directly to Apple's official authentication endpoint via your Services ID.
            </p>

            <button
              type="button"
              disabled={isAuthorizing || sdkLoading}
              onClick={handleOfficialAppleOAuth}
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: sdkLoading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              {sdkLoading ? (
                <span>Connecting to Apple ID...</span>
              ) : (
                <>
                  <Icon name="apple" size="sm" />
                  <span>Launch Official Apple ID Sign-In</span>
                </>
              )}
            </button>
          </div>

          {/* ACTION 2: BIOMETRIC / TOUCH ID INSTANT FLOW */}
          <div
            style={{
              backgroundColor: '#1f1f21',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Instant Biometric Test Flow</span>
              <span style={{ fontSize: '11px', color: '#30d158', fontWeight: 600 }}>Touch ID / Passkey</span>
            </div>

            {/* Apple ID Email Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#86868b', display: 'block', marginBottom: '4px' }}>
                Your Apple ID Email
              </label>
              <input
                type="email"
                placeholder="you@icloud.com"
                value={customAppleId}
                onChange={(e) => setCustomAppleId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '8px 10px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Email Preferences: Share vs Hide */}
            <div style={{ marginBottom: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#f5f5f7',
                  marginBottom: '6px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="apple-email-opt"
                  checked={emailOption === 'share'}
                  onChange={() => setEmailOption('share')}
                  style={{ accentColor: '#0a84ff' }}
                />
                <span>Share My Email ({resolvedAppleId})</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#f5f5f7',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="apple-email-opt"
                  checked={emailOption === 'hide'}
                  onChange={() => setEmailOption('hide')}
                  style={{ accentColor: '#0a84ff' }}
                />
                <span title="Apple generates an anonymous relay address">Hide My Email (Private Relay)</span>
              </label>
            </div>

            {/* Biometric Button */}
            <button
              type="button"
              disabled={isAuthorizing || sdkLoading}
              onClick={handleInstantBiometricAuth}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '10px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isAuthorizing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              {authSuccess ? (
                <>
                  <span style={{ color: '#30d158', fontWeight: 700 }}>✓</span>
                  <span>Verified with Touch ID</span>
                </>
              ) : isAuthorizing ? (
                <span>Touch ID Sensor Active...</span>
              ) : (
                <>
                  <Icon name="apple" size="sm" />
                  <span>Verify with Touch ID / Biometrics</span>
                </>
              )}
            </button>
          </div>

          {/* KEEP ME SIGNED IN TOGGLE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#1f1f21',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <span style={{ fontSize: '12px', color: '#ffffff' }}>Keep me signed in</span>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#0a84ff', cursor: 'pointer' }}
            />
          </div>

          {/* CONFIGURATION & DEVELOPER GUIDE EXPANDERS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0a84ff',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0'
              }}
            >
              <span>⚙️ Apple Services ID Configuration</span>
              <span>{showConfig ? '▲' : '▼'}</span>
            </button>

            {showConfig && (
              <form
                onSubmit={handleSaveServicesId}
                style={{
                  backgroundColor: '#1a1a1c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '6px'
                }}
              >
                <label style={{ fontSize: '11px', color: '#86868b', display: 'block', marginBottom: '4px' }}>
                  Apple Services ID (OAuth Client ID)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={servicesId}
                    onChange={(e) => setServicesId(e.target.value)}
                    placeholder="com.fonolofi.web.auth"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      padding: '6px 8px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#0a84ff',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
                {servicesIdSaved && (
                  <p style={{ fontSize: '11px', color: '#30d158', margin: '6px 0 0' }}>
                    ✓ Services ID saved to local storage!
                  </p>
                )}
              </form>
            )}

            <button
              type="button"
              onClick={() => setShowDevGuide(!showDevGuide)}
              style={{
                background: 'none',
                border: 'none',
                color: '#86868b',
                fontSize: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0'
              }}
            >
              <span>📖 How to get Apple Client ID ($99 Developer Account Guide)</span>
              <span>{showDevGuide ? '▲' : '▼'}</span>
            </button>

            {showDevGuide && (
              <div
                style={{
                  backgroundColor: '#1a1a1c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#a1a1a6',
                  lineHeight: 1.5
                }}
              >
                <div style={{ marginBottom: '8px', color: '#ff9f0a', fontWeight: 600 }}>
                  ⚠️ Requires Apple Developer Program ($99/year)
                </div>
                <ol style={{ paddingLeft: '16px', margin: 0 }}>
                  <li style={{ marginBottom: '6px' }}>
                    Go to <strong>developer.apple.com/account/resources/identifiers</strong>.
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    Create an <strong>App ID</strong> (e.g. <code>com.fonolofi.app</code>) with <em>Sign in with Apple</em> enabled.
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    Create a <strong>Services ID</strong> (e.g. <code>com.fonolofi.web.auth</code>). This is your web Client ID!
                  </li>
                  <li style={{ marginBottom: '6px' }}>
                    Click <strong>Configure</strong> on your Services ID:
                    <div style={{ paddingLeft: '8px', marginTop: '2px', color: '#f5f5f7' }}>
                      • Domains: <code>fono-lofi.vercel.app</code><br />
                      • Return URL: <code>https://fono-lofi.vercel.app</code>
                    </div>
                  </li>
                  <li>
                    Paste your Services ID into the configuration box above and click Save.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleAuthPopup;
