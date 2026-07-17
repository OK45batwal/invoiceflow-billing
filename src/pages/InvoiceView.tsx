import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { calculateInvoiceTotals, numberToWords } from '../utils/gstEngine';
import { ShareDialog } from '../components/invoices/ShareDialog';
import { ArrowLeft, Share2, Printer, RefreshCw } from 'lucide-react';

interface InvoiceViewProps {
  invoiceId: string;
  onBack?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoiceId, onBack }) => {
  const { invoices, showToast, refreshData } = useApp();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setInvoice(inv);
      setLoading(false);
    } else {
      refreshData().then(() => {
        const found = invoices.find(i => i.id === invoiceId);
        if (found) setInvoice(found);
        else showToast('Invoice not found', 'danger');
        setLoading(false);
      });
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white gap-4 p-8">
        <h2 className="text-xl font-bold text-slate-800">Invoice Not Found</h2>
        <p className="text-sm text-slate-500">The invoice you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const isGst = invoice.invoice_type === 'GST';
  const items = invoice.items || [];
  const totals = calculateInvoiceTotals(items, invoice.seller_snapshot, invoice.place_of_supply);
  const isIGST = isGst && totals.igst_total > 0;
  const s = invoice.customer_snapshot;
  const sel = invoice.seller_snapshot;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800">{invoice.invoice_number}</h1>
              <p className="text-xs text-slate-500">Shareable Invoice View</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShareOpen(true)} className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-soft hover:shadow-premium transition-all">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button onClick={() => window.print()} className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-white text-black p-6 md:p-8 border border-slate-200 rounded-xl shadow-sm text-xs font-sans select-text">
          <div className="flex justify-between items-start border-b border-black pb-4">
            <div className="space-y-1">
              {sel.logo_url ? (
                <img src={sel.logo_url} alt="Logo" className="h-10 object-contain mb-2 max-w-[120px]" />
              ) : (
                <div className="font-extrabold text-base tracking-wider uppercase text-slate-800">{sel.business_name}</div>
              )}
              <div className="font-semibold">{sel.business_name}</div>
              <div className="text-[10px] leading-relaxed max-w-xs">{sel.address}, {sel.city}, {sel.state}</div>
              <div className="text-[10px]">Phone: {sel.phone} {sel.alt_phone ? `/ ${sel.alt_phone}` : ''}</div>
              {sel.email && <div className="text-[10px]">Email: {sel.email}</div>}
              {sel.gstin && <div className="text-[10px] font-bold">GSTIN: {sel.gstin}</div>}
              {sel.pan && <div className="text-[10px] font-bold">PAN: {sel.pan}</div>}
            </div>
            <div className="text-right space-y-1">
              <div className="text-lg font-extrabold uppercase tracking-wide border-b border-black pb-1 mb-2">
                {isGst ? 'TAX INVOICE' : 'INVOICE'}
              </div>
              <div>Invoice No: <strong>{invoice.invoice_number}</strong></div>
              <div>Date: {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</div>
              {invoice.due_date && <div>Due Date: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</div>}
              <div>Supply Place: <strong>{invoice.place_of_supply}</strong></div>
              {isGst && invoice.reverse_charge && <div>Reverse Charge: <strong>Yes</strong></div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b border-black">
            <div>
              <div className="font-bold uppercase text-[10px] mb-1">Details of Receiver (Billed To):</div>
              <div className="font-bold">{s.name}</div>
              {s.company_name && <div className="font-semibold">{s.company_name}</div>}
              <div className="text-[10px] leading-relaxed">{s.address}, {s.city}, {s.state}</div>
              <div className="text-[10px]">Mobile: {s.mobile}</div>
              {s.gstin && <div className="font-bold">GSTIN: {s.gstin}</div>}
            </div>
            <div className="border-l border-black pl-4">
              <div className="font-bold uppercase text-[10px] mb-1">Payment & Shipping:</div>
              <div>Payment Method: <strong>{invoice.payment_mode}</strong></div>
              <div>Payment Status: <strong className="uppercase">{invoice.payment_status}</strong></div>
            </div>
          </div>

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
                  {isGst && (
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
                  )}
                  <th className="p-1.5 text-right w-16">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">{idx + 1}</td>
                    <td className="border-r border-black p-1.5 font-bold">
                      {item.product_name}
                      {item.description && <div className="text-[8px] font-normal text-gray-600 leading-tight">{item.description}</div>}
                    </td>
                    <td className="border-r border-black p-1.5 text-center">{item.hsn_code || '-'}</td>
                    <td className="border-r border-black p-1.5 text-right">{item.quantity}</td>
                    <td className="border-r border-black p-1.5 text-center">{item.unit}</td>
                    <td className="border-r border-black p-1.5 text-right">{Number(item.rate).toFixed(2)}</td>
                    <td className="border-r border-black p-1.5 text-right">{item.discount_pct}%</td>
                    {isGst && (
                      <>
                        <td className="border-r border-black p-1.5 text-right">{item.gst_rate}%</td>
                        {isIGST ? (
                          <td className="border-r border-black p-1.5 text-right">{Number(item.igst_amount).toFixed(2)}</td>
                        ) : (
                          <>
                            <td className="border-r border-black p-1.5 text-right">{Number(item.cgst_amount).toFixed(2)}</td>
                            <td className="border-r border-black p-1.5 text-right">{Number(item.sgst_amount).toFixed(2)}</td>
                          </>
                        )}
                      </>
                    )}
                    <td className="p-1.5 text-right font-bold">{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}

                <tr className="border-t border-black font-bold">
                  <td colSpan={isGst ? (isIGST ? 9 : 10) : 7} className="border-r border-black p-1.5 text-right uppercase">Subtotal{isGst ? ' (Taxable Value)' : ''}:</td>
                  <td className="p-1.5 text-right">{Number(totals.subtotal).toFixed(2)}</td>
                </tr>
                {isGst && isIGST && (
                  <tr className="font-bold text-[9px]">
                    <td colSpan={9} className="border-r border-black p-1.5 text-right uppercase">IGST:</td>
                    <td className="p-1.5 text-right">{totals.igst_total.toFixed(2)}</td>
                  </tr>
                )}
                {isGst && !isIGST && (
                  <>
                    <tr className="font-bold text-[9px]">
                      <td colSpan={10} className="border-r border-black p-1.5 text-right uppercase">CGST:</td>
                      <td className="p-1.5 text-right">{totals.cgst_total.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold text-[9px]">
                      <td colSpan={10} className="border-r border-black p-1.5 text-right uppercase">SGST:</td>
                      <td className="p-1.5 text-right">{totals.sgst_total.toFixed(2)}</td>
                    </tr>
                  </>
                )}
                {Number(totals.round_off) !== 0 && (
                  <tr className="font-bold text-[9px]">
                    <td colSpan={isGst ? (isIGST ? 9 : 10) : 7} className="border-r border-black p-1.5 text-right uppercase">Round Off:</td>
                    <td className="p-1.5 text-right">{totals.round_off.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-black font-extrabold text-[11px] bg-slate-50">
                  <td colSpan={isGst ? (isIGST ? 9 : 10) : 7} className="border-r border-black p-1.5 text-right uppercase tracking-wider">Grand Total (\u20B9):</td>
                  <td className="p-1.5 text-right text-base font-extrabold">{totals.grand_total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="py-2 border-b border-black">
            <span className="font-bold text-[9px] uppercase tracking-wide mr-1.5">Amount Chargeable (in words):</span>
            <span className="font-semibold italic text-[10px]">{numberToWords(totals.grand_total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1 font-semibold text-[9px] text-gray-700">
              <div className="font-bold text-black uppercase text-[10px] mb-1">Our Banking Credentials:</div>
              <div>Bank: <strong className="text-black">{sel.bank_name || '-'}</strong></div>
              <div>Branch: <strong className="text-black">{sel.branch || '-'}</strong></div>
              <div>Acc No: <strong className="text-black">{sel.account_number || '-'}</strong></div>
              <div>IFSC: <strong className="text-black">{sel.ifsc_code || '-'}</strong></div>
              {sel.upi_id && <div>UPI ID: <strong className="text-black">{sel.upi_id}</strong></div>}
            </div>
            <div className="flex flex-col justify-between items-end text-right">
              <div className="space-y-1">
                <div className="text-[9px] text-gray-500 font-semibold">For <strong>{sel.business_name}</strong></div>
                <div className="h-12 flex items-center justify-end">
                  <div className="w-24 border-b border-dashed border-gray-400 mt-8" />
                </div>
                <div className="text-[10px] font-bold">Authorized Signatory</div>
              </div>
            </div>
          </div>

          <div className="border-t border-black pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-bold uppercase text-[9px] mb-1">Declaration / Terms:</div>
              <div className="text-[9px] text-gray-500 font-semibold leading-relaxed whitespace-pre-line">{invoice.terms_conditions}</div>
            </div>
            <div className="text-right flex flex-col justify-end text-[9px] text-gray-500 font-medium">
              <span>Invoice generated on computer. Signature may not be required.</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] text-slate-400 no-print">Powered by InvoiceFlow</p>
      </div>

      <ShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        invoice={invoice}
        items={items}
      />
    </div>
  );
};
