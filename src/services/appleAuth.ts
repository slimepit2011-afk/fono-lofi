// Official Sign in with Apple (Apple ID OAuth 2.0 Web Authentication)
// Connects directly to appleid.apple.com for legitimate Apple authentication.

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            code: string;
            id_token: string;
            state?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
      };
    };
  }
}

const STORAGE_KEY_APPLE_SERVICES_ID = 'fono:apple_services_id';
export const DEFAULT_APPLE_SERVICES_ID = 'com.fonolofi.web.auth';

export interface AppleAuthResult {
  name: string;
  email: string;
  avatar: string;
  isPrivateRelay?: boolean;
  rawToken?: string;
}

class AppleAuthService {
  private servicesId: string = DEFAULT_APPLE_SERVICES_ID;
  private isScriptLoaded = false;
  private scriptPromise: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_APPLE_SERVICES_ID);
      const envId = (import.meta as any).env?.VITE_APPLE_SERVICES_ID;
      this.servicesId = saved || envId || DEFAULT_APPLE_SERVICES_ID;
    }
  }

  public getServicesId(): string {
    return this.servicesId;
  }

  public setServicesId(newId: string) {
    this.servicesId = newId.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_APPLE_SERVICES_ID, this.servicesId);
    }
  }

  public isConfigured(): boolean {
    return this.servicesId !== DEFAULT_APPLE_SERVICES_ID && this.servicesId.length > 5;
  }

  /**
   * Loads Apple's official Sign in with Apple JS library
   */
  public async loadAppleScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isScriptLoaded && window.AppleID) return true;

    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise((resolve) => {
      if (document.querySelector('script[src*="appleid.auth.js"]')) {
        this.isScriptLoaded = true;
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  /**
   * Parse JWT id_token payload without external dependencies
   */
  public parseAppleIdToken(idToken: string): { email?: string; sub?: string } {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) return {};
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Failed to parse Apple ID Token payload', e);
      return {};
    }
  }

  /**
   * Trigger official Sign in with Apple using official Apple JS SDK
   */
  public async signInWithAppleSdk(): Promise<AppleAuthResult> {
    const loaded = await this.loadAppleScript();
    if (!loaded || !window.AppleID) {
      throw new Error('Apple Sign-In SDK could not be loaded from Apple CDN.');
    }

    const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'https://fono-lofi.vercel.app';

    window.AppleID.auth.init({
      clientId: this.servicesId,
      scope: 'name email',
      redirectURI: redirectUri,
      state: 'apple_signin_' + Date.now(),
      usePopup: true
    });

    const res = await window.AppleID.auth.signIn();

    let email = res.user?.email;
    let name = '';
    if (res.user?.name) {
      const first = res.user.name.firstName || '';
      const last = res.user.name.lastName || '';
      name = `${first} ${last}`.trim();
    }

    // If Apple didn't return email in user obj (subsequent signins), read from id_token JWT
    if (!email && res.authorization?.id_token) {
      const parsed = this.parseAppleIdToken(res.authorization.id_token);
      email = parsed.email;
    }

    const resolvedEmail = email || 'apple.listener@icloud.com';
    const resolvedName = name || resolvedEmail.split('@')[0];
    const formattedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
    const isPrivateRelay = resolvedEmail.includes('privaterelay');

    return {
      name: formattedName,
      email: resolvedEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${formattedName}`,
      isPrivateRelay,
      rawToken: res.authorization?.id_token
    };
  }

  /**
   * Opens official Apple ID OAuth 2.0 Authorization Window directly at appleid.apple.com
   */
  public openOfficialAppleOAuthPopup(options?: {
    onSuccess?: (result: AppleAuthResult) => void;
    onError?: (error: string) => void;
  }) {
    if (typeof window === 'undefined') return;

    const width = 580;
    const height = 680;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const redirectUri = window.location.origin;
    const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(
      this.servicesId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code%20id_token&scope=name%20email&response_mode=fragment&state=${Date.now()}`;

    const popup = window.open(
      authUrl,
      'AppleSignInOfficial',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,status=no,resizable=yes`
    );

    if (!popup) {
      options?.onError?.('Popup was blocked by your browser. Please allow popups for appleid.apple.com.');
      return null;
    }

    return popup;
  }
}

export const appleAuthService = new AppleAuthService();
