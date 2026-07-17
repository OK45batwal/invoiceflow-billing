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
    const pw = 210, m = 10, r = pw - m;
    let y = 15;
    const ln = (h = 6) => { y += h; };
    const hr = (h = 3) => { y += h; pdf.line(m, y, r, y); ln(); };
    const bold = (t: string, x: number, y: number, opts?: any) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(t, x, y, opts);
      pdf.setFont('helvetica', 'normal');
    };
    const s = invoice.customer_snapshot;
    const sel = invoice.seller_snapshot;
    const itemsToPrint = items || [];

    const totalDiscount = itemsToPrint.reduce((sum, item) =>
      sum + item.rate * item.quantity * item.discount_pct / 100, 0);
    const lineTotal = (item: any) => item.rate * (1 - item.discount_pct / 100) * item.quantity;
    const taxableAmount = itemsToPrint.reduce((sum, item) => sum + lineTotal(item), 0);

    // === HEADER ===
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sel.business_name, m, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(isGst ? 'TAX INVOICE' : 'CASH MEMO', r, y, { align: 'right' });
    pdf.setFontSize(7);
    pdf.setFillColor(220, 38, 38);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(r - 17, y - 4, 16, 5, 'F');
    pdf.text('Original', r - 9, y, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    ln(8);
    pdf.setFontSize(9);
    pdf.text(`${sel.address}, ${sel.city}, ${sel.state}`, m, y);
    pdf.text(`Invoice: ${invoice.invoice_number}`, r, y, { align: 'right' });
    ln();
    pdf.text(`Phone: ${sel.phone}`, m, y);
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, r, y, { align: 'right' });
    ln();
    if (sel.gstin) pdf.text(`GSTIN: ${sel.gstin}`, m, y);
    if (invoice.due_date) pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, r, y, { align: 'right' });
    ln(6);
    hr();

    // === BILL FROM / BILL TO ===
    pdf.setFontSize(10);
    bold('Bill From', m, y);
    bold('Bill To', 105, y);
    ln(7);
    pdf.setFontSize(9);
    let ly = y, ry = y;
    pdf.text(sel.business_name, m, ly); ly += 5;
    if (sel.gstin) { pdf.text(`GSTIN: ${sel.gstin}`, m, ly); ly += 5; }
    pdf.text(`${sel.address}, ${sel.city}, ${sel.state}`, m, ly); ly += 5;
    pdf.text(`Phone: ${sel.phone}`, m, ly);
    pdf.text(s.name, 105, ry); ry += 5;
    if (s.company_name) { pdf.text(s.company_name, 105, ry); ry += 5; }
    if (s.gstin) { pdf.text(`GSTIN: ${s.gstin}`, 105, ry); ry += 5; }
    pdf.text(`${s.address}, ${s.city}, ${s.state}`, 105, ry); ry += 5;
    pdf.text(`Phone: ${s.mobile}`, 105, ry); ry += 5;
    if (s.email) pdf.text(`Email: ${s.email}`, 105, ry);
    y = Math.max(ly, ry) + 4;
    hr();

    // === ITEMS TABLE ===
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(isGst
      ? '#    Item                                    HSN    Qty   Price  GST%     Amount'
      : '#    Item                                            Qty   Price       Amount', m, y);
    pdf.setDrawColor(200);
    pdf.line(m, y + 1, r, y + 1);
    pdf.setDrawColor(0);
    ln();
    pdf.setFont('helvetica', 'normal');
    itemsToPrint.forEach((item: any, i: number) => {
      if (y > 275) { pdf.addPage(); y = 20; }
      const name = (item.product_name || '').padEnd(36, ' ').slice(0, 36);
      const qty = String(item.quantity).padStart(5, ' ');
      const rate = item.rate.toFixed(2).padStart(7, ' ');
      const amt = lineTotal(item).toFixed(2).padStart(11, ' ');
      if (isGst) {
        const hsn = (item.hsn_code || '-').padEnd(6, ' ');
        const gst = String(item.gst_rate).padStart(4, ' ');
        pdf.text(`${i + 1}. ${name} ${hsn}${qty} ${rate} ${gst} ${amt}`, m, y);
      } else {
        pdf.text(`${i + 1}. ${name}${qty} ${rate}    ${amt}`, m, y);
      }
      ln();
    });
    pdf.line(m, y - 3, r, y - 3);
    ln(2);

    // === TOTALS PANEL ===
    const tx = 125;
    pdf.setFontSize(10);
    const tLine = (label: string, val: string, isBold = false) => {
      if (isBold) pdf.setFont('helvetica', 'bold');
      pdf.text(label, tx, y);
      pdf.text(val, r, y, { align: 'right' });
      if (isBold) pdf.setFont('helvetica', 'normal');
      ln();
    };
    if (isGst) {
      tLine('Taxable Amount:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (Number(invoice.cgst_total) > 0) tLine('CGST (9%):', `\u20B9${Number(invoice.cgst_total).toFixed(2)}`);
      if (Number(invoice.sgst_total) > 0) tLine('SGST (9%):', `\u20B9${Number(invoice.sgst_total).toFixed(2)}`);
      if (totalDiscount > 0) tLine('Discount:', `\u20B9${totalDiscount.toFixed(2)}`);
      if (Number(invoice.round_off) !== 0) tLine('Round Off:', `\u20B9${Number(invoice.round_off).toFixed(2)}`);
      pdf.line(tx, y - 3, r, y - 3);
      tLine('GRAND TOTAL:', `\u20B9${Number(invoice.grand_total).toFixed(2)}`, true);
    } else {
      tLine('Subtotal:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (totalDiscount > 0) tLine('Discount:', `\u20B9${totalDiscount.toFixed(2)}`);
      tLine('Delivery:', '\u20B90.00');
      pdf.line(tx, y - 3, r, y - 3);
      tLine('TOTAL:', `\u20B9${Number(invoice.grand_total).toFixed(2)}`, true);
    }
    ln(2);

    // === AMOUNT IN WORDS ===
    pdf.setFontSize(9);
    pdf.text(`Amount in words: ${numberToWords(Number(invoice.grand_total))}`, m, y);
    ln(8);

    // === BANK DETAILS + SCAN & PAY ===
    if (sel.bank_name || sel.upi_id) {
      if (y > 260) { pdf.addPage(); y = 20; }
      const bly = y;
      let ly2 = bly, ry2 = bly;
      pdf.setFontSize(10);
      bold('Bank Details', m, ly2); ly2 += 7;
      pdf.setFontSize(9);
      if (sel.bank_name) { pdf.text(`Bank: ${sel.bank_name}`, m, ly2); ly2 += 5; }
      if (sel.branch) { pdf.text(`Branch: ${sel.branch}`, m, ly2); ly2 += 5; }
      if (sel.account_number) { pdf.text(`Account: ${sel.account_number}`, m, ly2); ly2 += 5; }
      if (sel.ifsc_code) { pdf.text(`IFSC: ${sel.ifsc_code}`, m, ly2); ly2 += 5; }
      if (sel.upi_id) { pdf.text(`UPI: ${sel.upi_id}`, m, ly2); ly2 += 5; }
      bold('Scan & Pay', 105, ry2); ry2 += 7;
      pdf.setFontSize(9);
      pdf.text('Scan QR code to pay', 105, ry2);
      y = Math.max(ly2, ry2 + 5) + 4;
    }

    // === TERMS & CONDITIONS + AUTHORIZED SIGNATURE ===
    if (y > 260) { pdf.addPage(); y = 20; }
    const ty = y;
    let tly = ty, aly = ty;
    pdf.setFontSize(10);
    bold('Terms & Conditions', m, tly); tly += 7;
    pdf.setFontSize(9);
    if (invoice.terms_conditions) {
      pdf.splitTextToSize(invoice.terms_conditions, 90).forEach((l: string) => {
        pdf.text(l, m, tly); tly += 4;
      });
    } else {
      pdf.text('1. Goods once sold will not be taken back.', m, tly); tly += 4;
      pdf.text('2. Interest @ 24% p.a. will be charged for delayed payment.', m, tly);
    }
    bold('Authorized Signature', 105, aly); aly += 30;
    pdf.setFontSize(9);
    pdf.text(sel.business_name, 105, aly);
    y = Math.max(tly, aly + 5);

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
