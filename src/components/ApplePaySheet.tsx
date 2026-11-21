import React, { useState } from 'react';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { BillingInvoice } from '../types';
import { storeActions } from '../store';

export interface ApplePaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const ApplePaySheet: React.FC<ApplePaySheetProps> = ({
  isOpen,
  onClose,
  planId = 'plus',
  planName = 'VIP Max Lifetime Pass',
  amount = '$5.99',
  onSuccess
}) => {
  const [selectedCard, setSelectedCard] = useState<'apple_card' | 'chase'>('apple_card');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  if (!isOpen) return null;

  const handleAuthorize = () => {
    tactile.click('snap');
    setStatus('scanning');

    setTimeout(() => {
      setStatus('success');
      tactile.click('snap');

      const invoice = storeActions.processPayment({
        planId,
        planName,
        amount,
        newMethod: {
          type: 'apple_pay',
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
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
          maxWidth: '430px',
          background: 'rgba(28, 28, 30, 0.94)',
          backdropFilter: 'blur(30px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif',
          animation: 'appleModalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Apple Pay Safari Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.5px' }}>
              Pay
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              pay.apple.com
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={status !== 'idle'}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Cancel
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Merchant & Order Details */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                PAY TO
              </span>
              <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 600 }}>
                FONO lofi Studio
              </h3>
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                {planName}
              </small>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                {amount}
              </span>
              <small style={{ display: 'block', fontSize: '11px', color: '#30d158' }}>
                Tax Included ($0.00)
              </small>
            </div>
          </div>

          {/* Cards Stack */}
          <div style={{ margin: '16px 0' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              PAYMENT CARD
            </span>

            {/* Apple Card Option */}
            <div
              onClick={() => setSelectedCard('apple_card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                background: selectedCard === 'apple_card' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: selectedCard === 'apple_card' ? '1.5px solid #30d158' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                marginBottom: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Titanium Apple Card Mini Art */}
                <div
                  style={{
                    width: '42px',
                    height: '26px',
                    borderRadius: '5px',
                    background: 'linear-gradient(135deg, #f5ebd9 0%, #d4a373 30%, #e8e8ed 60%, #b8c1ec 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    color: '#1c1c1e',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  Card
                </div>
                <div>
                  <b style={{ fontSize: '13px', display: 'block' }}>Apple Card (Mastercard)</b>
                  <small style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    •••• 1042 · 1% Daily Cash
                  </small>
                </div>
              </div>
              {selectedCard === 'apple_card' && (
                <span style={{ color: '#30d158', fontSize: '16px' }}>✓</span>
              )}
            </div>

            {/* Secondary Bank Card Option */}
            <div
              onClick={() => setSelectedCard('chase')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '14px',
                background: selectedCard === 'chase' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: selectedCard === 'chase' ? '1.5px solid #30d158' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '26px',
                    borderRadius: '5px',
                    background: 'linear-gradient(135deg, #0b2545 0%, #134074 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700
                  }}
                >
                  VISA
                </div>
                <div>
                  <b style={{ fontSize: '13px', display: 'block' }}>Chase Sapphire Reserve</b>
                  <small style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)' }}>
                    •••• 4242 · Preferred Card
                  </small>
                </div>
              </div>
              {selectedCard === 'chase' && (
                <span style={{ color: '#30d158', fontSize: '16px' }}>✓</span>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Billing: Cupertino, CA 95014</span>
            <span style={{ color: '#30d158' }}>✓ Privacy Relay Protected</span>
          </div>

          {/* Biometric Touch ID Sensor */}
          <div style={{ textAlign: 'center' }}>
            {status === 'idle' && (
              <button
                type="button"
                onClick={handleAuthorize}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 18px rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Icon name="touchId" size={22} />
                <span>Pay with Touch ID</span>
              </button>
            )}

            {status === 'scanning' && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(48, 209, 88, 0.15)',
                  border: '1px solid #30d158',
                  color: '#30d158',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2.5px solid #30d158',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite'
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Scanning Fingerprint & Authorizing Token...
                </span>
              </div>
            )}

            {status === 'success' && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#30d158',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '15px'
                }}
              >
                <Icon name="checkCircle" size="sm" />
                <span>Payment Done</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
              <Icon name="lock" size="xs" />
              <span>Apple Pay Device Account Number Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
