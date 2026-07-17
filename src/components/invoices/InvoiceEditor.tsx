import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceItem, Customer, PaymentMode, PaymentStatus } from '../../types';
import { calculateInvoiceTotals, numberToWords, INDIAN_STATES } from '../../utils/gstEngine';
import { Dialog } from '../ui/Dialog';
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
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit'); // for mobile toggling
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

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

  // Print Preview
  const handlePrint = () => {
    window.print();
  };

  const handleSharePDF = async () => {
    showToast('Generating PDF...', 'info');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 190;
    let y = 15;
    const ln = () => { y += 6; };
    const hr = () => { y += 3; pdf.line(10, y, 200, y); ln(); };

    pdf.setFontSize(16);
    pdf.text('TAX INVOICE', 105, y, { align: 'center' }); ln(); hr();
    pdf.setFontSize(10);
    pdf.text(`Invoice: ${invoiceNumber}`, 10, y); ln();
    pdf.text(`Date: ${new Date(invoiceDate).toLocaleDateString('en-IN')}`, 10, y); ln();
    pdf.text(`Place of Supply: ${placeOfSupply}`, 10, y); ln(); hr();

    pdf.setFontSize(12);
    pdf.text('Seller', 10, y); ln();
    pdf.setFontSize(10);
    const sell = sellerObj;
    pdf.text(`${sell.business_name}`, 10, y); ln();
    pdf.text(`${sell.address}, ${sell.city}, ${sell.state}`, 10, y); ln();
    pdf.text(`Phone: ${sell.phone}`, 10, y); ln();
    if (profile?.gstin) pdf.text(`GSTIN: ${profile.gstin}`, 10, y); ln(); hr();

    pdf.setFontSize(12);
    pdf.text('Customer', 10, y); ln();
    pdf.setFontSize(10);
    if (customerDetails) {
      pdf.text(`${customerDetails.name}`, 10, y); ln();
      if (customerDetails.company_name) { pdf.text(customerDetails.company_name, 10, y); ln(); }
      pdf.text(`${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state}`, 10, y); ln();
      pdf.text(`Mobile: ${customerDetails.mobile}`, 10, y); ln();
      if (customerDetails.gstin) pdf.text(`GSTIN: ${customerDetails.gstin}`, 10, y);
    }
    ln(); hr();

    pdf.setFontSize(12);
    pdf.text('Items', 10, y); ln();
    pdf.setFontSize(9);
    pdf.text('#  Item                         Qty  Rate     Disc   Amount', 10, y); ln();
    pdf.setFontSize(8);
    totals.items.forEach((item, i) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const line = `${i + 1}. ${(item.product_name || '').padEnd(28, ' ').slice(0, 28)} ${String(item.quantity).padStart(4, ' ')} ${item.rate.toFixed(2).padStart(7, ' ')} ${item.discount_pct ? item.discount_pct + '%' : '    '} ${item.amount.toFixed(2).padStart(8, ' ')}`;
      pdf.text(line, 10, y); ln();
    });
    hr();

    pdf.setFontSize(10);
    pdf.text(`Subtotal:       ₹${totals.subtotal.toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (totals.cgst_total > 0) pdf.text(`CGST:           ₹${totals.cgst_total.toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (totals.sgst_total > 0) pdf.text(`SGST:           ₹${totals.sgst_total.toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (totals.igst_total > 0) pdf.text(`IGST:           ₹${totals.igst_total.toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (totals.round_off !== 0) pdf.text(`Round Off:      ₹${totals.round_off.toFixed(2)}`, 130, y, { align: 'right' }); ln();
    pdf.setFontSize(14);
    pdf.text(`Grand Total:    ₹${totals.grand_total.toFixed(2)}`, 130, y, { align: 'right' }); ln();

    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const waText = encodeURIComponent([
      `*INVOICE: ${invoiceNumber}*`,
      `Customer: ${customerDetails?.name || 'N/A'}`,
      `Amount: ₹${totals.grand_total.toFixed(2)}`,
      `Date: ${new Date(invoiceDate).toLocaleDateString('en-IN')}`,
      ``,
      `📎 PDF has been downloaded — please attach it here.`,
      `Powered by InvoiceFlow`
    ].join('\n'));

    window.open(`https://wa.me/?text=${waText}`, '_blank');

    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast(`PDF downloaded & WhatsApp opened! Attach the PDF file to send.`, 'success');
  };

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
                onClick={handleSharePDF}
                className="h-9 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400 text-xs font-bold flex items-center gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                <span>PDF & WhatsApp</span>
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
            {/* Header: Company Details & Invoice Info */}
            <div className="flex justify-between items-start border-b border-black pb-4">
              <div className="space-y-1">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="h-10 object-contain mb-2 max-w-[120px]" />
                ) : (
                  <div className="font-extrabold text-base tracking-wider uppercase text-slate-800">{sellerObj.business_name}</div>
                )}
                <div className="font-semibold">{sellerObj.business_name}</div>
                <div className="text-[10px] leading-relaxed max-w-xs">{sellerObj.address}, {sellerObj.city}, {sellerObj.state}</div>
                <div className="text-[10px]">Phone: {sellerObj.phone} {sellerObj.alt_phone ? `/ ${sellerObj.alt_phone}` : ''}</div>
                {profile?.email && <div className="text-[10px]">Email: {profile.email}</div>}
                {profile?.gstin && <div className="text-[10px] font-bold">GSTIN: {profile.gstin}</div>}
                {profile?.pan && <div className="text-[10px] font-bold">PAN: {profile.pan}</div>}
              </div>

              <div className="text-right space-y-1">
                <div className="text-lg font-extrabold uppercase tracking-wide border-b border-black pb-1 mb-2">
                  TAX INVOICE
                </div>
                <div>Invoice No: <strong>{invoiceNumber}</strong></div>
                <div>Date: {new Date(invoiceDate).toLocaleDateString('en-IN')}</div>
                {dueDate && <div>Due Date: {new Date(dueDate).toLocaleDateString('en-IN')}</div>}
                <div>Supply Place: <strong>{placeOfSupply}</strong></div>
                {type === 'GST' && reverseCharge && <div>Reverse Charge: <strong>Yes</strong></div>}
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-black">
              <div>
                <div className="font-bold uppercase text-[10px] mb-1">Details of Receiver (Billed To):</div>
                <div className="font-bold">{customerDetails?.name || 'Customer Name'}</div>
                {customerDetails?.company_name && <div className="font-semibold">{customerDetails.company_name}</div>}
                <div className="text-[10px] leading-relaxed">{customerDetails?.address || 'Customer Address'}, {customerDetails?.city || 'City'}, {customerDetails?.state || 'State'}</div>
                <div className="text-[10px]">Mobile: {customerDetails?.mobile || 'N/A'}</div>
                {customerDetails?.gstin && <div className="font-bold">GSTIN: {customerDetails.gstin}</div>}
              </div>
              <div className="border-l border-black pl-4">
                <div className="font-bold uppercase text-[10px] mb-1">Payment & Shipping:</div>
                <div>Payment Method: <strong>{paymentMode}</strong></div>
                <div>Payment Status: <strong className="uppercase">{paymentStatus}</strong></div>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-4 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase text-[9px]">
                    <th className="border-r border-black p-1.5 text-center w-8">#</th>
                    <th className="border-r border-black p-1.5">Description of Item</th>
                    <th className="border-r border-black p-1.5 text-center">HSN</th>
                    <th className="border-r border-black p-1.5 text-right w-12">Qty</th>
                    <th className="border-r border-black p-1.5 text-center">Unit</th>
                    <th className="border-r border-black p-1.5 text-right w-14">Rate</th>
                    <th className="border-r border-black p-1.5 text-right w-12">Disc %</th>
                    {type === 'GST' ? (
                      <>
                        <th className="border-r border-black p-1.5 text-right w-12">GST %</th>
                        {isIGST ? (
                          <th className="border-r border-black p-1.5 text-right w-14">IGST</th>
                        ) : (
                          <>
                            <th className="border-r border-black p-1.5 text-right w-14">CGST</th>
                            <th className="border-r border-black p-1.5 text-right w-14">SGST</th>
                          </>
                        )}
                      </>
                    ) : null}
                    <th className="p-1.5 text-right w-16">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border-r border-black p-1.5 text-center">{idx + 1}</td>
                      <td className="border-r border-black p-1.5 font-bold">
                        {item.product_name || 'Product Details'}
                        {item.description && <div className="text-[8px] font-normal text-gray-600 leading-tight">{item.description}</div>}
                      </td>
                      <td className="border-r border-black p-1.5 text-center">{item.hsn_code || '-'}</td>
                      <td className="border-r border-black p-1.5 text-right">{item.quantity}</td>
                      <td className="border-r border-black p-1.5 text-center">{item.unit}</td>
                      <td className="border-r border-black p-1.5 text-right">{item.rate.toFixed(2)}</td>
                      <td className="border-r border-black p-1.5 text-right">{item.discount_pct}%</td>
                      {type === 'GST' ? (
                        <>
                          <td className="border-r border-black p-1.5 text-right">{item.gst_rate}%</td>
                          {isIGST ? (
                            <td className="border-r border-black p-1.5 text-right">{item.igst_amount.toFixed(2)}</td>
                          ) : (
                            <>
                              <td className="border-r border-black p-1.5 text-right">{item.cgst_amount.toFixed(2)}</td>
                              <td className="border-r border-black p-1.5 text-right">{item.sgst_amount.toFixed(2)}</td>
                            </>
                          )}
                        </>
                      ) : null}
                      <td className="p-1.5 text-right font-bold">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  
                  {/* Total Calculations */}
                  <tr className="border-t border-black font-bold">
                    <td colSpan={type === 'GST' ? (isIGST ? 8 : 9) : 7} className="border-r border-black p-1.5 text-right uppercase">Subtotal (Taxable Value):</td>
                    <td className="p-1.5 text-right">{totals.subtotal.toFixed(2)}</td>
                  </tr>
                  {type === 'GST' ? (
                    isIGST ? (
                      <tr className="font-bold text-[9px]">
                        <td colSpan={8} className="border-r border-black p-1.5 text-right uppercase">IGST:</td>
                        <td className="p-1.5 text-right">{totals.igst_total.toFixed(2)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr className="font-bold text-[9px]">
                          <td colSpan={9} className="border-r border-black p-1.5 text-right uppercase">CGST:</td>
                          <td className="p-1.5 text-right">{totals.cgst_total.toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold text-[9px]">
                          <td colSpan={9} className="border-r border-black p-1.5 text-right uppercase">SGST:</td>
                          <td className="p-1.5 text-right">{totals.sgst_total.toFixed(2)}</td>
                        </tr>
                      </>
                    )
                  ) : null}
                  {totals.round_off !== 0 && (
                    <tr className="font-bold text-[9px]">
                      <td colSpan={type === 'GST' ? (isIGST ? 8 : 9) : 7} className="border-r border-black p-1.5 text-right uppercase">Round Off:</td>
                      <td className="p-1.5 text-right">{totals.round_off.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-black font-extrabold text-[11px] bg-slate-50">
                    <td colSpan={type === 'GST' ? (isIGST ? 8 : 9) : 7} className="border-r border-black p-1.5 text-right uppercase tracking-wider">Grand Total (₹):</td>
                    <td className="p-1.5 text-right text-base font-extrabold">{totals.grand_total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Amount in Words */}
            <div className="py-2 border-b border-black">
              <span className="font-bold text-[9px] uppercase tracking-wide mr-1.5">Amount Chargeable (in words):</span>
              <span className="font-semibold italic text-[10px]">{numberToWords(totals.grand_total)}</span>
            </div>

            {/* Bank Details & Signature Panel */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1 font-semibold text-[9px] text-gray-700">
                <div className="font-bold text-black uppercase text-[10px] mb-1">Our Banking Credentials:</div>
                <div>Bank: <strong className="text-black">{profile?.bank_name || '-'}</strong></div>
                <div>Branch: <strong className="text-black">{profile?.branch || '-'}</strong></div>
                <div>Acc No: <strong className="text-black">{profile?.account_number || '-'}</strong></div>
                <div>IFSC: <strong className="text-black">{profile?.ifsc_code || '-'}</strong></div>
                {profile?.upi_id && <div>UPI ID: <strong className="text-black">{profile.upi_id}</strong></div>}

                {/* UPI QR Code — Non-GST bills only */}
                {type === 'Non-GST' && upiQrDataUrl && (
                  <div className="mt-2 flex flex-col items-start gap-0.5">
                    <div className="font-bold text-black uppercase text-[9px] tracking-wide">Scan to Pay (UPI):</div>
                    <img
                      src={upiQrDataUrl}
                      alt="UPI QR Code"
                      className="w-[72px] h-[72px] border border-black rounded"
                    />
                    <div className="text-[7px] text-gray-500 font-medium max-w-[80px] break-all">{profile?.upi_id}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between items-end text-right">
                <div className="space-y-1">
                  <div className="text-[9px] text-gray-500 font-semibold">For <strong>{sellerObj.business_name}</strong></div>
                  <div className="h-12 flex items-center justify-end">
                    {/* Placeholder for Signature */}
                    <div className="w-24 border-b border-dashed border-gray-400 mt-8" />
                  </div>
                  <div className="text-[10px] font-bold">Authorized Signatory</div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-t border-black pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="font-bold uppercase text-[9px] mb-1">Declaration / Terms:</div>
                <div className="text-[9px] text-gray-500 font-semibold leading-relaxed whitespace-pre-line">{terms}</div>
              </div>
              <div className="text-right flex flex-col justify-end text-[9px] text-gray-500 font-medium">
                <span>Invoice generated on computer. Signature may not be required.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
