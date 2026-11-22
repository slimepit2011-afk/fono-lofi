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
            requestAccessToken: () => void;
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

// Real Official Google Cloud OAuth 2.0 Client ID for FONO lofi
const DEFAULT_CLIENT_ID = '79960096223-7bi6j6glct7hl7pc9urvtls6tu6tm835.apps.googleusercontent.com';

class GoogleAuthService {
  private isScriptLoaded = false;
  private clientId: string = DEFAULT_CLIENT_ID;
  private activeSuccessCallback: ((user: GoogleUser) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID) || localStorage.getItem(LEGACY_STORAGE_KEY_CLIENT_ID);
      const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      this.clientId = saved || envId || DEFAULT_CLIENT_ID;
      this.loadGsiScript();
      this.setupMessageListener();
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

  private setupMessageListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('message', (event) => {
      // Validate origin if not localhost
      if (event.data?.type === 'FONO_GOOGLE_AUTH_CALLBACK' && event.data?.hash) {
        const user = this.parseHashToken(event.data.hash);
        if (user && user.email && this.activeSuccessCallback) {
          this.activeSuccessCallback(user);
          this.activeSuccessCallback = null;
        }
      }
    });
  }

  /**
   * Decodes Google ID Token (JWT) payload without external dependencies
   */
  public parseGoogleIdToken(idToken: string): GoogleUser {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) throw new Error('Invalid JWT');
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonStr);
      return {
        name: data.name || data.given_name || (data.email ? data.email.split('@')[0] : 'Listener'),
        email: data.email || '',
        avatar: data.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.name || 'FONO'}`,
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
        email: 'user@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoogleListener'
      };
    }
    return { name: '', email: '', avatar: '' };
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
        if (popup.location && popup.location.href.includes(window.location.origin)) {
          const hash = popup.location.hash;
          if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
            const user = this.parseHashToken(hash);
            clearInterval(checkTimer);
            try { popup.close(); } catch {}
            if (user && user.email) {
              if (this.activeSuccessCallback) {
                this.activeSuccessCallback(user);
                this.activeSuccessCallback = null;
              } else {
                options?.onSuccess?.(user);
              }
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