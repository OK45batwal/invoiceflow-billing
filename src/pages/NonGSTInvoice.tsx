import React from 'react';
import { InvoiceEditor } from '../components/invoices/InvoiceEditor';

export const NonGSTInvoice: React.FC = () => {
  return <InvoiceEditor type="Non-GST" />;
};
