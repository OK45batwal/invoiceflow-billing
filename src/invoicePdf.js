import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});

function formatCurrency(value) {
  return inrFormatter.format(Number(value || 0));
}

function writeField(doc, label, value) {
  if (!value) {
    return;
  }
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(String(value));
}

function dataUrlToBuffer(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Buffer.from(base64, "base64");
}

function buildUpiLink(invoice, settings) {
  const upiId = String(settings?.upiId || "").trim();
  if (!upiId) {
    return "";
  }

  const payeeName = String(settings?.upiPayeeName || settings?.companyName || "").trim();
  const dueAmount = Number(invoice?.dueAmount ?? invoice?.total ?? 0);
  const amount = Math.max(0, dueAmount).toFixed(2);
  const note = encodeURIComponent(`Invoice ${invoice.invoiceNumber || invoice.id}`);
  const pa = encodeURIComponent(upiId);
  const pn = encodeURIComponent(payeeName || "Payment");
  return `upi://pay?pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${note}`;
}

function collectPdf(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function createInvoicePdfBuffer(invoice, settings = {}) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const output = collectPdf(doc);

  let qrBuffer = null;
  const upiLink = buildUpiLink(invoice, settings);
  if (upiLink) {
    try {
      const qrDataUrl = await QRCode.toDataURL(upiLink, { margin: 1, width: 180 });
      qrBuffer = dataUrlToBuffer(qrDataUrl);
    } catch (_error) {
      qrBuffer = null;
    }
  }

  const companyName = String(settings.companyName || "My Company");
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#111827").text(companyName);
  doc.moveDown(0.15);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  if (settings.companyAddress) {
    doc.text(settings.companyAddress);
  }
  if (settings.companyPhone || settings.companyEmail) {
    doc.text([settings.companyPhone, settings.companyEmail].filter(Boolean).join(" | "));
  }
  if (settings.companyGstin) {
    doc.text(`GSTIN: ${settings.companyGstin}`);
  }

  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111827").text(`Invoice ${invoice.invoiceNumber || `#${invoice.id}`}`);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  const invoiceTypeText = String(invoice.gstType || "intra") === "none" ? "Without GST" : "With GST";
  doc.text(`Invoice Type: ${invoiceTypeText}`);
  doc.text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleString("en-IN")}`);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`);
  doc.text(`Status: ${String(invoice.status || "unpaid").toUpperCase()}`);
  doc.moveDown(0.7);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Bill To");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  writeField(doc, "Name", invoice.customer?.name);
  writeField(doc, "Email", invoice.customer?.email);
  writeField(doc, "Phone", invoice.customer?.phone);
  writeField(doc, "Address", invoice.customer?.address);
  writeField(doc, "GSTIN", invoice.customer?.gstin);
  writeField(doc, "State Code", invoice.customer?.stateCode);

  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Items");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(9).fillColor("#334155");

  for (const item of invoice.items || []) {
    const gstLabel =
      String(invoice.gstType || "intra") === "none"
        ? "No GST"
        : Number(item.igst || 0) > 0
          ? `IGST ${formatCurrency(item.igst)}`
          : `CGST ${formatCurrency(item.cgst)} + SGST ${formatCurrency(item.sgst)}`;
    const line = `${item.productName || "Item"} | HSN/SAC ${item.hsnSac || "-"} | Qty ${item.quantity} | Unit ${formatCurrency(item.unitPrice)} | Taxable ${formatCurrency(item.taxableAmount)} | ${gstLabel} | Total ${formatCurrency(item.lineTotal)}`;
    doc.text(line, { width: 520 });
  }

  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Totals");
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  doc.text(`Taxable Amount: ${formatCurrency(invoice.subtotalTaxable)}`);
  doc.text(`Line Discount: ${formatCurrency(invoice.lineDiscountTotal)}`);
  doc.text(`Invoice Discount: ${formatCurrency(invoice.invoiceDiscount)}`);
  doc.text(`Shipping: ${formatCurrency(invoice.shipping)}`);
  doc.text(`Round Off: ${formatCurrency(invoice.roundOff)}`);
  if (String(invoice.gstType || "intra") === "none") {
    doc.text("GST: Not Applied");
  } else {
    doc.text(`CGST: ${formatCurrency(invoice.cgstTotal)}`);
    doc.text(`SGST: ${formatCurrency(invoice.sgstTotal)}`);
    doc.text(`IGST: ${formatCurrency(invoice.igstTotal)}`);
  }
  doc.font("Helvetica-Bold").text(`Total: ${formatCurrency(invoice.total)}`);
  doc.font("Helvetica").text(`Paid: ${formatCurrency(invoice.paidAmount)}`);
  doc.font("Helvetica-Bold").text(`Due: ${formatCurrency(invoice.dueAmount)}`);

  if (invoice.notes) {
    doc.moveDown(0.6);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Notes");
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(invoice.notes);
  }

  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Payment Details");
  doc.moveDown(0.15);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  if (settings.upiId) {
    doc.text(`UPI ID: ${settings.upiId}`);
  }
  if (settings.bankName) {
    doc.text(`Bank: ${settings.bankName}`);
  }
  if (settings.bankAccountName) {
    doc.text(`Account Name: ${settings.bankAccountName}`);
  }
  if (settings.bankAccountNumber) {
    doc.text(`Account Number: ${settings.bankAccountNumber}`);
  }
  if (settings.bankIfsc) {
    doc.text(`IFSC: ${settings.bankIfsc}`);
  }

  if (qrBuffer) {
    const y = doc.y + 8;
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text("Scan UPI QR to pay", 380, y);
    doc.image(qrBuffer, 380, y + 14, { width: 120, height: 120 });
  }

  doc.end();
  return output;
}
