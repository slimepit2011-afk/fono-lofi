import React from 'react';
import { BillingInvoice } from '../types';

export interface GooglePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: 'plus' | 'duo';
  planName?: string;
  amount?: string;
  onSuccess?: (invoice: BillingInvoice) => void;
}

export const GooglePayModal: React.FC<GooglePayModalProps> = () => {
  return null;
};

export default GooglePayModal;
