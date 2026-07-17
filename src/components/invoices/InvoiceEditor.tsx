import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, Customer, PaymentMode, PaymentStatus } from '../../types';
import { calculateInvoiceTotals, numberToWords, INDIAN_STATES } from '../../utils/gstEngine';
import { Dialog } from '../ui/Dialog';
import { ShareDialog } from './ShareDialog';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  Save, 
  Printer, 
  UserPlus, 
  Building,
  ArrowLeft,
  Info,
  Share2
} from 'lucide-react';

interface InvoiceEditorProps {
  type: 'GST' | 'Non-GST';
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ type }) => {
  const { 
    gstProfile,
    nongstProfile,
    customers, 
    products, 
    invoices, 
    addInvoice, 
    updateInvoice,
    selectedInvoiceIdForEdit,
    setSelectedInvoiceIdForEdit,
    setActivePage,
    addCustomer,
    showToast 
  } = useApp();

  const profile = type === 'GST' ? gstProfile : nongstProfile;

  // If editing, find the invoice
  const editInvoice = selectedInvoiceIdForEdit 
    ? invoices.find(i => i.id === selectedInvoiceIdForEdit) 
    : null;

  // Invoice Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra');
  const [reverseCharge, setReverseCharge] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  
  // Invoice Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_name: '', description: '', hsn_code: '', quantity: 1, unit: 'PCS', rate: 0, discount_pct: 0, gst_rate: 18, cgst_rate: 9, sgst_rate: 9, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, amount: 0 }
  ]);
  
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('1. Please pay within due date.\n2. Goods once sold will not be taken back.');

  // UPI QR Code state (generated client-side)
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  // UI state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Auto-generate invoice number
  useEffect(() => {
    if (editInvoice) {
      // Load edit values
      setInvoiceNumber(editInvoice.invoice_number);
      setInvoiceDate(editInvoice.invoice_date);
      setDueDate(editInvoice.due_date || '');
      setPaymentMode(editInvoice.payment_mode);
      setPaymentStatus(editInvoice.payment_status);
      setPlaceOfSupply(editInvoice.place_of_supply);
      setReverseCharge(editInvoice.reverse_charge);
      setSelectedCustomerId(editInvoice.customer_id || '');
      setCustomerDetails(editInvoice.customer_snapshot);
      setItems(editInvoice.items || []);
      setNotes(editInvoice.notes || '');
      setTerms(editInvoice.terms_conditions || '');
    } else {
      // Auto-increment logic
      const prefix = type === 'GST' ? 'GST-' : 'BILL-';
      const year = new Date().getFullYear();
      
      const filtered = invoices.filter(inv => inv.invoice_number.startsWith(`${prefix}${year}-`));
      let nextNum = 1;
      
      if (filtered.length > 0) {
        const numbers = filtered.map(inv => {
          const parts = inv.invoice_number.split('-');
          const lastPart = parts[parts.length - 1];
          return parseInt(lastPart) || 0;
        });
        nextNum = Math.max(...numbers) + 1;
      }
      
      const paddedNum = String(nextNum).padStart(4, '0');
      setInvoiceNumber(`${prefix}${year}-${paddedNum}`);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setPaymentMode('UPI');
      setPaymentStatus('Unpaid');
      setSelectedCustomerId('');
      setCustomerDetails(null);
      setItems([
        { product_name: '', description: '', hsn_code: '', quantity: 1, unit: 'PCS', rate: 0, discount_pct: 0, gst_rate: type === 'GST' ? 18 : 0, cgst_rate: type === 'GST' ? 9 : 0, sgst_rate: type === 'GST' ? 9 : 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, amount: 0 }
      ]);
    }
  }, [editInvoice, invoices, type]);

  // Auto-generate UPI QR code whenever UPI ID or grand total changes
  useEffect(() => {
    if (type !== 'Non-GST' || !profile?.upi_id) {
      setUpiQrDataUrl('');
      return;
    }
    const sellerProfile = profile || { state: '' } as typeof profile;
    const grandTotal = calculateInvoiceTotals(items, sellerProfile!, placeOfSupply).grand_total;
    const upiString = `upi://pay?pa=${encodeURIComponent(profile.upi_id)}&pn=${encodeURIComponent(profile.business_name || '')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoiceNumber}`)}`.trim();
    QRCode.toDataURL(upiString, {
      width: 120,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(url => setUpiQrDataUrl(url))
      .catch(() => setUpiQrDataUrl(''));
  }, [profile?.upi_id, profile?.business_name, items, type, invoiceNumber, placeOfSupply]);

  // Handle customer selection change
  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setCustomerDetails(cust);
      setPlaceOfSupply(cust.state);
    } else {
      setCustomerDetails(null);
    }
  };

  // Create Customer Inline Shortcut
  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile || !newCustAddress) {
      showToast('Name, mobile and address are required.', 'danger');
      return;
    }
    
    try {
      const cust = await addCustomer({
        name: newCustName,
        mobile: newCustMobile,
        address: newCustAddress,
        city: 'Mumbai',
        state: 'Maharashtra',
        state_code: '27',
        country: 'India'
      });
      setSelectedCustomerId(cust.id);
      setCustomerDetails(cust);
      setPlaceOfSupply(cust.state);
      setIsCustomerModalOpen(false);
      setNewCustName('');
      setNewCustMobile('');
      setNewCustAddress('');
    } catch (err: any) {
      showToast(err.message, 'danger');
    }
  };

  // Product Selection auto-fill
  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    updateItemField(index, {
      product_id: prod.id,
      product_name: prod.name,
      description: prod.description || '',
      hsn_code: prod.hsn_code || '',
      unit: prod.unit,
      rate: Number(prod.selling_price) || 0,
      gst_rate: type === 'GST' ? (Number(prod.gst_rate) || 0) : 0,
      cgst_rate: type === 'GST' ? (Number(prod.cgst_rate) || 0) : 0,
      sgst_rate: type === 'GST' ? (Number(prod.sgst_rate) || 0) : 0
    });
  };

  // Update item field
  const updateItemField = (index: number, fields: Partial<InvoiceItem>) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ...fields
      };
      return updated;
    });
  };

  // Table items modifiers
  const addItemRow = () => {
    setItems(prev => [...prev, {
      product_name: '', description: '', hsn_code: '', quantity: 1, unit: 'PCS', rate: 0, discount_pct: 0, gst_rate: type === 'GST' ? 18 : 0, cgst_rate: type === 'GST' ? 9 : 0, sgst_rate: type === 'GST' ? 9 : 0, cgst_amount: 0, sgst_amount: 0, igst_amount: 0, amount: 0
    }]);
  };

  const deleteItemRow = (index: number) => {
    if (items.length === 1) {
      showToast('Invoice must contain at least one item.', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const duplicateItemRow = (index: number) => {
    setItems(prev => {
      const duplicated = { ...prev[index] };
      return [...prev, duplicated];
    });
  };

  // Calculate calculations
  const sellerObj = profile || {
    business_name: 'Your Company Name',
    address: 'Configure Business Address in Settings',
    city: 'Mumbai',
    state: 'Maharashtra',
    state_code: '27',
    phone: '9999999999'
  };

  const totals = calculateInvoiceTotals(items, sellerObj, placeOfSupply);
  const totalDiscount = totals.items.reduce((s: number, i: any) => s + i.rate * i.quantity * i.discount_pct / 100, 0);

  // Submit / Save handler
  const handleSaveInvoice = async (isDraft: boolean) => {
    if (!profile) {
      showToast('Please configure your Business Profile in Settings first.', 'danger');
      return;
    }
    if (!customerDetails) {
      showToast('Please select or create a customer.', 'danger');
      return;
    }
    if (items.some(item => !item.product_name || item.rate <= 0 || item.quantity <= 0)) {
      showToast('Please fill all item names, rates, and quantities.', 'danger');
      return;
    }

    const invoicePayload: Omit<Invoice, 'id'> & { isDraft?: boolean } = {
      invoice_number: invoiceNumber,
      invoice_type: type,
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      payment_mode: paymentMode,
      payment_status: isDraft ? 'Unpaid' : paymentStatus,
      place_of_supply: placeOfSupply,
      reverse_charge: reverseCharge,
      customer_id: selectedCustomerId,
      customer_snapshot: customerDetails,
      seller_snapshot: profile,
      subtotal: totals.subtotal,
      cgst_total: totals.cgst_total,
      sgst_total: totals.sgst_total,
      igst_total: totals.igst_total,
      round_off: totals.round_off,
      grand_total: totals.grand_total,
      notes,
      terms_conditions: terms,
      items: totals.items,
      isDraft
    };

    try {
      if (editInvoice && editInvoice.id) {
        await updateInvoice(editInvoice.id, invoicePayload);
      } else {
        await addInvoice(invoicePayload);
      }
      setSelectedInvoiceIdForEdit(null);
      setActivePage('invoice-history');
    } catch (err: any) {
      showToast(err.message, 'danger');
    }
  };

  // Print via PDF
  const handlePrint = () => {
    const data = getInvoiceData();
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = 20;
    const L = 12, R = 198, C = 105;
    const dowN = (h = 5) => { y += h; };
    const hr = () => { y += 2; pdf.line(L, y, R, y); y += 4; };
    const bold = (t: string, x: number, y: number, opts?: any) => { pdf.setFont('helvetica', 'bold'); pdf.text(t, x, y, opts); pdf.setFont('helvetica', 'normal'); };
    const s = data.customer_snapshot;
    const sel = data.seller_snapshot;

    const isGst = type === 'GST';
    const totalDiscount = totals.items.reduce((s: number, i: any) => s + i.rate * i.quantity * i.discount_pct / 100, 0);

    // ───── 1. HEADER ─────
    pdf.setFontSize(10);
    bold(sel.business_name, L, y);
    pdf.setFontSize(7);
    y += 4;
    const aLines = pdf.splitTextToSize(`${sel.address}, ${sel.city}, ${sel.state}`, 80);
    pdf.text(aLines, L, y); y += aLines.length * 3;
    pdf.text(`Phone: ${sel.phone}`, L, y); y += 3;
    if (profile?.email) { pdf.text(`Email: ${profile.email}`, L, y); y += 3; }
    if (profile?.gstin) { pdf.setFont('helvetica', 'bold'); pdf.text(`GSTIN: ${profile.gstin}`, L, y); pdf.setFont('helvetica', 'normal'); y += 3; }
    const leftBot = y;

    pdf.setFontSize(16);
    bold(isGst ? 'TAX INVOICE' : 'CASH MEMO', C, 20);
    let my = 22;
    if (isGst) { pdf.setFontSize(7); pdf.text('Original', C, my, { align: 'center' }); my += 5; }
    pdf.setFontSize(8);
    pdf.text(`${isGst ? 'Invoice' : 'Bill'} No: ${invoiceNumber}`, R, my, { align: 'right' }); my += 4;
    pdf.text(`Date: ${new Date(invoiceDate).toLocaleDateString('en-IN')}`, R, my, { align: 'right' }); my += 4;
    if (dueDate) { pdf.text(`Due Date: ${new Date(dueDate).toLocaleDateString('en-IN')}`, R, my, { align: 'right' }); my += 4; }
    if (isGst) pdf.text(`Place of Supply: ${placeOfSupply}`, R, my, { align: 'right' });

    y = Math.max(leftBot, my + 4);
    hr();

    // ───── 2. BILL FROM / BILL TO ─────
    pdf.setFontSize(7.5);
    bold('Bill From', L, y);
    bold('Bill To', C + 5, y);
    y += 4;

    const bfY = y;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sel.business_name, L, bfY);
    pdf.setFont('helvetica', 'normal');
    let bf = bfY + 3.5;
    if (profile?.gstin) { pdf.text(`GSTIN: ${profile.gstin}`, L, bf); bf += 3; }
    const bfA = pdf.splitTextToSize(`${sel.address}, ${sel.city}, ${sel.state}`, 80);
    pdf.text(bfA, L, bf); bf += bfA.length * 3;
    pdf.text(`Phone: ${sel.phone}`, L, bf); bf += 3;

    pdf.setFont('helvetica', 'bold');
    pdf.text(s.name, C + 5, bfY);
    pdf.setFont('helvetica', 'normal');
    let bt = bfY + 3.5;
    if (s.gstin) { pdf.text(`GSTIN: ${s.gstin}`, C + 5, bt); bt += 3; }
    const btA = pdf.splitTextToSize(`${s.address || ''}, ${s.city || ''}, ${s.state || ''}`, 80);
    pdf.text(btA, C + 5, bt); bt += btA.length * 3;
    pdf.text(`Phone: ${s.mobile || ''}`, C + 5, bt); bt += 3;
    if (s.email) pdf.text(`Email: ${s.email}`, C + 5, bt);

    y = Math.max(bf, bt) + 1;
    hr();

    // ───── 3. ITEMS TABLE ─────
    pdf.setFontSize(7.5);
    const hdr = isGst
      ? `#  Item                         HSN    Qty  Price  GST%     Amount`
      : `#  Item                                  Qty  Price     Amount`;
    pdf.setFont('helvetica', 'bold');
    pdf.text(hdr, L, y); dowN(4.5);
    pdf.setFont('helvetica', 'normal');

    totals.items.forEach((item: any, i: number) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const amt = item.rate * (1 - item.discount_pct / 100) * item.quantity;
      const n = (item.product_name || '').padEnd(28, ' ').slice(0, 28);
      const q = String(item.quantity).padStart(5, ' ');
      const r = item.rate.toFixed(2).padStart(7, ' ');
      const a = amt.toFixed(2).padStart(9, ' ');
      if (isGst) {
        const h = (item.hsn_code || '-').padEnd(6, ' ');
        const g = String(item.gst_rate).padStart(4, ' ');
        pdf.text(`${i + 1}. ${n} ${h} ${q} ${r} ${g}%  ${a}`, L, y);
      } else {
        pdf.text(`${i + 1}. ${n} ${q} ${r}  ${a}`, L, y);
      }
      dowN(4.5);
    });
    hr();

    // ───── 4. TOTALS ─────
    pdf.setFontSize(9);
    const rx = R;
    if (isGst) {
      pdf.text('Taxable Amount', rx - 30, y, { align: 'right' });
      pdf.text(`\u20B9${totals.subtotal.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
      if (!isIGST && totals.cgst_total > 0) {
        pdf.text('CGST (9%)', rx - 30, y, { align: 'right' });
        pdf.text(`\u20B9${totals.cgst_total.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
      }
      if (!isIGST && totals.sgst_total > 0) {
        pdf.text('SGST (9%)', rx - 30, y, { align: 'right' });
        pdf.text(`\u20B9${totals.sgst_total.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
      }
      if (isIGST && totals.igst_total > 0) {
        pdf.text('IGST', rx - 30, y, { align: 'right' });
        pdf.text(`\u20B9${totals.igst_total.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
      }
    } else {
      pdf.text('Subtotal', rx - 30, y, { align: 'right' });
      pdf.text(`\u20B9${totals.subtotal.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
    }
    if (totalDiscount > 0) {
      pdf.text('Discount', rx - 30, y, { align: 'right' });
      pdf.text(`-\u20B9${totalDiscount.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
    }
    if (!isGst) {
      pdf.text('Delivery', rx - 30, y, { align: 'right' });
      pdf.text('\u20B90.00', rx, y, { align: 'right' }); dowN(5);
    }
    if (totals.round_off !== 0) {
      pdf.text('Round Off', rx - 30, y, { align: 'right' });
      pdf.text(`${totals.round_off.toFixed(2)}`, rx, y, { align: 'right' }); dowN(5);
    }
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(isGst ? 'GRAND TOTAL' : 'TOTAL', rx - 30, y, { align: 'right' });
    pdf.text(`\u20B9${totals.grand_total.toFixed(2)}`, rx, y, { align: 'right' }); dowN(6);
    pdf.setFont('helvetica', 'normal');

    hr();

    // ───── 5. AMOUNT IN WORDS ─────
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount in Words:', L, y);
    pdf.setFont('helvetica', 'normal');
    const ntw = pdf.splitTextToSize(numberToWords(totals.grand_total), 170);
    pdf.text(ntw, L + 30, y); dowN(ntw.length * 3 + 2);
    hr();

    // ───── 6. BANK DETAILS + QR ─────
    const qrTop = y;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bank Details', L, y); y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Bank Name : ${profile?.bank_name || '-'}`, L, y); y += 3.5;
    pdf.text(`A/C No    : ${profile?.account_number || '-'}`, L, y); y += 3.5;
    pdf.text(`IFSC      : ${profile?.ifsc_code || '-'}`, L, y); y += 3.5;
    if (profile?.upi_id) { pdf.text(`UPI ID    : ${profile.upi_id}`, L, y); y += 3.5; }
    const bankEnd = y;

    if (upiQrDataUrl) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan & Pay', R - 20, qrTop + 1, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.addImage(upiQrDataUrl, 'PNG', R - 40, qrTop + 4, 28, 28);
    }

    y = Math.max(bankEnd, qrTop + 36);
    hr();

    // ───── 7. TERMS & SIGNATURE ─────
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms & Conditions', L, y);
    pdf.setFont('helvetica', 'normal');
    const tLines = pdf.splitTextToSize(terms, 90);
    pdf.text(tLines, L, y + 3);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`For ${sel.business_name}`, R, y, { align: 'right' });
    y += 10;
    pdf.line(R - 40, y, R, y);
    y += 3;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Authorized Signature', R, y, { align: 'right' });

    window.open(URL.createObjectURL(pdf.output('blob')), '_blank');
  };

  const getInvoiceData = (): Invoice => ({
    id: editInvoice?.id || `inv_${Date.now()}`,
    invoice_number: invoiceNumber,
    invoice_type: type,
    invoice_date: invoiceDate,
    due_date: dueDate || undefined,
    payment_mode: paymentMode,
    payment_status: paymentStatus,
    place_of_supply: placeOfSupply,
    reverse_charge: reverseCharge,
    customer_id: customerDetails?.id || '',
    customer_snapshot: customerDetails || { id: '', name: '', address: '', city: '', state: '', state_code: '', mobile: '' },
    seller_snapshot: sellerObj,
    subtotal: totals.subtotal,
    cgst_total: totals.cgst_total,
    sgst_total: totals.sgst_total,
    igst_total: totals.igst_total,
    round_off: totals.round_off,
    grand_total: totals.grand_total,
    notes,
    terms_conditions: terms,
    items: totals.items,
  });

  const isIGST = type === 'GST' && totals.igst_total > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Settings warning */}
      {!profile && (
        <div className="flex gap-3.5 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold no-print">
          <Info className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <span>Business Profile is not set up. Please click </span>
            <button onClick={() => setActivePage('settings')} className="text-primary underline font-bold">here to set up Business Profile</button>
            <span> before creating invoices so that your billing details appear correctly.</span>
          </div>
        </div>
      )}

      {/* Editor Layout: Form and Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Editor Panel */}
        <div className={`xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-6 no-print ${previewTab === 'preview' ? 'hidden xl:block' : 'block'}`}>
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-850">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setSelectedInvoiceIdForEdit(null);
                  setActivePage('dashboard');
                }}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400">
                {editInvoice ? 'Edit' : 'Create'} {type} Invoice
              </h2>
            </div>
            
            {/* View switcher for smaller devices */}
            <button
              onClick={() => setPreviewTab('preview')}
              className="xl:hidden h-9 px-3 rounded-lg bg-slate-50 text-text-primary hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span>Preview Layout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Invoice Metadata */}
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
              >
                <option value="Unpaid">Unpaid / Uncollected</option>
                <option value="Paid">Paid / Collected</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-850">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Customer Details</label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
              >
                <UserPlus className="h-4.5 w-4.5" />
                <span>Quick Add</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <select
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
                  disabled={!selectedCustomerId}
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {customerDetails && (
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs space-y-1 font-semibold text-text-secondary dark:text-slate-400">
                <p className="text-text-primary dark:text-slate-200 font-bold">{customerDetails.name}</p>
                {customerDetails.company_name && <p className="flex items-center gap-1"><Building className="h-3.5 w-3.5 text-text-light" /> {customerDetails.company_name}</p>}
                <p>{customerDetails.address}, {customerDetails.city}, {customerDetails.state}</p>
                <p>Mobile: {customerDetails.mobile}</p>
                {customerDetails.gstin && <p className="text-blue-600 dark:text-blue-400">GSTIN: {customerDetails.gstin}</p>}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider">Invoice Items</h3>
            
            <div className="space-y-3.5">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end relative"
                >
                  {/* Select Product */}
                  <div className="sm:col-span-5">
                    <label className="block text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">Select Product / Item Name *</label>
                    <select
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250 mb-1.5"
                    >
                      <option value="">-- Choose Product catalog --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Item Custom Name"
                      value={item.product_name}
                      onChange={(e) => updateItemField(index, { product_name: e.target.value })}
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250 font-bold"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">Qty</label>
                    <input
                      type="number"
                      required
                      min={0.001}
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItemField(index, { quantity: Number(e.target.value) || 0 })}
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItemField(index, { rate: Number(e.target.value) || 0 })}
                      className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250 font-bold"
                    />
                  </div>

                  {/* GST Column (GST Editor only) */}
                  {type === 'GST' ? (
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-text-secondary dark:text-slate-500 uppercase tracking-wider mb-1">GST %</label>
                      <select
                        value={item.gst_rate}
                        onChange={(e) => updateItemField(index, { gst_rate: Number(e.target.value) || 0 })}
                        className="w-full h-10 px-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary dark:text-slate-250"
                      >
                        <option value={0}>0%</option>
                        <option value={3}>3%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  ) : null}

                  {/* Extra Options Panel (HSN, Discount) */}
                  <div className="sm:col-span-12 grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="HSN (Optional)"
                      value={item.hsn_code}
                      onChange={(e) => updateItemField(index, { hsn_code: e.target.value })}
                      className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-lg text-text-secondary dark:text-slate-300"
                    />
                    <input
                      type="number"
                      placeholder="Discount %"
                      min={0}
                      max={100}
                      value={item.discount_pct || ''}
                      onChange={(e) => updateItemField(index, { discount_pct: Number(e.target.value) || 0 })}
                      className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-lg text-text-secondary dark:text-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g. PCS)"
                      value={item.unit}
                      onChange={(e) => updateItemField(index, { unit: e.target.value })}
                      className="h-9 px-3 text-xs border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 rounded-lg text-text-secondary dark:text-slate-300"
                    />
                  </div>

                  {/* Row Actions */}
                  <div className="absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto sm:col-span-12 flex justify-end gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => duplicateItemRow(index)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-text-secondary dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      title="Duplicate Row"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItemRow(index)}
                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 transition-colors"
                      title="Delete Row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addItemRow}
              className="h-10 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 text-text-secondary hover:text-primary dark:border-slate-750 dark:hover:border-slate-650 flex items-center justify-center gap-1.5 w-full text-xs font-bold transition-all duration-200"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Item Line</span>
            </button>
          </div>

          {/* Terms & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Remarks / Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 text-text-primary dark:text-slate-250"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-wider mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 text-text-primary dark:text-slate-250"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-slate-50 dark:border-slate-850">
            <button
              type="button"
              onClick={() => handleSaveInvoice(true)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveInvoice(false)}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs shadow-soft hover:shadow-premium transition-all duration-200 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save & Register</span>
            </button>
          </div>
        </div>

        {/* Live A4 Print Preview Panel */}
        <div className={`xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-soft space-y-6 overflow-x-auto w-full ${previewTab === 'edit' ? 'hidden xl:block' : 'block'}`}>
          <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-850 no-print">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary dark:text-slate-400">A4 Live Print View</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="h-9 px-3 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-soft"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button
                onClick={handlePrint}
                className="h-9 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-text-primary dark:bg-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setPreviewTab('edit')}
                className="xl:hidden h-9 px-3 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" />
                <span>Edit fields</span>
              </button>
            </div>
          </div>

          {/* Printable Invoice Page Container */}
          <div ref={printRef} className="bg-white text-black p-6 border border-slate-200 rounded-xl max-w-2xl mx-auto shadow-sm text-xs font-sans print-container select-text">
            {/* ────────────── HEADER ────────────── */}
            <div className="flex justify-between items-start border-b border-black pb-3">
              <div className="space-y-0.5">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="h-10 object-contain mb-1 max-w-[120px]" />
                ) : (
                  <div className="font-extrabold text-sm tracking-wider uppercase text-slate-800">{sellerObj.business_name}</div>
                )}
                <div className="font-bold text-sm">{sellerObj.business_name}</div>
                <div className="text-[9px] leading-relaxed max-w-[180px]">{sellerObj.address}, {sellerObj.city}, {sellerObj.state}</div>
                <div className="text-[9px]">Phone: {sellerObj.phone} {sellerObj.alt_phone ? `/ ${sellerObj.alt_phone}` : ''}</div>
                {profile?.email && <div className="text-[9px]">Email: {profile.email}</div>}
                {profile?.gstin && <div className="text-[9px] font-bold">GSTIN: {profile.gstin}</div>}
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold uppercase tracking-wider border-b border-black pb-1 mb-1">
                  {type === 'GST' ? 'TAX INVOICE' : 'CASH MEMO'}
                </div>
                {type === 'GST' && <div className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Original</div>}
                <div className="text-[9px] leading-relaxed">
                  {type === 'GST' ? 'Invoice' : 'Bill'} No: <strong>{invoiceNumber}</strong><br />
                  Date: {new Date(invoiceDate).toLocaleDateString('en-IN')}<br />
                  {dueDate && <>Due Date: {new Date(dueDate).toLocaleDateString('en-IN')}<br /></>}
                  {type === 'GST' && <>Place of Supply: <strong>{placeOfSupply}</strong><br /></>}
                  {type === 'GST' && reverseCharge && <>Reverse Charge: <strong>Yes</strong><br /></>}
                </div>
              </div>
            </div>

            {/* ────────────── BILL FROM / BILL TO ────────────── */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-black">
              <div>
                <div className="font-bold uppercase text-[9px] mb-1">Bill From</div>
                <div className="text-[9px] leading-relaxed">
                  <div className="font-bold">{sellerObj.business_name}</div>
                  {profile?.gstin && <div>GSTIN: {profile.gstin}</div>}
                  <div>{sellerObj.address}, {sellerObj.city}, {sellerObj.state}</div>
                  <div>Phone: {sellerObj.phone}</div>
                </div>
              </div>
              <div className="border-l border-black pl-3">
                <div className="font-bold uppercase text-[9px] mb-1">Bill To</div>
                <div className="text-[9px] leading-relaxed">
                  <div className="font-bold">{customerDetails?.name || 'Customer Name'}</div>
                  {customerDetails?.gstin && <div>GSTIN: {customerDetails.gstin}</div>}
                  <div>{customerDetails?.address || ''}, {customerDetails?.city || ''}, {customerDetails?.state || ''}</div>
                  <div>Phone: {customerDetails?.mobile || ''}</div>
                  {customerDetails?.email && <div>Email: {customerDetails.email}</div>}
                </div>
              </div>
            </div>

            {/* ────────────── ITEMS TABLE ────────────── */}
            <div className="py-3">
              <table className="w-full text-left border-collapse border border-black text-[9px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase text-[8px]">
                    <th className="border-r border-black p-1 text-center w-6">#</th>
                    <th className="border-r border-black p-1">Item</th>
                    {type === 'GST' && <th className="border-r border-black p-1 text-center w-10">HSN</th>}
                    <th className="border-r border-black p-1 text-right w-8">Qty</th>
                    <th className="border-r border-black p-1 text-right w-12">Price</th>
                    {type === 'GST' && <th className="border-r border-black p-1 text-right w-10">GST %</th>}
                    <th className="p-1 text-right w-14">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border-r border-black p-1 text-center">{idx + 1}</td>
                      <td className="border-r border-black p-1 font-semibold">
                        {item.product_name}
                        {item.description && <div className="text-[7px] font-normal text-gray-600">{item.description}</div>}
                      </td>
                      {type === 'GST' && <td className="border-r border-black p-1 text-center">{item.hsn_code || '-'}</td>}
                      <td className="border-r border-black p-1 text-right">{item.quantity}</td>
                      <td className="border-r border-black p-1 text-right">\u20B9{item.rate.toFixed(2)}</td>
                      {type === 'GST' && <td className="border-r border-black p-1 text-right">{item.gst_rate}%</td>}
                      <td className="p-1 text-right font-bold">\u20B9{(item.rate * (1 - item.discount_pct / 100) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ────────────── TOTALS PANEL ────────────── */}
            <div className="flex justify-end mb-3">
              <table className="text-[9px] w-52">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="py-1 pr-4 text-right font-semibold">{type === 'GST' ? 'Taxable Amount' : 'Subtotal'}</td>
                    <td className="py-1 text-right font-bold">\u20B9{totals.subtotal.toFixed(2)}</td>
                  </tr>
                  {type === 'GST' && !isIGST && totals.cgst_total > 0 && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">CGST (9%)</td>
                      <td className="py-1 text-right">\u20B9{totals.cgst_total.toFixed(2)}</td>
                    </tr>
                  )}
                  {type === 'GST' && !isIGST && totals.sgst_total > 0 && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">SGST (9%)</td>
                      <td className="py-1 text-right">\u20B9{totals.sgst_total.toFixed(2)}</td>
                    </tr>
                  )}
                  {type === 'GST' && isIGST && totals.igst_total > 0 && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">IGST</td>
                      <td className="py-1 text-right">\u20B9{totals.igst_total.toFixed(2)}</td>
                    </tr>
                  )}
                  {totalDiscount > 0 && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">Discount</td>
                      <td className="py-1 text-right">-\u20B9{totalDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                  {type !== 'GST' && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">Delivery</td>
                      <td className="py-1 text-right">\u20B90.00</td>
                    </tr>
                  )}
                  {totals.round_off !== 0 && (
                    <tr className="border-b border-black">
                      <td className="py-1 pr-4 text-right font-semibold">Round Off</td>
                      <td className="py-1 text-right">{totals.round_off.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="font-extrabold text-[11px]">
                    <td className="py-1.5 pr-4 text-right uppercase">{type === 'GST' ? 'Grand Total' : 'TOTAL'}</td>
                    <td className="py-1.5 text-right">\u20B9{totals.grand_total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ────────────── AMOUNT IN WORDS ────────────── */}
            <div className="py-2 border-t border-black">
              <span className="font-bold text-[8px] uppercase tracking-wide">Amount in Words: </span>
              <span className="font-semibold italic text-[9px]">{numberToWords(totals.grand_total)}</span>
            </div>

            {/* ────────────── BANK DETAILS + QR CODE ────────────── */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-black">
              <div className="space-y-0.5 text-[8px] text-gray-700">
                <div className="font-bold text-black uppercase text-[9px] mb-0.5">Bank Details</div>
                <div>Bank Name : <strong className="text-black">{profile?.bank_name || '-'}</strong></div>
                <div>A/C No   : <strong className="text-black">{profile?.account_number || '-'}</strong></div>
                <div>IFSC     : <strong className="text-black">{profile?.ifsc_code || '-'}</strong></div>
                {profile?.upi_id && <div>UPI ID   : <strong className="text-black">{profile.upi_id}</strong></div>}
              </div>
              <div className="flex flex-col items-end text-right">
                {upiQrDataUrl && (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="font-bold text-black uppercase text-[8px] tracking-wide">Scan & Pay</div>
                    <img src={upiQrDataUrl} alt="UPI QR" className="w-16 h-16 border border-black rounded" />
                    <div className="text-[6px] text-gray-500 max-w-[80px] break-all">{profile?.upi_id}</div>
                  </div>
                )}
                {!upiQrDataUrl && profile?.upi_id && (
                  <div className="text-[8px] text-gray-500 italic">UPI: {profile.upi_id}</div>
                )}
              </div>
            </div>

            {/* ────────────── TERMS & SIGNATURE ────────────── */}
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <div className="font-bold uppercase text-[8px] mb-0.5">Terms &amp; Conditions</div>
                <div className="text-[8px] text-gray-600 leading-relaxed whitespace-pre-line">{terms}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="text-right">
                  <div className="text-[8px] text-gray-500 font-semibold">For <strong className="text-black">{sellerObj.business_name}</strong></div>
                  <div className="w-28 border-b border-dashed border-gray-400 mt-6 mb-0.5" />
                  <div className="text-[9px] font-bold">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        invoice={getInvoiceData()}
        items={totals.items}
      />

      {/* Quick Add Customer Dialog */}
      <Dialog
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Quick Add Customer"
      >
        <form onSubmit={handleQuickCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-text-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Mobile *</label>
            <input
              type="tel"
              required
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              className="w-full h-10 px-3.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-text-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Billing Address *</label>
            <textarea
              required
              rows={2}
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              className="w-full p-3 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-text-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-750 text-text-secondary hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs shadow-soft"
            >
              Add Customer
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
