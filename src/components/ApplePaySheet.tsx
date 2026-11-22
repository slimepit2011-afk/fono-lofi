import React from 'react';
import { BillingInvoice } from '../types';

export interface ApplePaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const ApplePaySheet: React.FC<ApplePaySheetProps> = () => {
  return null;
};

export default ApplePaySheet;
