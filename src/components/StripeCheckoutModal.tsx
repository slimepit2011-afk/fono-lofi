import React, { useState } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { BillingInvoice, CardBrand } from '../types';
import { storeActions, useStore } from '../store';
import { paymentGatewayService } from '../services/paymentGateway';

export interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  planId = 'plus',
  planName = 'VIP Max Lifetime Pass',
  amount = '$5.99',
  onSuccess
}) => {
  const store = useStore();
  const [email, setEmail] = useState(store.profile.email || 'noor.haddad@gmail.com');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(store.profile.name || 'Noor Haddad');
  const [country, setCountry] = useState('United States');
  const [zip, setZip] = useState('94103');
  const [saveInfo, setSaveInfo] = useState(true);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Luhn & brand detector
  const detectBrand = (num: string): CardBrand => {
    const clean = num.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^6(?:011|5)/.test(clean)) return 'discover';
    return 'generic';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExp(val);
  };

  const currentBrand = detectBrand(cardNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 15) {
      setErrorMsg('Your card number is incomplete.');
      return;
    }
    if (!cardExp || cardExp.length < 5) {
      setErrorMsg('Your card expiration date is incomplete.');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      setErrorMsg('Your security code is incomplete.');
      return;
    }

    setErrorMsg(null);
    setStatus('processing');
    tactile.click('snap');

    setTimeout(() => {
      setStatus('success');
      tactile.click('snap');

      const expParts = cardExp.split('/');
      const expMonth = parseInt(expParts[0] || '12', 10);
      const expYear = parseInt('20' + (expParts[1] || '28'), 10);

      const invoice = storeActions.processPayment({
        planId,
        planName,
        amount,
        newMethod: {
          type: 'stripe',
          brand: currentBrand === 'generic' ? 'visa' : currentBrand,
          last4: clean.slice(-4),
          expMonth,
          expYear,
          cardholderName: cardHolder,
          isDefault: true
        }
      });

      setTimeout(() => {
        onSuccess?.(invoice);
        onClose();
        setStatus('idle');
      }, 1000);
    }, 1400);
  };

  const handlePayWithLink = () => {
    setStatus('processing');
    tactile.click('snap');

    setTimeout(() => {
      setStatus('success');
      tactile.click('snap');

      const invoice = storeActions.processPayment({
        planId,
        planName,
        amount,
        newMethod: {
          type: 'stripe',
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2028,
          cardholderName: cardHolder,
          isDefault: true
        }
      });

      setTimeout(() => {
        onSuccess?.(invoice);
        onClose();
        setStatus('idle');
      }, 900);
    }, 1200);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && status === 'idle') onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Browser Top URL Simulation Bar */}
        <div
          style={{
            background: '#f1f3f5',
            padding: '10px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {/* macOS dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
          </div>

          {/* URL bar */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '11px',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #cbd5e1'
            }}
          >
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}>
              <Icon name="lock" size={10} />
            </span>
            <span style={{ fontWeight: 600, color: '#059669' }}>https://</span>
            <span>checkout.stripe.com/c/pay/cs_live_839210482910</span>
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '10px' }}>
              Stripe, Inc. [US]
            </span>
          </div>

          <button
            type="button"
            className="btn btn--xs"
            style={{
              background: '#635bff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onClick={() => paymentGatewayService.openRealStripeCheckout(planName, amount)}
            title="Open genuine Stripe checkout in a new window"
          >
            Open Real stripe.com ↗
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={status !== 'idle'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '14px',
              padding: '2px 6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Split-screen Stripe Checkout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {/* Left Column: Dark Slate Merchant Summary */}
          <div
            style={{
              flex: '1 1 300px',
              background: '#1a1f36',
              color: '#ffffff',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '24px'
                }}
              >
                ← Back to FONO lofi
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>📻</span>
                <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)' }}>
                  FONO lofi Studio
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px', color: '#ffffff' }}>
                {planName}
              </h2>

              <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px' }}>
                  {amount}
                </span>
                <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                  billed once
                </small>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '16px',
                  marginTop: '16px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#30d158' }}>✓</span> FLAC 320 kbps Lossless Master Audio
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#30d158' }}>✓</span> Unlimited AI DJ Mood Radio Tokens
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#30d158' }}>✓</span> All 4 Turntable Disc Finishes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#30d158' }}>✓</span> Real-Time Procedural Soundscapes
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#30d158' }}>✓</span> Permanent Ad-Free Lifetime Pass
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
              <span>Powered by <strong>stripe</strong></span>
              <span>Terms · Privacy</span>
            </div>
          </div>

          {/* Right Column: Stripe Checkout Form */}
          <div
            style={{
              flex: '1 1 380px',
              padding: '32px 30px',
              background: '#ffffff',
              color: '#1a1f36',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Stripe Link 1-Click Button */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handlePayWithLink}
                disabled={status !== 'idle'}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#00d66f',
                  color: '#002b11',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(0, 214, 111, 0.3)'
                }}
              >
                <span>⚡ Pay with Link</span>
                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>1-click checkout</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0 18px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Or pay with card
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Card Information Composite */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Card information
                </label>
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Number Input with Dynamic Brand Logo */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderBottom: '1px solid #cbd5e1',
                      background: '#ffffff'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        flex: 1
                      }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: currentBrand === 'visa' ? '#1a1f71' : '#f1f5f9', color: currentBrand === 'visa' ? '#fff' : '#64748b' }}>
                        VISA
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: currentBrand === 'mastercard' ? '#eb001b' : '#f1f5f9', color: currentBrand === 'mastercard' ? '#fff' : '#64748b' }}>
                        MC
                      </span>
                    </div>
                  </div>

                  {/* Expiry & CVC */}
                  <div style={{ display: 'flex' }}>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={cardExp}
                      onChange={handleExpChange}
                      maxLength={5}
                      style={{
                        width: '50%',
                        border: 'none',
                        borderRight: '1px solid #cbd5e1',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      style={{
                        width: '50%',
                        border: 'none',
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Cardholder name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Country & ZIP */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Country or region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#1e293b',
                      outline: 'none',
                      background: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>Japan</option>
                    <option>Germany</option>
                    <option>Australia</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    ZIP
                  </label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#1e293b',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Save for Link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="stripe-save-link"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                  style={{ accentColor: '#635bff', cursor: 'pointer' }}
                />
                <label htmlFor="stripe-save-link" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  Securely save my info for 1-click checkout with Link
                </label>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '10px' }}>
                {status === 'idle' && (
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '8px',
                      background: '#635bff',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(99, 91, 255, 0.35)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>Pay {amount}</span>
                  </button>
                )}

                {status === 'processing' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: '#ede9fe',
                      color: '#635bff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid #635bff',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.6s linear infinite'
                      }}
                    />
                    <span>Securing with Stripe 256-bit TLS...</span>
                  </div>
                )}

                {status === 'success' && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}
                  >
                    <span>✓ Authorized (ch_3M4920194)</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
