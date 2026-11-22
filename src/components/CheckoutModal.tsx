import React from 'react';
import { BillingInvoice } from '../types';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

// STRICT GLOBAL LOCK: Direct payments are completely disabled across the application.
// All VIP upgrades are granted exclusively via Founder/Voucher code redemption.
export const CheckoutModal: React.FC<CheckoutModalProps> = () => {
  return null;
};

export default CheckoutModal;
