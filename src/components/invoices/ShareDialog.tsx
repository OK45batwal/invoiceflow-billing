import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  const printRef = useRef<HTMLDivElement>(null);
  const totalDiscount = (items || []).reduce((sum, item) =>
    sum + item.rate * item.quantity * item.discount_pct / 100, 0);
  const lineTotal = (item: any) => item.rate * (1 - item.discount_pct / 100) * item.quantity;
  const taxableAmount = (items || []).reduce((sum, item) => sum + lineTotal(item), 0);
  const isIGST = isGst && Number(invoice.igst_total) > 0;
  const s = invoice.customer_snapshot;
  const sel = invoice.seller_snapshot;

  const generatePdf = async (): Promise<jsPDF> => {
    if (!printRef.current) return new jsPDF('p', 'mm', 'a4');
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const m = 10;
    const iw = pw - m * 2;
    const ih = (canvas.height * iw) / canvas.width;
    let pos = 0;
    for (let page = 0; pos < ih; page++) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', m, m - pos, iw, ih);
      pos += ph - m * 2;
    }
    return pdf;
  };

  const downloadPDF = async () => {
    showToast('Generating PDF...', 'info');
    const pdf = await generatePdf();
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

  const handlePrint = async () => {
    showToast('Generating PDF...', 'info');
    onClose();
    const pdf = await generatePdf();
    window.open(URL.createObjectURL(pdf.output('blob')), '_blank');
  };

  const handleWhatsApp = async () => {
    showToast('Preparing PDF...', 'info');
    const pdf = await generatePdf();
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
    <>
      {/* Hidden invoice HTML for PDF capture */}
      <div style={{ position: 'relative' }}>
        <div ref={printRef} className="bg-white text-slate-800 p-0 max-w-2xl mx-auto text-xs font-sans select-text" style={{ position: 'absolute', left: 0, top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1, width: '672px' }}>
        <div className="bg-slate-800 text-white px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-sm tracking-wide">{sel.business_name}</div>
              <div className="text-[8px] text-slate-300 leading-relaxed mt-0.5">{sel.address}, {sel.city}, {sel.state}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold uppercase tracking-wider text-white">{isGst ? 'TAX INVOICE' : 'CASH MEMO'}</div>
              {isGst && <div className="text-[7px] uppercase tracking-widest text-amber-300 font-semibold">Original</div>}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-[9px] text-slate-600">
          <div className="flex gap-6">
            <span><span className="font-semibold text-slate-700">{isGst ? 'Invoice' : 'Bill'} No:</span> {invoice.invoice_number}</span>
            <span><span className="font-semibold text-slate-700">Date:</span> {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span>
            {invoice.due_date && <span><span className="font-semibold text-slate-700">Due:</span> {new Date(invoice.due_date).toLocaleDateString('en-IN')}</span>}
          </div>
          {isGst && <span><span className="font-semibold text-slate-700">Place of Supply:</span> {invoice.place_of_supply}</span>}
        </div>
        <div className="grid grid-cols-2 gap-0 px-6 py-3 border-b border-slate-200">
          <div className="pr-4">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bill From</div>
            <div className="text-[9px] leading-relaxed text-slate-700">
              <div className="font-semibold text-slate-800">{sel.business_name}</div>
              {sel.gstin && <div className="text-slate-500">GSTIN: {sel.gstin}</div>}
              <div className="text-slate-500">{sel.address}, {sel.city}, {sel.state}</div>
              <div className="text-slate-500">Phone: {sel.phone}</div>
            </div>
          </div>
          <div className="pl-4 border-l border-slate-200">
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bill To</div>
            <div className="text-[9px] leading-relaxed text-slate-700">
              <div className="font-semibold text-slate-800">{s.name}</div>
              {s.gstin && <div className="text-slate-500">GSTIN: {s.gstin}</div>}
              <div className="text-slate-500">{s.address}, {s.city}, {s.state}</div>
              <div className="text-slate-500">Phone: {s.mobile}</div>
              {s.email && <div className="text-slate-500">Email: {s.email}</div>}
            </div>
          </div>
        </div>
        <div className="px-6 py-3">
          <table className="w-full text-left border-collapse text-[9px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[8px] tracking-wider">
                <th className="p-1.5 text-center w-6">#</th>
                <th className="p-1.5">Item</th>
                {isGst && <th className="p-1.5 text-center w-12">HSN</th>}
                <th className="p-1.5 text-right w-10">Qty</th>
                <th className="p-1.5 text-right w-14">Price</th>
                {isGst && <th className="p-1.5 text-right w-12">GST %</th>}
                <th className="p-1.5 text-right w-16">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                  <td className="p-1.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-1.5 font-medium text-slate-800">{item.product_name}</td>
                  {isGst && <td className="p-1.5 text-center text-slate-500">{item.hsn_code || '-'}</td>}
                  <td className="p-1.5 text-right text-slate-700">{item.quantity}</td>
                  <td className="p-1.5 text-right text-slate-700">\u20B9{item.rate.toFixed(2)}</td>
                  {isGst && <td className="p-1.5 text-right text-slate-600">{item.gst_rate}%</td>}
                  <td className="p-1.5 text-right font-semibold text-slate-800">\u20B9{lineTotal(item).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end px-6 pb-3">
          <div className="w-56 bg-slate-50 rounded-lg border border-slate-200 p-3">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-slate-500">{isGst ? 'Taxable Amount' : 'Subtotal'}</span>
                <span className="font-semibold text-slate-800">\u20B9{taxableAmount.toFixed(2)}</span>
              </div>
              {isGst && !isIGST && Number(invoice.cgst_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CGST (9%)</span>
                  <span className="text-slate-700">\u20B9{Number(invoice.cgst_total).toFixed(2)}</span>
                </div>
              )}
              {isGst && !isIGST && Number(invoice.sgst_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">SGST (9%)</span>
                  <span className="text-slate-700">\u20B9{Number(invoice.sgst_total).toFixed(2)}</span>
                </div>
              )}
              {isGst && isIGST && Number(invoice.igst_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">IGST</span>
                  <span className="text-slate-700">\u20B9{Number(invoice.igst_total).toFixed(2)}</span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="text-slate-600">-\u20B9{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {!isGst && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-slate-700">\u20B90.00</span>
                </div>
              )}
              {Number(invoice.round_off) !== 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Round Off</span>
                  <span className="text-slate-700">{Number(invoice.round_off).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-1.5 mt-1.5 flex justify-between font-bold text-slate-800">
                <span className="uppercase text-[10px]">{isGst ? 'Grand Total' : 'TOTAL'}</span>
                <span className="text-sm">\u20B9{Number(invoice.grand_total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-2 border-t border-slate-200 bg-slate-50/50">
          <span className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Amount in Words: </span>
          <span className="text-[9px] font-medium text-slate-700 italic">{numberToWords(Number(invoice.grand_total))}</span>
        </div>
        <div className="grid grid-cols-2 gap-0 px-6 py-3 border-t border-slate-200">
          <div className="text-[8px] text-slate-500 space-y-0.5">
            <div className="font-bold text-slate-700 uppercase text-[8px] tracking-wide mb-1">Bank Details</div>
            <div>Bank: <span className="font-medium text-slate-700">{sel.bank_name || '-'}</span></div>
            <div>A/C: <span className="font-medium text-slate-700">{sel.account_number || '-'}</span></div>
            <div>IFSC: <span className="font-medium text-slate-700">{sel.ifsc_code || '-'}</span></div>
            {sel.upi_id && <div>UPI: <span className="font-medium text-slate-700">{sel.upi_id}</span></div>}
          </div>
          <div className="flex flex-col items-end justify-start" />
        </div>
        <div className="grid grid-cols-2 gap-0 px-6 py-3 border-t border-slate-200">
          <div className="pr-4">
            <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">Terms &amp; Conditions</div>
            <div className="text-[8px] text-slate-500 leading-relaxed whitespace-pre-line">{invoice.terms_conditions || '1. Goods once sold will not be taken back.\n2. Interest @ 24% p.a. for delayed payment.'}</div>
          </div>
          <div className="flex flex-col items-end justify-end pl-4 border-l border-slate-200">
            <div className="text-right">
              <div className="text-[8px] text-slate-500">For <span className="font-semibold text-slate-700">{sel.business_name}</span></div>
              <div className="w-28 border-b border-dashed border-slate-300 mt-5 mb-0.5" />
              <div className="text-[9px] font-semibold text-slate-700">Authorized Signature</div>
            </div>
          </div>
        </div>
        </div>
      </div>

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
    </>
  );
};
