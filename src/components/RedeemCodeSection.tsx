import React, { useState } from 'react';
import { useStore, storeActions } from '../store';
import { Icon } from '../ui/icons';
import { tactile } from '../services/tactileFeedback';
import { RedeemResult } from '../services/redeemService';

export const RedeemCodeSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  const store = useStore();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<RedeemResult | null>(null);
  const redeemedCodes = store.profile.redeemedCodes || [];

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    tactile.click('snap');
    const res = storeActions.redeemGiftCode(code.trim());
    setResult(res);
    if (res.success) {
      setCode('');
    }
  };

  return (
    <section className={`card card--padded redeem-card ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" />
          <h2 className="title title--sm m-0">Redeem Gift or Promo Code</h2>
        </div>
        <span className="badge badge--pill badge--gold">
          Instant Unlock
        </span>
      </div>
      <p className="text-xs muted-ink mb-4">
        Enter your voucher, founder pass, or VIP invite code to immediately unlock premium features, custom turntable finishes, and studio audio filters.
      </p>

      {/* Code Input Form */}
      <form onSubmit={handleRedeem} className="flex gap-2 mb-3">
        <input
          type="text"
          className="input flex-1 uppercase tracking-wider font-mono font-bold"
          placeholder="ENTER CODE (e.g. VIPMAX, LOFI2026, STUDIO)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ letterSpacing: '0.08em' }}
        />
        <button
          type="submit"
          className="btn btn--primary btn--md font-bold"
          disabled={!code.trim()}
        >
          Redeem
        </button>
      </form>

      {/* Sample Quick Codes for convenience */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-2xs muted-ink font-semibold">Available Codes:</span>
        {['VIPMAX', 'LOFI2026', 'STUDIO', 'NEONDUSK', 'COZYRAIN'].map(sampleCode => (
          <button
            key={sampleCode}
            type="button"
            className="btn btn--2xs btn--soft font-mono"
            onClick={() => {
              tactile.click('tap');
              setCode(sampleCode);
            }}
          >
            {sampleCode}
          </button>
        ))}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`p-3 rounded-xl text-xs mt-3 ${
            result.success
              ? 'bg-green-100/90 text-green-900 border border-green-300'
              : 'bg-red-100/90 text-red-900 border border-red-300'
          }`}
          style={{ borderRadius: 'var(--r-md)' }}
        >
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <Icon name={result.success ? 'check' : 'close'} size="xs" />
            <span>{result.title}</span>
          </div>
          <p className="m-0 mb-2">{result.message}</p>
          {result.perksUnlocked.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.perksUnlocked.map((perk, idx) => (
                <span
                  key={idx}
                  className="badge badge--pill bg-green-200 text-green-900 text-2xs font-bold"
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List of active redeemed codes */}
      {redeemedCodes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-line">
          <span className="text-2xs uppercase tracking-wider font-bold text-muted block mb-2">
            Active Unlocked Passes on this Account ({redeemedCodes.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {redeemedCodes.map((c, i) => (
              <span
                key={i}
                className="badge badge--pill bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-bold font-mono"
              >
                👑 {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
