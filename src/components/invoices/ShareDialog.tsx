import React from 'react';
import { jsPDF } from 'jspdf';
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

  const generatePdf = (): jsPDF => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    // Page margins & usable width
    const ML = 12, MR = 12, PW = 210, PH = 297;
    const W = PW - ML - MR;   // usable width = 186
    const RX = ML + W;        // right edge = 198
    let y = ML;

    const sel = invoice.seller_snapshot || {} as any;
    const cust = invoice.customer_snapshot || {} as any;
    const rows = items || [];
    const isIGST = isGst && Number(invoice.igst_total) > 0;

    // ── helpers ──────────────────────────────────────────────────────────────
    const lineTotal = (item: any) =>
      Number(item.rate) * Number(item.quantity) * (1 - Number(item.discount_pct || 0) / 100);

    const taxableTotal = rows.reduce((s, item) => s + lineTotal(item), 0);
    const totalDiscount = rows.reduce((s, item: any) =>
      s + Number(item.rate) * Number(item.quantity) * (Number(item.discount_pct || 0) / 100), 0);

    const hRule = (thickness = 0.2, color = 180) => {
      pdf.setDrawColor(color); pdf.setLineWidth(thickness);
      pdf.line(ML, y, RX, y);
      pdf.setDrawColor(0); pdf.setLineWidth(0.2);
    };

    const newPageIfNeeded = (needed = 20) => {
      if (y + needed > PH - ML) { pdf.addPage(); y = ML + 4; }
    };

    // ── HEADER BAR ───────────────────────────────────────────────────────────
    const headerH = 22;
    pdf.setFillColor(15, 23, 42);               // slate-900
    pdf.rect(ML, y, W, headerH, 'F');
    pdf.setTextColor(248, 250, 252);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(sel.business_name || 'Business Name', ML + 4, y + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    const addrLine = [sel.address, sel.city, sel.state].filter(Boolean).join(', ');
    const addrLines = pdf.splitTextToSize(addrLine, W / 2);
    addrLines.forEach((l: string, i: number) => pdf.text(l, ML + 4, y + 13 + i * 3.5));
    // Invoice badge (right side)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(isGst ? 'TAX INVOICE' : 'BILL', RX - 4, y + 8, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(invoice.invoice_number, RX - 4, y + 13, { align: 'right' });
    pdf.text(new Date(invoice.invoice_date).toLocaleDateString('en-IN'), RX - 4, y + 17, { align: 'right' });
    if (isGst) {
      pdf.setTextColor(252, 211, 77);
      pdf.setFontSize(6);
      pdf.text('FOR RECIPIENT', RX - 4, y + 21, { align: 'right' });
    }
    y += headerH + 5;
    pdf.setTextColor(30, 41, 59);

    // ── SELLER GSTIN / PHONE row ──────────────────────────────────────────────
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    const metaParts: string[] = [];
    if (sel.gstin) metaParts.push(`GSTIN: ${sel.gstin}`);
    if (sel.pan) metaParts.push(`PAN: ${sel.pan}`);
    if (sel.phone) metaParts.push(`Phone: ${sel.phone}`);
    if (sel.email) metaParts.push(`Email: ${sel.email}`);
    pdf.text(metaParts.join('   |   '), ML, y);
    y += 5;
    hRule(); y += 4;

    // ── BILL TO / SHIP TO + INVOICE META ─────────────────────────────────────
    const billToX = ML, metaX = ML + W * 0.55;
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('BILL TO', billToX, y);
    pdf.text('INVOICE DETAILS', metaX, y);
    y += 4.5;
    pdf.setTextColor(15, 23, 42);

    // Bill-to column
    let ly = y;
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text(cust.name || '—', billToX, ly); ly += 5;
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    if (cust.company_name) { pdf.text(cust.company_name, billToX, ly); ly += 4.5; }
    if (cust.gstin) { pdf.setFont('helvetica', 'bold'); pdf.text(`GSTIN: ${cust.gstin}`, billToX, ly); pdf.setFont('helvetica', 'normal'); ly += 4.5; }
    const custAddr = [cust.address, cust.city, cust.state].filter(Boolean).join(', ');
    if (custAddr) {
      const custAddrLines = pdf.splitTextToSize(custAddr, W * 0.50);
      custAddrLines.forEach((l: string) => { pdf.text(l, billToX, ly); ly += 4; });
    }
    if (cust.mobile) { pdf.text(`Phone: ${cust.mobile}`, billToX, ly); ly += 4; }
    if (cust.email) { pdf.text(`Email: ${cust.email}`, billToX, ly); ly += 4; }

    // Meta column
    let ry = y;
    pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
    const metaRows: [string, string][] = [
      ['Invoice No.', invoice.invoice_number],
      ['Date', new Date(invoice.invoice_date).toLocaleDateString('en-IN')],
      ...(invoice.due_date ? [['Due Date', new Date(invoice.due_date).toLocaleDateString('en-IN')] as [string, string]] : []),
      ['Payment Mode', invoice.payment_mode || '—'],
      ['Payment Status', (invoice.payment_status || '').toUpperCase()],
      ...(isGst ? [['Place of Supply', invoice.place_of_supply] as [string, string]] : []),
    ];
    metaRows.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'normal'); pdf.text(label + ':', metaX, ry);
      pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text(value, RX, ry, { align: 'right' });
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105);
      ry += 4.5;
    });

    y = Math.max(ly, ry) + 4;
    hRule(); y += 4;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    newPageIfNeeded(20);

    // Column definitions: [label, relWidth, align]
    type ColAlign = 'left' | 'center' | 'right';
    const cols: { label: string; w: number; align: ColAlign }[] = isGst
      ? [
          { label: '#',       w: 7,   align: 'center' },
          { label: 'Description', w: 63, align: 'left'   },
          { label: 'HSN',     w: 18,  align: 'center' },
          { label: 'Qty',     w: 14,  align: 'right'  },
          { label: 'Rate',    w: 22,  align: 'right'  },
          { label: 'GST%',    w: 14,  align: 'center' },
          { label: 'Disc%',   w: 14,  align: 'center' },
          { label: 'Amount',  w: 34,  align: 'right'  },
        ]
      : [
          { label: '#',       w: 7,   align: 'center' },
          { label: 'Description', w: 85, align: 'left'   },
          { label: 'Qty',     w: 18,  align: 'right'  },
          { label: 'Rate',    w: 28,  align: 'right'  },
          { label: 'Disc%',   w: 14,  align: 'center' },
          { label: 'Amount',  w: 34,  align: 'right'  },
        ];

    // Scale widths to fill W exactly
    const totalColW = cols.reduce((s, c) => s + c.w, 0);
    const scale = W / totalColW;
    const scaledCols = cols.map(c => ({ ...c, w: c.w * scale }));

    // Header row
    pdf.setFillColor(241, 245, 249);
    pdf.rect(ML, y - 3, W, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    let cx = ML;
    scaledCols.forEach(col => {
      const tx = col.align === 'center' ? cx + col.w / 2
               : col.align === 'right'  ? cx + col.w - 1.5
               :                          cx + 1.5;
      pdf.text(col.label, tx, y + 1, { align: col.align });
      cx += col.w;
    });
    y += 6;
    hRule(0.4, 150); y += 1;

    // Item rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);

    rows.forEach((item: any, i: number) => {
      // Wrap long description
      const descCol = scaledCols[1];
      const descLines = pdf.splitTextToSize(item.product_name || '—', descCol.w - 3);
      const rowH = Math.max(6, descLines.length * 4.5);

      newPageIfNeeded(rowH + 4);

      cx = ML;
      scaledCols.forEach((col, ci) => {
        let val = '';
        if (ci === 0) val = String(i + 1);
        else if (ci === 1) val = '';  // handled separately (multi-line)
        else if (isGst) {
          if (ci === 2) val = item.hsn_code || '—';
          else if (ci === 3) val = String(item.quantity);
          else if (ci === 4) val = `\u20B9${Number(item.rate).toFixed(2)}`;
          else if (ci === 5) val = `${item.gst_rate ?? 0}%`;
          else if (ci === 6) val = `${item.discount_pct ?? 0}%`;
          else if (ci === 7) val = `\u20B9${lineTotal(item).toFixed(2)}`;
        } else {
          if (ci === 2) val = String(item.quantity);
          else if (ci === 3) val = `\u20B9${Number(item.rate).toFixed(2)}`;
          else if (ci === 4) val = `${item.discount_pct ?? 0}%`;
          else if (ci === 5) val = `\u20B9${lineTotal(item).toFixed(2)}`;
        }

        if (ci === 1) {
          // Multi-line description
          descLines.forEach((dl: string, di: number) => {
            pdf.text(dl, cx + 1.5, y + di * 4.5);
          });
          if (item.description) {
            pdf.setFontSize(6.5); pdf.setTextColor(100, 116, 139);
            const subLines = pdf.splitTextToSize(item.description, descCol.w - 3);
            subLines.forEach((sl: string, si: number) => {
              pdf.text(sl, cx + 1.5, y + descLines.length * 4.5 + si * 3.5);
            });
            pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
          }
        } else {
          const tx = col.align === 'center' ? cx + col.w / 2
                   : col.align === 'right'  ? cx + col.w - 1.5
                   :                          cx + 1.5;
          pdf.text(val, tx, y, { align: col.align });
        }
        cx += col.w;
      });

      y += rowH;
      pdf.setDrawColor(226, 232, 240); pdf.line(ML, y, RX, y); pdf.setDrawColor(0);
      y += 1;
    });

    y += 3;

    // ── TOTALS (right-aligned block) ──────────────────────────────────────────
    newPageIfNeeded(40);
    const tLabelX = ML + W * 0.60;
    pdf.setFontSize(8.5);

    const tRow = (label: string, value: string, bold = false, large = false) => {
      if (bold || large) pdf.setFont('helvetica', 'bold');
      if (large) pdf.setFontSize(11);
      pdf.setTextColor(71, 85, 105);
      pdf.text(label, tLabelX, y);
      pdf.setTextColor(15, 23, 42);
      pdf.text(value, RX, y, { align: 'right' });
      y += large ? 7 : 5.5;
      if (bold || large) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); }
    };

    if (isGst) {
      tRow('Taxable Amount', `\u20B9${taxableTotal.toFixed(2)}`);
      if (totalDiscount > 0) tRow('Discount', `-\u20B9${totalDiscount.toFixed(2)}`);
      if (!isIGST && Number(invoice.cgst_total) > 0) tRow('CGST', `\u20B9${Number(invoice.cgst_total).toFixed(2)}`);
      if (!isIGST && Number(invoice.sgst_total) > 0) tRow('SGST', `\u20B9${Number(invoice.sgst_total).toFixed(2)}`);
      if (isIGST && Number(invoice.igst_total) > 0) tRow('IGST', `\u20B9${Number(invoice.igst_total).toFixed(2)}`);
    } else {
      tRow('Subtotal', `\u20B9${taxableTotal.toFixed(2)}`);
      if (totalDiscount > 0) tRow('Discount', `-\u20B9${totalDiscount.toFixed(2)}`);
    }
    if (Number(invoice.round_off) !== 0) tRow('Round Off', `${Number(invoice.round_off) > 0 ? '+' : ''}\u20B9${Number(invoice.round_off).toFixed(2)}`);

    // Grand total bar
    pdf.setFillColor(15, 23, 42);
    pdf.rect(tLabelX - 3, y - 3.5, RX - tLabelX + 6, 9, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('GRAND TOTAL', tLabelX, y + 2);
    pdf.text(`\u20B9${Number(invoice.grand_total).toFixed(2)}`, RX - 1, y + 2, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(15, 23, 42);
    y += 10;

    // Amount in words
    newPageIfNeeded(12);
    y += 3;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(71, 85, 105);
    pdf.text('Amount in Words:', ML, y);
    pdf.setFont('helvetica', 'italic'); pdf.setTextColor(15, 23, 42);
    const wordLines = pdf.splitTextToSize(numberToWords(Number(invoice.grand_total)), W - 38);
    pdf.text(wordLines, ML + 38, y);
    y += wordLines.length * 4.5 + 5;
    hRule(); y += 5;

    // ── FOOTER: Bank & UPI | Terms & Signature (2 columns) ───────────────────
    newPageIfNeeded(35);
    const footMid = ML + W * 0.48;

    // LEFT — Bank Details
    let bankY = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
    pdf.text('Payment Details', ML, bankY); bankY += 5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(71, 85, 105);
    if (sel.bank_name)      { pdf.text(`Bank:    ${sel.bank_name}`, ML, bankY); bankY += 4.5; }
    if (sel.branch)         { pdf.text(`Branch:  ${sel.branch}`, ML, bankY); bankY += 4.5; }
    if (sel.account_number) { pdf.text(`A/C No:  ${sel.account_number}`, ML, bankY); bankY += 4.5; }
    if (sel.ifsc_code)      { pdf.text(`IFSC:    ${sel.ifsc_code}`, ML, bankY); bankY += 4.5; }
    if (sel.upi_id)         { pdf.setFont('helvetica', 'bold'); pdf.text(`UPI:     ${sel.upi_id}`, ML, bankY); pdf.setFont('helvetica', 'normal'); bankY += 4.5; }

    // RIGHT — Terms & Authorized Signature
    let termY = y;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
    pdf.text('Terms & Conditions', footMid, termY); termY += 5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(71, 85, 105);
    const termsText = invoice.terms_conditions
      || '1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. for delayed payment.';
    const termLines = pdf.splitTextToSize(termsText, W - (footMid - ML) - 4);
    termLines.forEach((l: string) => { pdf.text(l, footMid, termY); termY += 4; });

    // Signature (bottom-right)
    const sigY = Math.max(bankY, termY) + 8;
    newPageIfNeeded(sigY - y + 10);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
    pdf.text(`For ${sel.business_name}`, RX, sigY - 10, { align: 'right' });
    pdf.setDrawColor(100); pdf.line(RX - 40, sigY, RX, sigY); pdf.setDrawColor(0);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(71, 85, 105);
    pdf.text('Authorized Signatory', RX, sigY + 4, { align: 'right' });

    return pdf;
  };

  const handlePrint = () => {
    showToast('Opening print view...', 'info');
    onClose();
    window.open(`/invoice/${invoice.id}?print`, '_blank');
  };

  const handleDownload = () => {
    showToast('Generating PDF...', 'info');
    try {
      const pdf = generatePdf();
      pdf.save(`${invoice.invoice_number}.pdf`);
      showToast('PDF downloaded!', 'success');
      onClose();
    } catch {
      showToast('Failed to generate PDF', 'danger');
    }
  };

  const handleWhatsApp = () => {
    const text = [
      `*${invoice.invoice_type === 'GST' ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}*`,
      `Customer: ${invoice.customer_snapshot.name}${invoice.customer_snapshot.company_name ? ` (${invoice.customer_snapshot.company_name})` : ''}`,
      `Amount: \u20B9${Number(invoice.grand_total).toFixed(2)}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
      `Status: ${invoice.payment_status}`,
      ``,
      `View online: ${window.location.origin}/invoice/${invoice.id}`,
      `Download PDF from the link above.`,
      `Powered by InvoiceFlow`
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${invoice.invoice_type === 'GST' ? 'Tax Invoice' : 'Invoice'} ${invoice.invoice_number}`);
    const body = encodeURIComponent([
      `${invoice.invoice_type === 'GST' ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
      ``,
      `Customer: ${invoice.customer_snapshot.name}`,
      `${invoice.customer_snapshot.company_name ? `Company: ${invoice.customer_snapshot.company_name}` : ''}`,
      `Amount: \u20B9${Number(invoice.grand_total).toFixed(2)}`,
      `Status: ${invoice.payment_status}`,
      ``,
      `View online: ${window.location.origin}/invoice/${invoice.id}`,
      `Powered by InvoiceFlow`
    ].join('\n'));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invoice/${invoice.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Invoice link copied!', 'success');
        }).catch(() => fallbackCopy(url));
      } else {
        fallbackCopy(url);
      }
    } catch {
      fallbackCopy(url);
    }
    onClose();
  };

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Invoice link copied!', 'success'); }
    catch { showToast('Failed to copy link', 'danger'); }
    document.body.removeChild(ta);
  };

  const actions = [
    { icon: FileDown, label: 'Download PDF', desc: 'Save as PDF (via browser)', onClick: handleDownload, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400' },
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
                <p className="text-xs text-text-secondary dark:text-slate-400 mt-0.5">{invoice.invoice_number} — \u20B9{Number(invoice.grand_total).toFixed(2)}</p>
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
