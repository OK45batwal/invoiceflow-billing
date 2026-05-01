import fs from "fs";
import { createInvoicePdfBuffer } from "./src/invoicePdf.js";

const sampleInvoice = {
  id: 1,
  invoiceNumber: "01",
  createdAt: new Date("2026-03-21T07:29:11.307Z").toISOString(),
  dueDate: new Date("2026-04-05T07:29:11.307Z").toISOString(),
  status: "unpaid",
  gstType: "none",
  paymentMode: "UPI",
  notes: "",
  customer: {
    name: "ALPESH VIJAY",
    address: "-\nPhone: +919726980442",
    phone: "",
    gstin: ""
  },
  items: [
    {
      productName: "Transformer",
      hsnSac: "-",
      quantity: 60,
      unitPrice: 123,
      lineTotal: 7380,
      taxableAmount: 7380,
      taxRate: 0,
      unit: "PCS"
    },
    {
      productName: "Ic old",
      hsnSac: "-",
      quantity: 50,
      unitPrice: 7,
      lineTotal: 350,
      taxableAmount: 350,
      taxRate: 0,
      unit: "PCS"
    }
  ],
  subtotalTaxable: 7730,
  cgstTotal: 0,
  sgstTotal: 0,
  igstTotal: 0,
  invoiceDiscount: 0,
  shipping: 0,
  roundOff: 0,
  total: 7730
};

const sampleSettings = {
  companyName: "MALINE ENTERPRISE",
  companyAddress: "-",
  companyPhone: "",
  companyEmail: "batwalomkar19@gmail.com",
  companyGstin: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  upiId: "Okbatwal@okicici"
};

async function generate() {
  try {
    const buffer = await createInvoicePdfBuffer(sampleInvoice, sampleSettings);
    fs.writeFileSync("sample_preview.pdf", buffer);
    console.log("sample_preview.pdf generated successfully!");
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
}

generate();
