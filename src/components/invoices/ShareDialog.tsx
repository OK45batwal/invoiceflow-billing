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
    const m = 12, r = 198;
    let y = 20;
    const bold = (t: string, x: number, yo: number, opts?: any) => {
      pdf.setFont('helvetica', 'bold'); pdf.text(t, x, yo, opts); pdf.setFont('helvetica', 'normal');
    };
    const s = invoice.customer_snapshot;
    const sel = invoice.seller_snapshot;
    const itemsToPrint = items || [];

    const totalDiscount = itemsToPrint.reduce((sum, item) =>
      sum + item.rate * item.quantity * item.discount_pct / 100, 0);
    const lineTotal = (item: any) => item.rate * (1 - item.discount_pct / 100) * item.quantity;
    const taxableAmount = itemsToPrint.reduce((sum, item) => sum + lineTotal(item), 0);
    const isIGST = isGst && Number(invoice.igst_total) > 0;

    // ──── HEADER BAR ────
    pdf.setFillColor(30, 41, 59);
    pdf.rect(m - 2, y - 7, r - m + 4, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sel.business_name, m, y);
    pdf.setFontSize(7);
    pdf.setTextColor(203, 213, 225);
    const addrLines = pdf.splitTextToSize(`${sel.address}, ${sel.city}, ${sel.state}`, 80);
    addrLines.forEach((l: string, i: number) => pdf.text(l, m, y + 3.5 + i * 3));
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(isGst ? 'TAX INVOICE' : 'CASH MEMO', r, y, { align: 'right' });
    if (isGst) { pdf.setFontSize(6); pdf.setTextColor(252, 211, 77); pdf.text('Original', r, y + 4, { align: 'right' }); }
    y += 22;
    pdf.setTextColor(0);

    // ──── META ────
    pdf.setDrawColor(180);
    pdf.line(m, y, r, y); y += 5;
    pdf.setFontSize(8);
    pdf.text(`${isGst ? 'Invoice' : 'Bill'} No: ${invoice.invoice_number}`, m, y);
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, m + 65, y);
    if (invoice.due_date) pdf.text(`Due: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, m + 110, y);
    if (isGst) bold('Place of Supply:', r, y, { align: 'right' });
    y += 5;
    pdf.setDrawColor(180);
    pdf.line(m, y, r, y); y += 6;

    // ──── BILL FROM / TO ────
    bold('Bill From', m, y);
    bold('Bill To', 105, y);
    y += 5;
    let ly = y, ry = y;
    pdf.setFontSize(8.5);
    bold(sel.business_name, m, ly); ly += 5;
    pdf.setFontSize(8);
    if (sel.gstin) { pdf.text(`GSTIN: ${sel.gstin}`, m, ly); ly += 4.5; }
    pdf.text(`${sel.address}, ${sel.city}, ${sel.state}`, m, ly); ly += 4.5;
    pdf.text(`Phone: ${sel.phone}`, m, ly);
    pdf.setFontSize(8.5);
    bold(s.name, 105, ry); ry += 5;
    pdf.setFontSize(8);
    if (s.company_name) { pdf.text(s.company_name, 105, ry); ry += 4.5; }
    if (s.gstin) { pdf.text(`GSTIN: ${s.gstin}`, 105, ry); ry += 4.5; }
    pdf.text(`${s.address}, ${s.city}, ${s.state}`, 105, ry); ry += 4.5;
    pdf.text(`Phone: ${s.mobile}`, 105, ry); ry += 4;
    if (s.email) pdf.text(`Email: ${s.email}`, 105, ry);

    y = Math.max(ly, ry) + 4;
    pdf.setDrawColor(180);
    pdf.line(m, y, r, y); y += 6;

    // ──── ITEMS TABLE ────
    if (y > 260) { pdf.addPage(); y = 20; }
    const colW = (r - m) / (isGst ? 7 : 5);
    const colPct = isGst ? [0.3, 2.2, 0.8, 0.7, 1.0, 0.8, 1.2] : [0.3, 2.0, 0.7, 1.0, 1.0];
    const colLbl = isGst ? ['#', 'Item', 'HSN', 'Qty', 'Price', 'GST%', 'Amount'] : ['#', 'Item', 'Qty', 'Price', 'Amount'];
    const colX = colPct.reduce((acc: number[], p) => [...acc, (acc.at(-1) ?? m) + p * colW], [] as number[]);
    colX.unshift(m);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    for (let c = 0; c < colPct.length; c++) {
      const cx = colX[c], cw = colPct[c] * colW;
      if (c === 0) pdf.text(colLbl[c], cx + cw / 2, y, { align: 'center' });
      else if (c <= 1 || (isGst && c === 2)) pdf.text(colLbl[c], cx + 1, y);
      else pdf.text(colLbl[c], cx + cw - 1, y, { align: 'right' });
    }
    pdf.setDrawColor(180);
    pdf.line(m, y + 1, r, y + 1);
    pdf.setDrawColor(0);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    itemsToPrint.forEach((item: any, i: number) => {
      if (y > 275) { pdf.addPage(); y = 20; }
      for (let c = 0; c < colPct.length; c++) {
        const cx = colX[c], cw = colPct[c] * colW;
        let val = String(i + 1);
        if (c === 1) val = item.product_name || '';
        else if (isGst && c === 2) val = item.hsn_code || '-';
        else if (!isGst && c === 2) val = String(item.quantity);
        else if (c === (isGst ? 3 : 3)) { pdf.setFont('helvetica', 'bold'); val = String(item.quantity); }
        else if (c === (isGst ? 4 : 4)) val = `\u20B9${item.rate.toFixed(2)}`;
        else if (isGst && c === 5) val = `${item.gst_rate}%`;
        else if (c === (isGst ? 6 : 4)) { pdf.setFont('helvetica', 'bold'); val = `\u20B9${lineTotal(item).toFixed(2)}`; }
        if (c === 0) pdf.text(val, cx + cw / 2, y, { align: 'center' });
        else if (c === 1) pdf.text(val, cx + 1, y);
        else pdf.text(val, cx + cw - 1, y, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
      }
      y += 6.5;
    });
    pdf.setDrawColor(180);
    pdf.line(m, y - 2, r, y - 2);
    pdf.setDrawColor(0);
    y += 4;

    // ──── TOTALS ────
    pdf.setFontSize(9);
    const tRight = r, tLeft = r - 78;
    const totLine = (l: string, v: string, b = false) => {
      if (b) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); }
      pdf.text(l, tLeft, y);
      pdf.text(v, tRight, y, { align: 'right' });
      y += 5.5;
      if (b) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); }
    };
    if (isGst) {
      totLine('Taxable Amount:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (!isIGST && Number(invoice.cgst_total) > 0) totLine('CGST (9%):', `\u20B9${Number(invoice.cgst_total).toFixed(2)}`);
      if (!isIGST && Number(invoice.sgst_total) > 0) totLine('SGST (9%):', `\u20B9${Number(invoice.sgst_total).toFixed(2)}`);
      if (isIGST && Number(invoice.igst_total) > 0) totLine('IGST:', `\u20B9${Number(invoice.igst_total).toFixed(2)}`);
      if (totalDiscount > 0) totLine('Discount:', `-\u20B9${totalDiscount.toFixed(2)}`);
    } else {
      totLine('Subtotal:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (totalDiscount > 0) totLine('Discount:', `-\u20B9${totalDiscount.toFixed(2)}`);
      totLine('Delivery:', '\u20B90.00');
    }
    if (Number(invoice.round_off) !== 0) totLine('Round Off:', `${Number(invoice.round_off).toFixed(2)}`);
    pdf.line(tLeft, y - 1, tRight, y - 1);
    totLine(isGst ? 'GRAND TOTAL' : 'TOTAL', `\u20B9${Number(invoice.grand_total).toFixed(2)}`, true);
    y += 3;

    // ──── AMOUNT IN WORDS ────
    pdf.setDrawColor(180);
    pdf.line(m, y, r, y); y += 5;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount in Words:', m, y);
    pdf.setFont('helvetica', 'normal');
    const amtWords = pdf.splitTextToSize(numberToWords(Number(invoice.grand_total)), r - m - 40);
    pdf.text(amtWords, m + 35, y);
    y += amtWords.length * 4.5 + 4;

    // ──── BANK DETAILS ────
    if (sel.bank_name || sel.upi_id) {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(180);
      pdf.line(m, y, r, y); y += 5;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bank Details', m, y); y += 5.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      if (sel.bank_name) { pdf.text(`Bank: ${sel.bank_name}`, m, y); y += 4.5; }
      if (sel.account_number) { pdf.text(`A/C: ${sel.account_number}`, m, y); y += 4.5; }
      if (sel.ifsc_code) { pdf.text(`IFSC: ${sel.ifsc_code}`, m, y); y += 4.5; }
      if (sel.upi_id) { pdf.text(`UPI: ${sel.upi_id}`, m, y); y += 4.5; }
    }

    // ──── TERMS & SIGNATURE ────
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(180);
    pdf.line(m, y, r, y); y += 5;
    const termsY = y;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms & Conditions', m, y); y += 5.5;
    pdf.setFont('helvetica', 'normal');
    if (invoice.terms_conditions) {
      pdf.splitTextToSize(invoice.terms_conditions, 90).forEach((l: string) => { pdf.text(l, m, y); y += 4.5; });
    } else {
      pdf.text('1. Goods once sold will not be taken back.', m, y); y += 4.5;
      pdf.text('2. Interest @ 24% p.a. for delayed payment.', m, y); y += 4.5;
    }
    y = Math.max(y, termsY + 16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Authorized Signature', r, y, { align: 'right' });
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text(sel.business_name, r, y, { align: 'right' });
    y += 6;

    return pdf;
  };

  const downloadPDF = () => {
    showToast('Generating PDF...', 'info');
    const pdf = generatePdf();
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('PDF downloaded!', 'success');
    onClose();
  };

  const handlePrint = () => {
    onClose();
    const pdf = generatePdf();
    window.open(URL.createObjectURL(pdf.output('blob')), '_blank');
  };

  const handleWhatsApp = async () => {
    showToast('Preparing PDF...', 'info');
    const pdf = generatePdf();
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

    const shareData: ShareData = {
      files: [pdfFile],
      title: `Invoice ${invoice.invoice_number}`,
      text: `*${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}*\nCustomer: ${invoice.customer_snapshot.name}\nAmount: \u20B9${Number(invoice.grand_total).toFixed(2)}`
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast('Shared!', 'success');
        onClose();
        return;
      }
    } catch (_) {}

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const text = [
      `*${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}*`,
      `Customer: ${invoice.customer_snapshot.name}${invoice.customer_snapshot.company_name ? ` (${invoice.customer_snapshot.company_name})` : ''}`,
      `Amount: \u20B9${Number(invoice.grand_total).toFixed(2)}`,
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`,
      `Status: ${invoice.payment_status}`,
      ``,
      `PDF downloaded — please attach it from your downloads.`,
      `Powered by InvoiceFlow`
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('PDF downloaded & WhatsApp opened!', 'success');
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${isGst ? 'Tax Invoice' : 'Invoice'} ${invoice.invoice_number}`);
    const body = encodeURIComponent([
      `${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}`,
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
    navigator.clipboard.writeText(url).then(() => {
      showToast('Invoice link copied!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'danger');
    });
    onClose();
  };

  const actions = [
    { icon: FileDown, label: 'Download PDF', desc: 'Save as PDF file', onClick: downloadPDF, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400' },
    { icon: Printer, label: 'Print', desc: 'Print invoice', onClick: handlePrint, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300' },
    { icon: MessageCircle, label: 'WhatsApp', desc: 'Share on WhatsApp', onClick: handleWhatsApp, color: 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400' },
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
