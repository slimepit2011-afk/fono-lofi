import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FONO lofi] Recovered from UI error:', error, errorInfo);
  }

  // Safe reload that PRESERVES user account, login session, and playlists
  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  // Safe soft recovery: only resets transient player state, never user credentials or profile
  private handleSoftRecover = () => {
    try {
      const raw = localStorage.getItem('fono:data') || localStorage.getItem('lullo:data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.player) {
            parsed.player.playing = false;
            parsed.player.pos = 0;
            parsed.player.id = '';
          }
          localStorage.setItem('fono:data', JSON.stringify(parsed));
          localStorage.setItem('lullo:data', JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('Soft recover notice:', e);
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg, #fcecdc)',
            padding: '24px',
            fontFamily: '"Urbanist", system-ui, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: 'var(--card, #fdf1e3)',
              borderRadius: '24px',
              padding: '32px 28px',
              boxShadow: '0 20px 50px rgba(61, 43, 31, 0.12)',
              textAlign: 'center',
              border: '1px solid var(--line, rgba(93, 64, 40, 0.1))'
            }}
          >
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '14px' }}>🎧</span>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--ink, #3d2b1f)', fontWeight: 800 }}>
              FONO Listening Room Paused
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--muted, #75604f)', lineHeight: 1.5 }}>
              A temporary stream glitch occurred. Your account, saved songs, and playlists are safe.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: 'var(--accent, #f09064)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(240, 144, 100, 0.35)'
                }}
              >
                Resume FONO Room
              </button>

              <button
                type="button"
                onClick={this.handleSoftRecover}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--muted, #75604f)',
                  border: '1px solid var(--line, rgba(93, 64, 40, 0.15))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Player Stream (Keep Login)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
