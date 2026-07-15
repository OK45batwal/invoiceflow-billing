export type InvoiceType = 'GST' | 'Non-GST' | 'Quotation' | 'Estimate' | 'Proforma' | 'Challan';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank Transfer';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';

export interface BusinessProfile {
  id?: string;
  profile_type?: 'GST' | 'Non-GST';
  business_name: string;
  logo_url?: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  gstin?: string;
  pan?: string;
  email?: string;
  website?: string;
  phone: string;
  alt_phone?: string;
  bank_name?: string;
  branch?: string;
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  qr_code_url?: string;
}

export interface Customer {
  id: string;
  name: string;
  company_name?: string;
  gstin?: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  country?: string;
  email?: string;
  mobile: string;
  notes?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  hsn_code?: string;
  sku?: string;
  description?: string;
  unit: string;
  selling_price: number;
  purchase_price?: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  stock: number;
  barcode?: string;
  image_url?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id?: string;
  product_id?: string;
  product_name: string;
  description?: string;
  hsn_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount_pct: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  amount: number;
}

export interface Invoice {
  id?: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_date: string;
  due_date?: string;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  place_of_supply: string;
  reverse_charge: boolean;
  customer_id?: string;
  customer_snapshot: Customer;
  seller_snapshot: BusinessProfile;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  round_off: number;
  grand_total: number;
  notes?: string;
  terms_conditions?: string;
  items?: InvoiceItem[];
  created_at?: string;
}

export interface DashboardStats {
  todaySales: number;
  todayInvoices: number;
  monthlySales: number;
  totalCustomers: number;
  totalProducts: number;
  totalGstCollected: number;
  recentInvoices: Invoice[];
}

export interface ReportData {
  totalSales: number;
  totalTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  invoices: Invoice[];
  dailySales: { date: string; amount: number }[];
}
