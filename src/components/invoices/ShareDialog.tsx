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
    let y = 15;
    const ln = () => { y += 6; };
    const hr = () => { y += 3; pdf.line(10, y, 200, y); ln(); };
    const bold = (t: string, x: number, y: number, opts?: any) => { pdf.setFont('helvetica', 'bold'); pdf.text(t, x, y, opts); pdf.setFont('helvetica', 'normal'); };
    const s = invoice.customer_snapshot;
    const sel = invoice.seller_snapshot;
    const tot = invoice;

    pdf.setFontSize(16);
    pdf.text(isGst ? 'TAX INVOICE' : 'INVOICE', 105, y, { align: 'center' }); ln(); hr();
    pdf.setFontSize(10);
    pdf.text(`Invoice: ${invoice.invoice_number}`, 10, y); ln();
    pdf.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 10, y); ln();
    if (invoice.due_date) pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 10, y); ln();
    pdf.text(`Place of Supply: ${invoice.place_of_supply}`, 10, y); ln(); hr();

    bold('Seller', 10, y); ln();
    pdf.setFontSize(10);
    pdf.text(`${sel.business_name}`, 10, y); ln();
    pdf.text(`${sel.address}, ${sel.city}, ${sel.state}`, 10, y); ln();
    pdf.text(`Phone: ${sel.phone}`, 10, y); ln();
    if (sel.gstin) pdf.text(`GSTIN: ${sel.gstin}`, 10, y);
    if (sel.pan) pdf.text(`PAN: ${sel.pan}`, 10, y);
    ln(); hr();

    bold('Customer', 10, y); ln();
    pdf.setFontSize(10);
    pdf.text(`${s.name}`, 10, y); ln();
    if (s.company_name) pdf.text(s.company_name, 10, y); ln();
    pdf.text(`${s.address}, ${s.city}, ${s.state}`, 10, y); ln();
    pdf.text(`Mobile: ${s.mobile}`, 10, y); ln();
    if (s.gstin) pdf.text(`GSTIN: ${s.gstin}`, 10, y);
    ln(); hr();

    const igst = Number(invoice.igst_total) > 0;
    const itemsToPrint = items || [];
    bold('Items', 10, y); ln();
    pdf.setFontSize(8);
    const hdr = isGst
      ? `#  Item                         HSN    Qty  Rate     Disc   GST%  ${igst ? 'IGST' : 'CGST  SGST'}  Amount`
      : `#  Item                         HSN    Qty  Rate     Disc   Amount`;
    pdf.setFont('helvetica', 'bold');
    pdf.text(hdr, 10, y); ln();
    pdf.setFont('helvetica', 'normal');
    itemsToPrint.forEach((item: any, i: number) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const name = (item.product_name || '').padEnd(24, ' ').slice(0, 24);
      const hsn = (item.hsn_code || '-').padEnd(6, ' ');
      const qty = String(item.quantity).padStart(4, ' ');
      const rate = item.rate.toFixed(2).padStart(7, ' ');
      const disc = item.discount_pct ? item.discount_pct + '%' : '    ';
      if (isGst) {
        const gst = String(item.gst_rate).padStart(4, ' ');
        const tax = igst
          ? item.igst_amount.toFixed(2).padStart(6, ' ')
          : `${item.cgst_amount.toFixed(2).padStart(5, ' ')} ${item.sgst_amount.toFixed(2).padStart(5, ' ')}`;
        const amt = item.amount.toFixed(2).padStart(8, ' ');
        pdf.text(`${i + 1}. ${name} ${hsn} ${qty} ${rate} ${disc} ${gst} ${tax} ${amt}`, 10, y);
      } else {
        const amt = item.amount.toFixed(2).padStart(8, ' ');
        pdf.text(`${i + 1}. ${name} ${hsn} ${qty} ${rate} ${disc} ${amt}`, 10, y);
      }
      ln();
    });
    hr();

    pdf.setFontSize(10);
    pdf.text(`Subtotal:       \u20B9${Number(tot.subtotal).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (isGst && Number(tot.cgst_total) > 0) pdf.text(`CGST:           \u20B9${Number(tot.cgst_total).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (isGst && Number(tot.sgst_total) > 0) pdf.text(`SGST:           \u20B9${Number(tot.sgst_total).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (isGst && Number(tot.igst_total) > 0) pdf.text(`IGST:           \u20B9${Number(tot.igst_total).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    if (Number(tot.round_off) !== 0) pdf.text(`Round Off:      \u20B9${Number(tot.round_off).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Grand Total:    \u20B9${Number(tot.grand_total).toFixed(2)}`, 130, y, { align: 'right' }); ln();
    pdf.setFont('helvetica', 'normal');

    pdf.setFontSize(9);
    pdf.text(`Amount Chargeable (in words): ${numberToWords(Number(tot.grand_total))}`, 10, y); ln();
    if (sel.bank_name) {
      hr();
      pdf.setFontSize(10);
      bold('Bank Details', 10, y); ln();
      pdf.setFontSize(9);
      pdf.text(`Bank: ${sel.bank_name}`, 10, y); ln();
      if (sel.branch) pdf.text(`Branch: ${sel.branch}`, 10, y); ln();
      if (sel.account_number) pdf.text(`Account: ${sel.account_number}`, 10, y); ln();
      if (sel.ifsc_code) pdf.text(`IFSC: ${sel.ifsc_code}`, 10, y); ln();
      if (sel.upi_id) pdf.text(`UPI: ${sel.upi_id}`, 10, y);
    }
    if (invoice.notes) { ln(); pdf.setFontSize(9); pdf.text(`Notes: ${invoice.notes}`, 10, y); }

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
    setTimeout(() => window.print(), 200);
  };

  const handleWhatsApp = async () => {
    showToast('Preparing PDF...', 'info');
    const pdf = generatePdf();
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `${invoice.invoice_number}.pdf`, { type: 'application/pdf' });

    const shareData = {
      files: [pdfFile],
      title: `Invoice ${invoice.invoice_number}`,
      text: `*${isGst ? 'TAX INVOICE' : 'INVOICE'}: ${invoice.invoice_number}*\nCustomer: ${invoice.customer_snapshot.name}\nAmount: \u20B9${Number(invoice.grand_total).toFixed(2)}`
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!', 'success');
        onClose();
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') { onClose(); return; }
      }
    }

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
    showToast('PDF downloaded & WhatsApp opened! Attach the PDF file.', 'success');
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
