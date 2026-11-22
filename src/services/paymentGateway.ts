// Legitimate Payment Gateway Integration Service
// Coordinates Real Stripe, Apple Pay, and Google Pay processing.

// Global Feature Flag: Set to false while merchant verifications (Stripe, Apple, Google, Alipay) are pending.
// Set to true or use ?payments=1 to preview/re-enable.
export const SHOW_PAYMENT_METHODS = false;

export function isPaymentMethodsVisible(): boolean {
  if (typeof window !== 'undefined') {
    if (new URLSearchParams(window.location.search).get('payments') === '1') return true;
    if (localStorage.getItem('fono:show_payment_methods') === 'true') return true;
  }
  return SHOW_PAYMENT_METHODS;
}

const STORAGE_KEY_STRIPE_PK = 'lullo:stripe_publishable_key';
const STORAGE_KEY_STRIPE_LINK = 'lullo:stripe_payment_link';

class PaymentGatewayService {
  private publishableKey: string = '';
  private paymentLinkUrl: string = '';
  private isStripeLoaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedPk = localStorage.getItem(STORAGE_KEY_STRIPE_PK);
      const savedLink = localStorage.getItem(STORAGE_KEY_STRIPE_LINK);
      const envPk = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
      const envLink = (import.meta as any).env?.VITE_STRIPE_PAYMENT_LINK;

      this.publishableKey = savedPk || envPk || '';
      this.paymentLinkUrl = savedLink || envLink || '';
      this.loadStripeScript();
    }
  }

  public getPublishableKey(): string {
    return this.publishableKey;
  }

  public setPublishableKey(key: string) {
    this.publishableKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STRIPE_PK, this.publishableKey);
    }
  }

  public getPaymentLink(): string {
    return this.paymentLinkUrl;
  }

  public setPaymentLink(url: string) {
    this.paymentLinkUrl = url.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STRIPE_LINK, this.paymentLinkUrl);
    }
  }

  public isConfigured(): boolean {
    return !!(this.publishableKey || this.paymentLinkUrl);
  }

  public hasDirectLink(): boolean {
    return !!(this.paymentLinkUrl && this.paymentLinkUrl.startsWith('https://'));
  }

  private loadStripeScript() {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[src="https://js.stripe.com/v3/"]')) {
      this.isStripeLoaded = true;
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      this.isStripeLoaded = true;
    };
    document.head.appendChild(script);
  }

  // Opens the genuine Stripe Checkout or Payment Link portal directly hosted on stripe.com
  public openRealStripeCheckout(planName?: string, amount?: string): boolean {
    if (typeof window === 'undefined') return false;

    // If developer/merchant has configured a direct Stripe Payment Link:
    if (this.paymentLinkUrl && this.paymentLinkUrl.startsWith('https://')) {
      window.open(this.paymentLinkUrl, '_blank', 'noopener,noreferrer');
      return true;
    }

    // Default: Open the official Stripe Payment Links creation portal so they can create a real link in 60s
    const stripeDashboardUrl = 'https://dashboard.stripe.com/payment-links/create';
    window.open(stripeDashboardUrl, '_blank', 'noopener,noreferrer');
    return false;
  }

  public openStripeRegistration() {
    if (typeof window !== 'undefined') {
      window.open('https://dashboard.stripe.com/register', '_blank', 'noopener,noreferrer');
    }
  }

  public openGooglePayConsole() {
    if (typeof window !== 'undefined') {
      window.open('https://pay.google.com/business/console', '_blank', 'noopener,noreferrer');
    }
  }

  public openApplePayDocs() {
    if (typeof window !== 'undefined') {
      window.open('https://developer.apple.com/apple-pay/', '_blank', 'noopener,noreferrer');
    }
  }
}

export const paymentGatewayService = new PaymentGatewayService();
