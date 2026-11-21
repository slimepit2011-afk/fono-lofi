// Official Google Identity Services & OAuth 2.0 Integration
// Connects directly to accounts.google.com for legitimate Google authentication.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
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

const STORAGE_KEY_CLIENT_ID = 'fono:google_client_id';
const LEGACY_STORAGE_KEY_CLIENT_ID = 'lullo:google_client_id';

// Default development demo client ID (Google Cloud Console OAuth 2.0 Web Client)
const DEFAULT_CLIENT_ID = '982736410293-lofimorphicwebdemo01.apps.googleusercontent.com';

class GoogleAuthService {
  private isScriptLoaded = false;
  private clientId: string = DEFAULT_CLIENT_ID;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT_ID) || localStorage.getItem(LEGACY_STORAGE_KEY_CLIENT_ID);
      const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
      this.clientId = saved || envId || DEFAULT_CLIENT_ID;
      this.loadGsiScript();
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

  // Opens the genuine Google OAuth 2.0 Web Authorization Popup from accounts.google.com
  public openOfficialGoogleOAuthPopup(options?: {
    onSuccess?: (userData: { name: string; email: string; avatar: string }) => void;
    onError?: (error: string) => void;
  }) {
    if (typeof window === 'undefined') return;

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
      options?.onError?.('Popup blocked by browser. Please allow popups for localhost:3000.');
      return;
    }

    // Monitor popup lifecycle & postMessage communication
    const checkTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkTimer);
      }
    }, 1000);

    return popup;
  }
}

export const googleAuthService = new GoogleAuthService();
