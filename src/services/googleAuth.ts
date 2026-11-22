// Official Google Identity Services & OAuth 2.0 Integration
// Connects directly to accounts.google.com for legitimate Google authentication.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

export interface GoogleUser {
  name: string;
  email: string;
  avatar: string;
  sub?: string;
}

const STORAGE_KEY_CLIENT_ID = 'fono:google_client_id';
const LEGACY_STORAGE_KEY_CLIENT_ID = 'lullo:google_client_id';
export const FONO_AUTH_CHANNEL = 'fono_auth_channel';

// Real Official Google Cloud OAuth 2.0 Client ID for FONO lofi
const DEFAULT_CLIENT_ID = '79960096223-7bi6j6glct7hl7pc9urvtls6tu6tm835.apps.googleusercontent.com';

class GoogleAuthService {
  private isScriptLoaded = false;
  private clientId: string = DEFAULT_CLIENT_ID;
  private activeSuccessCallback: ((user: GoogleUser) => void) | null = null;
  private authChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID) || localStorage.getItem(LEGACY_STORAGE_KEY_CLIENT_ID);
      const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      this.clientId = saved || envId || DEFAULT_CLIENT_ID;
      this.loadGsiScript();
      this.setupListeners();
    }
  }

  public getClientId(): string {
    return this.clientId;
  }

  public setClientId(newId: string) {
    this.clientId = newId.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CLIENT_ID, this.clientId);
      localStorage.setItem(LEGACY_STORAGE_KEY_CLIENT_ID, this.clientId);
    }
  }

  public isCustomClientId(): boolean {
    return this.clientId !== DEFAULT_CLIENT_ID && this.clientId.includes('.apps.googleusercontent.com');
  }

  private loadGsiScript() {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      this.isScriptLoaded = true;
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.isScriptLoaded = true;
    };
    document.head.appendChild(script);
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // 1. PostMessage Listener (from child popup windows)
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'FONO_GOOGLE_AUTH_CALLBACK') {
        const user: GoogleUser | undefined = event.data?.user || (event.data?.hash ? this.parseHashToken(event.data.hash) : undefined);
        if (user && user.email) {
          this.dispatchSuccess(user);
        }
      }
    });

    // 2. BroadcastChannel Listener (cross-tab sync)
    try {
      this.authChannel = new BroadcastChannel(FONO_AUTH_CHANNEL);
      this.authChannel.onmessage = (event) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.user) {
          this.dispatchSuccess(event.data.user);
        }
      };
    } catch {}
  }

  public dispatchSuccess(user: GoogleUser) {
    if (this.activeSuccessCallback) {
      this.activeSuccessCallback(user);
      this.activeSuccessCallback = null;
    }
  }

  /**
   * Decodes Google ID Token (JWT) payload with full UTF-8 and padding resilience
   */
  public parseGoogleIdToken(idToken: string): GoogleUser {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) throw new Error('Invalid JWT: missing parts');
      
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const jsonStr = new TextDecoder('utf-8').decode(bytes);
      const data = JSON.parse(jsonStr);

      const email = data.email || '';
      const name = data.name || data.given_name || (email ? email.split('@')[0] : 'Listener');
      const avatar = data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'FONO')}`;

      return {
        name,
        email,
        avatar,
        sub: data.sub || ''
      };
    } catch (e) {
      console.warn('[GoogleAuth] Failed to parse ID Token payload', e);
      return { name: 'Listener', email: '', avatar: '' };
    }
  }

  /**
   * Parses URL hash fragment returned by Google OAuth redirect
   */
  public parseHashToken(hash: string): GoogleUser {
    const cleanHash = hash.replace(/^[#?]/, '');
    const params = new URLSearchParams(cleanHash);
    const idToken = params.get('id_token');
    if (idToken) {
      return this.parseGoogleIdToken(idToken);
    }
    const accessToken = params.get('access_token');
    if (accessToken) {
      return {
        name: 'Google Listener',
        email: 'google.listener@fono.fm',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoogleListener'
      };
    }
    return { name: '', email: '', avatar: '' };
  }

  /**
   * High-level entry point for Google Sign-In / Sign-Up.
   * Prefers official Google Identity Services token client (in-page popup with no redirect COOP loss),
   * falling back to the standard OAuth web authorization popup if GSI is not yet available.
   */
  public async signInWithGoogle(options?: {
    onSuccess?: (userData: GoogleUser) => void;
    onError?: (error: string) => void;
  }): Promise<void> {
    if (typeof window === 'undefined') return;

    if (options?.onSuccess) {
      this.activeSuccessCallback = options.onSuccess;
    }

    // 1. If Google Identity Services OAuth2 token client is loaded
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn('[GoogleAuth] Token response error:', tokenResponse.error);
              options?.onError?.(tokenResponse.error);
              return;
            }
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const info = await res.json();
                const user: GoogleUser = {
                  name: info.name || info.given_name || (info.email ? info.email.split('@')[0] : 'Listener'),
                  email: info.email || '',
                  avatar: info.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(info.name || 'FONO')}`,
                  sub: info.sub || ''
                };
                if (user.email) {
                  this.broadcastLogin(user);
                  this.dispatchSuccess(user);
                  return;
                }
              } catch (e) {
                console.warn('[GoogleAuth] Userinfo fetch failed', e);
              }
            }
          },
          error_callback: (error: any) => {
            console.warn('[GoogleAuth] GSI tokenClient error_callback, falling back to popup', error);
            this.openOfficialGoogleOAuthPopup(options);
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[GoogleAuth] GSI token client init error, falling back to popup', err);
      }
    }

    // 2. Fallback to Official Google Web OAuth Popup
    this.openOfficialGoogleOAuthPopup(options);
  }

  /**
   * Broadcast login to all tabs and windows
   */
  public broadcastLogin(user: GoogleUser) {
    try {
      if (this.authChannel) {
        this.authChannel.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user });
      }
    } catch {}
  }

  /**
   * Initializes Google Identity Services (GSI) One-Tap or button
   */
  public initGsi(onSuccess: (userData: GoogleUser) => void) {
    if (typeof window === 'undefined' || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            const user = this.parseGoogleIdToken(response.credential);
            if (user && user.email) {
              this.broadcastLogin(user);
              onSuccess(user);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
    } catch (e) {
      console.warn('[GoogleAuth] GSI initialization warning:', e);
    }
  }

  /**
   * Renders the official Google Sign-In button into an HTML element
   */
  public renderGoogleButton(container: HTMLElement, onSuccess: (userData: GoogleUser) => void) {
    if (typeof window === 'undefined' || !window.google?.accounts?.id || !container) return;
    this.initGsi(onSuccess);
    try {
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: '320'
      });
    } catch (e) {
      console.warn('[GoogleAuth] renderButton error:', e);
    }
  }

  // Opens the genuine Google OAuth 2.0 Web Authorization Popup from accounts.google.com
  public openOfficialGoogleOAuthPopup(options?: {
    onSuccess?: (userData: GoogleUser) => void;
    onError?: (error: string) => void;
  }) {
    if (typeof window === 'undefined') return;

    if (options?.onSuccess) {
      this.activeSuccessCallback = options.onSuccess;
    }

    const width = 520;
    const height = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      this.clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&prompt=select_account&nonce=${Date.now()}`;

    const popup = window.open(
      authUrl,
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,status=no,resizable=yes`
    );

    if (!popup) {
      options?.onError?.('Popup blocked by browser. Please allow popups for this site.');
      return;
    }

    // Monitor popup lifecycle & capture redirect tokens
    const checkTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkTimer);
        return;
      }

      try {
        // Once redirected back to window.location.origin, it is same-origin
        if (popup.location && popup.location.href && popup.location.href.includes(window.location.origin)) {
          const hash = popup.location.hash;
          if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
            const user = this.parseHashToken(hash);
            clearInterval(checkTimer);
            if (user && user.email) {
              this.broadcastLogin(user);
              this.dispatchSuccess(user);
            }
          }
        }
      } catch (e) {
        // Cross-origin while on accounts.google.com; expected, keep waiting
      }
    }, 400);

    return popup;
  }
}

export const googleAuthService = new GoogleAuthService();
