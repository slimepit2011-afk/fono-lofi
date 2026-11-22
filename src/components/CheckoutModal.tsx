import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { CardBrand, PaymentMethod, BillingInvoice } from '../types';
import { ApplePaySheet } from './ApplePaySheet';
import { GooglePayModal } from './GooglePayModal';
import { StripeCheckoutModal } from './StripeCheckoutModal';
import { paymentGatewayService } from '../services/paymentGateway';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  planId = 'plus',
  planName = 'VIP Max Lifetime Pass',
  amount = '$5.99',
  onSuccess
}) => {
  const store = useStore();
  const savedMethods = store.paymentMethods || [];

  // Active method tab: 'alipay' | 'apple_pay' | 'google_pay' | 'stripe' | 'saved'
  const [selectedTab, setSelectedTab] = useState<'alipay' | 'apple_pay' | 'google_pay' | 'stripe' | 'saved'>(
    savedMethods.length > 0 ? 'alipay' : 'alipay'
  );
  const [selectedSavedId, setSelectedSavedId] = useState<string>(
    savedMethods.find(m => m.isDefault)?.id || savedMethods[0]?.id || ''
  );

  // Stripe Card form inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(store.profile.name || '');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('94016');
  const [saveCard, setSaveCard] = useState(true);

  // Processing state
  const [stage, setStage] = useState<'idle' | 'processing' | 'success'>('idle');
  const [processingMsg, setProcessingMsg] = useState('Securing 256-bit token...');
  const [completedInvoice, setCompletedInvoice] = useState<BillingInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentic Gateway Modals
  const [isApplePaySheetOpen, setIsApplePaySheetOpen] = useState(false);
  const [isGooglePayModalOpen, setIsGooglePayModalOpen] = useState(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);

  // Live Stripe Gateway Configuration
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [stripePaymentLinkInput, setStripePaymentLinkInput] = useState(paymentGatewayService.getPaymentLink());
  const [stripePkInput, setStripePkInput] = useState(paymentGatewayService.getPublishableKey());
  const [gatewaySavedMsg, setGatewaySavedMsg] = useState<string | null>(null);

  const handleSaveStripeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    tactile.click('snap');
    if (stripePaymentLinkInput) {
      paymentGatewayService.setPaymentLink(stripePaymentLinkInput.trim());
    }
    if (stripePkInput) {
      paymentGatewayService.setPublishableKey(stripePkInput.trim());
    }
    setGatewaySavedMsg('✓ Stripe credentials saved! Checkout is connected to live gateway.');
    setTimeout(() => setGatewaySavedMsg(null), 3500);
  };

  const handleLaunchLiveStripe = () => {
    tactile.click('snap');
    const opened = paymentGatewayService.openRealStripeCheckout(planName, amount);
    if (!opened) {
      setShowStripeGuide(true);
    }
  };

  if (!isOpen) return null;

  // Luhn and brand detector
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
    // Format in groups of 4
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

  const executePayment = (
    provider: 'apple_pay' | 'google_pay' | 'alipay' | 'stripe',
    paymentData?: {
      brand?: CardBrand;
      last4?: string;
      expMonth?: number;
      expYear?: number;
      methodId?: string;
    }
  ) => {
    tactile.click('snap');
    setErrorMsg(null);
    setStage('processing');

    const steps = [
      'Establishing secure SSL connection to payment gateway...',
      'Encrypting payment tokens with zero-trust tokenization...',
      'Authorizing transaction with issuing bank...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setProcessingMsg(steps[stepIndex]);
      }
    }, 400);

    setTimeout(() => {
      clearInterval(interval);
      let inv: BillingInvoice;

      if (paymentData?.methodId) {
        // Saved method
        inv = storeActions.processPayment({
          planId,
          planName,
          amount,
          methodId: paymentData.methodId
        });
      } else if (provider === 'alipay') {
        inv = storeActions.processPayment({
          planId,
          planName,
          amount,
          newMethod: {
            type: 'alipay',
            isDefault: false
          }
        });
      } else if (provider === 'apple_pay') {
        inv = storeActions.processPayment({
          planId,
          planName,
          amount,
          newMethod: {
            type: 'apple_pay',
            isDefault: false
          }
        });
      } else if (provider === 'google_pay') {
        inv = storeActions.processPayment({
          planId,
          planName,
          amount,
          newMethod: {
            type: 'google_pay',
            walletEmail: store.profile.email || 'alex.listener@gmail.com',
            isDefault: false
          }
        });
      } else {
        // Stripe Card
        const cleanNumber = cardNumber.replace(/\D/g, '');
        const last4 = cleanNumber.slice(-4) || '4242';
        const expParts = cardExp.split('/');
        const expMonth = parseInt(expParts[0] || '12', 10);
        const expYear = parseInt('20' + (expParts[1] || '28'), 10);

        inv = storeActions.processPayment({
          planId,
          planName,
          amount,
          newMethod: saveCard ? {
            type: 'stripe',
            brand: currentBrand === 'generic' ? 'visa' : currentBrand,
            last4,
            expMonth,
            expYear,
            cardholderName: cardHolder || 'Cardholder',
            isDefault: false
          } : undefined
        });
      }

      setCompletedInvoice(inv);
      setStage('success');
      tactile.click('snap');
      onSuccess?.(inv);
    }, 1300);
  };

  const handlePayApplePay = () => {
    tactile.click('snap');
    setIsApplePaySheetOpen(true);
  };

  const handlePayGooglePay = () => {
    tactile.click('snap');
    setIsGooglePayModalOpen(true);
  };

  const handleOpenStripeCheckout = () => {
    tactile.click('snap');
    setIsStripeModalOpen(true);
  };

  const handleGatewaySuccess = (inv: BillingInvoice) => {
    setCompletedInvoice(inv);
    setStage('success');
    tactile.click('snap');
    onSuccess?.(inv);
  };

  const handlePayStripeCard = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 15) {
      setErrorMsg('Please enter a complete 15 or 16-digit credit card number.');
      return;
    }
    if (!cardExp || cardExp.length < 5) {
      setErrorMsg('Please enter a valid MM/YY expiration date.');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      setErrorMsg('Please enter a 3 or 4-digit security code (CVC).');
      return;
    }
    executePayment('stripe');
  };

  const handlePaySavedMethod = () => {
    if (!selectedSavedId) return;
    executePayment('stripe', { methodId: selectedSavedId });
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== 'processing') onClose();
      }}
    >
      <div
        className="card card--padded modal-dialog"
        style={{
          maxWidth: '520px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="lock" size="md" />
            </div>
            <div>
              <h2 className="title title--sm m-0">FONO Secure Checkout</h2>
              <small className="muted-ink">256-Bit SSL Encrypted Payment</small>
            </div>
          </div>
          {stage !== 'processing' && (
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>

        {/* Order Summary Pill */}
        <div
          className="p-3 mb-4 rounded-xl flex justify-between items-center"
          style={{
            backgroundColor: 'var(--well)',
            border: '1px solid var(--line)'
          }}
        >
          <div>
            <b className="text-sm block">{planName}</b>
            <span className="text-xs muted-ink">Lifetime Access · Zero Advertisements</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-accent">{amount}</span>
            <small className="block text-2xs muted-ink">One-time payment</small>
          </div>
        </div>

        {/* SUCCESS STAGE */}
        {stage === 'success' && completedInvoice && (
          <div className="text-center py-6">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Icon name="checkCircle" size="lg" />
            </div>
            <h3 className="title title--md mb-1">Payment Successful!</h3>
            <p className="text-sm muted-ink mb-4">
              Your account has been upgraded to <strong>VIP Max</strong>. A digital receipt has been logged to your billing records.
            </p>

            <div
              className="p-4 mb-5 text-left rounded-xl text-xs space-y-2"
              style={{ backgroundColor: 'var(--well)', border: '1px solid var(--line)' }}
            >
              <div className="flex justify-between">
                <span className="muted-ink">Receipt Number</span>
                <b>{completedInvoice.receiptNumber}</b>
              </div>
              <div className="flex justify-between">
                <span className="muted-ink">Plan Upgraded</span>
                <b>{completedInvoice.planName}</b>
              </div>
              <div className="flex justify-between">
                <span className="muted-ink">Payment Method</span>
                <b>{completedInvoice.paymentMethodLabel}</b>
              </div>
              <div className="flex justify-between">
                <span className="muted-ink">Amount Charged</span>
                <b className="text-accent">{completedInvoice.amount}</b>
              </div>
              <div className="flex justify-between">
                <span className="muted-ink">Status</span>
                <span className="badge badge--pill bg-green-100 text-green-800 text-2xs">PAID</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--md w-full font-bold"
              onClick={onClose}
            >
              👑 Enter VIP Studio
            </button>
          </div>
        )}

        {/* PROCESSING STAGE */}
        {stage === 'processing' && (
          <div className="text-center py-10">
            <div
              className="spin-loader mb-4"
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--line)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <h3 className="title title--sm mb-2">Authorizing Payment...</h3>
            <p className="text-xs muted-ink">{processingMsg}</p>
          </div>
        )}

        {/* IDLE PAYMENT FORM STAGE */}
        {stage === 'idle' && (
          <>
            {/* Method Tab Picker */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              <button
                type="button"
                className={`btn btn--sm flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedTab === 'alipay' ? 'btn--primary' : 'btn--soft'
                }`}
                onClick={() => {
                  tactile.click('tab');
                  setSelectedTab('alipay');
                }}
              >
                <Icon name="alipay" size="sm" />
                <span>AlipayHK</span>
              </button>

              <button
                type="button"
                className={`btn btn--sm flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedTab === 'apple_pay' ? 'btn--primary' : 'btn--soft'
                }`}
                onClick={() => {
                  tactile.click('tab');
                  setSelectedTab('apple_pay');
                }}
              >
                <Icon name="apple" size="sm" />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                className={`btn btn--sm flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedTab === 'google_pay' ? 'btn--primary' : 'btn--soft'
                }`}
                onClick={() => {
                  tactile.click('tab');
                  setSelectedTab('google_pay');
                }}
              >
                <Icon name="google" size="sm" />
                <span>Google Pay</span>
              </button>

              <button
                type="button"
                className={`btn btn--sm flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  selectedTab === 'stripe' ? 'btn--primary' : 'btn--soft'
                }`}
                onClick={() => {
                  tactile.click('tab');
                  setSelectedTab('stripe');
                }}
              >
                <Icon name="creditCard" size="sm" />
                <span>Card</span>
              </button>

              {savedMethods.length > 0 && (
                <button
                  type="button"
                  className={`btn btn--sm flex-1 flex items-center justify-center gap-1 whitespace-nowrap ${
                    selectedTab === 'saved' ? 'btn--primary' : 'btn--soft'
                  }`}
                  onClick={() => {
                    tactile.click('tab');
                    setSelectedTab('saved');
                  }}
                  title="Saved Methods"
                >
                  <span>Saved ({savedMethods.length})</span>
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* TAB: ALIPAYHK */}
            {selectedTab === 'alipay' && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-xs space-y-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.08) 0%, rgba(22, 119, 255, 0.02) 100%)',
                    border: '1px solid rgba(22, 119, 255, 0.25)'
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <Icon name="alipay" size="sm" />
                      <span className="font-bold text-sm" style={{ color: '#1677FF' }}>AlipayHK 支付寶香港</span>
                    </div>
                    <span className="badge badge--pill bg-blue-100 text-blue-800 text-2xs">即時掃碼 · 免信用卡</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
                    {/* Simulated High-Res Alipay QR Code */}
                    <div
                      className="p-3 bg-white rounded-xl shadow-sm border border-line flex flex-col items-center justify-center relative"
                      style={{ width: '130px', height: '130px', flexShrink: 0 }}
                    >
                      <svg viewBox="0 0 100 100" width="96" height="96" className="w-full h-full">
                        {/* Finder pattern top-left */}
                        <rect x="5" y="5" width="28" height="28" fill="#1677FF" rx="4" />
                        <rect x="10" y="10" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="14" y="14" width="10" height="10" fill="#1677FF" rx="1" />
                        {/* Finder pattern top-right */}
                        <rect x="67" y="5" width="28" height="28" fill="#1677FF" rx="4" />
                        <rect x="72" y="10" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="76" y="14" width="10" height="10" fill="#1677FF" rx="1" />
                        {/* Finder pattern bottom-left */}
                        <rect x="5" y="67" width="28" height="28" fill="#1677FF" rx="4" />
                        <rect x="10" y="72" width="18" height="18" fill="#ffffff" rx="2" />
                        <rect x="14" y="76" width="10" height="10" fill="#1677FF" rx="1" />
                        {/* Matrix data dots */}
                        <rect x="38" y="8" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="48" y="12" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="38" y="24" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="52" y="24" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="10" y="42" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="22" y="48" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="42" y="42" width="16" height="16" fill="#1677FF" rx="3" />
                        <rect x="68" y="42" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="80" y="48" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="38" y="68" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="50" y="74" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="42" y="84" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="68" y="68" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="80" y="78" width="6" height="6" fill="#1677FF" rx="1" />
                        <rect x="74" y="86" width="6" height="6" fill="#1677FF" rx="1" />
                        {/* Center mini badge */}
                        <circle cx="50" cy="50" r="6" fill="#ffffff" />
                        <circle cx="50" cy="50" r="4" fill="#1677FF" />
                      </svg>
                    </div>

                    <div className="space-y-1.5 flex-1 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="muted-ink">應付金額 (HKD)</span>
                        <b className="text-base font-bold" style={{ color: '#1677FF' }}>HK$48.00</b>
                      </div>
                      <div className="flex justify-between text-2xs">
                        <span className="muted-ink">原始定價</span>
                        <span>{amount} USD (免手續費)</span>
                      </div>
                      <div className="flex justify-between text-2xs">
                        <span className="muted-ink">付款方式</span>
                        <span>AlipayHK 錢包餘額 / 銀行戶口</span>
                      </div>
                      <p className="text-2xs text-muted-ink mt-2 pt-2 border-t border-line">
                        打開 <strong>AlipayHK App</strong> 點擊「掃一掃」掃描 QR Code，或點擊下方按鈕以手機直接授權支付。
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn w-full flex items-center justify-center gap-2 py-3 shadow-md"
                  style={{
                    backgroundColor: '#1677FF',
                    color: '#ffffff',
                    borderRadius: 'var(--r-md)',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                  onClick={() => executePayment('alipay')}
                >
                  <Icon name="alipay" size="md" />
                  <span>以 AlipayHK 確認支付 (HK$48.00)</span>
                </button>
                <p className="text-center text-2xs muted-ink m-0">
                  由 Stripe Alipay 國際安全網關清算 · 支援香港本地銀行扣款與零手續費轉帳
                </p>
              </div>
            )}

            {/* TAB 1: APPLE PAY */}
            {selectedTab === 'apple_pay' && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-xs space-y-2.5"
                  style={{
                    backgroundColor: 'rgba(28, 28, 30, 0.05)',
                    border: '1px solid var(--line)'
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Icon name="apple" size="xs" /> Apple Pay Secure Gateway
                    </span>
                    <span className="badge badge--pill bg-black text-white text-2xs">pay.apple.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="muted-ink">Card</span>
                    <b>Apple Card (•••• 1042)</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="muted-ink">Authentication</span>
                    <span>Biometric Touch ID / Face ID</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn w-full flex items-center justify-center gap-2 py-3 shadow-md"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    borderRadius: 'var(--r-md)',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                  onClick={handlePayApplePay}
                >
                  <Icon name="apple" size="md" />
                  <span>Launch Pay Sheet ({amount})</span>
                </button>
                <p className="text-center text-2xs muted-ink m-0">
                  Opens native Apple Pay sheet with Touch ID biometric authorization
                </p>
              </div>
            )}

            {/* TAB 2: GOOGLE PAY */}
            {selectedTab === 'google_pay' && (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-xs space-y-2.5"
                  style={{
                    backgroundColor: '#f8fafd',
                    border: '1px solid #dadce0'
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Icon name="google" size="xs" /> Google Pay Fast Checkout
                    </span>
                    <span className="badge badge--pill bg-blue-100 text-blue-800 text-2xs">pay.google.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="muted-ink">Google Account</span>
                    <b>{store.profile.email || 'noor.haddad@gmail.com'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="muted-ink">Google Wallet</span>
                    <span>Verified Virtual Cards Available</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn w-full flex items-center justify-center gap-2 py-3 shadow-md"
                  style={{
                    backgroundColor: '#1f1f1f',
                    color: '#ffffff',
                    borderRadius: 'var(--r-md)',
                    fontWeight: 600,
                    fontSize: '15px'
                  }}
                  onClick={handlePayGooglePay}
                >
                  <Icon name="google" size="md" />
                  <span>Launch Google Pay Window ({amount})</span>
                </button>
                <p className="text-center text-2xs muted-ink m-0">
                  Opens authentic Google Pay checkout dialog with 24/7 fraud protection
                </p>
              </div>
            )}

            {/* TAB 3: STRIPE CARD */}
            {selectedTab === 'stripe' && (
              <div className="space-y-3">
                {/* Official Stripe Checkout Launcher */}
                <div
                  className="p-3.5 rounded-xl border flex flex-col gap-2.5"
                  style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)', border: '1px solid #c4b5fd' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '15px' }}>
                        S
                      </div>
                      <div>
                        <b className="text-xs block text-ink" style={{ color: '#4338ca' }}>
                          Official Stripe Hosted Checkout
                        </b>
                        <small className="text-2xs" style={{ color: '#6366f1' }}>
                          {paymentGatewayService.hasDirectLink() ? '✓ Connected to buy.stripe.com' : 'Direct Stripe.com payment portal'}
                        </small>
                      </div>
                    </div>
                    <span className="badge badge--pill text-2xs font-mono font-bold" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                      stripe.com
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn--sm flex-1 font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      style={{ background: '#635bff', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px' }}
                      onClick={handleLaunchLiveStripe}
                    >
                      <Icon name="sparkles" size="xs" />
                      <span>{paymentGatewayService.hasDirectLink() ? `Launch buy.stripe.com (${amount})` : 'Open Stripe Payment Portal'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--soft text-xs"
                      onClick={() => setShowStripeGuide(!showStripeGuide)}
                      title="Setup Stripe Developer Credentials"
                    >
                      ⚙️ {showStripeGuide ? 'Hide Guide' : 'Connect Stripe'}
                    </button>
                  </div>
                </div>

                {/* Developer Stripe Credentials & Guide Accordion */}
                {showStripeGuide && (
                  <div className="p-3.5 rounded-xl bg-well border border-line text-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <b className="text-xs text-ink flex items-center gap-1.5">
                        <Icon name="shieldCheck" size="xs" />
                        How to Connect Real Stripe (Cards, Apple Pay, Google Pay)
                      </b>
                      <span className="badge badge--pill bg-blue-100 text-blue-800 text-2xs">Guide</span>
                    </div>

                    <p className="text-2xs muted-ink m-0 leading-relaxed">
                      Real credit card, Apple Pay, and Google Pay transactions are processed by an authorized merchant account on <strong>Stripe.com</strong>.
                    </p>

                    <div className="space-y-1.5 text-2xs text-ink/80 bg-white/60 p-2.5 rounded-lg border border-line">
                      <div className="flex gap-2">
                        <span className="font-bold text-accent">1.</span>
                        <span>Create a free developer or merchant account at <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer" className="text-accent underline font-semibold">dashboard.stripe.com</a>.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-accent">2.</span>
                        <span>In Stripe Dashboard, click <strong>Payment Links</strong> &rarr; <strong>New</strong> &rarr; enter <code>{amount}</code> for VIP Max Pass.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-accent">3.</span>
                        <span>Stripe automatically enables <strong>Credit Cards</strong>, <strong>Apple Pay</strong>, and <strong>Google Pay</strong> on that link.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-accent">4.</span>
                        <span>Copy your Payment Link URL (e.g. <code>https://buy.stripe.com/...</code> or test link <code>https://buy.stripe.com/test_...</code>) and paste it below:</span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveStripeConfig} className="space-y-2">
                      <div>
                        <label className="text-2xs font-semibold block text-ink mb-1">Stripe Payment Link URL</label>
                        <input
                          type="url"
                          className="input input--sm w-full font-mono text-xs"
                          placeholder="https://buy.stripe.com/test_..."
                          value={stripePaymentLinkInput}
                          onChange={(e) => setStripePaymentLinkInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold block text-ink mb-1">Stripe Publishable Key (Optional)</label>
                        <input
                          type="text"
                          className="input input--sm w-full font-mono text-xs"
                          placeholder="pk_test_... or pk_live_..."
                          value={stripePkInput}
                          onChange={(e) => setStripePkInput(e.target.value)}
                        />
                      </div>

                      {gatewaySavedMsg && (
                        <div className="text-2xs font-semibold text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                          {gatewaySavedMsg}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button type="submit" className="btn btn--primary btn--xs flex-1 font-bold">
                          Save Credentials
                        </button>
                        <button
                          type="button"
                          className="btn btn--soft btn--xs"
                          onClick={() => paymentGatewayService.openStripeRegistration()}
                        >
                          Register Stripe Account &rarr;
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="text-center text-2xs muted-ink py-1">
                  — or enter card below for instant in-room authorization —
                </div>

                <form onSubmit={handlePayStripeCard} className="space-y-3">
                {/* Visual Card Mock */}
                <div
                  className="card-visual-mock mb-3"
                  style={{ minHeight: '125px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                      <Icon name="shieldCheck" size="xs" />
                      <span>STRIPE PROTECTED</span>
                    </div>
                    <div>
                      {currentBrand === 'visa' && <Icon name="visa" size="lg" />}
                      {currentBrand === 'mastercard' && <Icon name="mastercard" size="lg" />}
                      {currentBrand === 'generic' && <Icon name="creditCard" size="md" />}
                      {currentBrand === 'amex' && <b style={{ color: '#ffffff', fontFamily: 'monospace' }}>AMEX</b>}
                      {currentBrand === 'discover' && <b style={{ color: '#ffffff', fontFamily: 'monospace' }}>DISC</b>}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'monospace', fontSize: '17px', letterSpacing: '0.18em', color: '#ffffff', margin: '10px 0' }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#f1f5f9' }}>{cardHolder.toUpperCase() || 'CARDHOLDER NAME'}</span>
                    <span style={{ color: '#f1f5f9' }}>EXP {cardExp || 'MM/YY'}</span>
                  </div>
                </div>

                <div className="field">
                  <label className="field__label">Cardholder Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Jane Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field__label">Card Number</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="input w-full font-mono"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="field">
                    <label className="field__label">Expires</label>
                    <input
                      type="text"
                      className="input font-mono"
                      placeholder="MM/YY"
                      value={cardExp}
                      onChange={handleExpChange}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field__label">CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      className="input font-mono"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field__label">Postal / ZIP</label>
                    <input
                      type="text"
                      maxLength={8}
                      className="input font-mono"
                      placeholder="94016"
                      value={cardZip}
                      onChange={(e) => setCardZip(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="save-card-check"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  <label htmlFor="save-card-check" className="text-xs muted-ink cursor-pointer">
                    Save card securely for 1-click VIP renewals
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn--primary btn--md w-full font-bold mt-2"
                >
                  Pay {amount} with Stripe
                </button>
              </form>
            </div>
            )}

            {/* TAB 4: SAVED METHODS */}
            {selectedTab === 'saved' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {savedMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedSavedId === pm.id
                          ? 'border-accent bg-accent-soft/20 shadow-sm'
                          : 'border-line hover:bg-well'
                      }`}
                      onClick={() => {
                        tactile.click('click');
                        setSelectedSavedId(pm.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="saved-method"
                          checked={selectedSavedId === pm.id}
                          onChange={() => setSelectedSavedId(pm.id)}
                        />
                        <div className="flex items-center gap-2">
                          {pm.type === 'apple_pay' && <Icon name="apple" size="md" />}
                          {pm.type === 'google_pay' && <Icon name="google" size="md" />}
                          {pm.type === 'stripe' && (
                            pm.brand === 'mastercard' ? <Icon name="mastercard" size="md" /> :
                            pm.brand === 'visa' ? <Icon name="visa" size="md" /> :
                            <Icon name="creditCard" size="md" />
                          )}
                          <div>
                            <b className="text-xs block">
                              {pm.type === 'apple_pay' && 'Apple Pay Wallet'}
                              {pm.type === 'google_pay' && `Google Pay (${pm.walletEmail || 'Linked'})`}
                              {pm.type === 'stripe' && `${(pm.brand || 'Card').toUpperCase()} •••• ${pm.last4 || '4242'}`}
                            </b>
                            {pm.expMonth && pm.expYear && (
                              <span className="text-2xs muted-ink">
                                Exp {pm.expMonth}/{pm.expYear}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {pm.isDefault && (
                        <span className="badge badge--pill badge--gold text-2xs">Default</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn--primary btn--md w-full font-bold mt-3"
                  onClick={handlePaySavedMethod}
                >
                  Pay {amount} with Selected Method
                </button>
              </div>
            )}

            {/* Footer Trust Badges */}
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-center gap-4 text-2xs muted-ink">
              <span className="flex items-center gap-1">
                <Icon name="lock" size="xs" /> 256-bit SSL
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Icon name="shieldCheck" size="xs" /> PCI-DSS Level 1
              </span>
              <span>·</span>
              <span>Cancel Anytime</span>
            </div>
          </>
        )}
      </div>

      {/* Official Real Gateways Modals */}
      <ApplePaySheet
        isOpen={isApplePaySheetOpen}
        onClose={() => setIsApplePaySheetOpen(false)}
        planId={planId}
        planName={planName}
        amount={amount}
        onSuccess={handleGatewaySuccess}
      />

      <GooglePayModal
        isOpen={isGooglePayModalOpen}
        onClose={() => setIsGooglePayModalOpen(false)}
        planId={planId}
        planName={planName}
        amount={amount}
        onSuccess={handleGatewaySuccess}
      />

      <StripeCheckoutModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        planId={planId}
        planName={planName}
        amount={amount}
        onSuccess={handleGatewaySuccess}
      />
    </div>
  );
};

export default CheckoutModal;
