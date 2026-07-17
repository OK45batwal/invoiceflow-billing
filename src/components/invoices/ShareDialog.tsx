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
    const pw = 210, m = 12, r = pw - m;
    let y = 15;
    const ln = (h = 5) => { y += h; };
    const hr = (h = 2) => { y += h; pdf.setDrawColor(200); pdf.line(m, y, r, y); pdf.setDrawColor(0); y += 3; };
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
    const isIGST = isGst && Number(invoice.igst_total) > 0;

    // === HEADER BAR (dark background) ===
    pdf.setFillColor(30, 41, 59); // slate-800
    pdf.rect(m - 2, y - 6, r - m + 4, 18, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    bold(sel.business_name, m, y);
    pdf.setFontSize(7);
    pdf.setTextColor(200, 200, 210);
    const addrLines = pdf.splitTextToSize(`${sel.address}, ${sel.city}, ${sel.state}`, 80);
    addrLines.forEach((l: string, i: number) => { pdf.text(l, m, y + 3 + i * 3); });
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(isGst ? 'TAX INVOICE' : 'CASH MEMO', r, y, { align: 'right' });
    if (isGst) {
      pdf.setFontSize(6);
      pdf.setTextColor(252, 211, 77); // amber-300
      pdf.text('Original', r, y + 4, { align: 'right' });
    }
    ln(16);
    pdf.setTextColor(0, 0, 0);

    // === INVOICE META BAR ===
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(m - 2, y - 3, r - m + 4, 8, 'F');
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.text(`${isGst ? 'Invoice' : 'Bill'} No: ${invoice.invoice_number}`, m, y + 1);
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, m + 50, y + 1);
    if (invoice.due_date) pdf.text(`Due: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, m + 95, y + 1);
    if (isGst) pdf.text(`Place of Supply: ${invoice.place_of_supply}`, r, y + 1, { align: 'right' });
    ln(8);

    // === BILL FROM / BILL TO ===
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    bold('Bill From', m, y);
    bold('Bill To', 105, y);
    ln(4);
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    let ly = y, ry = y;
    pdf.setFont('helvetica', 'bold');
    pdf.text(sel.business_name, m, ly); pdf.setFont('helvetica', 'normal'); ly += 4;
    if (sel.gstin) { pdf.setTextColor(100, 116, 139); pdf.text(`GSTIN: ${sel.gstin}`, m, ly); ly += 4; }
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${sel.address}, ${sel.city}, ${sel.state}`, m, ly); ly += 4;
    pdf.text(`Phone: ${sel.phone}`, m, ly); ly += 3;
    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'bold');
    pdf.text(s.name, 105, ry); pdf.setFont('helvetica', 'normal'); ry += 4;
    if (s.company_name) { pdf.text(s.company_name, 105, ry); ry += 4; }
    if (s.gstin) { pdf.setTextColor(100, 116, 139); pdf.text(`GSTIN: ${s.gstin}`, 105, ry); ry += 4; }
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${s.address}, ${s.city}, ${s.state}`, 105, ry); ry += 4;
    pdf.text(`Phone: ${s.mobile}`, 105, ry); ry += 3;
    if (s.email) pdf.text(`Email: ${s.email}`, 105, ry);
    y = Math.max(ly, ry) + 2;
    hr();

    // === ITEMS TABLE ===
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(m, y - 3, r - m, 5.5, 'F');
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    let cx = m;
    const colW = (r - m) / (isGst ? 7 : 5);
    const ct = (t: string, w: number, align: 'left' | 'right' | 'center' = 'left') => {
      const x = cx;
      cx += w;
      if (align === 'right') pdf.text(t, x + w - 2, y, { align: 'right' });
      else if (align === 'center') pdf.text(t, x + w / 2, y, { align: 'center' });
      else pdf.text(t, x + 1, y);
    };
    ct('#', colW * 0.3, 'center');
    ct('Item', isGst ? colW * 2.2 : colW * 2.0);
    if (isGst) ct('HSN', colW * 0.8, 'center');
    ct('Qty', colW * 0.7, 'right');
    ct('Price', colW * 1, 'right');
    if (isGst) ct('GST%', colW * 0.8, 'right');
    ct('Amount', isGst ? colW * 1.2 : colW * 1.0, 'right');
    ln(5);
    pdf.setFont('helvetica', 'normal');
    itemsToPrint.forEach((item: any, i: number) => {
      if (y > 275) { pdf.addPage(); y = 20; }
      cx = m;
      pdf.setTextColor(100, 116, 139);
      ct(String(i + 1), colW * 0.3, 'center');
      pdf.setTextColor(51, 65, 85);
      ct(item.product_name || '', isGst ? colW * 2.2 : colW * 2.0);
      if (isGst) { pdf.setTextColor(100, 116, 139); ct(item.hsn_code || '-', colW * 0.8, 'center'); }
      pdf.setTextColor(100, 116, 139);
      ct(String(item.quantity), colW * 0.7, 'right');
      ct(`\u20B9${item.rate.toFixed(2)}`, colW * 1, 'right');
      if (isGst) ct(`${item.gst_rate}%`, colW * 0.8, 'right');
      pdf.setFont('helvetica', 'bold');
      ct(`\u20B9${lineTotal(item).toFixed(2)}`, isGst ? colW * 1.2 : colW * 1.0, 'right');
      pdf.setFont('helvetica', 'normal');
      ln(4.5);
      pdf.setDrawColor(230);
      pdf.line(m, y - 1, r, y - 1);
      pdf.setDrawColor(0);
    });
    ln(1);

    // === TOTALS PANEL ===
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    const tLeft = r - 80, tW = 78;
    pdf.roundedRect(tLeft, y - 2, tW, 40, 2, 2, 'FD');
    pdf.setDrawColor(0);
    let ty2 = y + 1;
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(7);
    const tLine = (label: string, val: string, isBold = false) => {
      if (isBold) { pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 59); }
      pdf.text(label, tLeft + 3, ty2);
      pdf.text(val, tLeft + tW - 3, ty2, { align: 'right' });
      if (isBold) { pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105); }
      ty2 += 4;
    };
    if (isGst) {
      tLine('Taxable Amount:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (!isIGST && Number(invoice.cgst_total) > 0) tLine('CGST (9%):', `\u20B9${Number(invoice.cgst_total).toFixed(2)}`);
      if (!isIGST && Number(invoice.sgst_total) > 0) tLine('SGST (9%):', `\u20B9${Number(invoice.sgst_total).toFixed(2)}`);
      if (isIGST && Number(invoice.igst_total) > 0) tLine('IGST:', `\u20B9${Number(invoice.igst_total).toFixed(2)}`);
      if (totalDiscount > 0) tLine('Discount:', `-\u20B9${totalDiscount.toFixed(2)}`);
    } else {
      tLine('Subtotal:', `\u20B9${taxableAmount.toFixed(2)}`);
      if (totalDiscount > 0) tLine('Discount:', `-\u20B9${totalDiscount.toFixed(2)}`);
      tLine('Delivery:', '\u20B90.00');
    }
    if (Number(invoice.round_off) !== 0) tLine('Round Off:', `${Number(invoice.round_off).toFixed(2)}`);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(tLeft + 3, ty2 - 1.5, tLeft + tW - 3, ty2 - 1.5);
    pdf.setDrawColor(0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    pdf.text(isGst ? 'GRAND TOTAL' : 'TOTAL', tLeft + 3, ty2 + 1);
    pdf.text(`\u20B9${Number(invoice.grand_total).toFixed(2)}`, tLeft + tW - 3, ty2 + 1, { align: 'right' });
    y = ty2 + 8;
    pdf.setFont('helvetica', 'normal');
    y = ty2 + 8;

    // === AMOUNT IN WORDS ===
    pdf.setFillColor(248, 250, 252);
    pdf.rect(m, y - 1, r - m, 5, 'F');
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount in Words:', m, y + 1.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(numberToWords(Number(invoice.grand_total)), m + 24, y + 1.5);
    ln(6);

    // === BANK DETAILS + SCAN & PAY ===
    if (sel.bank_name || sel.upi_id) {
      if (y > 260) { pdf.addPage(); y = 20; }
      const bly = y;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(m, y - 1, r, y - 1);
      y = bly + 1;
      let ly2 = y, ry2 = y;
      pdf.setFontSize(6.5);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bank Details', m, ly2); ly2 += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      if (sel.bank_name) { pdf.text(`Bank: ${sel.bank_name}`, m, ly2); ly2 += 3.5; }
      if (sel.account_number) { pdf.text(`A/C: ${sel.account_number}`, m, ly2); ly2 += 3.5; }
      if (sel.ifsc_code) { pdf.text(`IFSC: ${sel.ifsc_code}`, m, ly2); ly2 += 3.5; }
      if (sel.upi_id) { pdf.text(`UPI: ${sel.upi_id}`, m, ly2); ly2 += 3.5; }
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan to Pay', r, ry2, { align: 'right' }); ry2 += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('QR code', r, ry2, { align: 'right' });
      y = Math.max(ly2, ry2 + 5) + 2;
    }

    // === TERMS & CONDITIONS + AUTHORIZED SIGNATURE ===
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setDrawColor(226, 232, 240);
    pdf.line(m, y - 1, r, y - 1);
    const ty3 = y;
    let tly = y + 2, aly = y + 2;
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Terms & Conditions', m, tly); tly += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    if (invoice.terms_conditions) {
      pdf.splitTextToSize(invoice.terms_conditions, 90).forEach((l: string) => {
        pdf.text(l, m, tly); tly += 3.5;
      });
    } else {
      pdf.text('1. Goods once sold will not be taken back.', m, tly); tly += 3.5;
      pdf.text('2. Interest @ 24% p.a. for delayed payment.', m, tly);
    }
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Authorized Signature', r, aly, { align: 'right' }); aly += 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(sel.business_name, r, aly, { align: 'right' });
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
