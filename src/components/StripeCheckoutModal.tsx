import React from 'react';
import { BillingInvoice } from '../types';

export interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = () => {
  return null;
};

export default StripeCheckoutModal;
