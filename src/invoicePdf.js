import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const amountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function formatAmount(value) {
  return amountFormatter.format(Number(value || 0));
}

function toText(value) {
  return String(value || "").trim();
}

function toUpperText(value) {
  const text = toText(value);
  return text ? text.toUpperCase() : "";
}

function normalizeAmount(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundMoney(value) {
  return Number((Math.round((Number(value) + Number.EPSILON) * 100) / 100).toFixed(2));
}

function splitLines(value) {
  return toText(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatPercent(value) {
  const numeric = normalizeAmount(value);
  if (Math.abs(numeric) < 0.001) {
    return "0";
  }
  if (Number.isInteger(numeric)) {
    return String(numeric);
  }
  return numeric.toFixed(2).replace(/\.?0+$/, "");
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return `${date.toLocaleDateString("en-IN")} ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })}`;
}

function normalizeGstType(value) {
  const normalized = String(value || "intra").toLowerCase();
  if (normalized === "none" || normalized === "without_gst" || normalized === "without-gst") {
    return "none";
  }
  if (normalized === "inter") {
    return "inter";
  }
  return "intra";
}

function ratiosToWidths(totalWidth, ratios) {
  // Convert ratio-based columns into integer widths while preserving full total width.
  const widths = [];
  let used = 0;
  for (let index = 0; index < ratios.length - 1; index += 1) {
    const width = Math.floor(totalWidth * ratios[index]);
    widths.push(width);
    used += width;
  }
  widths.push(totalWidth - used);
  return widths;
}

function widthsToPositions(startX, widths) {
  const positions = [startX];
  let cursor = startX;
  for (const width of widths) {
    cursor += width;
    positions.push(cursor);
  }
  return positions;
}

function drawHorizontalLine(doc, xStart, xEnd, y) {
  doc.moveTo(xStart, y).lineTo(xEnd, y).stroke();
}

function drawVerticalLines(doc, xStart, yStart, height, widths) {
  let cursor = xStart;
  for (let index = 0; index < widths.length - 1; index += 1) {
    cursor += widths[index];
    doc.moveTo(cursor, yStart).lineTo(cursor, yStart + height).stroke();
  }
}

function fitTextSize(doc, text, maxWidth, startSize, minSize) {
  let fontSize = startSize;
  doc.fontSize(fontSize);
  while (fontSize > minSize && doc.widthOfString(text) > maxWidth) {
    fontSize -= 1;
    doc.fontSize(fontSize);
  }
  return fontSize;
}

function fitSingleLineText(doc, value, maxWidth) {
  const text = toText(value) || "-";
  if (doc.widthOfString(text) <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  let trimmed = text;
  while (trimmed.length > 0 && doc.widthOfString(`${trimmed}${ellipsis}`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed ? `${trimmed}${ellipsis}` : ellipsis;
}

function inferItemTaxRate(item) {
  const configuredRate = normalizeAmount(item?.taxRate);
  if (configuredRate > 0) {
    return configuredRate;
  }
  const taxableAmount = normalizeAmount(item?.taxableAmount);
  const taxTotal = normalizeAmount(item?.cgst) + normalizeAmount(item?.sgst) + normalizeAmount(item?.igst);
  if (taxableAmount <= 0 || taxTotal <= 0) {
    return 0;
  }
  return roundMoney((taxTotal / taxableAmount) * 100);
}

function buildTaxRows(invoice) {
  // Group line items by effective GST rate so the tax table remains compact and readable.
  const gstType = String(invoice?.gstType || "intra");
  const groupedRows = new Map();
  for (const item of invoice?.items || []) {
    const rate = gstType === "none" ? 0 : inferItemTaxRate(item);
    const key = rate.toFixed(2);
    if (!groupedRows.has(key)) {
      groupedRows.set(key, { rate, taxable: 0, sgst: 0, cgst: 0, igst: 0 });
    }
    const row = groupedRows.get(key);
    row.taxable += normalizeAmount(item?.taxableAmount);
    row.sgst += normalizeAmount(item?.sgst);
    row.cgst += normalizeAmount(item?.cgst);
    row.igst += normalizeAmount(item?.igst);
  }

  let rows = [...groupedRows.values()]
    .sort((left, right) => left.rate - right.rate)
    .map((row) => ({
      taxable: roundMoney(row.taxable),
      sgstRate: gstType === "intra" ? roundMoney(row.rate / 2) : 0,
      sgstAmount: roundMoney(row.sgst),
      cgstRate: gstType === "intra" ? roundMoney(row.rate / 2) : 0,
      cgstAmount: roundMoney(row.cgst),
      igstRate: gstType === "inter" ? roundMoney(row.rate) : 0,
      igstAmount: roundMoney(row.igst)
    }));

  if (rows.length === 0) {
    rows = [
      {
        taxable: normalizeAmount(invoice?.subtotalTaxable),
        sgstRate: 0,
        sgstAmount: normalizeAmount(invoice?.sgstTotal),
        cgstRate: 0,
        cgstAmount: normalizeAmount(invoice?.cgstTotal),
        igstRate: 0,
        igstAmount: normalizeAmount(invoice?.igstTotal)
      }
    ];
  }

  if (rows.length > 3) {
    // Keep only two explicit slabs and merge the rest into one summary row.
    const head = rows.slice(0, 2);
    const tail = rows.slice(2);
    const merged = tail.reduce(
      (sum, row) => ({
        taxable: roundMoney(sum.taxable + row.taxable),
        sgstRate: Math.max(sum.sgstRate, row.sgstRate),
        sgstAmount: roundMoney(sum.sgstAmount + row.sgstAmount),
        cgstRate: Math.max(sum.cgstRate, row.cgstRate),
        cgstAmount: roundMoney(sum.cgstAmount + row.cgstAmount),
        igstRate: Math.max(sum.igstRate, row.igstRate),
        igstAmount: roundMoney(sum.igstAmount + row.igstAmount)
      }),
      { taxable: 0, sgstRate: 0, sgstAmount: 0, cgstRate: 0, cgstAmount: 0, igstRate: 0, igstAmount: 0 }
    );
    rows = [...head, merged];
  }

  return rows;
}

function twoDigitWords(number) {
  if (number < 20) {
    return ONES[number];
  }
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`.trim();
}

function threeDigitWords(number) {
  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  if (!hundreds) {
    return twoDigitWords(remainder);
  }
  if (!remainder) {
    return `${ONES[hundreds]} Hundred`;
  }
  return `${ONES[hundreds]} Hundred and ${twoDigitWords(remainder)}`;
}

function numberToWordsIndian(number) {
  // Convert number using Indian units (Crore/Lakh/Thousand) for amount-in-words.
  let value = Math.floor(Math.max(0, normalizeAmount(number)));
  if (!value) {
    return "Zero";
  }

  const parts = [];
  const crore = Math.floor(value / 10000000);
  if (crore) {
    parts.push(`${twoDigitWords(crore)} Crore`);
    value %= 10000000;
  }
  const lakh = Math.floor(value / 100000);
  if (lakh) {
    parts.push(`${twoDigitWords(lakh)} Lakh`);
    value %= 100000;
  }
  const thousand = Math.floor(value / 1000);
  if (thousand) {
    parts.push(`${twoDigitWords(thousand)} Thousand`);
    value %= 1000;
  }
  if (value) {
    parts.push(threeDigitWords(value));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function amountToWords(value) {
  const amount = Math.max(0, normalizeAmount(value));
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  if (!paise) {
    return `Rs ${numberToWordsIndian(rupees)} only`;
  }
  return `Rs ${numberToWordsIndian(rupees)} and ${numberToWordsIndian(paise)} Paise only`;
}

function normalizePaymentMode(invoice, settings) {
  // Strip symbols and map aliases so labels like "G/Pay", "gpay", "google pay" render consistently.
  const raw = toText(invoice?.paymentMode);
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mapped = {
    GPAY: "GPAY",
    GOOGLEPAY: "GPAY",
    UPI: "UPI",
    PAYTM: "PAYTM",
    PHONEPE: "PHONEPE",
    CASH: "CASH",
    CARD: "CARD",
    BANK: "BANK TRANSFER",
    BANKTRANSFER: "BANK TRANSFER",
    NETBANKING: "BANK TRANSFER",
    NEFT: "BANK TRANSFER",
    RTGS: "BANK TRANSFER",
    IMPS: "BANK TRANSFER"
  };
  if (mapped[cleaned]) {
    return mapped[cleaned];
  }
  if (settings?.upiId) {
    return "UPI";
  }
  if (settings?.bankName) {
    return "BANK TRANSFER";
  }
  return "-";
}

function normalizeCompanyProfile(profile = {}, fallback = {}) {
  return {
    name: toText(profile?.name ?? fallback?.name),
    address: toText(profile?.address ?? fallback?.address),
    email: toText(profile?.email ?? fallback?.email),
    phone: toText(profile?.phone ?? fallback?.phone),
    gstin: toText(profile?.gstin ?? fallback?.gstin),
    pan: toText(profile?.pan ?? fallback?.pan),
    state: toText(profile?.state ?? fallback?.state),
    stateCode: toText(profile?.stateCode ?? fallback?.stateCode)
  };
}

function getInvoiceCompanyProfile(invoice, settings) {
  const legacyCompany = {
    name: toText(settings?.companyName || "My Company"),
    address: toText(settings?.companyAddress),
    email: toText(settings?.companyEmail),
    phone: toText(settings?.companyPhone),
    gstin: toText(settings?.companyGstin),
    pan: toText(settings?.companyPan),
    state: toText(settings?.companyState),
    stateCode: toText(settings?.companyStateCode)
  };
  const gstType = String(invoice?.gstType || "intra").toLowerCase();
  const profileKey = gstType === "none" ? "nonGst" : "gst";
  const settingsProfile = normalizeCompanyProfile(settings?.companyProfiles?.[profileKey] || {}, legacyCompany);
  const invoiceProfile = normalizeCompanyProfile(invoice?.companyProfile || {}, settingsProfile);
  const hasInvoiceProfile = Object.values(invoiceProfile).some((value) => Boolean(toText(value)));
  return hasInvoiceProfile ? invoiceProfile : settingsProfile;
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

  const companyProfile = getInvoiceCompanyProfile(invoice, settings);
  const payeeName = String(settings?.upiPayeeName || companyProfile?.name || settings?.companyName || "").trim();
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

function renderNonGstInvoiceLayout(doc, context) {
  const {
    invoice,
    settings,
    companyProfile,
    companyName,
    companyPhone,
    companyAddressText,
    invoiceNumber,
    invoiceDate,
    amountWords,
    items,
    qtyTotal,
    amountTotal,
    grandTotal,
    upiQrBuffer
  } = context;

  const margin = 24;
  const x = margin;
  const y = margin;
  const w = doc.page.width - margin * 2;
  const h = doc.page.height - margin * 2;
  const bottom = y + h;
  const border = "#1a1f2b";
  const accent = "#24395b";

  const customerName = toUpperText(invoice.customer?.name) || "WALK-IN CUSTOMER";
  const customerAddressLines = splitLines(toText(invoice.customer?.address) || "-");
  const customerPhone = toText(invoice.customer?.phone);
  const paymentMode = normalizePaymentMode(invoice, settings);
  const dueDate = formatDate(invoice.dueDate);
  const createdDateTime = formatDateTime(invoice.createdAt);
  const invoiceStatus = toUpperText(invoice.status) || "UNPAID";

  doc.lineWidth(1).strokeColor(border).fillColor(border);
  doc.rect(x, y, w, h).stroke();

  const headerH = 94;
  doc.fillColor(accent).rect(x, y, w, headerH).fill();
  doc.fillColor("#ffffff");

  const headerNameSize = fitTextSize(doc, companyName, w - 210, 29, 17);
  doc.font("Times-Bold").fontSize(headerNameSize).text(companyName, x + 12, y + 11, { width: w - 210 });
  doc.font("Helvetica-Bold").fontSize(10.2);
  doc.text(fitSingleLineText(doc, toUpperText(companyAddressText || "-"), w - 24), x + 12, y + 52, {
    width: w - 24
  });
  const contactLine = [
    companyPhone ? `Phone: ${companyPhone}` : "",
    companyProfile?.email ? `Email: ${toText(companyProfile.email)}` : ""
  ]
    .filter(Boolean)
    .join("   ");
  doc.font("Helvetica").fontSize(9.8).text(fitSingleLineText(doc, contactLine || "-", w - 24), x + 12, y + 72, {
    width: w - 24
  });

  const infoY = y + headerH + 8;
  const infoH = 112;
  const infoSplitX = x + Math.floor(w * 0.62);
  doc.fillColor(border);
  doc.rect(x, infoY, w, infoH).stroke();
  doc.moveTo(infoSplitX, infoY).lineTo(infoSplitX, infoY + infoH).stroke();

  doc.font("Helvetica-Bold").fontSize(12).text("Bill To", x + 10, infoY + 8);
  doc.font("Helvetica-Bold").fontSize(12).text("Invoice Details", infoSplitX + 10, infoY + 8);

  let customerY = infoY + 30;
  doc.font("Helvetica-Bold").fontSize(12).text(customerName, x + 10, customerY, { width: infoSplitX - x - 20 });
  customerY += 20;
  for (const line of customerAddressLines.slice(0, 3)) {
    doc.font("Helvetica").fontSize(10.5).text(line, x + 10, customerY, { width: infoSplitX - x - 20 });
    customerY += 16;
  }
  if (customerPhone) {
    doc.font("Helvetica").fontSize(10.2).text(`Phone: ${customerPhone}`, x + 10, customerY, {
      width: infoSplitX - x - 20
    });
  }

  const detailX = infoSplitX + 10;
  const detailLabelW = 88;
  const detailValueW = x + w - detailX - detailLabelW - 12;
  const detailRows = [
    ["Invoice No.", invoiceNumber],
    ["Date", createdDateTime],
    ["Due Date", dueDate],
    ["Pay Mode", paymentMode],
    ["Status", invoiceStatus]
  ];
  let detailY = infoY + 30;
  for (const [label, value] of detailRows) {
    doc.font("Helvetica-Bold").fontSize(10.5).text(`${label} :`, detailX, detailY, { width: detailLabelW });
    doc.font("Helvetica").fontSize(10.5).text(fitSingleLineText(doc, value || "-", detailValueW), detailX + detailLabelW, detailY, {
      width: detailValueW
    });
    detailY += 17;
  }

  const tableY = infoY + infoH + 10;
  const tableHeaderH = 24;
  const tableBodyH = 220;
  const tableH = tableHeaderH + tableBodyH;
  const colWidths = ratiosToWidths(w, [0.08, 0.42, 0.14, 0.12, 0.12, 0.12]);
  const colX = widthsToPositions(x, colWidths);

  doc.lineWidth(0.9).strokeColor(border).fillColor(border);
  doc.rect(x, tableY, w, tableH).stroke();
  drawVerticalLines(doc, x, tableY, tableH, colWidths);
  doc.fillColor(accent).rect(x, tableY, w, tableHeaderH).fill();

  doc.fillColor("#ffffff");
  const tableHeaders = ["Sr", "Particulars", "HSN/SAC", "Qty", "Rate", "Amount"];
  for (let index = 0; index < tableHeaders.length; index += 1) {
    doc.font("Helvetica-Bold").fontSize(10.5).text(tableHeaders[index], colX[index], tableY + 7, {
      width: colWidths[index],
      align: "center"
    });
  }

  doc.fillColor(border);
  const rowH = 22;
  const maxRows = Math.max(1, Math.floor(tableBodyH / rowH));
  for (let row = 1; row <= maxRows; row += 1) {
    drawHorizontalLine(doc, x, x + w, tableY + tableHeaderH + row * rowH);
  }

  const drawCount = Math.min(items.length, maxRows);
  for (let index = 0; index < drawCount; index += 1) {
    const item = items[index];
    const rowTop = tableY + tableHeaderH + index * rowH;
    const rowValues = [
      String(index + 1),
      toText(item.productName) || "Item",
      toText(item.hsnSac) || "-",
      `${formatAmount(item.quantity)} ${toUpperText(item.unit) || "PCS"}`.trim(),
      formatAmount(item.unitPrice),
      formatAmount(item.lineTotal)
    ];
    doc.font("Helvetica").fontSize(10).text(rowValues[0], colX[0], rowTop + 6, { width: colWidths[0], align: "center" });
    doc.font("Helvetica").fontSize(10).text(fitSingleLineText(doc, rowValues[1], colWidths[1] - 8), colX[1] + 4, rowTop + 6, {
      width: colWidths[1] - 8
    });
    doc.font("Helvetica").fontSize(10).text(rowValues[2], colX[2], rowTop + 6, { width: colWidths[2], align: "center" });
    doc.font("Helvetica").fontSize(10).text(rowValues[3], colX[3], rowTop + 6, { width: colWidths[3], align: "center" });
    doc.font("Helvetica").fontSize(10).text(rowValues[4], colX[4] + 3, rowTop + 6, { width: colWidths[4] - 6, align: "right" });
    doc.font("Helvetica").fontSize(10).text(rowValues[5], colX[5] + 3, rowTop + 6, { width: colWidths[5] - 6, align: "right" });
  }
  if (items.length > maxRows) {
    doc.font("Helvetica-Oblique").fontSize(9.4).text(`... ${items.length - maxRows} more item(s)`, colX[1] + 4, tableY + tableH - 15, {
      width: colWidths[1] - 8
    });
  }

  const summaryY = tableY + tableH + 8;
  const summaryH = 100;
  const totalsW = 220;
  const wordsW = w - totalsW - 8;
  const totalsX = x + wordsW + 8;
  doc.rect(x, summaryY, wordsW, summaryH).stroke();
  doc.rect(totalsX, summaryY, totalsW, summaryH).stroke();

  doc.font("Helvetica-Bold").fontSize(11).text("Amount In Words", x + 10, summaryY + 8, { width: wordsW - 20 });
  doc.font("Helvetica").fontSize(10.4).text(amountWords, x + 10, summaryY + 28, { width: wordsW - 20 });
  doc.font("Helvetica").fontSize(9.8).text(
    `Total Qty: ${formatAmount(qtyTotal)}   Item Amount: ${formatAmount(amountTotal)}`,
    x + 10,
    summaryY + summaryH - 18,
    { width: wordsW - 20 }
  );

  const subtotal = normalizeAmount(invoice.subtotalTaxable || amountTotal);
  const invoiceDiscount = normalizeAmount(invoice.invoiceDiscount);
  const shipping = normalizeAmount(invoice.shipping);
  const roundOff = normalizeAmount(invoice.roundOff);
  const totalsRows = [
    ["Sub Total", subtotal],
    ["Discount", invoiceDiscount],
    ["Shipping", shipping],
    ["Round Off", roundOff],
    ["Grand Total", grandTotal]
  ];
  let totalsY = summaryY + 8;
  for (let index = 0; index < totalsRows.length; index += 1) {
    const [label, value] = totalsRows[index];
    if (index === totalsRows.length - 1) {
      drawHorizontalLine(doc, totalsX, totalsX + totalsW, totalsY - 3);
    }
    doc.font(index === totalsRows.length - 1 ? "Helvetica-Bold" : "Helvetica-Bold").fontSize(10.2).text(label, totalsX + 8, totalsY, {
      width: totalsW - 100
    });
    doc.font(index === totalsRows.length - 1 ? "Helvetica-Bold" : "Helvetica").fontSize(10.2).text(formatAmount(value), totalsX + 8, totalsY, {
      width: totalsW - 16,
      align: "right"
    });
    totalsY += 18;
  }

  const footerY = summaryY + summaryH + 10;
  const footerH = bottom - footerY;
  const footerSplitX = x + Math.floor(w * 0.66);
  doc.rect(x, footerY, w, footerH).stroke();
  doc.moveTo(footerSplitX, footerY).lineTo(footerSplitX, footerY + footerH).stroke();

  const leftBlockX = x + 10;
  const leftBlockRight = footerSplitX - 10;
  const qrSize = upiQrBuffer ? 74 : 0;
  const qrX = upiQrBuffer ? leftBlockRight - qrSize : 0;
  const qrY = footerY + 36;
  const upiTextWidth = upiQrBuffer ? qrX - leftBlockX - 8 : leftBlockRight - leftBlockX;
  const upiId = toText(settings.upiId) || "-";

  doc.font("Helvetica-Bold").fontSize(11.5).text("UPI Payment", leftBlockX, footerY + 8, {
    width: leftBlockRight - leftBlockX
  });
  doc.font("Helvetica-Bold").fontSize(10.4).text(`UPI ID : ${upiId}`, leftBlockX, footerY + 30, {
    width: upiTextWidth
  });
  doc.font("Helvetica").fontSize(9.6).text("Scan QR to pay this invoice.", leftBlockX, footerY + 48, {
    width: upiTextWidth
  });

  if (upiQrBuffer) {
    doc.image(upiQrBuffer, qrX, qrY, { fit: [qrSize, qrSize] });
    doc.font("Helvetica-Bold").fontSize(8.5).text("UPI QR", qrX, qrY + qrSize + 2, { width: qrSize, align: "center" });
  }

  drawHorizontalLine(doc, x + 10, footerSplitX - 20, bottom - 32);
  doc.font("Helvetica").fontSize(9.8).text("Customer Signature", x + 10, bottom - 25, {
    width: footerSplitX - x - 30
  });

  const rightW = x + w - footerSplitX;
  doc.font("Helvetica").fontSize(10).text("Certified that the particulars are true and correct.", footerSplitX + 8, footerY + 10, {
    width: rightW - 16
  });
  doc.font("Times-Bold").fontSize(14).text(`For, ${companyName}`, footerSplitX + 8, footerY + footerH - 76, {
    width: rightW - 16,
    align: "center"
  });
  drawHorizontalLine(doc, x + w - 130, x + w - 12, bottom - 32);
  doc.font("Helvetica-Bold").fontSize(10.2).text("Authorised Signatory", footerSplitX + 8, bottom - 25, {
    width: rightW - 16,
    align: "right"
  });
}

export async function createInvoicePdfBuffer(invoice, settings = {}) {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
  const output = collectPdf(doc);

  const companyProfile = getInvoiceCompanyProfile(invoice, settings);
  const companyName = toUpperText(companyProfile.name || "My Company");
  const invoiceNumber = toText(invoice.invoiceNumber) || `#${invoice.id || 0}`;
  const gstType = normalizeGstType(invoice.gstType);
  const isNonGstInvoice = gstType === "none";
  let upiQrBuffer = null;
  if (isNonGstInvoice) {
    const upiLink = buildUpiLink({ ...invoice, gstType }, settings);
    if (upiLink) {
      try {
        upiQrBuffer = await QRCode.toBuffer(upiLink, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: "M"
        });
      } catch (_error) {
        upiQrBuffer = null;
      }
    }
  }
  const items = invoice.items || [];
  const qtyTotal = roundMoney(items.reduce((sum, item) => sum + normalizeAmount(item.quantity), 0));
  const amountTotal = roundMoney(items.reduce((sum, item) => sum + normalizeAmount(item.lineTotal), 0));
  const subtotalTaxable = normalizeAmount(invoice.subtotalTaxable);
  const cgstTotal = normalizeAmount(invoice.cgstTotal);
  const sgstTotal = normalizeAmount(invoice.sgstTotal);
  const igstTotal = normalizeAmount(invoice.igstTotal);
  const grandTotal = normalizeAmount(invoice.total);
  const cgstRate = subtotalTaxable > 0 ? roundMoney((cgstTotal / subtotalTaxable) * 100) : 0;
  const sgstRate = subtotalTaxable > 0 ? roundMoney((sgstTotal / subtotalTaxable) * 100) : 0;
  const igstRate = subtotalTaxable > 0 ? roundMoney((igstTotal / subtotalTaxable) * 100) : 0;

  const companyPhone = toText(companyProfile.phone) || toText(settings.companyPhone);
  const companyAddressText = splitLines(companyProfile.address).join(", ");
  const companyGstin = toUpperText(companyProfile.gstin) || toUpperText(settings.companyGstin) || "-";
  const companyState = toUpperText(companyProfile.state || settings.companyState || "Gujarat");
  const companyStateCode = toUpperText(companyProfile.stateCode || settings.companyStateCode || "-");
  const companyPan = toUpperText(companyProfile.pan || settings.companyPan || settings.pan || "-");

  const customerName = toUpperText(invoice.customer?.name) || "WALK-IN CUSTOMER";
  const customerAddressLines = splitLines(toText(invoice.customer?.address) || "-");
  const customerGstin = toUpperText(invoice.customer?.gstin) || "-";
  const invoiceDate = formatDate(invoice.createdAt);

  const amountWords = amountToWords(grandTotal);
  if (isNonGstInvoice) {
    renderNonGstInvoiceLayout(doc, {
      invoice,
      settings,
      companyProfile,
      companyName,
      companyPhone,
      companyAddressText,
      invoiceNumber,
      invoiceDate,
      amountWords,
      items,
      qtyTotal,
      amountTotal,
      grandTotal,
      upiQrBuffer
    });

    doc.info.Title = `Invoice ${invoiceNumber}`;
    doc.info.Subject = `Invoice generated for ${toText(invoice.customer?.name) || "customer"}`;
    doc.info.Author = toText(companyProfile.name) || toText(settings.companyName) || "InvoiceFlow Pro";

    doc.end();
    return output;
  }

  const margin = 20;
  const x = margin;
  const y = margin;
  const w = doc.page.width - margin * 2;
  const h = doc.page.height - margin * 2;
  const companyH = 60;
  const legalH = 24;
  const titleH = 28;
  const partyH = 116;
  const itemHeaderH = 32;
  const itemBodyH = 282;
  const itemFooterH = 24;
  const wordsSummaryH = 74;
  const bankSignH = h - (companyH + legalH + titleH + partyH + itemHeaderH + itemBodyH + itemFooterH + wordsSummaryH);

  const yCompanyBottom = y + companyH;
  const yLegalBottom = yCompanyBottom + legalH;
  const yTitleBottom = yLegalBottom + titleH;
  const yPartyBottom = yTitleBottom + partyH;
  const yItemHeaderBottom = yPartyBottom + itemHeaderH;
  const yItemBodyBottom = yItemHeaderBottom + itemBodyH;
  const yItemFooterBottom = yItemBodyBottom + itemFooterH;
  const yWordsBottom = yItemFooterBottom + wordsSummaryH;
  const yPageBottom = y + h;

  doc.fillColor("#24395b").rect(x, yPartyBottom, w, itemHeaderH).fill();

  doc.lineWidth(1.1).strokeColor("#1a1f2b").fillColor("#1a1f2b");
  doc.rect(x, y, w, h).stroke();
  doc.lineWidth(0.8);
  drawHorizontalLine(doc, x, x + w, yCompanyBottom);
  drawHorizontalLine(doc, x, x + w, yLegalBottom);
  drawHorizontalLine(doc, x, x + w, yTitleBottom);
  drawHorizontalLine(doc, x, x + w, yPartyBottom);
  drawHorizontalLine(doc, x, x + w, yItemHeaderBottom);
  drawHorizontalLine(doc, x, x + w, yItemBodyBottom);
  drawHorizontalLine(doc, x, x + w, yItemFooterBottom);
  drawHorizontalLine(doc, x, x + w, yWordsBottom);

  const legalWidths = ratiosToWidths(w, [0.39, 0.18, 0.19, 0.24]);
  const legalX = widthsToPositions(x, legalWidths);
  drawVerticalLines(doc, x, yCompanyBottom, legalH, legalWidths);

  const partySplitX = x + Math.floor(w * 0.66);
  doc.moveTo(partySplitX, yTitleBottom).lineTo(partySplitX, yPartyBottom).stroke();

  const itemWidths = ratiosToWidths(w, [0.08, 0.38, 0.10, 0.11, 0.11, 0.08, 0.14]);
  const itemX = widthsToPositions(x, itemWidths);
  drawVerticalLines(doc, x, yPartyBottom, itemHeaderH + itemBodyH + itemFooterH, itemWidths);

  const bottomSplitX = x + Math.floor(w * 0.63);
  doc.moveTo(bottomSplitX, yItemFooterBottom).lineTo(bottomSplitX, yPageBottom).stroke();

  const summaryRowH = wordsSummaryH / 4;
  for (let index = 1; index < 4; index += 1) {
    drawHorizontalLine(doc, bottomSplitX, x + w, yItemFooterBottom + summaryRowH * index);
  }

  const bankLeftSignSplitY = yWordsBottom + Math.floor(bankSignH * 0.67);
  drawHorizontalLine(doc, x, bottomSplitX, bankLeftSignSplitY);

  doc.fillColor("#1a1f2b");
  const headerNameSize = fitTextSize(doc, companyName, w - 190, 26, 16);
  doc.font("Times-Bold").fontSize(headerNameSize).text(companyName, x + 10, y + 8, { width: w - 190 });
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(companyPhone ? `Mo. ${companyPhone}` : "Mo. -", x + w - 190, y + 9, { width: 180, align: "right" });

  doc.font("Helvetica-Bold").fontSize(10.5);
  const addressLine = fitSingleLineText(doc, toUpperText(companyAddressText || "-"), w - 20);
  doc.text(addressLine, x + 10, y + 38, { width: w - 20, align: "center" });

  if (!isNonGstInvoice) {
    doc.font("Helvetica-Bold").fontSize(9.9);
    doc.text(fitSingleLineText(doc, `GSTIN No. : ${companyGstin}`, legalWidths[0] - 16), legalX[0] + 8, yCompanyBottom + 7, {
      width: legalWidths[0] - 16
    });
    doc.text(fitSingleLineText(doc, `State : ${companyState}`, legalWidths[1] - 16), legalX[1] + 8, yCompanyBottom + 7, {
      width: legalWidths[1] - 16
    });
    doc.text(fitSingleLineText(doc, `State Code : ${companyStateCode}`, legalWidths[2] - 16), legalX[2] + 8, yCompanyBottom + 7, {
      width: legalWidths[2] - 16
    });
    doc.text(fitSingleLineText(doc, `PAN No. ${companyPan}`, legalWidths[3] - 16), legalX[3] + 8, yCompanyBottom + 7, {
      width: legalWidths[3] - 16
    });
  }

  doc.font("Helvetica-Bold").fontSize(16).text("TAX INVOICE", x, yLegalBottom + 5, {
    width: w,
    align: "center"
  });

  const partyLeftW = partySplitX - x;
  const partyRightW = x + w - partySplitX;
  doc.font("Helvetica-Bold").fontSize(12).text("M/s.", x + 10, yTitleBottom + 12, { width: 40 });
  doc.font("Helvetica-Bold").fontSize(12).text(customerName, x + 54, yTitleBottom + 12, { width: partyLeftW - 64 });
  doc.font("Helvetica-Bold").fontSize(12).text("Address :", x + 10, yTitleBottom + 44, { width: 70 });
  doc.font("Helvetica").fontSize(11).text(customerAddressLines[0] || "-", x + 78, yTitleBottom + 45, { width: partyLeftW - 86 });
  if (customerAddressLines[1]) {
    doc.font("Helvetica").fontSize(11).text(customerAddressLines[1], x + 78, yTitleBottom + 64, { width: partyLeftW - 86 });
  }
  if (!isNonGstInvoice) {
    doc.font("Helvetica-Bold").fontSize(12).text(`GST No. : ${customerGstin}`, x + 10, yTitleBottom + 90, {
      width: partyLeftW - 16
    });
  }

  const detailLabelX = partySplitX + 10;
  const detailLabelW = 88;
  const detailValueX = detailLabelX + detailLabelW;
  const detailValueW = partyRightW - detailLabelW - 18;
  doc.font("Helvetica-Bold").fontSize(13).text("Invoice No. :", detailLabelX, yTitleBottom + 18, { width: detailLabelW });
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(fitSingleLineText(doc, invoiceNumber, detailValueW), detailValueX, yTitleBottom + 18, { width: detailValueW });
  doc.font("Helvetica-Bold").fontSize(13).text("Date :", detailLabelX, yTitleBottom + 68, { width: detailLabelW });
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(fitSingleLineText(doc, invoiceDate, detailValueW), detailValueX, yTitleBottom + 68, { width: detailValueW });

  doc.fillColor("#ffffff");
  const itemHeaders = ["Sr. No.", "Particulars", "HSN", "Qty.", "Rate", "Pcs", "Amount"];
  for (let index = 0; index < itemHeaders.length; index += 1) {
    doc.font("Helvetica-Bold").fontSize(11).text(itemHeaders[index], itemX[index], yPartyBottom + 9, {
      width: itemWidths[index],
      align: "center"
    });
  }
  doc.fillColor("#1a1f2b");

  const itemRowH = 22;
  const maxItemRows = Math.max(1, Math.floor(itemBodyH / itemRowH));
  for (let row = 1; row <= Math.min(items.length, maxItemRows); row += 1) {
    drawHorizontalLine(doc, x, x + w, yItemHeaderBottom + row * itemRowH);
  }

  const drawCount = Math.min(items.length, maxItemRows);
  for (let index = 0; index < drawCount; index += 1) {
    const rowTop = yItemHeaderBottom + index * itemRowH;
    const item = items[index];
    const unitLabel = toUpperText(item.unit) || "PCS";
    const itemValues = [
      String(index + 1),
      toText(item.productName) || "Item",
      toText(item.hsnSac) || "-",
      formatAmount(item.quantity),
      formatAmount(item.unitPrice),
      unitLabel,
      formatAmount(item.lineTotal)
    ];
    doc.font("Helvetica").fontSize(10.5).text(itemValues[0], itemX[0], rowTop + 6, { width: itemWidths[0], align: "center" });
    doc.font("Helvetica").fontSize(10.5).text(fitSingleLineText(doc, itemValues[1], itemWidths[1] - 8), itemX[1] + 4, rowTop + 6, {
      width: itemWidths[1] - 8
    });
    doc.font("Helvetica").fontSize(10.5).text(itemValues[2], itemX[2], rowTop + 6, { width: itemWidths[2], align: "center" });
    doc.font("Helvetica").fontSize(10.5).text(itemValues[3], itemX[3], rowTop + 6, { width: itemWidths[3], align: "center" });
    doc.font("Helvetica").fontSize(10.5).text(itemValues[4], itemX[4] + 2, rowTop + 6, { width: itemWidths[4] - 4, align: "right" });
    doc.font("Helvetica").fontSize(10.5).text(itemValues[5], itemX[5], rowTop + 6, { width: itemWidths[5], align: "center" });
    doc.font("Helvetica").fontSize(10.5).text(itemValues[6], itemX[6] + 2, rowTop + 6, { width: itemWidths[6] - 4, align: "right" });
  }

  if (items.length > maxItemRows) {
    doc.font("Helvetica-Oblique").fontSize(9.5).text(`... ${items.length - maxItemRows} more item(s)`, itemX[1] + 4, yItemBodyBottom - 16, {
      width: itemWidths[1] - 8
    });
  }

  doc.font("Helvetica-Bold").fontSize(11).text(formatAmount(qtyTotal), itemX[3], yItemBodyBottom + 6, {
    width: itemWidths[3],
    align: "center"
  });
  doc.font("Helvetica-Bold").fontSize(11).text(formatAmount(amountTotal), itemX[6] + 2, yItemBodyBottom + 6, {
    width: itemWidths[6] - 4,
    align: "right"
  });

  doc.font("Helvetica-Bold").fontSize(11).text("Total Invoice Amount in Words", x + 8, yItemFooterBottom + 8, {
    width: bottomSplitX - x - 16,
    align: "center"
  });
  doc.font("Helvetica").fontSize(10).text(amountWords, x + 8, yItemFooterBottom + 28, {
    width: bottomSplitX - x - 16,
    align: "center"
  });

  const taxLabel1 = gstType === "inter" ? `IGST ${formatPercent(igstRate)}%` : `CGST ${formatPercent(cgstRate)}%`;
  const taxValue1 = gstType === "inter" ? igstTotal : cgstTotal;
  const taxLabel2 = gstType === "inter" ? "SGST 0%" : `SGST ${formatPercent(sgstRate)}%`;
  const taxValue2 = gstType === "inter" ? 0 : sgstTotal;
  const summaryRows = [
    ["Sub Total", subtotalTaxable],
    [taxLabel1, taxValue1],
    [taxLabel2, taxValue2],
    ["Grand Total", grandTotal]
  ];
  const summaryValueW = 92;
  for (let index = 0; index < summaryRows.length; index += 1) {
    const [label, value] = summaryRows[index];
    const rowY = yItemFooterBottom + index * summaryRowH + 5;
    doc.font(index === summaryRows.length - 1 ? "Helvetica-Bold" : "Helvetica-Bold").fontSize(10.8).text(label, bottomSplitX + 8, rowY, {
      width: w - (bottomSplitX - x) - summaryValueW - 18
    });
    doc.font(index === summaryRows.length - 1 ? "Helvetica-Bold" : "Helvetica").fontSize(10.8).text(formatAmount(value), x + w - summaryValueW - 8, rowY, {
      width: summaryValueW,
      align: "right"
    });
  }

  doc.font("Helvetica-Bold").fontSize(14).text("Bank Details", x + 8, yWordsBottom + 8, {
    width: bottomSplitX - x - 16,
    align: "center"
  });
  const bankAreaTop = yWordsBottom;
  const bankAreaBottom = bankLeftSignSplitY;
  const bankAreaHeight = Math.max(0, bankAreaBottom - bankAreaTop);
  const qrSize = upiQrBuffer ? Math.max(52, Math.min(74, Math.floor(bankAreaHeight - 34))) : 0;
  const qrX = upiQrBuffer ? bottomSplitX - qrSize - 14 : 0;
  const qrY = bankAreaTop + 22;
  const bankTextX = x + 10;
  const bankTextRight = upiQrBuffer ? qrX - 8 : bottomSplitX - 10;
  const bankTextWidth = Math.max(120, bankTextRight - bankTextX);
  const bankLines = [
    `A/C No. : ${toText(settings.bankAccountNumber) || "-"}`,
    `IFSC : ${toText(settings.bankIfsc) || "-"}`,
    `BANK : ${toText(settings.bankName) || "-"}`,
    toText(settings.bankBranch) ? `Branch : ${toText(settings.bankBranch)}` : ""
  ].filter(Boolean);
  let bankY = yWordsBottom + 28;
  for (const line of bankLines) {
    doc.font("Helvetica-Bold").fontSize(12).text(line, bankTextX, bankY, { width: bankTextWidth });
    bankY += 20;
    if (bankY > bankLeftSignSplitY - 10) {
      break;
    }
  }

  if (upiQrBuffer) {
    doc.image(upiQrBuffer, qrX, qrY, { fit: [qrSize, qrSize] });
    doc.font("Helvetica-Bold").fontSize(9).text("UPI QR", qrX, qrY + qrSize + 2, {
      width: qrSize,
      align: "center"
    });
  }

  doc.font("Helvetica-Bold").fontSize(15).text("Customer Sign", x + 8, bankLeftSignSplitY + 10, {
    width: bottomSplitX - x - 16,
    align: "center"
  });

  const rightBottomW = x + w - bottomSplitX;
  doc.font("Helvetica").fontSize(11).text("GST Payable on Reverse Charge", bottomSplitX + 8, yWordsBottom + 8, {
    width: rightBottomW - 16
  });
  doc.font("Helvetica").fontSize(8.8).text("Certified that the particulars given above are true and correct.", bottomSplitX + 8, yWordsBottom + 26, {
    width: rightBottomW - 16
  });
  doc.font("Times-Bold").fontSize(15).text(`For, ${companyName}`, bottomSplitX + 8, yWordsBottom + 44, {
    width: rightBottomW - 16,
    align: "center"
  });
  drawHorizontalLine(doc, x + w - 130, x + w - 12, yPageBottom - 34);
  doc.font("Helvetica-Bold").fontSize(11).text("Authorised Signatory", bottomSplitX + 8, yPageBottom - 24, {
    width: rightBottomW - 16,
    align: "right"
  });

  doc.info.Title = `Invoice ${invoiceNumber}`;
  doc.info.Subject = `Invoice generated for ${toText(invoice.customer?.name) || "customer"}`;
  doc.info.Author = toText(companyProfile.name) || toText(settings.companyName) || "InvoiceFlow Pro";

  doc.end();
  return output;
}
