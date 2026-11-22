import React from 'react';

export interface BillingSectionProps {
  className?: string;
  onOpenCheckout?: () => void;
}

// STRICT GLOBAL LOCK: Direct payment methods and billing management are completely disabled.
// All upgrades are voucher-code gated.
export const BillingSection: React.FC<BillingSectionProps> = () => {
  return null;
};

export default BillingSection;
