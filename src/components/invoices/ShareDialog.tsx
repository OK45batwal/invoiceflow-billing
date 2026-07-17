import React from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  FileDown,
  Printer,
  MessageCircle,
  Mail,
  Link,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Invoice } from '../../types';
import { numberToWords } from '../../utils/gstEngine';
import { useApp } from '../../context/AppContext';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  items: Invoice['items'];
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, invoice, items }) => {
  const { showToast } = useApp();
  const isGst = invoice.invoice_type === 'GST';

  // ── Build the PDF (accepts an optional pre-rendered QR data-URL) ─────────
  const generatePdf = (qrDataUrl?: string): jsPDF => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const ML = 14;                   // left margin
    const PW = 210;                  // A4 width
    const W = PW - ML * 2;          // usable width (182)
    const RX = ML + W;              // right edge (196)
    const PH = 297;
    let y = 14;

    const sel = invoice.seller_snapshot || {} as any;
    const cust = invoice.customer_snapshot || {} as any;
    const rows = items || [];
    const isIGST = isGst && Number(invoice.igst_total) > 0;

    const lineAmt = (it: any) =>
      Number(it.rate) * Number(it.quantity) * (1 - (Number(it.discount_pct) || 0) / 100);
    const taxableTotal = rows.reduce((s: number, it: any) => s + lineAmt(it), 0);
    const totalDiscount = rows.reduce((s: number, it: any) =>
      s + Number(it.rate) * Number(it.quantity) * ((Number(it.discount_pct) || 0) / 100), 0);

    const hLine = (clr = 200) => { pdf.setDrawColor(clr); pdf.setLineWidth(0.3); pdf.line(ML, y, RX, y); pdf.setLineWidth(0.2); pdf.setDrawColor(0); };
    const pageGuard = (h = 20) => { if (y + h > PH - 14) { pdf.addPage(); y = 14; } };

    // ═══════════════════════════ HEADER ═══════════════════════════════════
    const hH = 20;
    pdf.setFillColor(15, 23, 42);
    pdf.rect(ML, y, W, hH, 'F');

    // Left: business name + address
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(255);
    pdf.text(sel.business_name || 'Business', ML + 5, y + 7);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(160, 174, 192);
    const addr = [sel.address, sel.city, sel.state].filter(Boolean).join(', ');
    const addrW = pdf.splitTextToSize(addr, W * 0.55);
    addrW.forEach((l: string, i: number) => pdf.text(l, ML + 5, y + 12 + i * 3));

    // Right: invoice type + number + date
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255);
    pdf.text(isGst ? 'TAX INVOICE' : 'BILL / CASH MEMO', RX - 5, y + 7, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(160, 174, 192);
    pdf.text(invoice.invoice_number, RX - 5, y + 12, { align: 'right' });
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, RX - 5, y + 16, { align: 'right' });
    y += hH + 2;

    // Seller details strip
    pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.setFont('helvetica', 'normal');
    const parts: string[] = [];
    if (sel.gstin) parts.push(`GSTIN: ${sel.gstin}`);
    if (sel.phone) parts.push(`Ph: ${sel.phone}`);
    if (sel.email) parts.push(sel.email);
    if (parts.length) pdf.text(parts.join('  |  '), ML, y + 3);
    y += 7;
    hLine(); y += 4;

    // ═══════════════════════════ BILL TO + META ══════════════════════════
    const midX = ML + W * 0.52;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(120);
    pdf.text('BILL TO', ML, y); pdf.text('INVOICE DETAILS', midX, y);
    y += 4;

    // Bill-to
    let lY = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30);
    pdf.text(cust.name || '—', ML, lY); lY += 4.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(80);
    if (cust.company_name) { pdf.text(cust.company_name, ML, lY); lY += 4; }
    if (cust.gstin) { pdf.setFont('helvetica', 'bold'); pdf.text(`GSTIN: ${cust.gstin}`, ML, lY); pdf.setFont('helvetica', 'normal'); lY += 4; }
    const ca = [cust.address, cust.city, cust.state].filter(Boolean).join(', ');
    if (ca) { const cL = pdf.splitTextToSize(ca, W * 0.48); cL.forEach((l: string) => { pdf.text(l, ML, lY); lY += 3.5; }); }
    if (cust.mobile) { pdf.text(`Ph: ${cust.mobile}`, ML, lY); lY += 4; }

    // Meta
    let rY = y;
    const meta: [string, string][] = [
      ['Invoice No', invoice.invoice_number],
      ['Date', new Date(invoice.invoice_date).toLocaleDateString('en-IN')],
      ...(invoice.due_date ? [['Due', new Date(invoice.due_date).toLocaleDateString('en-IN')] as [string,string]] : []),
      ['Payment', invoice.payment_mode || '—'],
      ['Status', (invoice.payment_status || '').toUpperCase()],
      ...(isGst ? [['Supply Place', invoice.place_of_supply] as [string,string]] : []),
    ];
    pdf.setFontSize(7.5);
    meta.forEach(([k, v]) => {
      pdf.setTextColor(100); pdf.setFont('helvetica', 'normal'); pdf.text(k + ':', midX, rY);
      pdf.setTextColor(30); pdf.setFont('helvetica', 'bold'); pdf.text(v, RX, rY, { align: 'right' });
      rY += 4.5;
    });
    y = Math.max(lY, rY) + 3;
    hLine(); y += 4;

    // ═══════════════════════════ ITEMS TABLE ══════════════════════════════
    pageGuard(20);
    type Align = 'left' | 'center' | 'right';
    const cols: { lbl: string; w: number; a: Align }[] = isGst
      ? [
          { lbl: '#',    w: 6,  a: 'center' },
          { lbl: 'Item', w: 56, a: 'left'   },
          { lbl: 'HSN',  w: 16, a: 'center' },
          { lbl: 'Qty',  w: 12, a: 'right'  },
          { lbl: 'Rate', w: 22, a: 'right'  },
          { lbl: 'GST%', w: 12, a: 'center' },
          { lbl: 'Disc%',w: 12, a: 'center' },
          { lbl: 'Amount',w:30, a: 'right'  },
        ]
      : [
          { lbl: '#',    w: 6,  a: 'center' },
          { lbl: 'Item', w: 76, a: 'left'   },
          { lbl: 'Qty',  w: 16, a: 'right'  },
          { lbl: 'Rate', w: 26, a: 'right'  },
          { lbl: 'Disc%',w: 14, a: 'center' },
          { lbl: 'Amount',w:30, a: 'right'  },
        ];

    const totalW = cols.reduce((s, c) => s + c.w, 0);
    const sc = W / totalW;
    const C = cols.map(c => ({ ...c, w: c.w * sc }));

    // Header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(ML, y - 2.5, W, 6, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(80);
    let cx = ML;
    C.forEach(c => {
      const tx = c.a === 'center' ? cx + c.w / 2 : c.a === 'right' ? cx + c.w - 2 : cx + 2;
      pdf.text(c.lbl, tx, y + 1, { align: c.a });
      cx += c.w;
    });
    y += 5.5;

    // Rows
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(20);
    rows.forEach((item: any, i: number) => {
      const descW = C[1].w - 4;
      const dLines = pdf.splitTextToSize(item.product_name || '—', descW);
      const rH = Math.max(5, dLines.length * 3.5);
      pageGuard(rH + 3);

      cx = ML;
      C.forEach((col, ci) => {
        let v = '';
        if (ci === 0) v = String(i + 1);
        else if (ci === 1) {
          // multi-line description
          dLines.forEach((dl: string, di: number) => pdf.text(dl, cx + 2, y + di * 3.5));
          cx += col.w; return;
        } else if (isGst) {
          if (ci === 2) v = item.hsn_code || '—';
          else if (ci === 3) v = String(item.quantity);
          else if (ci === 4) v = `₹${Number(item.rate).toFixed(2)}`;
          else if (ci === 5) v = `${item.gst_rate ?? 0}%`;
          else if (ci === 6) v = `${item.discount_pct ?? 0}%`;
          else if (ci === 7) v = `₹${lineAmt(item).toFixed(2)}`;
        } else {
          if (ci === 2) v = String(item.quantity);
          else if (ci === 3) v = `₹${Number(item.rate).toFixed(2)}`;
          else if (ci === 4) v = `${item.discount_pct ?? 0}%`;
          else if (ci === 5) v = `₹${lineAmt(item).toFixed(2)}`;
        }
        const tx = col.a === 'center' ? cx + col.w / 2 : col.a === 'right' ? cx + col.w - 2 : cx + 2;
        pdf.text(v, tx, y, { align: col.a });
        cx += col.w;
      });

      y += rH;
      pdf.setDrawColor(230); pdf.line(ML, y, RX, y); pdf.setDrawColor(0);
      y += 1.5;
    });
    y += 2;

    // ═══════════════════════════ TOTALS ═══════════════════════════════════
    pageGuard(35);
    const tX = ML + W * 0.58;
    pdf.setFontSize(8);
    const tR = (lbl: string, val: string) => {
      pdf.setTextColor(80); pdf.setFont('helvetica', 'normal'); pdf.text(lbl, tX, y);
      pdf.setTextColor(20); pdf.setFont('helvetica', 'bold'); pdf.text(val, RX, y, { align: 'right' });
      y += 5;
    };
    if (isGst) {
      tR('Taxable Amount', `₹${taxableTotal.toFixed(2)}`);
      if (totalDiscount > 0) tR('Discount', `-₹${totalDiscount.toFixed(2)}`);
      if (!isIGST && Number(invoice.cgst_total) > 0) tR('CGST', `₹${Number(invoice.cgst_total).toFixed(2)}`);
      if (!isIGST && Number(invoice.sgst_total) > 0) tR('SGST', `₹${Number(invoice.sgst_total).toFixed(2)}`);
      if (isIGST && Number(invoice.igst_total) > 0) tR('IGST', `₹${Number(invoice.igst_total).toFixed(2)}`);
    } else {
      tR('Subtotal', `₹${taxableTotal.toFixed(2)}`);
      if (totalDiscount > 0) tR('Discount', `-₹${totalDiscount.toFixed(2)}`);
    }
    if (Number(invoice.round_off) !== 0) tR('Round Off', `${Number(invoice.round_off) > 0 ? '+' : ''}₹${Number(invoice.round_off).toFixed(2)}`);

    // Grand total bar
    pdf.setFillColor(15, 23, 42);
    pdf.rect(tX - 3, y - 2, RX - tX + 5, 8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(255);
    pdf.text('TOTAL', tX, y + 3);
    pdf.text(`₹${Number(invoice.grand_total).toFixed(2)}`, RX - 1, y + 3, { align: 'right' });
    y += 10;

    // Amount in words
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(80);
    pdf.text('In Words:', ML, y);
    pdf.setFont('helvetica', 'italic'); pdf.setTextColor(30);
    const wLines = pdf.splitTextToSize(numberToWords(Number(invoice.grand_total)), W - 22);
    pdf.text(wLines, ML + 20, y);
    y += wLines.length * 3.5 + 4;
    hLine(); y += 5;

    // ═══════════════════════════ FOOTER (3 columns) ══════════════════════
    pageGuard(40);
    const col1X = ML;          // Bank details
    const col2X = ML + W * 0.40; // Terms
    const col3X = ML + W * 0.75; // QR + Signature

    // Col 1: Bank Details
    let bY = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(30);
    pdf.text('Payment Details', col1X, bY); bY += 4.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80);
    if (sel.bank_name)      { pdf.text(`Bank:  ${sel.bank_name}`, col1X, bY); bY += 4; }
    if (sel.branch)         { pdf.text(`Branch: ${sel.branch}`, col1X, bY); bY += 4; }
    if (sel.account_number) { pdf.text(`A/C:   ${sel.account_number}`, col1X, bY); bY += 4; }
    if (sel.ifsc_code)      { pdf.text(`IFSC:  ${sel.ifsc_code}`, col1X, bY); bY += 4; }
    if (sel.upi_id)         { pdf.setFont('helvetica', 'bold'); pdf.text(`UPI:   ${sel.upi_id}`, col1X, bY); pdf.setFont('helvetica', 'normal'); bY += 4; }

    // Col 2: Terms
    let tY = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(30);
    pdf.text('Terms & Conditions', col2X, tY); tY += 4.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(80);
    const terms = invoice.terms_conditions || '1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. for delayed payment.';
    const tLines = pdf.splitTextToSize(terms, (col3X - col2X) - 6);
    tLines.forEach((l: string) => { pdf.text(l, col2X, tY); tY += 3.5; });

    // Col 3: QR Code (if available)
    let qY = y;
    if (qrDataUrl && sel.upi_id) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(30);
      pdf.text('Scan to Pay', col3X + 10, qY, { align: 'center' }); qY += 2;
      try {
        pdf.addImage(qrDataUrl, 'PNG', col3X, qY, 20, 20);
      } catch { /* QR embed failed silently */ }
      qY += 21;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(5.5); pdf.setTextColor(100);
      pdf.text(sel.upi_id, col3X + 10, qY, { align: 'center' });
      qY += 5;
    }

    // Signature (bottom right)
    const sigY = Math.max(bY, tY, qY) + 6;
    pageGuard(sigY - y + 14);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(30);
    pdf.text(`For ${sel.business_name}`, RX, sigY, { align: 'right' });
    pdf.setDrawColor(120); pdf.line(RX - 35, sigY + 8, RX, sigY + 8); pdf.setDrawColor(0);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(100);
    pdf.text('Authorized Signatory', RX, sigY + 12, { align: 'right' });

    return pdf;
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    showToast('Opening print view...', 'info');
    onClose();
    window.open(`/invoice/${invoice.id}?print`, '_blank');
  };

  const handleDownload = async () => {
    showToast('Generating PDF...', 'info');
    try {
      // Pre-generate UPI QR code if UPI ID is available
      let qrDataUrl: string | undefined;
      const sel = invoice.seller_snapshot || {} as any;
      if (sel.upi_id) {
        const upiStr = `upi://pay?pa=${encodeURIComponent(sel.upi_id)}&pn=${encodeURIComponent(sel.business_name || '')}&am=${Number(invoice.grand_total).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Inv ' + invoice.invoice_number)}`;
        try {
          qrDataUrl = await QRCode.toDataURL(upiStr, { width: 200, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
        } catch { /* QR generation failed, continue without it */ }
      }

      const pdf = generatePdf(qrDataUrl);
      pdf.save(`${invoice.invoice_number}.pdf`);
      showToast('PDF downloaded!', 'success');
      onClose();
    } catch {
      showToast('Failed to generate PDF', 'danger');
    }
  };

  const handleWhatsApp = () => {
    const text = [
      `*${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}*`,
      `Customer: ${invoice.customer_snapshot.name}${invoice.customer_snapshot.company_name ? ` (${invoice.customer_snapshot.company_name})` : ''}`,
      `Amount: ₹${Number(invoice.grand_total).toFixed(2)}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
      `Status: ${invoice.payment_status}`,
      ``,
      `View: ${window.location.origin}/invoice/${invoice.id}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${isGst ? 'Tax Invoice' : 'Invoice'} ${invoice.invoice_number}`);
    const body = encodeURIComponent([
      `${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
      `Customer: ${invoice.customer_snapshot.name}`,
      `Amount: ₹${Number(invoice.grand_total).toFixed(2)}`,
      `Status: ${invoice.payment_status}`,
      ``,
      `View: ${window.location.origin}/invoice/${invoice.id}`,
    ].join('\n'));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard?.writeText(url)
      .then(() => showToast('Invoice link copied!', 'success'))
      .catch(() => showToast('Failed to copy link', 'danger'));
    onClose();
  };

  const actions = [
    { icon: FileDown, label: 'Download PDF', desc: 'Save as PDF file', onClick: handleDownload, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400' },
    { icon: Printer, label: 'Print', desc: 'Open print view', onClick: handlePrint, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300' },
    { icon: MessageCircle, label: 'WhatsApp', desc: 'Share invoice link', onClick: handleWhatsApp, color: 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400' },
    { icon: Mail, label: 'Email', desc: 'Send via email', onClick: handleEmail, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400' },
    { icon: Link, label: 'Copy Link', desc: 'Copy shareable link', onClick: handleCopyLink, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-premium z-10 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">Share Invoice</h3>
                <p className="text-xs text-text-secondary dark:text-slate-400 mt-0.5">{invoice.invoice_number} — ₹{Number(invoice.grand_total).toFixed(2)}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-soft transition-all ${action.color}`}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-xs font-bold">{action.label}</span>
                  <span className="text-[9px] text-text-secondary dark:text-slate-500">{action.desc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
