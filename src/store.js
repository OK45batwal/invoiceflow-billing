
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword, sanitizeUser, verifyPassword } from "./auth.js";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = process.env.DATA_DIR
  ? path.resolve(String(process.env.DATA_DIR))
  : path.join(__dirname, "..", "data");
const dataPath = path.join(dataDir, "store.json");
const storageDriver = String(process.env.STORAGE_DRIVER || "json")
  .trim()
  .toLowerCase();
const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(String(process.env.SQLITE_PATH))
  : path.join(dataDir, "store.sqlite");
const sqliteStoreId = "invoiceflow_store";
let sqliteDb = null;
let DatabaseSyncClass = null;
const FALLBACK_ADMIN_PASSWORD = "admin123";
const FALLBACK_STAFF_PASSWORD = "staff123";
const FALLBACK_ADMIN_HASH = hashPassword(FALLBACK_ADMIN_PASSWORD);
const FALLBACK_STAFF_HASH = hashPassword(FALLBACK_STAFF_PASSWORD);
const DEFAULT_COMPANY_PROFILE = {
  name: "My Company",
  address: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  state: "",
  stateCode: ""
};

const DEFAULT_SETTINGS = {
  companyName: "My Company",
  companyAddress: "",
  companyEmail: "",
  companyPhone: "",
  companyGstin: "",
  companyProfiles: {
    gst: {
      name: "My Company",
      address: "",
      email: "",
      phone: "",
      gstin: "",
      pan: "",
      state: "Gujarat",
      stateCode: ""
    },
    nonGst: {
      name: "My Company",
      address: "",
      email: "",
      phone: "",
      gstin: "",
      pan: "",
      state: "",
      stateCode: ""
    }
  },
  companyPan: "",
  companyState: "Gujarat",
  companyStateCode: "",
  invoicePrefix: "INV",
  financialYearStartMonth: 4,
  upiId: "",
  upiPayeeName: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: ""
};

const DEFAULT_USERS = [
  {
    id: 1,
    username: "admin",
    name: "Administrator",
    role: "admin",
    passwordHash: hashPassword(process.env.DEFAULT_ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD)
  },
  {
    id: 2,
    username: "staff",
    name: "Billing Staff",
    role: "staff",
    passwordHash: hashPassword(process.env.DEFAULT_STAFF_PASSWORD || FALLBACK_STAFF_PASSWORD)
  }
];

const DEFAULT_STORE = {
  nextCustomerId: 1,
  nextProductId: 1,
  nextInvoiceId: 1,
  nextPaymentId: 1,
  nextRecurringId: 1,
  nextUserId: 3,
  customers: [],
  products: [],
  invoices: [],
  recurringTemplates: [],
  users: DEFAULT_USERS,
  settings: DEFAULT_SETTINGS,
  invoiceCounters: {}
};

function roundMoney(value) {
  return Number((Math.round((Number(value) + Number.EPSILON) * 100) / 100).toFixed(2));
}

function toText(value) {
  return String(value || "").trim();
}

function normalizeCustomerProfile(input = {}, fallback = {}) {
  return {
    name: toText(input?.name ?? fallback?.name),
    email: toText(input?.email ?? fallback?.email),
    phone: toText(input?.phone ?? fallback?.phone),
    address: toText(input?.address ?? fallback?.address),
    gstin: toText(input?.gstin ?? fallback?.gstin),
    stateCode: toText(input?.stateCode ?? fallback?.stateCode)
  };
}

function normalizeCompanyProfile(input = {}, fallback = {}) {
  return {
    name: toText(input?.name ?? fallback?.name),
    address: toText(input?.address ?? fallback?.address),
    email: toText(input?.email ?? fallback?.email),
    phone: toText(input?.phone ?? fallback?.phone),
    gstin: toText(input?.gstin ?? fallback?.gstin),
    pan: toText(input?.pan ?? fallback?.pan),
    state: toText(input?.state ?? fallback?.state),
    stateCode: toText(input?.stateCode ?? fallback?.stateCode)
  };
}

function normalizeCompanyProfiles(input = {}) {
  const gst = normalizeCompanyProfile(
    {
      name: input?.companyProfiles?.gst?.name ?? input?.gstCompanyName ?? input?.companyName,
      address: input?.companyProfiles?.gst?.address ?? input?.gstCompanyAddress ?? input?.companyAddress,
      email: input?.companyProfiles?.gst?.email ?? input?.gstCompanyEmail ?? input?.companyEmail,
      phone: input?.companyProfiles?.gst?.phone ?? input?.gstCompanyPhone ?? input?.companyPhone,
      gstin: input?.companyProfiles?.gst?.gstin ?? input?.gstCompanyGstin ?? input?.companyGstin,
      pan: input?.companyProfiles?.gst?.pan ?? input?.gstCompanyPan ?? input?.companyPan,
      state: input?.companyProfiles?.gst?.state ?? input?.gstCompanyState ?? input?.companyState,
      stateCode:
        input?.companyProfiles?.gst?.stateCode ??
        input?.gstCompanyStateCode ??
        input?.companyStateCode
    },
    DEFAULT_COMPANY_PROFILE
  );

  const nonGstFallback = {
    ...DEFAULT_COMPANY_PROFILE,
    name: gst.name || DEFAULT_COMPANY_PROFILE.name,
    address: gst.address,
    email: gst.email,
    phone: gst.phone,
    gstin: "",
    pan: "",
    state: gst.state,
    stateCode: ""
  };
  const nonGst = normalizeCompanyProfile(
    {
      name: input?.companyProfiles?.nonGst?.name ?? input?.nonGstCompanyName ?? input?.companyName,
      address: input?.companyProfiles?.nonGst?.address ?? input?.nonGstCompanyAddress ?? input?.companyAddress,
      email: input?.companyProfiles?.nonGst?.email ?? input?.nonGstCompanyEmail ?? input?.companyEmail,
      phone: input?.companyProfiles?.nonGst?.phone ?? input?.nonGstCompanyPhone ?? input?.companyPhone,
      gstin: input?.companyProfiles?.nonGst?.gstin ?? input?.nonGstCompanyGstin ?? "",
      pan: input?.companyProfiles?.nonGst?.pan ?? input?.nonGstCompanyPan ?? "",
      state: input?.companyProfiles?.nonGst?.state ?? input?.nonGstCompanyState ?? "",
      stateCode: input?.companyProfiles?.nonGst?.stateCode ?? input?.nonGstCompanyStateCode ?? ""
    },
    nonGstFallback
  );

  return { gst, nonGst };
}

function applyCompanyProfilesToSettings(settings) {
  settings.companyProfiles = normalizeCompanyProfiles(settings);

  settings.companyName = settings.companyProfiles.gst.name;
  settings.companyAddress = settings.companyProfiles.gst.address;
  settings.companyEmail = settings.companyProfiles.gst.email;
  settings.companyPhone = settings.companyProfiles.gst.phone;
  settings.companyGstin = settings.companyProfiles.gst.gstin;
  settings.companyPan = settings.companyProfiles.gst.pan;
  settings.companyState = settings.companyProfiles.gst.state || "Gujarat";
  settings.companyStateCode = settings.companyProfiles.gst.stateCode;

  settings.gstCompanyName = settings.companyProfiles.gst.name;
  settings.gstCompanyAddress = settings.companyProfiles.gst.address;
  settings.gstCompanyEmail = settings.companyProfiles.gst.email;
  settings.gstCompanyPhone = settings.companyProfiles.gst.phone;
  settings.gstCompanyGstin = settings.companyProfiles.gst.gstin;
  settings.gstCompanyPan = settings.companyProfiles.gst.pan;
  settings.gstCompanyState = settings.companyProfiles.gst.state || "Gujarat";
  settings.gstCompanyStateCode = settings.companyProfiles.gst.stateCode;

  settings.nonGstCompanyName = settings.companyProfiles.nonGst.name;
  settings.nonGstCompanyAddress = settings.companyProfiles.nonGst.address;
  settings.nonGstCompanyEmail = settings.companyProfiles.nonGst.email;
  settings.nonGstCompanyPhone = settings.companyProfiles.nonGst.phone;
  settings.nonGstCompanyGstin = settings.companyProfiles.nonGst.gstin;
  settings.nonGstCompanyPan = settings.companyProfiles.nonGst.pan;
  settings.nonGstCompanyState = settings.companyProfiles.nonGst.state;
  settings.nonGstCompanyStateCode = settings.companyProfiles.nonGst.stateCode;
}

function normalizeCompanyProfileType(value, gstType = "intra") {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "nongst" || normalized === "non_gst" || normalized === "non-gst") {
    return "nonGst";
  }
  if (normalized === "gst") {
    return "gst";
  }
  return normalizeGstType(gstType) === "none" ? "nonGst" : "gst";
}

function getCompanyProfileForInvoice(settings, gstType) {
  const profileType = normalizeGstType(gstType) === "none" ? "nonGst" : "gst";
  const profiles = normalizeCompanyProfiles(settings || {});
  return {
    profileType,
    profile: profileType === "nonGst" ? profiles.nonGst : profiles.gst
  };
}

function ensureInvoiceCompanySnapshots(store) {
  for (const invoice of store.invoices || []) {
    const currentType = normalizeCompanyProfileType(invoice.companyProfileType, invoice.gstType);
    const currentProfile = normalizeCompanyProfile(invoice.companyProfile || {}, {});
    const hasCurrentProfile = Object.values(currentProfile).some((value) => Boolean(value));
    if (invoice.companyProfileType && hasCurrentProfile) {
      continue;
    }

    const selection = getCompanyProfileForInvoice(store.settings, invoice.gstType);
    invoice.companyProfileType = currentType || selection.profileType;
    invoice.companyProfile = hasCurrentProfile ? currentProfile : { ...selection.profile };
  }
}

function toDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addDays(date, days) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + Number(days || 0));
  return result;
}

function addTemplateFrequency(date, frequency) {
  const result = new Date(date.getTime());
  if (normalizeFrequency(frequency) === "weekly") {
    result.setDate(result.getDate() + 7);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

function normalizePricingModel(value) {
  return String(value || "exclusive").toLowerCase() === "inclusive" ? "inclusive" : "exclusive";
}

function normalizeGstType(value) {
  const normalized = String(value || "intra").toLowerCase();
  if (normalized === "inter") {
    return "inter";
  }
  if (normalized === "none" || normalized === "without_gst" || normalized === "without-gst") {
    return "none";
  }
  return "intra";
}

function normalizeFrequency(value) {
  return String(value || "monthly").toLowerCase() === "weekly" ? "weekly" : "monthly";
}

function maxId(items) {
  let max = 0;
  for (const item of items) {
    const id = Number(item?.id || 0);
    if (id > max) {
      max = id;
    }
  }
  return max;
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function ensureSqliteDir() {
  const sqliteDir = path.dirname(sqlitePath);
  if (!fs.existsSync(sqliteDir)) {
    fs.mkdirSync(sqliteDir, { recursive: true });
  }
}

function ensureStoreFile() {
  ensureDataDir();
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

function getSqliteDb() {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!DatabaseSyncClass) {
    try {
      const sqliteModule = require("node:sqlite");
      DatabaseSyncClass = sqliteModule.DatabaseSync;
    } catch (_error) {
      throw new Error(
        "SQLite storage requires Node.js with built-in node:sqlite (use Node 22+), or set STORAGE_DRIVER=json."
      );
    }
  }

  ensureSqliteDir();
  sqliteDb = new DatabaseSyncClass(sqlitePath);
  sqliteDb.exec(
    "CREATE TABLE IF NOT EXISTS app_store (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)"
  );
  return sqliteDb;
}

function ensureSqliteStore() {
  const db = getSqliteDb();
  const row = db.prepare("SELECT id FROM app_store WHERE id = ?").get(sqliteStoreId);
  if (!row) {
    db.prepare("INSERT INTO app_store (id, payload, updated_at) VALUES (?, ?, ?)")
      .run(sqliteStoreId, JSON.stringify(DEFAULT_STORE), new Date().toISOString());
  }
}

function normalizeInvoiceItem(item, gstType) {
  const normalizedGstType = normalizeGstType(gstType);
  const taxTotal =
    item.taxTotal !== undefined
      ? roundMoney(item.taxTotal)
      : roundMoney(item.lineTax !== undefined ? item.lineTax : 0);
  const taxableAmount =
    item.taxableAmount !== undefined
      ? roundMoney(item.taxableAmount)
      : roundMoney(item.lineSubtotal !== undefined ? item.lineSubtotal : 0);
  const lineTotal =
    item.lineTotal !== undefined
      ? roundMoney(item.lineTotal)
      : roundMoney(taxableAmount + taxTotal);
  const lineDiscount =
    item.lineDiscount !== undefined ? roundMoney(Math.max(0, item.lineDiscount)) : 0;
  const pricingModel = normalizePricingModel(item.pricingModel);

  let cgst = Number(item.cgst || 0);
  let sgst = Number(item.sgst || 0);
  let igst = Number(item.igst || 0);

  if (normalizedGstType === "none") {
    cgst = 0;
    sgst = 0;
    igst = 0;
  }

  if (cgst === 0 && sgst === 0 && igst === 0 && taxTotal > 0) {
    if (normalizedGstType === "inter") {
      igst = taxTotal;
    } else if (normalizedGstType === "intra") {
      cgst = roundMoney(taxTotal / 2);
      sgst = roundMoney(taxTotal - cgst);
    }
  }

  const normalizedTaxTotal =
    normalizedGstType === "none" ? 0 : roundMoney(taxTotal);
  const normalizedLineTotal =
    item.lineTotal !== undefined
      ? roundMoney(item.lineTotal)
      : roundMoney(taxableAmount + normalizedTaxTotal);

  return {
    productId: Number(item.productId) || 0,
    productName: toText(item.productName),
    hsnSac: toText(item.hsnSac),
    quantity: roundMoney(Number(item.quantity || 0)),
    unitPrice: roundMoney(Number(item.unitPrice || 0)),
    pricingModel,
    taxRate: roundMoney(Number(item.taxRate || 0)),
    lineDiscount,
    grossAmount:
      item.grossAmount !== undefined
        ? roundMoney(item.grossAmount)
        : roundMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0)),
    taxableAmount,
    cgst: roundMoney(cgst),
    sgst: roundMoney(sgst),
    igst: roundMoney(igst),
    taxTotal: normalizedTaxTotal,
    lineTotal: normalizedLineTotal
  };
}

function normalizeInvoice(invoice) {
  const createdAt = toDate(invoice.createdAt) || new Date();
  const gstType = normalizeGstType(invoice.gstType);
  const items = (Array.isArray(invoice.items) ? invoice.items : []).map((item) =>
    normalizeInvoiceItem(item, gstType)
  );
  const subtotalTaxable = roundMoney(
    invoice.subtotalTaxable !== undefined
      ? invoice.subtotalTaxable
      : items.reduce((sum, item) => sum + item.taxableAmount, 0)
  );
  const lineDiscountTotal = roundMoney(
    invoice.lineDiscountTotal !== undefined
      ? invoice.lineDiscountTotal
      : items.reduce((sum, item) => sum + item.lineDiscount, 0)
  );
  const cgstTotal = roundMoney(
    invoice.cgstTotal !== undefined
      ? invoice.cgstTotal
      : items.reduce((sum, item) => sum + item.cgst, 0)
  );
  const sgstTotal = roundMoney(
    invoice.sgstTotal !== undefined
      ? invoice.sgstTotal
      : items.reduce((sum, item) => sum + item.sgst, 0)
  );
  const igstTotal = roundMoney(
    invoice.igstTotal !== undefined
      ? invoice.igstTotal
      : items.reduce((sum, item) => sum + item.igst, 0)
  );
  const taxTotal = roundMoney(
    invoice.taxTotal !== undefined ? invoice.taxTotal : cgstTotal + sgstTotal + igstTotal
  );

  const invoiceDiscount = roundMoney(Math.max(0, Number(invoice.invoiceDiscount || 0)));
  const shipping = roundMoney(Number(invoice.shipping || 0));
  const roundOff = roundMoney(Number(invoice.roundOff || 0));

  const baseTotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const total =
    invoice.total !== undefined
      ? roundMoney(invoice.total)
      : roundMoney(Math.max(baseTotal - invoiceDiscount + shipping + roundOff, 0));

  const dueDate =
    toDate(invoice.dueDate)?.toISOString() || addDays(createdAt, Number(invoice.dueDays || 15)).toISOString();

  const payments = (Array.isArray(invoice.payments) ? invoice.payments : []).map((payment) => ({
    id: Number(payment.id) || 0,
    amount: roundMoney(Number(payment.amount || 0)),
    date: toDate(payment.date)?.toISOString() || new Date().toISOString(),
    method: toText(payment.method) || "cash",
    note: toText(payment.note)
  }));
  const companyProfileType = normalizeCompanyProfileType(invoice.companyProfileType, gstType);
  const normalizedCompanyProfile = normalizeCompanyProfile(invoice.companyProfile || {}, {});
  const hasCompanyProfile = Object.values(normalizedCompanyProfile).some((value) => Boolean(value));
  const normalizedCustomerProfile = normalizeCustomerProfile(invoice.customerProfile || {}, {});
  const hasCustomerProfile = Object.values(normalizedCustomerProfile).some((value) => Boolean(value));

  return {
    id: Number(invoice.id) || 0,
    invoiceNumber: toText(invoice.invoiceNumber) || `LEGACY-${Number(invoice.id) || 0}`,
    customerId: Number(invoice.customerId) || 0,
    createdAt: createdAt.toISOString(),
    dueDate,
    gstType,
    notes: toText(invoice.notes),
    items,
    subtotalTaxable,
    lineDiscountTotal,
    invoiceDiscount,
    shipping,
    roundOff,
    cgstTotal,
    sgstTotal,
    igstTotal,
    taxTotal,
    subtotal: subtotalTaxable,
    tax: taxTotal,
    total,
    companyProfileType,
    companyProfile: hasCompanyProfile ? normalizedCompanyProfile : null,
    customerProfile: hasCustomerProfile ? normalizedCustomerProfile : null,
    payments
  };
}
function migrateStore(parsed) {
  const store = {
    ...DEFAULT_STORE,
    ...parsed,
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    users:
      Array.isArray(parsed.users) && parsed.users.length > 0
        ? parsed.users.map((user, index) => ({
            id: Number(user.id) || index + 1,
            username: toText(user.username).toLowerCase(),
            name: toText(user.name) || toText(user.username) || `User ${index + 1}`,
            role: toText(user.role).toLowerCase() === "staff" ? "staff" : "admin",
            passwordHash: toText(user.passwordHash) || hashPassword("admin123")
          }))
        : DEFAULT_USERS,
    customers: Array.isArray(parsed.customers)
      ? parsed.customers.map((customer, index) => ({
          id: Number(customer.id) || index + 1,
          name: toText(customer.name),
          email: toText(customer.email),
          phone: toText(customer.phone),
          address: toText(customer.address),
          gstin: toText(customer.gstin),
          stateCode: toText(customer.stateCode),
          createdAt: toDate(customer.createdAt)?.toISOString() || new Date().toISOString()
        }))
      : [],
    products: Array.isArray(parsed.products)
      ? parsed.products.map((product, index) => ({
          id: Number(product.id) || index + 1,
          name: toText(product.name),
          hsnSac: toText(product.hsnSac),
          pricingModel: normalizePricingModel(product.pricingModel),
          price: roundMoney(Number(product.price || 0)),
          taxRate: roundMoney(Number(product.taxRate || 0)),
          createdAt: toDate(product.createdAt)?.toISOString() || new Date().toISOString()
        }))
      : [],
    invoices: Array.isArray(parsed.invoices) ? parsed.invoices.map((invoice) => normalizeInvoice(invoice)) : [],
    recurringTemplates: Array.isArray(parsed.recurringTemplates)
      ? parsed.recurringTemplates
      : Array.isArray(parsed.recurring)
        ? parsed.recurring
        : [],
    invoiceCounters:
      typeof parsed.invoiceCounters === "object" && parsed.invoiceCounters !== null
        ? parsed.invoiceCounters
        : {}
  };

  store.recurringTemplates = store.recurringTemplates.map((template, index) => {
    const startDate = toDate(template.startDate) || new Date();
    const nextRunAt = toDate(template.nextRunAt) || startDate;
    return {
      id: Number(template.id) || index + 1,
      name: toText(template.name) || `Recurring #${index + 1}`,
      customerId: Number(template.customerId) || 0,
      frequency: normalizeFrequency(template.frequency),
      dueDays: Number.isFinite(Number(template.dueDays)) ? Number(template.dueDays) : 15,
      gstType: normalizeGstType(template.gstType),
      notes: toText(template.notes),
      invoiceDiscount: roundMoney(Math.max(0, Number(template.invoiceDiscount || 0))),
      shipping: roundMoney(Number(template.shipping || 0)),
      roundOff: roundMoney(Number(template.roundOff || 0)),
      active: template.active !== false,
      startDate: startDate.toISOString(),
      nextRunAt: nextRunAt.toISOString(),
      lastRunAt: toDate(template.lastRunAt)?.toISOString() || null,
      lastInvoiceNumber: toText(template.lastInvoiceNumber),
      lastError: toText(template.lastError),
      createdAt: toDate(template.createdAt)?.toISOString() || new Date().toISOString(),
      updatedAt: toDate(template.updatedAt)?.toISOString() || new Date().toISOString(),
      items: (Array.isArray(template.items) ? template.items : []).map((item) => ({
        productId: Number(item.productId) || 0,
        quantity: roundMoney(Number(item.quantity || 0)),
        lineDiscount: roundMoney(Math.max(0, Number(item.lineDiscount || 0))),
        unitPrice:
          item.unitPrice !== undefined && item.unitPrice !== null ? roundMoney(Number(item.unitPrice || 0)) : null,
        taxRate: item.taxRate !== undefined && item.taxRate !== null ? roundMoney(Number(item.taxRate || 0)) : null,
        pricingModel: item.pricingModel ? normalizePricingModel(item.pricingModel) : null
      }))
    };
  });

  const customerMax = maxId(store.customers);
  const productMax = maxId(store.products);
  const invoiceMax = maxId(store.invoices);
  const paymentMax = store.invoices.reduce(
    (maxValue, invoice) => Math.max(maxValue, maxId(invoice.payments || [])),
    0
  );
  const recurringMax = maxId(store.recurringTemplates);
  const userMax = maxId(store.users);

  store.nextCustomerId = Math.max(Number(store.nextCustomerId || 0), customerMax + 1, 1);
  store.nextProductId = Math.max(Number(store.nextProductId || 0), productMax + 1, 1);
  store.nextInvoiceId = Math.max(Number(store.nextInvoiceId || 0), invoiceMax + 1, 1);
  store.nextPaymentId = Math.max(Number(store.nextPaymentId || 0), paymentMax + 1, 1);
  store.nextRecurringId = Math.max(Number(store.nextRecurringId || 0), recurringMax + 1, 1);
  store.nextUserId = Math.max(Number(store.nextUserId || 0), userMax + 1, 1);

  const month = Number(store.settings.financialYearStartMonth || 4);
  store.settings.financialYearStartMonth = month >= 1 && month <= 12 ? month : 4;
  store.settings.invoicePrefix =
    toText(store.settings.invoicePrefix).replace(/\s+/g, "-").toUpperCase() || "INV";
  applyCompanyProfilesToSettings(store.settings);
  ensureInvoiceCompanySnapshots(store);

  const envAdminPassword = toText(process.env.DEFAULT_ADMIN_PASSWORD);
  const envStaffPassword = toText(process.env.DEFAULT_STAFF_PASSWORD);
  for (const user of store.users) {
    const username = toText(user.username).toLowerCase();
    if (username === "admin" && envAdminPassword && user.passwordHash === FALLBACK_ADMIN_HASH) {
      user.passwordHash = hashPassword(envAdminPassword);
    }
    if (username === "staff" && envStaffPassword && user.passwordHash === FALLBACK_STAFF_HASH) {
      user.passwordHash = hashPassword(envStaffPassword);
    }
  }

  return store;
}

function readStore() {
  let parsed;
  if (storageDriver === "sqlite") {
    ensureSqliteStore();
    const db = getSqliteDb();
    const row = db.prepare("SELECT payload FROM app_store WHERE id = ?").get(sqliteStoreId);
    parsed = row?.payload ? JSON.parse(row.payload) : DEFAULT_STORE;
  } else {
    ensureStoreFile();
    const content = fs.readFileSync(dataPath, "utf8");
    parsed = JSON.parse(content);
  }
  return migrateStore(parsed);
}

function writeStore(store) {
  if (storageDriver === "sqlite") {
    ensureSqliteStore();
    const db = getSqliteDb();
    db.prepare(
      `INSERT INTO app_store (id, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`
    ).run(sqliteStoreId, JSON.stringify(store), new Date().toISOString());
    return;
  }

  fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
}

function ensurePersistedStore() {
  const store = readStore();
  writeStore(store);
  return store;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function getFinancialYearLabel(date, startMonth) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const fyStartYear = month >= startMonth ? year : year - 1;
  const fyEndYearShort = String((fyStartYear + 1) % 100).padStart(2, "0");
  return `${fyStartYear}-${fyEndYearShort}`;
}

function getUniqueInvoiceNumber(store, createdAt) {
  const key = "short";
  let counter = Number(store.invoiceCounters[key] || 0);
  let candidate;

  do {
    counter += 1;
    candidate = String(counter).padStart(2, "0");
  } while (store.invoices.some((invoice) => invoice.invoiceNumber === candidate));

  store.invoiceCounters[key] = counter;
  return candidate;
}

function paymentSummary(invoice) {
  const paidAmount = roundMoney((invoice.payments || []).reduce((sum, payment) => sum + payment.amount, 0));
  const dueAmount = roundMoney(Math.max(Number(invoice.total || 0) - paidAmount, 0));
  const dueDate = toDate(invoice.dueDate);
  let status = "unpaid";

  if (dueAmount <= 0.009) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partial";
  }

  if (status !== "paid" && dueDate && dueDate.getTime() < Date.now()) {
    status = "overdue";
  }

  return {
    paidAmount,
    dueAmount,
    status
  };
}

function publicCustomer(customer) {
  if (!customer) {
    return null;
  }
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    gstin: customer.gstin,
    stateCode: customer.stateCode,
    createdAt: customer.createdAt
  };
}

function hydrateInvoice(invoice, store) {
  const liveCustomer = store.customers.find((entry) => entry.id === invoice.customerId) || null;
  const baseCustomer = publicCustomer(liveCustomer);
  const snapshot = invoice.customerProfile
    ? normalizeCustomerProfile(invoice.customerProfile, {})
    : null;
  const hasSnapshot = snapshot && Object.values(snapshot).some((value) => Boolean(value));
  const customer = hasSnapshot
    ? {
      id: baseCustomer?.id || Number(invoice.customerId) || 0,
      name: snapshot.name || baseCustomer?.name || "Unknown",
      email: snapshot.email || baseCustomer?.email || "",
      phone: snapshot.phone || baseCustomer?.phone || "",
      address: snapshot.address || baseCustomer?.address || "",
      gstin: snapshot.gstin || baseCustomer?.gstin || "",
      stateCode: snapshot.stateCode || baseCustomer?.stateCode || "",
      createdAt: baseCustomer?.createdAt || invoice.createdAt
    }
    : baseCustomer;
  return {
    ...invoice,
    customer,
    ...paymentSummary(invoice)
  };
}
function buildInvoiceLineItem(store, rawItem, gstType, index) {
  const normalizedGstType = normalizeGstType(gstType);
  const productId = Number(rawItem.productId);
  const product = store.products.find((entry) => entry.id === productId);
  if (!product) {
    throw new Error(`Item #${index + 1}: product not found.`);
  }

  const quantity = Number(rawItem.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`Item #${index + 1}: quantity must be greater than 0.`);
  }

  const unitPrice = roundMoney(
    rawItem.unitPrice !== undefined && rawItem.unitPrice !== null ? rawItem.unitPrice : product.price
  );
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error(`Item #${index + 1}: invalid unit price.`);
  }

  const taxRate = roundMoney(
    rawItem.taxRate !== undefined && rawItem.taxRate !== null ? rawItem.taxRate : product.taxRate
  );
  if (!Number.isFinite(taxRate) || taxRate < 0) {
    throw new Error(`Item #${index + 1}: invalid tax rate.`);
  }

  const lineDiscount = roundMoney(Math.max(0, Number(rawItem.lineDiscount || 0)));
  const pricingModel = normalizePricingModel(rawItem.pricingModel || product.pricingModel);
  const grossAmount = roundMoney(unitPrice * quantity);
  const amountAfterDiscount = roundMoney(Math.max(grossAmount - lineDiscount, 0));

  let taxableAmount = 0;
  let taxTotal = 0;
  let lineTotal = 0;

  if (normalizedGstType === "none") {
    taxableAmount = amountAfterDiscount;
    taxTotal = 0;
    lineTotal = amountAfterDiscount;
  } else if (pricingModel === "inclusive") {
    taxableAmount = taxRate > 0 ? roundMoney(amountAfterDiscount / (1 + taxRate / 100)) : amountAfterDiscount;
    taxTotal = roundMoney(amountAfterDiscount - taxableAmount);
    lineTotal = amountAfterDiscount;
  } else {
    taxableAmount = amountAfterDiscount;
    taxTotal = roundMoney(taxableAmount * (taxRate / 100));
    lineTotal = roundMoney(taxableAmount + taxTotal);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (normalizedGstType === "inter") {
    igst = taxTotal;
  } else if (normalizedGstType === "intra") {
    cgst = roundMoney(taxTotal / 2);
    sgst = roundMoney(taxTotal - cgst);
  }

  return {
    productId: product.id,
    productName: toText(rawItem.productName || product.name),
    hsnSac: toText(rawItem.hsnSac || product.hsnSac),
    quantity: roundMoney(quantity),
    unitPrice,
    pricingModel,
    taxRate,
    lineDiscount,
    grossAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    taxTotal,
    lineTotal
  };
}

function createInvoiceInternal(store, input, createdAtValue = new Date()) {
  const customerId = Number(input.customerId);
  const customer = store.customers.find((entry) => entry.id === customerId);
  if (!customer) {
    throw new Error("Customer not found.");
  }
  const customerProfile = normalizeCustomerProfile(customer, {});

  const gstType = normalizeGstType(input.gstType);
  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) {
    throw new Error("Invoice requires at least one item.");
  }

  const items = rawItems.map((item, index) => buildInvoiceLineItem(store, item, gstType, index));
  const subtotalTaxable = roundMoney(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const lineDiscountTotal = roundMoney(items.reduce((sum, item) => sum + item.lineDiscount, 0));
  const cgstTotal = roundMoney(items.reduce((sum, item) => sum + item.cgst, 0));
  const sgstTotal = roundMoney(items.reduce((sum, item) => sum + item.sgst, 0));
  const igstTotal = roundMoney(items.reduce((sum, item) => sum + item.igst, 0));
  const taxTotal = roundMoney(cgstTotal + sgstTotal + igstTotal);
  const invoiceLevelBeforeAdjustments = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const invoiceDiscount = roundMoney(Math.max(0, Number(input.invoiceDiscount || 0)));
  const shipping = roundMoney(Number(input.shipping || 0));
  const roundOff = roundMoney(Number(input.roundOff || 0));
  const total = roundMoney(
    Math.max(invoiceLevelBeforeAdjustments - invoiceDiscount + shipping + roundOff, 0)
  );

  const createdAt = toDate(createdAtValue) || new Date();
  const dueDays = Number.isFinite(Number(input.dueDays)) ? Number(input.dueDays) : 15;
  const dueDate =
    toDate(input.dueDate)?.toISOString() || addDays(createdAt, Math.max(0, dueDays)).toISOString();
  const companySelection = getCompanyProfileForInvoice(store.settings, gstType);

  const invoice = {
    id: store.nextInvoiceId,
    invoiceNumber: getUniqueInvoiceNumber(store, createdAt),
    customerId,
    createdAt: createdAt.toISOString(),
    dueDate,
    gstType,
    notes: toText(input.notes),
    items,
    subtotalTaxable,
    lineDiscountTotal,
    invoiceDiscount,
    shipping,
    roundOff,
    cgstTotal,
    sgstTotal,
    igstTotal,
    taxTotal,
    subtotal: subtotalTaxable,
    tax: taxTotal,
    total,
    companyProfileType: companySelection.profileType,
    companyProfile: { ...companySelection.profile },
    customerProfile,
    payments: []
  };

  store.nextInvoiceId += 1;
  store.invoices.push(invoice);
  return invoice;
}

function processRecurringDue(store, runDate = new Date()) {
  const createdInvoices = [];
  let changed = false;

  for (const template of store.recurringTemplates) {
    if (!template.active) {
      continue;
    }

    let nextRun = toDate(template.nextRunAt) || toDate(template.startDate) || runDate;
    let guard = 0;

    while (nextRun.getTime() <= runDate.getTime() && guard < 24) {
      try {
        const invoice = createInvoiceInternal(
          store,
          {
            customerId: template.customerId,
            items: template.items,
            dueDays: template.dueDays,
            gstType: template.gstType,
            notes: template.notes,
            invoiceDiscount: template.invoiceDiscount,
            shipping: template.shipping,
            roundOff: template.roundOff
          },
          nextRun
        );
        template.lastInvoiceNumber = invoice.invoiceNumber;
        template.lastError = "";
        createdInvoices.push(invoice);
      } catch (error) {
        template.lastError = error.message;
      }

      template.lastRunAt = nextRun.toISOString();
      nextRun = addTemplateFrequency(nextRun, template.frequency);
      template.nextRunAt = nextRun.toISOString();
      template.updatedAt = new Date().toISOString();
      changed = true;
      guard += 1;
    }
  }

  return { changed, createdInvoices };
}

function loadStoreWithRecurring() {
  const store = ensurePersistedStore();
  const recurringRun = processRecurringDue(store, new Date());
  if (recurringRun.changed) {
    writeStore(store);
  }
  return { store, recurringRun };
}

export function authenticateUser(username, password) {
  const store = ensurePersistedStore();
  const normalized = toText(username).toLowerCase();
  const user = store.users.find((entry) => entry.username.toLowerCase() === normalized);
  if (!user) {
    return null;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }
  return sanitizeUser(user);
}

function validateNewPassword(value) {
  const newPassword = String(value || "");
  if (newPassword.trim().length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  return newPassword;
}

export function changeUserPassword(userId, input = {}) {
  const store = ensurePersistedStore();
  const numericId = Number(userId);
  const user = store.users.find((entry) => entry.id === numericId);
  if (!user) {
    return null;
  }

  const bypassCurrentPassword = input.bypassCurrentPassword === true;
  if (!bypassCurrentPassword) {
    const currentPassword = String(input.currentPassword || "");
    if (!currentPassword) {
      throw new Error("Current password is required.");
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect.");
    }
  }

  const newPassword = validateNewPassword(input.newPassword);
  user.passwordHash = hashPassword(newPassword);
  writeStore(store);
  return sanitizeUser(user);
}

export function listUsers() {
  const store = ensurePersistedStore();
  return store.users.map((user) => sanitizeUser(user));
}

export function listCustomers() {
  const store = ensurePersistedStore();
  return [...store.customers].sort((a, b) => a.name.localeCompare(b.name)).map((c) => publicCustomer(c));
}

export function createCustomer(input) {
  const store = ensurePersistedStore();
  const name = toText(input.name);
  if (!name) {
    throw new Error("Customer name is required.");
  }

  const customer = {
    id: store.nextCustomerId,
    name,
    email: toText(input.email),
    phone: toText(input.phone),
    address: toText(input.address),
    gstin: toText(input.gstin),
    stateCode: toText(input.stateCode),
    createdAt: new Date().toISOString()
  };
  store.nextCustomerId += 1;
  store.customers.push(customer);
  writeStore(store);
  return publicCustomer(customer);
}

export function updateCustomerById(id, input) {
  const store = ensurePersistedStore();
  const customer = store.customers.find((entry) => entry.id === Number(id));
  if (!customer) {
    return null;
  }

  const nextName = input.name !== undefined ? toText(input.name) : customer.name;
  if (!nextName) {
    throw new Error("Customer name is required.");
  }

  customer.name = nextName;
  if (input.email !== undefined) {
    customer.email = toText(input.email);
  }
  if (input.phone !== undefined) {
    customer.phone = toText(input.phone);
  }
  if (input.address !== undefined) {
    customer.address = toText(input.address);
  }
  if (input.gstin !== undefined) {
    customer.gstin = toText(input.gstin);
  }
  if (input.stateCode !== undefined) {
    customer.stateCode = toText(input.stateCode);
  }

  writeStore(store);
  return publicCustomer(customer);
}

export function deleteCustomerById(id) {
  const store = ensurePersistedStore();
  const customerId = Number(id);
  const index = store.customers.findIndex((entry) => entry.id === customerId);
  if (index < 0) {
    return null;
  }

  const linkedInvoice = store.invoices.find((invoice) => invoice.customerId === customerId);
  if (linkedInvoice) {
    throw new Error(
      `Customer is used in invoice ${linkedInvoice.invoiceNumber || `#${linkedInvoice.id}`}.`
    );
  }

  const linkedTemplate = store.recurringTemplates.find((template) => template.customerId === customerId);
  if (linkedTemplate) {
    throw new Error(`Customer is used in recurring template "${linkedTemplate.name}".`);
  }

  const [customer] = store.customers.splice(index, 1);
  writeStore(store);
  return publicCustomer(customer);
}

export function listProducts() {
  const store = ensurePersistedStore();
  return [...store.products].sort((a, b) => a.name.localeCompare(b.name));
}

export function createProduct(input) {
  const store = ensurePersistedStore();
  const name = toText(input.name);
  if (!name) {
    throw new Error("Product name is required.");
  }

  const price = roundMoney(Number(input.price));
  const taxRate = roundMoney(Number(input.taxRate || 0));
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid number.");
  }
  if (!Number.isFinite(taxRate) || taxRate < 0) {
    throw new Error("Tax rate must be 0 or greater.");
  }

  const product = {
    id: store.nextProductId,
    name,
    hsnSac: toText(input.hsnSac),
    pricingModel: normalizePricingModel(input.pricingModel),
    price,
    taxRate,
    createdAt: new Date().toISOString()
  };

  store.nextProductId += 1;
  store.products.push(product);
  writeStore(store);
  return product;
}

export function deleteProductById(id) {
  const store = ensurePersistedStore();
  const numericId = Number(id);
  const index = store.products.findIndex((entry) => entry.id === numericId);
  if (index < 0) {
    return null;
  }

  const usedInRecurring = store.recurringTemplates.find(
    (template) =>
      template.active && Array.isArray(template.items) && template.items.some((item) => item.productId === numericId)
  );
  if (usedInRecurring) {
    throw new Error(`Product is used in recurring template "${usedInRecurring.name}". Remove it there first.`);
  }

  const [product] = store.products.splice(index, 1);
  writeStore(store);
  return product;
}
export function listInvoices(filters = {}) {
  const { store } = loadStoreWithRecurring();
  const query = toText(filters.query).toLowerCase();
  const status = toText(filters.status).toLowerCase();
  const customerId = Number(filters.customerId || 0);
  const dateFrom = toDate(filters.dateFrom);
  const dateTo = toDate(filters.dateTo);
  if (dateTo) {
    dateTo.setHours(23, 59, 59, 999);
  }

  return [...store.invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((invoice) => hydrateInvoice(invoice, store))
    .filter((invoice) => {
      if (customerId > 0 && invoice.customerId !== customerId) {
        return false;
      }
      if (status && status !== "all" && invoice.status !== status) {
        return false;
      }
      if (query) {
        const haystack = [
          invoice.invoiceNumber,
          invoice.customer?.name,
          invoice.customer?.email,
          invoice.notes
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      const createdAt = toDate(invoice.createdAt);
      if (dateFrom && createdAt && createdAt.getTime() < dateFrom.getTime()) {
        return false;
      }
      if (dateTo && createdAt && createdAt.getTime() > dateTo.getTime()) {
        return false;
      }
      return true;
    });
}

export function getInvoiceById(id) {
  const { store } = loadStoreWithRecurring();
  const invoice = store.invoices.find((entry) => entry.id === Number(id));
  if (!invoice) {
    return null;
  }
  return hydrateInvoice(invoice, store);
}

export function createInvoice(input) {
  const store = ensurePersistedStore();
  const invoice = createInvoiceInternal(store, input, new Date());
  writeStore(store);
  return hydrateInvoice(invoice, store);
}

export function deleteInvoiceById(id) {
  const store = ensurePersistedStore();
  const index = store.invoices.findIndex((entry) => entry.id === Number(id));
  if (index < 0) {
    return null;
  }
  const [invoice] = store.invoices.splice(index, 1);
  writeStore(store);
  return hydrateInvoice(invoice, store);
}

export function addInvoicePayment(id, input) {
  const store = ensurePersistedStore();
  const invoice = store.invoices.find((entry) => entry.id === Number(id));
  if (!invoice) {
    return null;
  }

  const amount = roundMoney(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  const summary = paymentSummary(invoice);
  if (amount - summary.dueAmount > 0.01) {
    throw new Error(`Payment exceeds due amount (${summary.dueAmount}).`);
  }

  const payment = {
    id: store.nextPaymentId,
    amount,
    date: toDate(input.date)?.toISOString() || new Date().toISOString(),
    method: toText(input.method) || "cash",
    note: toText(input.note)
  };
  store.nextPaymentId += 1;
  invoice.payments.push(payment);
  writeStore(store);
  return hydrateInvoice(invoice, store);
}

export function getCustomerStatement(customerId, filters = {}) {
  const { store } = loadStoreWithRecurring();
  const customer = store.customers.find((entry) => entry.id === Number(customerId));
  if (!customer) {
    return null;
  }

  const dateFrom = toDate(filters.dateFrom);
  const dateTo = toDate(filters.dateTo);
  if (dateTo) {
    dateTo.setHours(23, 59, 59, 999);
  }

  const invoices = store.invoices
    .filter((invoice) => invoice.customerId === customer.id)
    .filter((invoice) => {
      const created = toDate(invoice.createdAt);
      if (!created) {
        return false;
      }
      if (dateFrom && created.getTime() < dateFrom.getTime()) {
        return false;
      }
      if (dateTo && created.getTime() > dateTo.getTime()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((invoice) => hydrateInvoice(invoice, store));

  const payments = invoices
    .flatMap((invoice) =>
      (invoice.payments || []).map((payment) => ({
        ...payment,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    customer: publicCustomer(customer),
    summary: {
      invoiceCount: invoices.length,
      totalBilled: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.total, 0)),
      totalPaid: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0)),
      totalDue: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0)),
      overdueInvoices: invoices.filter((invoice) => invoice.status === "overdue").length
    },
    invoices,
    payments
  };
}
function validateRecurringItems(items) {
  const rawItems = Array.isArray(items) ? items : [];
  if (rawItems.length === 0) {
    throw new Error("Recurring template requires at least one item.");
  }

  return rawItems.map((item, index) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error(`Recurring item #${index + 1}: invalid product.`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Recurring item #${index + 1}: quantity must be greater than 0.`);
    }

    return {
      productId,
      quantity: roundMoney(quantity),
      lineDiscount: roundMoney(Math.max(0, Number(item.lineDiscount || 0))),
      unitPrice:
        item.unitPrice !== undefined && item.unitPrice !== null ? roundMoney(Number(item.unitPrice || 0)) : null,
      taxRate: item.taxRate !== undefined && item.taxRate !== null ? roundMoney(Number(item.taxRate || 0)) : null,
      pricingModel: item.pricingModel ? normalizePricingModel(item.pricingModel) : null
    };
  });
}

function hydrateTemplate(template, store) {
  const customer = store.customers.find((entry) => entry.id === template.customerId) || null;
  return {
    ...template,
    customer: publicCustomer(customer)
  };
}

export function listRecurringTemplates() {
  const { store } = loadStoreWithRecurring();
  return [...store.recurringTemplates]
    .sort((a, b) => b.id - a.id)
    .map((template) => hydrateTemplate(template, store));
}

export function createRecurringTemplate(input) {
  const store = ensurePersistedStore();
  const customerId = Number(input.customerId);
  const customer = store.customers.find((entry) => entry.id === customerId);
  if (!customer) {
    throw new Error("Customer not found.");
  }

  const startDate = toDate(input.startDate) || new Date();
  const template = {
    id: store.nextRecurringId,
    name: toText(input.name) || `Recurring #${store.nextRecurringId}`,
    customerId,
    frequency: normalizeFrequency(input.frequency),
    dueDays: Number.isFinite(Number(input.dueDays)) ? Number(input.dueDays) : 15,
    gstType: normalizeGstType(input.gstType),
    notes: toText(input.notes),
    invoiceDiscount: roundMoney(Math.max(0, Number(input.invoiceDiscount || 0))),
    shipping: roundMoney(Number(input.shipping || 0)),
    roundOff: roundMoney(Number(input.roundOff || 0)),
    active: input.active !== false,
    startDate: startDate.toISOString(),
    nextRunAt: startDate.toISOString(),
    lastRunAt: null,
    lastInvoiceNumber: "",
    lastError: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: validateRecurringItems(input.items)
  };
  store.nextRecurringId += 1;
  store.recurringTemplates.push(template);
  writeStore(store);
  return hydrateTemplate(template, store);
}

export function updateRecurringTemplate(id, input) {
  const store = ensurePersistedStore();
  const template = store.recurringTemplates.find((entry) => entry.id === Number(id));
  if (!template) {
    return null;
  }

  if (input.name !== undefined) {
    template.name = toText(input.name) || template.name;
  }
  if (input.frequency !== undefined) {
    template.frequency = normalizeFrequency(input.frequency);
  }
  if (input.gstType !== undefined) {
    template.gstType = normalizeGstType(input.gstType);
  }
  if (input.dueDays !== undefined) {
    const dueDays = Number(input.dueDays);
    if (!Number.isFinite(dueDays) || dueDays < 0) {
      throw new Error("Due days must be 0 or greater.");
    }
    template.dueDays = dueDays;
  }
  if (input.notes !== undefined) {
    template.notes = toText(input.notes);
  }
  if (input.invoiceDiscount !== undefined) {
    template.invoiceDiscount = roundMoney(Math.max(0, Number(input.invoiceDiscount || 0)));
  }
  if (input.shipping !== undefined) {
    template.shipping = roundMoney(Number(input.shipping || 0));
  }
  if (input.roundOff !== undefined) {
    template.roundOff = roundMoney(Number(input.roundOff || 0));
  }
  if (input.active !== undefined) {
    template.active = Boolean(input.active);
  }
  if (input.customerId !== undefined) {
    const customerId = Number(input.customerId);
    const customer = store.customers.find((entry) => entry.id === customerId);
    if (!customer) {
      throw new Error("Customer not found.");
    }
    template.customerId = customerId;
  }
  if (input.items !== undefined) {
    template.items = validateRecurringItems(input.items);
  }
  if (input.startDate !== undefined) {
    const startDate = toDate(input.startDate);
    if (!startDate) {
      throw new Error("Invalid start date.");
    }
    template.startDate = startDate.toISOString();
    template.nextRunAt = startDate.toISOString();
  }

  template.updatedAt = new Date().toISOString();
  writeStore(store);
  return hydrateTemplate(template, store);
}

export function deleteRecurringTemplate(id) {
  const store = ensurePersistedStore();
  const index = store.recurringTemplates.findIndex((entry) => entry.id === Number(id));
  if (index < 0) {
    return null;
  }
  const [template] = store.recurringTemplates.splice(index, 1);
  writeStore(store);
  return template;
}

export function runRecurringNow() {
  const store = ensurePersistedStore();
  const result = processRecurringDue(store, new Date());
  if (result.changed) {
    writeStore(store);
  }
  return result.createdInvoices.map((invoice) => hydrateInvoice(invoice, store));
}

export function getReportsSummary(filters = {}) {
  const invoices = listInvoices(filters);
  const totals = {
    invoiceCount: invoices.length,
    revenue: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.total, 0)),
    taxableSales: roundMoney(
      invoices.reduce((sum, invoice) => sum + Number(invoice.subtotalTaxable || 0), 0)
    ),
    taxCollected: roundMoney(invoices.reduce((sum, invoice) => sum + Number(invoice.taxTotal || 0), 0)),
    received: roundMoney(invoices.reduce((sum, invoice) => sum + Number(invoice.paidAmount || 0), 0)),
    outstanding: roundMoney(invoices.reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0)),
    overdueInvoices: invoices.filter((invoice) => invoice.status === "overdue").length
  };

  const byCustomer = new Map();
  for (const invoice of invoices) {
    const key = invoice.customerId;
    const current = byCustomer.get(key) || {
      customerId: key,
      name: invoice.customer?.name || "Unknown",
      revenue: 0,
      due: 0
    };
    current.revenue = roundMoney(current.revenue + invoice.total);
    current.due = roundMoney(current.due + invoice.dueAmount);
    byCustomer.set(key, current);
  }

  const byProduct = new Map();
  for (const invoice of invoices) {
    for (const item of invoice.items || []) {
      const key = item.productId || item.productName;
      const current = byProduct.get(key) || {
        productId: item.productId || null,
        name: item.productName || "Unknown",
        quantity: 0,
        revenue: 0
      };
      current.quantity = roundMoney(current.quantity + Number(item.quantity || 0));
      current.revenue = roundMoney(current.revenue + Number(item.lineTotal || 0));
      byProduct.set(key, current);
    }
  }

  return {
    totals,
    topCustomers: [...byCustomer.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  };
}

export function getSettings() {
  const store = ensurePersistedStore();
  applyCompanyProfilesToSettings(store.settings);
  return cloneJson(store.settings);
}

export function updateSettings(input) {
  const store = ensurePersistedStore();
  const settings = store.settings;
  applyCompanyProfilesToSettings(settings);

  if (input.invoicePrefix !== undefined) {
    const prefix = toText(input.invoicePrefix)
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9-]/g, "")
      .toUpperCase();
    if (!prefix) {
      throw new Error("Invoice prefix cannot be empty.");
    }
    settings.invoicePrefix = prefix;
  }

  if (input.financialYearStartMonth !== undefined) {
    const month = Number(input.financialYearStartMonth);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Financial year start month must be between 1 and 12.");
    }
    settings.financialYearStartMonth = month;
  }

  const companyKeyMap = {
    companyName: ["gst", "name"],
    companyAddress: ["gst", "address"],
    companyEmail: ["gst", "email"],
    companyPhone: ["gst", "phone"],
    companyGstin: ["gst", "gstin"],
    companyPan: ["gst", "pan"],
    companyState: ["gst", "state"],
    companyStateCode: ["gst", "stateCode"],
    gstCompanyName: ["gst", "name"],
    gstCompanyAddress: ["gst", "address"],
    gstCompanyEmail: ["gst", "email"],
    gstCompanyPhone: ["gst", "phone"],
    gstCompanyGstin: ["gst", "gstin"],
    gstCompanyPan: ["gst", "pan"],
    gstCompanyState: ["gst", "state"],
    gstCompanyStateCode: ["gst", "stateCode"],
    nonGstCompanyName: ["nonGst", "name"],
    nonGstCompanyAddress: ["nonGst", "address"],
    nonGstCompanyEmail: ["nonGst", "email"],
    nonGstCompanyPhone: ["nonGst", "phone"],
    nonGstCompanyGstin: ["nonGst", "gstin"],
    nonGstCompanyPan: ["nonGst", "pan"],
    nonGstCompanyState: ["nonGst", "state"],
    nonGstCompanyStateCode: ["nonGst", "stateCode"]
  };
  for (const [inputKey, [profileKey, fieldKey]] of Object.entries(companyKeyMap)) {
    if (input[inputKey] !== undefined) {
      settings.companyProfiles[profileKey][fieldKey] = toText(input[inputKey]);
    }
  }

  if (input.companyProfiles !== undefined && typeof input.companyProfiles === "object" && input.companyProfiles !== null) {
    for (const profileKey of ["gst", "nonGst"]) {
      const payloadProfile = input.companyProfiles?.[profileKey];
      if (!payloadProfile || typeof payloadProfile !== "object") {
        continue;
      }
      for (const fieldKey of ["name", "address", "email", "phone", "gstin", "pan", "state", "stateCode"]) {
        if (payloadProfile[fieldKey] !== undefined) {
          settings.companyProfiles[profileKey][fieldKey] = toText(payloadProfile[fieldKey]);
        }
      }
    }
  }

  const textKeys = [
    "upiId",
    "upiPayeeName",
    "bankName",
    "bankAccountName",
    "bankAccountNumber",
    "bankIfsc"
  ];
  for (const key of textKeys) {
    if (input[key] !== undefined) {
      settings[key] = toText(input[key]);
    }
  }

  applyCompanyProfilesToSettings(settings);

  writeStore(store);
  return cloneJson(settings);
}

export function exportBackupData() {
  const store = ensurePersistedStore();
  return {
    app: "invoiceflow-pro",
    exportedAt: new Date().toISOString(),
    store: cloneJson(store)
  };
}

export function restoreBackupData(input) {
  const payload =
    input && typeof input === "object" && !Array.isArray(input)
      ? input
      : null;
  if (!payload) {
    throw new Error("Backup payload must be a valid JSON object.");
  }

  const source =
    payload.store && typeof payload.store === "object" && !Array.isArray(payload.store)
      ? payload.store
      : payload;

  const restored = migrateStore(source);
  writeStore(restored);

  return {
    customers: restored.customers.length,
    products: restored.products.length,
    invoices: restored.invoices.length,
    recurringTemplates: restored.recurringTemplates.length,
    users: restored.users.length
  };
}
