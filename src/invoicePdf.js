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

function ratiosToWidths(totalWidth, ratios) {
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
    gstin: toText(profile?.gstin ?? fallback?.gstin)
  };
}

function getInvoiceCompanyProfile(invoice, settings) {
  const legacyCompany = {
    name: toText(settings?.companyName || "My Company"),
    address: toText(settings?.companyAddress),
    email: toText(settings?.companyEmail),
    phone: toText(settings?.companyPhone),
    gstin: toText(settings?.companyGstin)
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

export async function createInvoicePdfBuffer(invoice, settings = {}) {
  const doc = new PDFDocument({ margin: 20, size: "A4" });
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

  const companyProfile = getInvoiceCompanyProfile(invoice, settings);
  const companyName = toUpperText(companyProfile.name || "My Company");
  const invoiceNumber = toText(invoice.invoiceNumber) || `#${invoice.id || 0}`;
  const gstType = String(invoice.gstType || "intra");
  const status = toUpperText(invoice.status || "unpaid");
  const items = invoice.items || [];
  const qtyTotal = roundMoney(items.reduce((sum, item) => sum + normalizeAmount(item.quantity), 0));
  const amountTotal = roundMoney(items.reduce((sum, item) => sum + normalizeAmount(item.lineTotal), 0));
  const companyContact = [toText(companyProfile.phone), toText(companyProfile.email)].filter(Boolean).join("   ");
  const companyLines = [
    ...splitLines(companyProfile.address).map((line) => toUpperText(line)),
    companyContact ? `PH: ${toUpperText(companyContact)}` : "",
    toText(companyProfile.gstin) ? `GSTIN: ${toUpperText(companyProfile.gstin)}` : ""
  ].filter(Boolean);
  const taxRows = buildTaxRows(invoice);
  const taxDisplayRows = [
    ...taxRows,
    {
      taxable: normalizeAmount(invoice.subtotalTaxable),
      sgstRate: 0,
      sgstAmount: normalizeAmount(invoice.sgstTotal),
      cgstRate: 0,
      cgstAmount: normalizeAmount(invoice.cgstTotal),
      igstRate: 0,
      igstAmount: normalizeAmount(invoice.igstTotal),
      totalRow: true
    }
  ];

  const margin = 20;
  const x = margin;
  const y = margin;
  const w = doc.page.width - margin * 2;
  const h = doc.page.height - margin * 2;
  const headerH = 126;
  const partyH = 116;
  const itemsH = 226;
  const remarksH = 22;
  const taxH = 118;
  const wordsH = 25;
  const footerH = h - headerH - partyH - itemsH - remarksH - taxH - wordsH;

  const y1 = y + headerH;
  const y2 = y1 + partyH;
  const y3 = y2 + itemsH;
  const y4 = y3 + remarksH;
  const y5 = y4 + taxH;
  const y6 = y5 + wordsH;

  doc.lineWidth(1.2).strokeColor("#111111").fillColor("#111111");
  doc.rect(x, y, w, h).stroke();
  doc.lineWidth(0.8);
  drawHorizontalLine(doc, x, x + w, y1);
  drawHorizontalLine(doc, x, x + w, y2);
  drawHorizontalLine(doc, x, x + w, y3);
  drawHorizontalLine(doc, x, x + w, y4);
  drawHorizontalLine(doc, x, x + w, y5);
  drawHorizontalLine(doc, x, x + w, y6);

  doc.font("Helvetica-Bold").fontSize(13).text("TAX INVOICE", x + 8, y + 6, { width: 220 });
  doc.font("Helvetica-Bold").fontSize(13).text("ORIGINAL FOR RECIPIENT", x + 8, y + 6, { width: w - 16, align: "right" });

  const headerNameSize = fitTextSize(doc, companyName, w - 20, 34, 21);
  doc.font("Helvetica-Bold").fontSize(headerNameSize).text(companyName, x + 10, y + 28, { width: w - 20, align: "center" });
  let lineY = doc.y + 4;
  for (const line of companyLines) {
    if (lineY > y1 - 20) {
      break;
    }
    doc.font("Helvetica-Bold").fontSize(10.5).text(line, x + 10, lineY, { width: w - 20, align: "center" });
    lineY = doc.y + 1;
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(`INVOICE TYPE: ${gstType === "none" ? "WITHOUT GST" : "WITH GST"}`, x + 10, lineY + 1, {
      width: w - 20,
      align: "center"
    });

  const partySplitX = x + Math.floor(w * 0.64);
  const partyHeaderBottom = y1 + 22;
  doc.moveTo(partySplitX, y1).lineTo(partySplitX, y2).stroke();
  drawHorizontalLine(doc, x, x + w, partyHeaderBottom);

  doc.font("Helvetica-Bold").fontSize(12).text("Buyer's Detail", x + 8, y1 + 5);
  doc.font("Helvetica-Bold").fontSize(12).text("Invoice Detail", partySplitX + 8, y1 + 5);

  const leftW = partySplitX - x;
  let buyerY = partyHeaderBottom + 6;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(toUpperText(invoice.customer?.name) || "WALK-IN CUSTOMER", x + 8, buyerY, { width: leftW - 16 });
  buyerY = doc.y + 2;
  if (toText(invoice.customer?.address)) {
    doc.font("Helvetica").fontSize(10.5).text(toText(invoice.customer.address), x + 8, buyerY, { width: leftW - 16 });
    buyerY = doc.y + 2;
  }
  if (toText(invoice.customer?.phone)) {
    doc.font("Helvetica").fontSize(10.5).text(`Contact No : ${toText(invoice.customer.phone)}`, x + 8, buyerY, { width: leftW - 16 });
    buyerY = doc.y + 1;
  }
  doc.font("Helvetica-Bold").fontSize(10.5).text(`GST NO : ${toText(invoice.customer?.gstin) || "-"}`, x + 8, buyerY, { width: leftW - 16 });
  buyerY = doc.y + 1;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(`STATE CODE : ${toText(invoice.customer?.stateCode) || "-"}`, x + 8, buyerY, { width: leftW - 16 });

  const rightW = x + w - partySplitX;
  const labelW = Math.floor(rightW * 0.46);
  const paymentMode = normalizePaymentMode(invoice, settings).replace(/[^A-Z ]/g, "") || "-";
  const deliveryAddress =
    toUpperText(invoice.deliveryAddress) || toUpperText(invoice.customer?.name) || toUpperText(invoice.customer?.address) || "-";
  const challanNo = toUpperText(invoice.challanNo) || "-";
  const detailRows = [
    ["Invoice No", invoiceNumber],
    ["Invoice Date", formatDateTime(invoice.createdAt)],
    ["Challan No", challanNo],
    ["Delv Add", deliveryAddress],
    ["Pay Mode", paymentMode],
    ["Status", status]
  ];
  let detailY = partyHeaderBottom + 7;
  const detailValueWidth = rightW - labelW - 8;
  for (const [label, value] of detailRows) {
    doc.font("Helvetica-Bold").fontSize(10.5).text(`${label} :`, partySplitX + 8, detailY, { width: labelW - 8 });
    doc.font("Helvetica-Bold").fontSize(10.5).text(fitSingleLineText(doc, toUpperText(value) || "-", detailValueWidth), partySplitX + labelW, detailY, {
      width: detailValueWidth
    });
    detailY += 14.5;
  }

  const itemHeaderBottom = y2 + 24;
  const itemBandTop = y3 - 18;
  drawHorizontalLine(doc, x, x + w, itemHeaderBottom);
  drawHorizontalLine(doc, x, x + w, itemBandTop);

  const itemWidths = ratiosToWidths(w, [0.05, 0.39, 0.11, 0.08, 0.1, 0.09, 0.08, 0.1]);
  const itemX = widthsToPositions(x, itemWidths);
  drawVerticalLines(doc, x, y2, itemsH, itemWidths);

  const headers = ["", "PARTICULAR", "HSN CODE", "GST %", "QTY", "UNIT", "RATE", "AMOUNT"];
  for (let index = 0; index < headers.length; index += 1) {
    doc.font("Helvetica-Bold").fontSize(11).text(headers[index], index === 1 ? itemX[index] + 4 : itemX[index], y2 + 6, {
      width: index === 1 ? itemWidths[index] - 8 : itemWidths[index],
      align: index === 1 ? "left" : "center"
    });
  }

  let itemY = itemHeaderBottom;
  let shown = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const name = toText(item.productName) || "Item";
    doc.font("Helvetica").fontSize(9.5);
    const rowHeight = Math.max(22, Math.ceil(doc.heightOfString(name, { width: itemWidths[1] - 8 }) + 5));
    if (itemY + rowHeight > itemBandTop - 18) {
      break;
    }

    const values = [
      String(index + 1),
      name,
      toText(item.hsnSac) || "-",
      gstType === "none" ? "0" : formatPercent(inferItemTaxRate(item)),
      formatAmount(item.quantity),
      toUpperText(item.unit) || "PCS",
      formatAmount(item.unitPrice),
      formatAmount(item.lineTotal)
    ];

    doc.font("Helvetica").fontSize(9.5).text(values[0], itemX[0], itemY + 6, { width: itemWidths[0], align: "center" });
    doc.font("Helvetica").fontSize(9.5).text(values[1], itemX[1] + 4, itemY + 4, { width: itemWidths[1] - 8 });
    doc.font("Helvetica").fontSize(9.5).text(values[2], itemX[2], itemY + 6, { width: itemWidths[2], align: "center" });
    doc.font("Helvetica").fontSize(9.5).text(values[3], itemX[3], itemY + 6, { width: itemWidths[3], align: "center" });
    doc.font("Helvetica").fontSize(9.5).text(values[4], itemX[4], itemY + 6, { width: itemWidths[4], align: "center" });
    doc.font("Helvetica").fontSize(9.5).text(values[5], itemX[5], itemY + 6, { width: itemWidths[5], align: "center" });
    doc.font("Helvetica").fontSize(9.5).text(values[6], itemX[6] + 2, itemY + 6, { width: itemWidths[6] - 4, align: "right" });
    doc.font("Helvetica").fontSize(9.5).text(values[7], itemX[7] + 2, itemY + 6, { width: itemWidths[7] - 4, align: "right" });

    itemY += rowHeight;
    drawHorizontalLine(doc, x, x + w, itemY);
    shown += 1;
  }
  if (shown < items.length && itemY + 18 <= itemBandTop) {
    const hidden = items.length - shown;
    doc.font("Helvetica-Oblique").fontSize(9).text(`... ${hidden} more item(s) not shown`, itemX[1] + 4, itemY + 5, {
      width: itemWidths[1] - 8
    });
    itemY += 18;
    drawHorizontalLine(doc, x, x + w, itemY);
  }

  if (status === "PAID") {
    const stampX = x + w * 0.45;
    const stampY = itemHeaderBottom + (itemBandTop - itemHeaderBottom) / 2;
    doc.save();
    doc.fillColor("#bf0d3e").fillOpacity(0.14);
    doc.font("Helvetica-Bold").fontSize(86);
    doc.rotate(-15, { origin: [stampX, stampY] });
    doc.text("PAID", stampX - 110, stampY - 36, { width: 220, align: "center" });
    doc.restore();
    doc.fillColor("#111111");
  }

  doc.font("Helvetica-Bold").fontSize(11).text(formatAmount(qtyTotal), itemX[4], itemBandTop + 3, { width: itemWidths[4], align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).text(formatAmount(amountTotal), itemX[7] + 2, itemBandTop + 3, {
    width: itemWidths[7] - 4,
    align: "right"
  });

  doc.font("Helvetica-Bold").fontSize(11).text("Remarks:", x + 8, y3 + 5);
  doc.font("Helvetica").fontSize(10).text(toText(invoice.notes) || "-", x + 70, y3 + 5, { width: w - 78 });

  const taxSplitX = x + Math.floor(w * 0.62);
  const taxHeaderBottom = y4 + 22;
  doc.moveTo(taxSplitX, y4).lineTo(taxSplitX, y5).stroke();
  drawHorizontalLine(doc, x, taxSplitX, taxHeaderBottom);

  const taxWidths = ratiosToWidths(taxSplitX - x, [0.24, 0.1, 0.14, 0.1, 0.14, 0.1, 0.18]);
  const taxX = widthsToPositions(x, taxWidths);
  drawVerticalLines(doc, x, y4, taxH, taxWidths);

  const taxHeaders = ["Taxable\nAmount", "SGST\n%", "Amount", "CGST\n%", "Amount", "IGST\n%", "Amount"];
  for (let index = 0; index < taxHeaders.length; index += 1) {
    doc.font("Helvetica-Bold").fontSize(9).text(taxHeaders[index], taxX[index] + 1, y4 + 4, {
      width: taxWidths[index] - 2,
      align: "center"
    });
  }

  const rowArea = y5 - taxHeaderBottom;
  const rowH = taxDisplayRows.length > 0 ? rowArea / taxDisplayRows.length : rowArea;
  for (let index = 0; index < taxDisplayRows.length; index += 1) {
    const row = taxDisplayRows[index];
    const rowTop = taxHeaderBottom + index * rowH;
    if (index > 0) {
      drawHorizontalLine(doc, x, taxSplitX, rowTop);
    }
    doc.font(row.totalRow ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    doc.text(formatAmount(row.taxable), taxX[0] + 1, rowTop + 5, { width: taxWidths[0] - 2, align: "right" });
    doc.text(formatPercent(row.sgstRate), taxX[1], rowTop + 5, { width: taxWidths[1], align: "center" });
    doc.text(formatAmount(row.sgstAmount), taxX[2] + 1, rowTop + 5, { width: taxWidths[2] - 2, align: "right" });
    doc.text(formatPercent(row.cgstRate), taxX[3], rowTop + 5, { width: taxWidths[3], align: "center" });
    doc.text(formatAmount(row.cgstAmount), taxX[4] + 1, rowTop + 5, { width: taxWidths[4] - 2, align: "right" });
    doc.text(formatPercent(row.igstRate), taxX[5], rowTop + 5, { width: taxWidths[5], align: "center" });
    doc.text(formatAmount(row.igstAmount), taxX[6] + 1, rowTop + 5, { width: taxWidths[6] - 2, align: "right" });
  }

  const discounts = roundMoney(normalizeAmount(invoice.lineDiscountTotal) + normalizeAmount(invoice.invoiceDiscount));
  const summaryRows = [
    { label: "TAXABLE VALUE", value: normalizeAmount(invoice.subtotalTaxable) },
    ...(discounts > 0 ? [{ label: "(-) DISCOUNT", value: discounts }] : []),
    { label: "(+) FREIGHT", value: normalizeAmount(invoice.shipping) },
    { label: "(+) SGST", value: normalizeAmount(invoice.sgstTotal) },
    { label: "(+) CGST", value: normalizeAmount(invoice.cgstTotal) },
    { label: "(+) IGST", value: normalizeAmount(invoice.igstTotal) },
    { label: "(+) TCS", value: normalizeAmount(invoice.tcsAmount) },
    { label: "(+) ROUND OFF", value: normalizeAmount(invoice.roundOff) }
  ];
  const summaryValueW = 90;
  const summaryTopY = y4 + 8;
  const summaryBottomLimit = y5 - 34;
  const summaryLineH = Math.max(
    10,
    Math.min(13, Math.floor((summaryBottomLimit - summaryTopY) / Math.max(summaryRows.length, 1)))
  );
  let summaryY = summaryTopY;
  for (const row of summaryRows) {
    doc.font("Helvetica").fontSize(11).text(row.label, taxSplitX + 8, summaryY, { width: w - (taxSplitX - x) - summaryValueW - 16 });
    doc.font("Helvetica").fontSize(11).text(formatAmount(row.value), x + w - summaryValueW - 8, summaryY, {
      width: summaryValueW,
      align: "right"
    });
    summaryY += summaryLineH;
  }
  const netLineY = Math.min(y5 - 30, summaryY + 1);
  const netTextY = Math.min(y5 - 24, netLineY + 4);
  drawHorizontalLine(doc, taxSplitX, x + w, netLineY);
  doc.font("Helvetica-Bold").fontSize(14).text("NET AMOUNT", taxSplitX + 8, netTextY, {
    width: w - (taxSplitX - x) - summaryValueW - 16
  });
  doc.font("Helvetica-Bold").fontSize(14).text(formatAmount(invoice.total), x + w - summaryValueW - 8, netTextY, {
    width: summaryValueW,
    align: "right"
  });

  doc.font("Helvetica").fontSize(12).text(amountToWords(invoice.total), x + 8, y5 + 5, { width: w - 16 });

  const footerSplitX = x + Math.floor(w * 0.60);
  const signTop = y6 + footerH - 44;
  doc.moveTo(footerSplitX, y6).lineTo(footerSplitX, y + h).stroke();
  drawHorizontalLine(doc, x, x + w, signTop);

  doc.font("Helvetica-Bold").fontSize(13).text("Terms & Conditions:", x + 8, y6 + 6);
  const terms = [
    "Our risks and responsibilities cease once the goods have left our premises.",
    "No Exchange and No Return Without Invoice.",
  ];
  let termsY = y6 + 24;
  for (let index = 0; index < terms.length; index += 1) {
    doc.font("Helvetica").fontSize(10).text(`${index + 1}. ${terms[index]}`, x + 10, termsY, { width: footerSplitX - x - 20 });
    termsY = doc.y + 3;
  }
  doc.font("Helvetica").fontSize(11).text("Receiver Sign", x + 8, signTop + 14);

  const rightWFooter = x + w - footerSplitX;
  const qrAreaSplitX = footerSplitX + Math.floor(rightWFooter * 0.34);
  doc.moveTo(qrAreaSplitX, y6).lineTo(qrAreaSplitX, signTop).stroke();
  const qrCellWidth = qrAreaSplitX - footerSplitX;
  const qrCellHeight = signTop - y6;
  const qrSize = Math.max(62, Math.min(86, qrCellWidth - 10, qrCellHeight - 10));
  const qrX = footerSplitX + Math.floor((qrCellWidth - qrSize) / 2);
  const qrY = y6 + Math.floor((qrCellHeight - qrSize) / 2);
  if (qrBuffer) {
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
  } else {
    doc.rect(qrX, qrY, qrSize, qrSize).stroke();
    doc.font("Helvetica").fontSize(9).text("UPI QR", qrX, qrY + 36, { width: qrSize, align: "center" });
  }

  const bankX = qrAreaSplitX + 8;
  const bankDetails = [
    ["Our Bank Detail", ""],
    ["Bank Name", toText(settings.bankName)],
    ["A/C Name", toText(settings.bankAccountName)],
    ["A/C No", toText(settings.bankAccountNumber)],
    ["IFSC Code", toText(settings.bankIfsc)],
    ["UPI ID", toText(settings.upiId)]
  ];
  let bankY = y6 + 8;
  const bankLabelWidth = 50;
  const bankValueWidth = x + w - bankX - bankLabelWidth - 8;
  for (const [label, value] of bankDetails) {
    if (label === "Our Bank Detail") {
      doc.font("Helvetica-Bold").fontSize(12).text(label, bankX, bankY, {
        width: x + w - bankX - 8
      });
      bankY += 16;
      continue;
    }
    if (!value) {
      continue;
    }
    doc.font("Helvetica-Bold").fontSize(9.4).text(`${label} :`, bankX, bankY, { width: bankLabelWidth });
    doc.font("Helvetica").fontSize(9.4);
    const valueText = toText(value);
    const valueHeight = doc.heightOfString(valueText, { width: bankValueWidth, lineBreak: true });
    const rowHeight = Math.max(11, Math.min(20, Math.ceil(valueHeight)));
    doc.text(valueText, bankX + bankLabelWidth, bankY, {
      width: bankValueWidth,
      height: rowHeight
    });
    bankY += rowHeight + 1;
    if (bankY > signTop - 4) {
      break;
    }
  }

  doc.font("Helvetica-Bold").fontSize(12).text(
    fitSingleLineText(doc, `For, ${companyName}`, rightWFooter - 16),
    footerSplitX + 8,
    signTop + 5,
    {
    width: rightWFooter - 16,
    align: "right"
    }
  );
  const signatureY = signTop + 24;
  doc.moveTo(x + w - 130, signatureY).lineTo(x + w - 12, signatureY).stroke();
  doc.font("Helvetica-Bold").fontSize(10.5).text("Authorised Signatory", footerSplitX + 8, signTop + 27, {
    width: rightWFooter - 16,
    align: "right"
  });

  doc.info.Title = `Invoice ${invoiceNumber}`;
  doc.info.Subject = `Invoice generated for ${toText(invoice.customer?.name) || "customer"}`;
  doc.info.Author = toText(companyProfile.name) || toText(settings.companyName) || "InvoiceFlow Pro";

  doc.end();
  return output;
}
