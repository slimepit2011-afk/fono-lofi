import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { CheckoutModal } from './CheckoutModal';
import { ApplePaySheet } from './ApplePaySheet';
import { GooglePayModal } from './GooglePayModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { BillingInvoice, PaymentMethod } from '../types';

export interface BillingSectionProps {
  className?: string;
  onOpenCheckout?: () => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({ className = '' }) => {
  const store = useStore();
  const paymentMethods = store.paymentMethods || [];
  const invoices = store.invoices || [];

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isApplePayOpen, setIsApplePayOpen] = useState(false);
  const [isGooglePayOpen, setIsGooglePayOpen] = useState(false);
  const [isStripeOpen, setIsStripeOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: 'plus' | 'duo'; name: string; amount: string }>({
    id: 'plus',
    name: 'VIP Max Lifetime Pass',
    amount: '$5.99'
  });

  const [activeReceipt, setActiveReceipt] = useState<BillingInvoice | null>(null);

  const handleSetDefault = (id: string) => {
    tactile.click('click');
    storeActions.setDefaultPaymentMethod(id);
  };

  const handleRemoveMethod = (pm: PaymentMethod) => {
    tactile.click('click');
    const label = pm.type === 'apple_pay' ? 'Apple Pay' :
      pm.type === 'google_pay' ? 'Google Pay' :
      `${pm.brand?.toUpperCase() || 'Card'} ending in ${pm.last4}`;
    if (confirm(`Remove ${label} from your saved payment methods?`)) {
      storeActions.removePaymentMethod(pm.id);
    }
  };

  const handleDownloadReceipt = (inv: BillingInvoice) => {
    tactile.click('click');
    const text = `====================================
FONO LISTENING ROOM - OFFICIAL RECEIPT
====================================
Receipt Number: ${inv.receiptNumber}
Date: ${new Date(inv.date).toLocaleDateString()} ${new Date(inv.date).toLocaleTimeString()}
Customer: ${store.profile.name} (${store.profile.email})
Plan: ${inv.planName}
Amount Paid: ${inv.amount}
Payment Method: ${inv.paymentMethodLabel}
Status: COMPLETED (PAID)
Gateway: 256-bit SSL Tokenized
====================================
Thank you for supporting cozy independent sound design on FONO lofi!
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fono-receipt-${inv.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`card card--padded ${className}`.trim()}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="creditCard" size="sm" />
          </div>
          <div>
            <h2 className="title title--sm m-0">Payment Methods & Billing</h2>
            <small className="muted-ink">Stripe, Apple Pay & Google Pay</small>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            className="btn btn--soft btn--xs flex items-center gap-1 font-semibold"
            onClick={() => {
              tactile.click('click');
              setIsApplePayOpen(true);
            }}
            title="Open Apple Pay Sheet"
          >
            <Icon name="apple" size="xs" />
            <span>Pay</span>
          </button>

          <button
            type="button"
            className="btn btn--soft btn--xs flex items-center gap-1 font-semibold"
            onClick={() => {
              tactile.click('click');
              setIsGooglePayOpen(true);
            }}
            title="Open Google Pay Window"
          >
            <Icon name="google" size="xs" />
            <span>GPay</span>
          </button>

          <button
            type="button"
            className="btn btn--soft btn--xs flex items-center gap-1 font-semibold"
            onClick={() => {
              tactile.click('click');
              setIsStripeOpen(true);
            }}
            title="Open Stripe Hosted Checkout"
          >
            <Icon name="creditCard" size="xs" />
            <span>Stripe</span>
          </button>

          <button
            type="button"
            className="btn btn--primary btn--sm flex items-center gap-1.5 font-bold"
            onClick={() => {
              tactile.click('click');
              setCheckoutPlan({
                id: 'plus',
                name: 'VIP Max Lifetime Pass',
                amount: '$5.99'
              });
              setIsCheckoutOpen(true);
            }}
          >
            <Icon name="sparkles" size="xs" />
            <span>Add Method / Upgrade</span>
          </button>
        </div>
      </div>

      {/* Active Membership Bar */}
      <div
        className="p-3 mb-5 rounded-xl flex items-center justify-between"
        style={{
          backgroundColor: 'var(--well)',
          border: '1px solid var(--line)'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="badge badge--pill badge--gold font-bold">
            👑 {store.plan === 'plus' ? 'VIP MAX LIFETIME' : store.plan === 'duo' ? 'DUO MIX' : 'FREE LISTENER'}
          </span>
          <span className="text-xs muted-ink">
            {store.plan === 'plus'
              ? 'Lifetime billing active · FLAC Lossless & Studio perks permanently unlocked'
              : 'Upgrade to unlock bespoke turntable skins and AI curation'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn--xs btn--soft"
          onClick={() => {
            tactile.click('click');
            setCheckoutPlan({
              id: 'duo',
              name: 'Duo Mix (2 Accounts)',
              amount: '$8.99'
            });
            setIsCheckoutOpen(true);
          }}
        >
          Switch to Duo
        </button>
      </div>

      {/* SAVED PAYMENT METHODS */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-ink uppercase tracking-wide">
            Saved Payment Cards & Wallets
          </span>
          <span className="text-2xs muted-ink">
            {paymentMethods.length} saved {paymentMethods.length === 1 ? 'method' : 'methods'}
          </span>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-line text-center text-xs muted-ink">
            No saved payment methods. Click "Add Method / Upgrade" to connect Apple Pay, Google Pay, or a Stripe card.
          </div>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="p-3 rounded-xl border border-line flex items-center justify-between bg-card"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '40px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--well)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--line)'
                    }}
                  >
                    {pm.type === 'apple_pay' && <Icon name="apple" size="md" />}
                    {pm.type === 'google_pay' && <Icon name="google" size="md" />}
                    {pm.type === 'stripe' && (
                      pm.brand === 'mastercard' ? <Icon name="mastercard" size="md" /> :
                      pm.brand === 'visa' ? <Icon name="visa" size="md" /> :
                      <Icon name="creditCard" size="md" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-xs">
                        {pm.type === 'apple_pay' && 'Apple Pay Wallet'}
                        {pm.type === 'google_pay' && `Google Pay (${pm.walletEmail || 'Linked'})`}
                        {pm.type === 'stripe' && `${(pm.brand || 'Card').toUpperCase()} •••• ${pm.last4 || '4242'}`}
                      </b>
                      {pm.isDefault && (
                        <span className="badge badge--pill badge--gold text-2xs">DEFAULT</span>
                      )}
                    </div>
                    <small className="text-2xs muted-ink block">
                      {pm.type === 'apple_pay' && 'Apple Device Biometric Token (Touch ID)'}
                      {pm.type === 'google_pay' && 'Google Wallet Token'}
                      {pm.type === 'stripe' && `Expires ${pm.expMonth || 12}/${pm.expYear || 2028} · Cardholder: ${pm.cardholderName || store.profile.name}`}
                    </small>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <button
                      type="button"
                      className="btn btn--xs btn--soft"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--xs btn--ghost text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveMethod(pm)}
                    title="Remove method"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BILLING HISTORY & INVOICES */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-ink uppercase tracking-wide">
            Billing History & Receipts
          </span>
          <span className="text-2xs muted-ink">{invoices.length} transactions</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-line text-center text-xs muted-ink">
            No previous billing receipts logged yet.
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-xl border border-line flex items-center justify-between text-xs bg-well"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <b>{inv.planName}</b>
                    <span className="badge badge--pill bg-green-100 text-green-800 text-2xs">PAID</span>
                  </div>
                  <span className="text-2xs muted-ink block">
                    {new Date(inv.date).toLocaleDateString()} · {inv.paymentMethodLabel} · {inv.receiptNumber}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <b className="text-sm text-accent">{inv.amount}</b>
                  <button
                    type="button"
                    className="btn btn--xs btn--soft flex items-center gap-1"
                    onClick={() => handleDownloadReceipt(inv)}
                    title="Download receipt text"
                  >
                    <Icon name="receipt" size="xs" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        planId={checkoutPlan.id}
        planName={checkoutPlan.name}
        amount={checkoutPlan.amount}
      />

      {/* Official Real Gateways */}
      <ApplePaySheet
        isOpen={isApplePayOpen}
        onClose={() => setIsApplePayOpen(false)}
        planId={checkoutPlan.id}
        planName={checkoutPlan.name}
        amount={checkoutPlan.amount}
      />

      <GooglePayModal
        isOpen={isGooglePayOpen}
        onClose={() => setIsGooglePayOpen(false)}
        planId={checkoutPlan.id}
        planName={checkoutPlan.name}
        amount={checkoutPlan.amount}
      />

      <StripeCheckoutModal
        isOpen={isStripeOpen}
        onClose={() => setIsStripeOpen(false)}
        planId={checkoutPlan.id}
        planName={checkoutPlan.name}
        amount={checkoutPlan.amount}
      />
    </section>
  );
};

export default BillingSection;
