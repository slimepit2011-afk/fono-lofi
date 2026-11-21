import React, { useState } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { BillingInvoice } from '../types';
import { storeActions, useStore } from '../store';

export interface GooglePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const GooglePayModal: React.FC<GooglePayModalProps> = ({
  isOpen,
  onClose,
  planId = 'plus',
  planName = 'VIP Max Lifetime Pass',
  amount = '$5.99',
  onSuccess
}) => {
  const store = useStore();
  const userEmail = store.profile.email || 'alex.listener@gmail.com';
  const userName = store.profile.name || 'Google Listener';

  const [selectedWalletMethod, setSelectedWalletMethod] = useState<'balance' | 'visa' | 'mastercard'>('visa');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  if (!isOpen) return null;

  const handlePayWithGoogle = () => {
    tactile.click('snap');
    setStatus('processing');

    setTimeout(() => {
      setStatus('success');
      tactile.click('snap');

      const invoice = storeActions.processPayment({
        planId,
        planName,
        amount,
        newMethod: {
          type: 'google_pay',
          walletEmail: userEmail,
          isDefault: true
        }
      });

      setTimeout(() => {
        onSuccess?.(invoice);
        onClose();
        setStatus('idle');
      }, 900);
    }, 1300);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.08)',
          color: '#1f1f1f',
          overflow: 'hidden',
          fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
          animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Google Pay Top Browser Simulation Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafd'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '18px', color: '#1f1f1f' }}>
              <span style={{ color: '#4285F4' }}>G</span>
              <span style={{ color: '#EA4335' }}>o</span>
              <span style={{ color: '#FBBC05' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span>
              <span style={{ color: '#34A853' }}>l</span>
              <span style={{ color: '#EA4335' }}>e</span>
              <span style={{ color: '#5f6368', fontWeight: 500, fontSize: '15px', marginLeft: '4px' }}>Pay</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#e8f0fe',
                color: '#1967d2',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon name="lock" size={10} /> pay.google.com
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status !== 'idle'}
            style={{
              background: 'none',
              border: 'none',
              color: '#5f6368',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Account Info Pill */}
        <div
          style={{
            padding: '12px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f3f4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#4285F4',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {userName.charAt(0)}
            </div>
            <div>
              <b style={{ fontSize: '13px', display: 'block', color: '#202124' }}>{userName}</b>
              <small style={{ fontSize: '11px', color: '#5f6368' }}>{userEmail}</small>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#1a73e8', fontWeight: 500 }}>
            Google Wallet
          </span>
        </div>

        {/* Order Details Banner */}
        <div style={{ padding: '20px', background: '#f8fafd', borderBottom: '1px solid #e8eaed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                MERCHANT: FONO LO-FI STUDIO
              </span>
              <h3 style={{ margin: '4px 0 2px', fontSize: '17px', fontWeight: 600, color: '#202124' }}>
                {planName}
              </h3>
              <small style={{ color: '#5f6368', fontSize: '12px' }}>
                One-time payment · Instant VIP activation
              </small>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1a73e8' }}>
                {amount}
              </span>
              <small style={{ display: 'block', fontSize: '11px', color: '#137333' }}>
                Total (USD)
              </small>
            </div>
          </div>
        </div>

        {/* Payment Methods in Google Wallet */}
        <div style={{ padding: '20px' }}>
          <span style={{ fontSize: '11px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
            PAY WITH GOOGLE WALLET
          </span>

          {/* Visa Card Option */}
          <div
            onClick={() => setSelectedWalletMethod('visa')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              background: selectedWalletMethod === 'visa' ? '#e8f0fe' : '#ffffff',
              border: selectedWalletMethod === 'visa' ? '1.5px solid #1a73e8' : '1px solid #dadce0',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '26px',
                  borderRadius: '4px',
                  background: '#1a1f71',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px'
                }}
              >
                VISA
              </div>
              <div>
                <b style={{ fontSize: '13px', display: 'block', color: '#202124' }}>Visa ending in 4242</b>
                <small style={{ fontSize: '11px', color: '#5f6368' }}>Expires 12/28 · Google Autofill</small>
              </div>
            </div>
            {selectedWalletMethod === 'visa' && (
              <span style={{ color: '#1a73e8', fontWeight: 700, fontSize: '15px' }}>●</span>
            )}
          </div>

          {/* Google Pay Balance Option */}
          <div
            onClick={() => setSelectedWalletMethod('balance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              background: selectedWalletMethod === 'balance' ? '#e8f0fe' : '#ffffff',
              border: selectedWalletMethod === 'balance' ? '1.5px solid #1a73e8' : '1px solid #dadce0',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '26px',
                  borderRadius: '4px',
                  background: '#e6f4ea',
                  color: '#137333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px'
                }}
              >
                GPAY
              </div>
              <div>
                <b style={{ fontSize: '13px', display: 'block', color: '#202124' }}>Google Pay Balance</b>
                <small style={{ fontSize: '11px', color: '#137333', fontWeight: 600 }}>$24.50 available</small>
              </div>
            </div>
            {selectedWalletMethod === 'balance' && (
              <span style={{ color: '#1a73e8', fontWeight: 700, fontSize: '15px' }}>●</span>
            )}
          </div>

          {/* Mastercard Option */}
          <div
            onClick={() => setSelectedWalletMethod('mastercard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '14px',
              background: selectedWalletMethod === 'mastercard' ? '#e8f0fe' : '#ffffff',
              border: selectedWalletMethod === 'mastercard' ? '1.5px solid #1a73e8' : '1px solid #dadce0',
              cursor: 'pointer',
              marginBottom: '18px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '26px',
                  borderRadius: '4px',
                  background: '#eb001b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '9px'
                }}
              >
                MC
              </div>
              <div>
                <b style={{ fontSize: '13px', display: 'block', color: '#202124' }}>Mastercard ending in 8812</b>
                <small style={{ fontSize: '11px', color: '#5f6368' }}>Expires 09/27</small>
              </div>
            </div>
            {selectedWalletMethod === 'mastercard' && (
              <span style={{ color: '#1a73e8', fontWeight: 700, fontSize: '15px' }}>●</span>
            )}
          </div>

          {/* Action Button */}
          {status === 'idle' && (
            <button
              type="button"
              onClick={handlePayWithGoogle}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '24px',
                background: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(26, 115, 232, 0.35)',
                transition: 'background 0.15s ease'
              }}
            >
              <span>Pay {amount} with Google Pay</span>
            </button>
          )}

          {status === 'processing' && (
            <div
              style={{
                padding: '14px',
                borderRadius: '24px',
                background: '#e8f0fe',
                color: '#1a73e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #1a73e8',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.6s linear infinite'
                }}
              />
              <span>Authorizing with Google Pay...</span>
            </div>
          )}

          {status === 'success' && (
            <div
              style={{
                padding: '14px',
                borderRadius: '24px',
                background: '#e6f4ea',
                color: '#137333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              <span>✓ Approved (GPA.3392-8812)</span>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <small style={{ fontSize: '11px', color: '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Icon name="shieldCheck" size={12} /> Google Pay 24/7 Fraud Protection Active
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};
