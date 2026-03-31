import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as store from "../src/store.js";
import { deleteSession, getSessionUser } from "../src/auth.js";
import { createInvoicePdfBuffer } from "../src/invoicePdf.js";
import { getFirebaseDb, hasFirebaseConfig } from "./firebase.js";
import otpRouter from "./routes/otp.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const loginComponentPath = path.join(__dirname, "..", "src", "Login.js");
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: "10mb" }));
app.use(express.static(publicDir));
app.get("/src/Login.js", (_req, res) => {
  res.type("application/javascript");
  res.sendFile(loginComponentPath);
});
app.use("/api/auth", otpRouter);
app.use("/", otpRouter);

function getToken(req) {
  const header = String(req.headers.authorization || "");
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  const tokenFromQuery = String(req.query?.token || "").trim();
  return tokenFromQuery || "";
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing auth token. Please login." });
  }

  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: "Session expired. Please login again." });
  }

  req.auth = { token, user };
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.user?.role;
    if (!roles.includes(role)) {
      return res.status(403).json({ error: "You do not have permission for this action." });
    }
    return next();
  };
}

function isOtpSession(req) {
  return req.auth?.user?.authMethod === "otp";
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", (_req, res) => {
  return res.status(410).json({
    error: "Password login has been replaced by email OTP. Use /send-otp and /verify-otp."
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  deleteSession(req.auth.token);
  return res.json({ message: "Logged out." });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.auth.user });
});

app.put("/api/auth/password", requireAuth, (req, res) => {
  if (isOtpSession(req)) {
    return res.status(400).json({ error: "Password management is disabled for OTP accounts." });
  }

  try {
    const user = store.changeUserPassword(req.auth.user.id, {
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ message: "Password updated.", user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/users", requireAuth, requireRole("admin"), (req, res) => {
  if (isOtpSession(req)) {
    return res.json([]);
  }
  return res.json(store.listUsers());
});

app.put("/api/users/:id/password", requireAuth, requireRole("admin"), (req, res) => {
  if (isOtpSession(req)) {
    return res.status(400).json({ error: "Password resets are disabled for OTP accounts." });
  }

  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "User ID must be a positive integer." });
  }

  try {
    const user = store.changeUserPassword(userId, {
      newPassword: req.body?.newPassword,
      bypassCurrentPassword: true
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ message: `Password updated for ${user.username}.`, user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/customers", requireAuth, (_req, res) => {
  res.json(store.listCustomers());
});

app.post("/api/customers", requireAuth, (req, res) => {
  try {
    const customer = store.createCustomer({
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone,
      address: req.body?.address,
      gstin: req.body?.gstin,
      stateCode: req.body?.stateCode
    });
    return res.status(201).json(customer);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.put("/api/customers/:id", requireAuth, (req, res) => {
  const customerId = Number(req.params.id);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res.status(400).json({ error: "Customer ID must be a positive integer." });
  }

  try {
    const customer = store.updateCustomerById(customerId, {
      name: req.body?.name,
      email: req.body?.email,
      phone: req.body?.phone,
      address: req.body?.address,
      gstin: req.body?.gstin,
      stateCode: req.body?.stateCode
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    return res.json(customer);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete("/api/customers/:id", requireAuth, requireRole("admin"), (req, res) => {
  const customerId = Number(req.params.id);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res.status(400).json({ error: "Customer ID must be a positive integer." });
  }

  try {
    const customer = store.deleteCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }
    return res.json({ message: `Customer \"${customer.name}\" removed.`, customer });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/customers/:id/statement", requireAuth, (req, res) => {
  const customerId = Number(req.params.id);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res.status(400).json({ error: "Customer ID must be a positive integer." });
  }

  const statement = store.getCustomerStatement(customerId, {
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo
  });

  if (!statement) {
    return res.status(404).json({ error: "Customer not found." });
  }

  return res.json(statement);
});

app.get("/api/products", requireAuth, (_req, res) => {
  res.json(store.listProducts());
});

app.post("/api/products", requireAuth, (req, res) => {
  try {
    const product = store.createProduct({
      name: req.body?.name,
      hsnSac: req.body?.hsnSac,
      pricingModel: req.body?.pricingModel,
      price: req.body?.price,
      taxRate: req.body?.taxRate
    });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete("/api/products/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Product ID must be a positive integer." });
  }

  try {
    const deleted = store.deleteProductById(id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found." });
    }
    return res.json({ message: `Product #${id} removed.`, product: deleted });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/invoices", requireAuth, (req, res) => {
  res.json(
    store.listInvoices({
      query: req.query.query,
      status: req.query.status,
      customerId: req.query.customerId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    })
  );
});

app.get("/api/invoices/:id", requireAuth, (req, res) => {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return res.status(400).json({ error: "Invoice ID must be a positive integer." });
  }

  const invoice = store.getInvoiceById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found." });
  }

  return res.json(invoice);
});

app.post("/api/invoices", requireAuth, (req, res) => {
  try {
    const invoice = store.createInvoice(req.body || {});
    return res.status(201).json(invoice);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/invoices/:id/payments", requireAuth, (req, res) => {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return res.status(400).json({ error: "Invoice ID must be a positive integer." });
  }

  try {
    const invoice = store.addInvoicePayment(invoiceId, {
      amount: req.body?.amount,
      date: req.body?.date,
      method: req.body?.method,
      note: req.body?.note
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    return res.json(invoice);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/invoices/:id/pdf", requireAuth, async (req, res) => {
  const invoiceId = Number(req.params.id);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return res.status(400).json({ error: "Invoice ID must be a positive integer." });
  }

  const invoice = store.getInvoiceById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found." });
  }

  try {
    const settings = store.getSettings();
    const pdfBuffer = await createInvoicePdfBuffer(invoice, settings);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    return res.send(pdfBuffer);
  } catch (_error) {
    return res.status(500).json({ error: "Failed to generate invoice PDF." });
  }
});

app.delete("/api/invoices/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invoice ID must be a positive integer." });
  }

  const deleted = store.deleteInvoiceById(id);
  if (!deleted) {
    return res.status(404).json({ error: "Invoice not found." });
  }

  return res.json({ message: `Invoice #${id} removed.`, invoice: deleted });
});

app.get("/api/recurring", requireAuth, (_req, res) => {
  res.json(store.listRecurringTemplates());
});

app.post("/api/recurring", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const template = store.createRecurringTemplate(req.body || {});
    return res.status(201).json(template);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.put("/api/recurring/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Recurring ID must be a positive integer." });
  }

  try {
    const template = store.updateRecurringTemplate(id, req.body || {});
    if (!template) {
      return res.status(404).json({ error: "Recurring template not found." });
    }
    return res.json(template);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete("/api/recurring/:id", requireAuth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Recurring ID must be a positive integer." });
  }

  const deleted = store.deleteRecurringTemplate(id);
  if (!deleted) {
    return res.status(404).json({ error: "Recurring template not found." });
  }

  return res.json({ message: `Recurring template #${id} removed.`, template: deleted });
});

app.post("/api/recurring/run", requireAuth, requireRole("admin"), (_req, res) => {
  const created = store.runRecurringNow();
  return res.json({ createdCount: created.length, invoices: created });
});

app.get("/api/reports/summary", requireAuth, (req, res) => {
  const report = store.getReportsSummary({
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    customerId: req.query.customerId,
    status: req.query.status
  });
  res.json(report);
});

app.get("/api/settings", requireAuth, (_req, res) => {
  res.json(store.getSettings());
});

app.put("/api/settings", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const settings = store.updateSettings(req.body || {});
    return res.json(settings);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get("/api/backup", requireAuth, requireRole("admin"), (_req, res) => {
  const backup = store.exportBackupData();
  const stamp = backup.exportedAt
    .replaceAll(":", "")
    .replaceAll("-", "")
    .replaceAll(".", "")
    .replace("T", "-")
    .replace("Z", "");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=invoiceflow-pro-backup-${stamp}.json`);
  return res.json(backup);
});

app.post("/api/backup/restore", requireAuth, requireRole("admin"), (req, res) => {
  try {
    const summary = store.restoreBackupData(req.body);
    return res.json({ message: "Backup restored.", summary });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.listen(port, host, () => {
  console.log(`InvoiceFlow Pro listening on http://${host}:${port}`);

  if (hasFirebaseConfig()) {
    try {
      getFirebaseDb();
      console.log("Firebase connection ready for OTP login.");
    } catch (error) {
      console.error(`Firebase connection failed: ${error.message}`);
    }
  } else {
    console.warn(
      "Firebase is not configured. OTP verification will use temporary in-memory users until Firebase is configured."
    );
  }
});

