const loginView = document.querySelector("#login-view");
const workspaceView = document.querySelector("#workspace-view");
const loginForm = document.querySelector("#login-form");
const logoutButton = document.querySelector("#logout-btn");
const currentUserNode = document.querySelector("#current-user");
const statusToastEl = document.querySelector(".toast");
const bootstrapApi = globalThis.bootstrap || null;
const statusToast = bootstrapApi && statusToastEl ? new bootstrapApi.Toast(statusToastEl) : null;
const statusCloseButton = statusToastEl?.querySelector("[data-status-close='true']");

const tabNav = document.querySelector("#tab-nav");
const tabButtons = [...document.querySelectorAll('[data-bs-toggle="pill"]')];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const adminOnlyNodes = [...document.querySelectorAll(".admin-only")];
const sidebarToggleButton = document.querySelector("#sidebar-toggle");
const sidebarOverlay = document.querySelector("#sidebar-overlay");
const globalSearchInput = document.querySelector("#global-search");
const topMenuButtons = [...document.querySelectorAll("[data-tab-open]")];

const customerForm = document.querySelector("#customer-form");
const customerTableBody = document.querySelector("#customer-table-body");
const customerIdInput = document.querySelector("#customer-id");
const customerSubmitButton = document.querySelector("#customer-submit-btn");
const customerCancelButton = document.querySelector("#customer-cancel-btn");

const productForm = document.querySelector("#product-form");
const productListNode = document.querySelector("#product-list");

const invoiceForm = document.querySelector("#invoice-form");
const invoiceCustomerSelect = document.querySelector("#invoice-customer");
const invoiceGstTypeSelect = document.querySelector("#invoice-gst-type");
const invoiceDueDaysInput = document.querySelector("#invoice-due-days");
const invoiceDiscountInput = document.querySelector("#invoice-discount");
const invoiceShippingInput = document.querySelector("#invoice-shipping");
const invoiceRoundoffInput = document.querySelector("#invoice-roundoff");
const invoiceNotesInput = document.querySelector("#invoice-notes");
const invoiceSubmitButton = document.querySelector("#invoice-submit");
const invoicePreview = document.querySelector("#invoice-preview");
const invoiceCompanyBanner = document.querySelector("#invoice-company-banner");
const lineItemsContainer = document.querySelector("#line-items");
const addLineItemButton = document.querySelector("#add-line-item");

const invoiceFilterForm = document.querySelector("#invoice-filter-form");
const filterQueryInput = document.querySelector("#filter-query");
const filterStatusSelect = document.querySelector("#filter-status");
const filterCustomerSelect = document.querySelector("#filter-customer");
const filterDateFromInput = document.querySelector("#filter-date-from");
const filterDateToInput = document.querySelector("#filter-date-to");
const clearInvoiceFiltersButton = document.querySelector("#clear-invoice-filters");
const invoiceTableBody = document.querySelector("#invoice-table-body");

const paymentTableBody = document.querySelector("#payment-table-body");

const recurringForm = document.querySelector("#recurring-form");
const recurringNameInput = document.querySelector("#rec-name");
const recurringCustomerSelect = document.querySelector("#rec-customer");
const recurringFrequencySelect = document.querySelector("#rec-frequency");
const recurringStartDateInput = document.querySelector("#rec-start-date");
const recurringGstTypeSelect = document.querySelector("#rec-gst-type");
const recurringDueDaysInput = document.querySelector("#rec-due-days");
const recurringDiscountInput = document.querySelector("#rec-discount");
const recurringShippingInput = document.querySelector("#rec-shipping");
const recurringRoundoffInput = document.querySelector("#rec-roundoff");
const recurringNotesInput = document.querySelector("#rec-notes");
const recurringItemsContainer = document.querySelector("#rec-items");
const addRecurringItemButton = document.querySelector("#add-rec-item");
const runRecurringNowButton = document.querySelector("#run-recurring-now");
const recurringTableBody = document.querySelector("#recurring-table-body");

const reportFilterForm = document.querySelector("#report-filter-form");
const reportDateFromInput = document.querySelector("#report-date-from");
const reportDateToInput = document.querySelector("#report-date-to");
const repInvoiceCount = document.querySelector("#rep-invoice-count");
const repRevenue = document.querySelector("#rep-revenue");
const repTax = document.querySelector("#rep-tax");
const repOutstanding = document.querySelector("#rep-outstanding");
const topCustomersBody = document.querySelector("#top-customers-body");
const topProductsBody = document.querySelector("#top-products-body");

const settingsForm = document.querySelector("#settings-form");
const changePasswordForm = document.querySelector("#change-password-form");
const adminResetPasswordForm = document.querySelector("#admin-reset-password-form");
const passwordUserSelect = document.querySelector("#password-user-id");
const downloadBackupButton = document.querySelector("#download-backup-btn");
const restoreBackupForm = document.querySelector("#restore-backup-form");
const restoreBackupFileInput = document.querySelector("#restore-backup-file");

const metricRevenue = document.querySelector("#metric-revenue");
const metricOutstanding = document.querySelector("#metric-outstanding");
const metricOverdue = document.querySelector("#metric-overdue");
const metricBase = document.querySelector("#metric-base");
const overviewRecentBody = document.querySelector("#overview-recent-body");
const walletBalanceValue = document.querySelector("#wallet-balance-value");
const walletProgressFill = document.querySelector("#wallet-progress-fill");
const walletProgressText = document.querySelector("#wallet-progress-text");
const walletCardBrand = document.querySelector("#wallet-card-brand");
const walletCardNumber = document.querySelector("#wallet-card-number");
const cardListBody = document.querySelector("#card-list-body");
const doughnutChart = document.querySelector("#chart-doughnut");
const doughnutCenter = document.querySelector("#chart-doughnut-center");
const legendPaidCount = document.querySelector("#legend-paid-count");
const legendPartialCount = document.querySelector("#legend-partial-count");
const legendUnpaidCount = document.querySelector("#legend-unpaid-count");
const incomeBars = document.querySelector("#income-bars");
const outcomeBars = document.querySelector("#outcome-bars");

const drawerEl = document.querySelector("#drawer");
const drawer = bootstrapApi && drawerEl ? new bootstrapApi.Modal(drawerEl) : null;
const drawerTitle = document.querySelector("#drawer-title");
const drawerBody = document.querySelector("#drawer-body");
const drawerCloseButton = document.querySelector("#drawer-close");

const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
});

const state = {
  token: localStorage.getItem("billing_token") || "",
  user: null,
  users: [],
  customers: [],
  products: [],
  invoices: [],
  recurringTemplates: [],
  report: null,
  settings: null,
  invoiceFilters: {
    query: "",
    status: "all",
    customerId: "",
    dateFrom: "",
    dateTo: ""
  },
  reportFilters: {
    dateFrom: "",
    dateTo: ""
  },
  statusTimer: null
};

function isAdmin() {
  return state.user?.role === "admin";
}

function formatCurrency(value) {
  return CURRENCY.format(Number(value || 0));
}

function formatShortCurrency(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) {
    return `Rs ${(amount / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (amount >= 100000) {
    return `Rs ${(amount / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `Rs ${Math.round(amount)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function maskAccountNumber(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return ".... 0000";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `.... ${digits.slice(-4)}`;
  }
  if (value.includes("@")) {
    const [prefix, suffix] = value.split("@");
    if (!suffix) {
      return value;
    }
    const safePrefix = prefix.length > 3 ? `${prefix.slice(0, 3)}...` : prefix;
    return `${safePrefix}@${suffix}`;
  }
  return value.length > 6 ? `${value.slice(0, 3)}...${value.slice(-2)}` : value;
}

function closeMobileSidebar() {
  workspaceView?.classList.remove("sidebar-open");
  sidebarOverlay?.classList.add("hidden");
}

function getCompanyProfileForInvoiceType(gstType) {
  const settings = state.settings || {};
  const profiles = settings.companyProfiles || {};
  const fallback = {
    name: settings.companyName || "",
    address: settings.companyAddress || "",
    email: settings.companyEmail || "",
    phone: settings.companyPhone || "",
    gstin: settings.companyGstin || ""
  };
  const selected = String(gstType || "intra") === "none" ? profiles.nonGst : profiles.gst;
  return {
    ...fallback,
    ...(selected || {})
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message, isError = false) {
  if (!statusToastEl) {
    return;
  }
  const toastBody = statusToastEl.querySelector(".toast-body");
  if (toastBody) {
    toastBody.textContent = message;
  } else {
    statusToastEl.textContent = message;
  }
  statusToastEl.classList.toggle("bg-danger", isError);
  statusToastEl.classList.toggle("text-white", isError);
  statusToastEl.classList.toggle("bg-success", !isError);
  statusToastEl.classList.toggle("text-white", !isError);
  if (statusToast) {
    statusToast.show();
    return;
  }
  statusToastEl.classList.add("show");
  clearTimeout(state.statusTimer);
  state.statusTimer = setTimeout(() => {
    statusToastEl.classList.remove("show");
  }, 2400);
}

function resetAuthState() {
  state.token = "";
  state.user = null;
  state.users = [];
  localStorage.removeItem("billing_token");
  loginView.classList.remove("hidden");
  workspaceView.classList.add("hidden");
}

async function requestJson(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (_error) {
      body = {};
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      resetAuthState();
    }
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

function openDrawer(title, html) {
  drawerTitle.textContent = title;
  drawerBody.innerHTML = html;
  if (drawer) {
    drawer.show();
    return;
  }
  drawerEl?.classList.add("show");
  drawerEl?.classList.remove("hidden");
}

function closeDrawer() {
  if (drawer) {
    drawer.hide();
    return;
  }
  drawerEl?.classList.remove("show");
  drawerEl?.classList.add("hidden");
}

function setActiveTab(tabId) {
  const tab = document.querySelector(`[data-tab="${tabId}"]`);
  if (!tab) {
    return;
  }

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  tabPanels.forEach((panel) => {
    const active = panel.dataset.panel === tabId;
    panel.classList.toggle("active", active);
    panel.classList.toggle("show", active);
  });

  if (window.matchMedia("(max-width: 1080px)").matches) {
    closeMobileSidebar();
  }
}

function applyRoleVisibility() {
  const admin = isAdmin();
  adminOnlyNodes.forEach((node) => {
    node.classList.toggle("hidden", !admin);
  });

  if (!admin) {
    const activeTab = document.querySelector('.nav-link.active[data-tab]');
    if (activeTab && activeTab.classList.contains("admin-only")) {
      setActiveTab("overview");
    }
  }
}

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

function statusPill(status) {
  const normalized = String(status || "unpaid").toLowerCase();
  return `<span class="pill ${normalized}">${escapeHtml(normalized)}</span>`;
}
function productById(productId) {
  return state.products.find((product) => product.id === Number(productId)) || null;
}

function buildCustomerOptions(selectedValue = "") {
  if (state.customers.length === 0) {
    return `<option value="">No customers</option>`;
  }

  return state.customers
    .map((customer) => {
      const selected = Number(selectedValue) === customer.id ? "selected" : "";
      return `<option value="${customer.id}" ${selected}>${escapeHtml(customer.name)}</option>`;
    })
    .join("");
}

function buildProductOptions(selectedValue = "") {
  if (state.products.length === 0) {
    return `<option value="">No products</option>`;
  }

  return [
    '<option value="">Select product</option>',
    ...state.products.map((product) => {
      const selected = Number(selectedValue) === product.id ? "selected" : "";
      const label = `${product.name} (${formatCurrency(product.price)}, GST ${Number(product.taxRate)}%)`;
      return `<option value="${product.id}" ${selected}>${escapeHtml(label)}</option>`;
    })
  ].join("");
}

function createLineItemRow(container, initial = {}) {
  const row = document.createElement("div");
  row.className = "line-item row";
  row.innerHTML = `
    <div class="col-md-4">
      <label class="form-label">Product</label>
      <select class="form-select row-product" required>
        ${buildProductOptions(initial.productId)}
      </select>
    </div>
    <div class="col-md-2">
      <label class="form-label">Qty</label>
      <input class="form-control row-qty" type="number" min="0.01" step="0.01" value="${
        initial.quantity || 1
      }" required />
    </div>
    <div class="col-md-2">
      <label class="form-label">Line Discount</label>
      <input class="form-control row-discount" type="number" min="0" step="0.01" value="${
        initial.lineDiscount || 0
      }" />
    </div>
    <div class="col-md-3">
      <p class="meta small">
        Taxable: <strong class="row-taxable">${formatCurrency(0)}</strong><br />
        Tax: <strong class="row-tax">${formatCurrency(0)}</strong><br />
        Total: <strong class="row-total">${formatCurrency(0)}</strong>
      </p>
    </div>
    <div class="col-md-1 d-flex align-items-end">
      <button type="button" class="btn btn-sm btn-outline-danger row-remove">Remove</button>
    </div>
  `;

  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    updateInvoicePreview();
  });
  row.querySelector(".row-product").addEventListener("change", updateInvoicePreview);
  row.querySelector(".row-qty").addEventListener("input", updateInvoicePreview);
  row.querySelector(".row-discount").addEventListener("input", updateInvoicePreview);

  container.append(row);
}

function createRecurringItemRow(container, initial = {}) {
  const row = document.createElement("div");
  row.className = "line-item row";
  row.innerHTML = `
    <div class="col-md-4">
      <label class="form-label">Product</label>
      <select class="form-select row-product" required>
        ${buildProductOptions(initial.productId)}
      </select>
    </div>
    <div class="col-md-3">
      <label class="form-label">Qty</label>
      <input class="form-control row-qty" type="number" min="0.01" step="0.01" value="${
        initial.quantity || 1
      }" required />
    </div>
    <div class="col-md-3">
      <label class="form-label">Line Discount</label>
      <input class="form-control row-discount" type="number" min="0" step="0.01" value="${
        initial.lineDiscount || 0
      }" />
    </div>
    <div class="col-md-2 d-flex align-items-end">
      <button type="button" class="btn btn-sm btn-outline-danger row-remove">Remove</button>
    </div>
  `;

  row.querySelector(".row-remove").addEventListener("click", () => row.remove());
  container.append(row);
}

function getInvoiceRowsPayload() {
  return [...lineItemsContainer.querySelectorAll(".line-item")]
    .map((row) => ({
      productId: Number(row.querySelector(".row-product")?.value),
      quantity: Number(row.querySelector(".row-qty")?.value),
      lineDiscount: Number(row.querySelector(".row-discount")?.value || 0)
    }))
    .filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );
}

function getRecurringRowsPayload() {
  return [...recurringItemsContainer.querySelectorAll(".line-item")]
    .map((row) => ({
      productId: Number(row.querySelector(".row-product")?.value),
      quantity: Number(row.querySelector(".row-qty")?.value),
      lineDiscount: Number(row.querySelector(".row-discount")?.value || 0)
    }))
    .filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );
}

function calculateLinePreview(product, qty, lineDiscount, gstType) {
  const quantity = Number(qty || 0);
  const discount = Math.max(0, Number(lineDiscount || 0));
  const unitPrice = Number(product.price || 0);
  const taxRate = Number(product.taxRate || 0);
  const pricingModel = String(product.pricingModel || "exclusive");

  const gross = unitPrice * quantity;
  const afterDiscount = Math.max(gross - discount, 0);
  let taxable = 0;
  let tax = 0;
  let total = 0;

  if (gstType === "none") {
    taxable = afterDiscount;
    tax = 0;
    total = afterDiscount;
  } else if (pricingModel === "inclusive") {
    taxable = taxRate > 0 ? afterDiscount / (1 + taxRate / 100) : afterDiscount;
    tax = afterDiscount - taxable;
    total = afterDiscount;
  } else {
    taxable = afterDiscount;
    tax = taxable * (taxRate / 100);
    total = taxable + tax;
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (gstType === "inter") {
    igst = tax;
  } else if (gstType === "intra") {
    cgst = tax / 2;
    sgst = tax - cgst;
  }

  return {
    taxable,
    tax,
    total,
    cgst,
    sgst,
    igst,
    lineDiscount: discount
  };
}

function updateInvoicePreview() {
  const rows = [...lineItemsContainer.querySelectorAll(".line-item")];
  const gstType = invoiceGstTypeSelect.value || "intra";

  let subtotalTaxable = 0;
  let lineDiscountTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  for (const row of rows) {
    const productId = Number(row.querySelector(".row-product")?.value);
    const quantity = Number(row.querySelector(".row-qty")?.value);
    const lineDiscount = Number(row.querySelector(".row-discount")?.value || 0);
    const product = productById(productId);

    const taxableNode = row.querySelector(".row-taxable");
    const taxNode = row.querySelector(".row-tax");
    const totalNode = row.querySelector(".row-total");

    if (!product || !Number.isFinite(quantity) || quantity <= 0) {
      taxableNode.textContent = formatCurrency(0);
      taxNode.textContent = formatCurrency(0);
      totalNode.textContent = formatCurrency(0);
      continue;
    }

    const calc = calculateLinePreview(product, quantity, lineDiscount, gstType);
    taxableNode.textContent = formatCurrency(calc.taxable);
    taxNode.textContent = formatCurrency(calc.tax);
    totalNode.textContent = formatCurrency(calc.total);

    subtotalTaxable += calc.taxable;
    lineDiscountTotal += calc.lineDiscount;
    cgstTotal += calc.cgst;
    sgstTotal += calc.sgst;
    igstTotal += calc.igst;
  }

  const taxTotal = cgstTotal + sgstTotal + igstTotal;
  const invoiceDiscount = Number(invoiceDiscountInput.value || 0);
  const shipping = Number(invoiceShippingInput.value || 0);
  const roundOff = Number(invoiceRoundoffInput.value || 0);
  const grossTotal = subtotalTaxable + taxTotal;
  const finalTotal = Math.max(grossTotal - invoiceDiscount + shipping + roundOff, 0);
  const invoiceTypeText = gstType === "none" ? "Without GST" : "With GST";
  const companyProfile = getCompanyProfileForInvoiceType(gstType);
  const companyName = companyProfile.name || "Company not configured";
  const companyGstinText = companyProfile.gstin ? ` | GSTIN ${escapeHtml(companyProfile.gstin)}` : "";
  const selectedCustomer = state.customers.find(
    (customer) => customer.id === Number(invoiceCustomerSelect.value)
  );
  const selectedCustomerGstin = selectedCustomer?.gstin ? escapeHtml(selectedCustomer.gstin) : "-";
  const customerGstRow =
    gstType === "none"
      ? ""
      : `<div class="row mt-2"><div class="col"><strong>Customer GSTIN:</strong> ${selectedCustomerGstin}</div></div>`;

  if (invoiceCompanyBanner) {
    const modeText = gstType === "none" ? "Without GST Company" : "GST Company";
    invoiceCompanyBanner.innerHTML = `<div class="alert alert-info"><strong>${modeText}:</strong> ${escapeHtml(companyName)}${companyGstinText}</div>`;
  }

  invoicePreview.innerHTML = `
    <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Invoice Preview</h5>
        <div class="row">
          <div class="col"><strong>Billing Company:</strong> ${escapeHtml(companyName)}</div>
          <div class="col"><strong>Invoice Type:</strong> ${invoiceTypeText}</div>
        </div>
        ${customerGstRow}
        <table class="table mt-2">
          <tbody>
            <tr><td>Taxable</td><td class="text-end">${formatCurrency(subtotalTaxable)}</td></tr>
            <tr><td>Line Discount</td><td class="text-end">${formatCurrency(lineDiscountTotal)}</td></tr>
            <tr><td>CGST</td><td class="text-end">${formatCurrency(cgstTotal)}</td></tr>
            <tr><td>SGST</td><td class="text-end">${formatCurrency(sgstTotal)}</td></tr>
            <tr><td>IGST</td><td class="text-end">${formatCurrency(igstTotal)}</td></tr>
            <tr><td>Tax Total</td><td class="text-end">${formatCurrency(taxTotal)}</td></tr>
            <tr><td>Invoice Discount</td><td class="text-end">${formatCurrency(invoiceDiscount)}</td></tr>
            <tr><td>Shipping</td><td class="text-end">${formatCurrency(shipping)}</td></tr>
            <tr><td>Round Off</td><td class="text-end">${formatCurrency(roundOff)}</td></tr>
            <tr><td><strong>Final Total</strong></td><td class="text-end"><strong>${formatCurrency(finalTotal)}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const validItems = getInvoiceRowsPayload().length;
  invoiceSubmitButton.disabled = !(
    Number(invoiceCustomerSelect.value) > 0 &&
    validItems > 0 &&
    state.products.length > 0
  );
}

function syncSelects() {
  invoiceCustomerSelect.innerHTML = buildCustomerOptions(invoiceCustomerSelect.value);
  recurringCustomerSelect.innerHTML = buildCustomerOptions(recurringCustomerSelect.value);

  filterCustomerSelect.innerHTML = [
    '<option value="">All Customers</option>',
    ...state.customers.map(
      (customer) =>
        `<option value="${customer.id}" ${
          Number(state.invoiceFilters.customerId) === customer.id ? "selected" : ""
        }>${escapeHtml(customer.name)}</option>`
    )
  ].join("");

  for (const row of [...lineItemsContainer.querySelectorAll(".line-item")]) {
    const select = row.querySelector(".row-product");
    const selected = select.value;
    select.innerHTML = buildProductOptions(selected);
  }
  for (const row of [...recurringItemsContainer.querySelectorAll(".line-item")]) {
    const select = row.querySelector(".row-product");
    const selected = select.value;
    select.innerHTML = buildProductOptions(selected);
  }

  updateInvoicePreview();
}

function countInvoiceStatuses(invoices = []) {
  return invoices.reduce(
    (summary, invoice) => {
      const status = String(invoice?.status || "unpaid").toLowerCase();
      if (status === "paid") {
        summary.paid += 1;
      } else if (status === "partial") {
        summary.partial += 1;
      } else {
        summary.unpaid += 1;
      }
      return summary;
    },
    { paid: 0, partial: 0, unpaid: 0 }
  );
}

function buildMonthlyOverviewSeries(invoices = [], monthCount = 6) {
  const currentMonth = new Date();
  const monthSeeds = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    monthSeeds.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1));
  }

  const series = monthSeeds.map((date) => ({
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleString("en-IN", { month: "short" }),
    income: 0,
    outcome: 0
  }));
  const indexByKey = new Map(series.map((entry, index) => [entry.key, index]));

  for (const invoice of invoices) {
    const invoiceDate = new Date(invoice?.createdAt || "");
    if (Number.isNaN(invoiceDate.getTime())) {
      continue;
    }
    const key = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, "0")}`;
    const targetIndex = indexByKey.get(key);
    if (targetIndex === undefined) {
      continue;
    }
    series[targetIndex].income += Number(invoice?.paidAmount ?? invoice?.total ?? 0);
    series[targetIndex].outcome += Number(invoice?.dueAmount ?? 0);
  }

  return series;
}

function renderMiniBarChart(node, series, field, variant) {
  if (!node) {
    return;
  }
  const values = series.map((entry) => Number(entry?.[field] || 0));
  const maxValue = Math.max(...values, 1);

  node.innerHTML = series
    .map((entry, index) => {
      const value = Number(entry?.[field] || 0);
      const barHeight = clamp(Math.round((value / maxValue) * 100), 8, 100);
      return `
        <div class="mini-bar-col">
          <span class="mini-bar-value">${formatShortCurrency(value)}</span>
          <div class="mini-bar-track">
            <span class="mini-bar-fill ${variant}" style="--bar-height:${barHeight}%;--bar-index:${index};"></span>
          </div>
          <span class="mini-bar-label">${escapeHtml(entry.label)}</span>
        </div>
      `;
    })
    .join("");
}

function renderDoughnutOverview(counts) {
  const paid = Number(counts?.paid || 0);
  const partial = Number(counts?.partial || 0);
  const unpaid = Number(counts?.unpaid || 0);
  const total = paid + partial + unpaid;

  if (legendPaidCount) {
    legendPaidCount.textContent = String(paid);
  }
  if (legendPartialCount) {
    legendPartialCount.textContent = String(partial);
  }
  if (legendUnpaidCount) {
    legendUnpaidCount.textContent = String(unpaid);
  }

  if (!doughnutChart) {
    return;
  }

  if (total <= 0) {
    doughnutChart.style.background = "conic-gradient(#d6e1ef 0deg 360deg)";
    if (doughnutCenter) {
      doughnutCenter.textContent = "0";
    }
    return;
  }

  const paidAngle = (paid / total) * 360;
  const partialAngle = paidAngle + (partial / total) * 360;
  doughnutChart.style.background = [
    `conic-gradient(`,
    `#1f8b58 0deg ${paidAngle.toFixed(2)}deg, `,
    `#2278bc ${paidAngle.toFixed(2)}deg ${partialAngle.toFixed(2)}deg, `,
    `#d78a23 ${partialAngle.toFixed(2)}deg 360deg) `
  ].join("");
  if (doughnutCenter) {
    doughnutCenter.textContent = String(total);
  }
}

function renderOverviewCardList() {
  if (!cardListBody) {
    return;
  }
  const settings = state.settings || {};
  const rows = [];

  if (settings.bankName || settings.bankAccountNumber || settings.bankIfsc) {
    rows.push({
      bank: settings.bankName || "Bank Account",
      channel: `${maskAccountNumber(settings.bankAccountNumber)} | ${settings.bankIfsc || "-"}`,
      status: "Primary",
      statusClass: "bg-success",
      action: "Enabled"
    });
  }

  if (settings.upiId) {
    rows.push({
      bank: "UPI",
      channel: settings.upiId,
      status: "Active",
      statusClass: "bg-warning",
      action: "Ready"
    });
  }

  if (rows.length === 0) {
    cardListBody.innerHTML = `<tr><td colspan="4">Add bank or UPI details in Settings.</td></tr>`;
    return;
  }

  cardListBody.innerHTML = rows
    .map(
      (entry) => `
      <tr>
        <td>${escapeHtml(entry.bank)}</td>
        <td>${escapeHtml(entry.channel)}</td>
        <td><span class="badge ${entry.statusClass}">${escapeHtml(entry.status)}</span></td>
        <td><button type="button" class="btn btn-sm btn-light" disabled>${escapeHtml(entry.action)}</button></td>
      </tr>
    `
    )
    .join("");
}

function renderOverview() {
  const totals = state.report?.totals || {};
  const revenue = Number(totals.revenue || 0);
  const outstanding = Number(totals.outstanding || 0);
  const overdueInvoices = Number(totals.overdueInvoices || 0);

  metricRevenue.textContent = formatCurrency(revenue);
  metricOutstanding.textContent = formatCurrency(outstanding);
  metricOverdue.textContent = String(overdueInvoices);
  metricBase.textContent = `${state.customers.length} / ${state.products.length}`;

  const availableBalance = Math.max(revenue - outstanding, 0);
  const availablePercentage = revenue > 0 ? clamp(Math.round((availableBalance / revenue) * 100), 0, 100) : 0;
  if (walletBalanceValue) {
    walletBalanceValue.textContent = formatCurrency(availableBalance);
  }
  if (walletProgressFill) {
    walletProgressFill.style.width = `${availablePercentage}%`;
  }
  if (walletProgressText) {
    walletProgressText.textContent = `${availablePercentage}% available`;
  }
  if (walletCardBrand) {
    const label = String(state.settings?.bankName || "Business Card").toUpperCase();
    walletCardBrand.textContent = label;
  }
  if (walletCardNumber) {
    walletCardNumber.textContent = maskAccountNumber(
      state.settings?.bankAccountNumber || state.settings?.upiId || ""
    );
  }

  renderOverviewCardList();

  const statusSummary = countInvoiceStatuses(state.invoices);
  renderDoughnutOverview(statusSummary);

  const monthlySeries = buildMonthlyOverviewSeries(state.invoices, 6);
  renderMiniBarChart(incomeBars, monthlySeries, "income", "income");
  renderMiniBarChart(outcomeBars, monthlySeries, "outcome", "outcome");

  const recent = [...state.invoices].slice(0, 8);
  if (recent.length === 0) {
    overviewRecentBody.innerHTML = `<tr><td colspan="5">No invoices yet.</td></tr>`;
    return;
  }

  overviewRecentBody.innerHTML = recent
    .map(
      (invoice) => `
      <tr>
        <td>${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}</td>
        <td>${escapeHtml(invoice.customer?.name || "Unknown")}</td>
        <td>${statusPill(invoice.status)}</td>
        <td>${formatCurrency(invoice.total)}</td>
        <td>${formatCurrency(invoice.dueAmount)}</td>
      </tr>
    `
    )
    .join("");
}

function renderCustomers() {
  if (state.customers.length === 0) {
    customerTableBody.innerHTML = `<tr><td colspan="4">No customers yet.</td></tr>`;
    return;
  }

  customerTableBody.innerHTML = state.customers
    .map(
      (customer) => `
      <tr>
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.email || "-")}</td>
        <td>${escapeHtml(customer.gstin || "-")}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" data-action="statement" data-customer-id="${customer.id}">Statement</button>
            ${
              isAdmin()
                ? `<button class="btn btn-sm btn-light" data-action="edit-customer" data-customer-id="${customer.id}">Edit</button>`
                : ""
            }
            ${
              isAdmin()
                ? `<button class="btn btn-sm btn-danger" data-action="remove-customer" data-customer-id="${customer.id}">Delete</button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function resetCustomerForm() {
  customerForm.reset();
  if (customerIdInput) {
    customerIdInput.value = "";
  }
  if (customerSubmitButton) {
    customerSubmitButton.textContent = "Save Customer";
  }
  customerCancelButton?.classList.add("hidden");
}

function startCustomerEdit(customerId) {
  const customer = state.customers.find((entry) => entry.id === Number(customerId));
  if (!customer) {
    setStatus("Customer not found.", true);
    return;
  }

  if (customerIdInput) {
    customerIdInput.value = String(customer.id);
  }
  customerForm.elements.namedItem("name").value = customer.name || "";
  customerForm.elements.namedItem("email").value = customer.email || "";
  customerForm.elements.namedItem("phone").value = customer.phone || "";
  customerForm.elements.namedItem("gstin").value = customer.gstin || "";
  customerForm.elements.namedItem("stateCode").value = customer.stateCode || "";
  customerForm.elements.namedItem("address").value = customer.address || "";
  if (customerSubmitButton) {
    customerSubmitButton.textContent = "Update Customer";
  }
  customerCancelButton?.classList.remove("hidden");
}

function renderProducts() {
  if (state.products.length === 0) {
    productListNode.innerHTML = `<p class="text-muted">No products yet.</p>`;
    return;
  }

  productListNode.innerHTML = state.products
    .map(
      (product) => `
      <div class="card mb-2">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h6 class="card-title mb-0">${escapeHtml(product.name)}</h6>
            <p class="card-text small text-muted">${escapeHtml(product.hsnSac || "-")} | ${escapeHtml(product.pricingModel)} | ${formatCurrency(product.price)} | GST ${Number(product.taxRate)}%</p>
          </div>
          ${
            isAdmin()
              ? `<button class="btn btn-sm btn-outline-danger" data-action="remove-product" data-product-id="${product.id}">Remove</button>`
              : ""
          }
        </div>
      </div>
    `
    )
    .join("");
}

function renderInvoices() {
  if (state.invoices.length === 0) {
    invoiceTableBody.innerHTML = `<tr><td colspan="8">No invoices found.</td></tr>`;
    return;
  }

  invoiceTableBody.innerHTML = state.invoices
    .map(
      (invoice) => `
      <tr>
        <td>${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}</td>
        <td>${new Date(invoice.createdAt).toLocaleString("en-IN")}</td>
        <td>${escapeHtml(invoice.customer?.name || "Unknown")}</td>
        <td>${statusPill(invoice.status)}</td>
        <td>${formatCurrency(invoice.total)}</td>
        <td>${formatCurrency(invoice.paidAmount)}</td>
        <td>${formatCurrency(invoice.dueAmount)}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-success" data-action="share-invoice" data-invoice-id="${invoice.id}">Share</button>
            <button class="btn btn-sm btn-info" data-action="download-invoice" data-invoice-id="${invoice.id}">PDF</button>
            <button class="btn btn-sm btn-secondary" data-action="pay-invoice" data-invoice-id="${invoice.id}">Pay</button>
            ${
              isAdmin()
                ? `<button class="btn btn-sm btn-danger" data-action="remove-invoice" data-invoice-id="${invoice.id}">Delete</button>`
                : ""
            }
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function renderPayments() {
  const payable = state.invoices.filter((invoice) => Number(invoice.dueAmount || 0) > 0.009);
  if (payable.length === 0) {
    paymentTableBody.innerHTML = `<tr><td colspan="7">No pending payments.</td></tr>`;
    return;
  }

  paymentTableBody.innerHTML = payable
    .map(
      (invoice) => `
      <tr>
        <td>${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}</td>
        <td>${escapeHtml(invoice.customer?.name || "Unknown")}</td>
        <td>${formatCurrency(invoice.total)}</td>
        <td>${formatCurrency(invoice.paidAmount)}</td>
        <td>${formatCurrency(invoice.dueAmount)}</td>
        <td>${statusPill(invoice.status)}</td>
        <td><button class="btn btn-sm btn-secondary" data-action="pay-invoice" data-invoice-id="${invoice.id}">Add Payment</button></td>
      </tr>
    `
    )
    .join("");
}

function renderRecurringTemplates() {
  if (!isAdmin()) {
    recurringTableBody.innerHTML = "";
    return;
  }

  if (state.recurringTemplates.length === 0) {
    recurringTableBody.innerHTML = `<tr><td colspan="6">No recurring templates yet.</td></tr>`;
    return;
  }

  recurringTableBody.innerHTML = state.recurringTemplates
    .map(
      (template) => `
      <tr>
        <td>${escapeHtml(template.name)}</td>
        <td>${escapeHtml(template.customer?.name || "Unknown")}</td>
        <td>${escapeHtml(template.frequency)}</td>
        <td>${new Date(template.nextRunAt).toLocaleString("en-IN")}</td>
        <td>${template.active ? '<span class="badge bg-success">active</span>' : '<span class="badge bg-warning">paused</span>'}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" data-action="toggle-recurring" data-recurring-id="${template.id}" data-active="${template.active}">
              ${template.active ? "Pause" : "Activate"}
            </button>
            <button class="btn btn-sm btn-danger" data-action="remove-recurring" data-recurring-id="${template.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function renderReports() {
  const totals = state.report?.totals || {};
  repInvoiceCount.textContent = String(totals.invoiceCount || 0);
  repRevenue.textContent = formatCurrency(totals.revenue || 0);
  repTax.textContent = formatCurrency(totals.taxCollected || 0);
  repOutstanding.textContent = formatCurrency(totals.outstanding || 0);

  const topCustomers = state.report?.topCustomers || [];
  topCustomersBody.innerHTML = topCustomers.length
    ? topCustomers
      .map(
        (entry) => `
      <tr>
        <td>${escapeHtml(entry.name)}</td>
        <td>${formatCurrency(entry.revenue)}</td>
        <td>${formatCurrency(entry.due)}</td>
      </tr>
    `
      )
      .join("")
    : `<tr><td colspan="3">No customer data.</td></tr>`;

  const topProducts = state.report?.topProducts || [];
  topProductsBody.innerHTML = topProducts.length
    ? topProducts
        .map(
          (entry) => `
      <tr>
        <td>${escapeHtml(entry.name)}</td>
        <td>${Number(entry.quantity || 0)}</td>
        <td>${formatCurrency(entry.revenue)}</td>
      </tr>
    `
        )
        .join("")
    : `<tr><td colspan="3">No product data.</td></tr>`;
}

function renderSettings() {
  if (!state.settings || !settingsForm) {
    return;
  }

  Object.entries(state.settings).forEach(([key, value]) => {
    const field = settingsForm.elements.namedItem(key);
    if (!field) {
      return;
    }
    field.value = value ?? "";
  });
}

function renderPasswordUserOptions() {
  if (!passwordUserSelect) {
    return;
  }

  if (!isAdmin()) {
    passwordUserSelect.innerHTML = "";
    return;
  }

  if (state.users.length === 0) {
    passwordUserSelect.innerHTML = '<option value="">No users</option>';
    return;
  }

  passwordUserSelect.innerHTML = state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.username)})</option>`)
    .join("");
}

async function openCustomerStatement(customerId) {
  try {
    const statement = await requestJson(`/api/customers/${customerId}/statement`);
    const invoiceRows = (statement.invoices || [])
      .map(
        (invoice) => `
        <tr>
          <td>${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}</td>
          <td>${new Date(invoice.createdAt).toLocaleDateString("en-IN")}</td>
          <td>${statusPill(invoice.status)}</td>
          <td>${formatCurrency(invoice.total)}</td>
          <td>${formatCurrency(invoice.paidAmount)}</td>
          <td>${formatCurrency(invoice.dueAmount)}</td>
        </tr>
      `
      )
      .join("");

    const paymentRows = (statement.payments || [])
      .map(
        (payment) => `
        <tr>
          <td>${escapeHtml(payment.invoiceNumber || `#${payment.invoiceId}`)}</td>
          <td>${new Date(payment.date).toLocaleDateString("en-IN")}</td>
          <td>${escapeHtml(payment.method)}</td>
          <td>${formatCurrency(payment.amount)}</td>
          <td>${escapeHtml(payment.note || "-")}</td>
        </tr>
      `
      )
      .join("");

    openDrawer(
      `Statement: ${statement.customer?.name || "Customer"}`,
      `
      <div class="row">
        <div class="col-md-3"><div class="card card-body"><h6>Total Billed</h6><p>${formatCurrency(statement.summary?.totalBilled || 0)}</p></div></div>
        <div class="col-md-3"><div class="card card-body"><h6>Total Paid</h6><p>${formatCurrency(statement.summary?.totalPaid || 0)}</p></div></div>
        <div class="col-md-3"><div class="card card-body"><h6>Total Due</h6><p>${formatCurrency(statement.summary?.totalDue || 0)}</p></div></div>
        <div class="col-md-3"><div class="card card-body"><h6>Overdue</h6><p>${statement.summary?.overdueInvoices || 0}</p></div></div>
      </div>

      <h5 class="mt-4">Invoices</h5>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>No.</th><th>Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead>
          <tbody>${invoiceRows || `<tr><td colspan="6">No invoices.</td></tr>`}</tbody>
        </table>
      </div>
      <h5 class="mt-4">Payments</h5>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>Invoice</th><th>Date</th><th>Method</th><th>Amount</th><th>Note</th></tr></thead>
          <tbody>${paymentRows || `<tr><td colspan="5">No payments.</td></tr>`}</tbody>
        </table>
      </div>
    `
    );
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadInvoices() {
  const query = buildQuery(state.invoiceFilters);
  state.invoices = await requestJson(`/api/invoices${query}`);
}

async function loadReport() {
  const query = buildQuery(state.reportFilters);
  state.report = await requestJson(`/api/reports/summary${query}`);
}

async function refreshBaseData() {
  const [customers, products, settings, users, recurringTemplates] = await Promise.all([
    requestJson("/api/customers"),
    requestJson("/api/products"),
    requestJson("/api/settings"),
    isAdmin() ? requestJson("/api/users") : Promise.resolve([]),
    isAdmin() ? requestJson("/api/recurring") : Promise.resolve([])
  ]);

  state.customers = customers;
  state.products = products;
  state.settings = settings;
  state.users = users;
  state.recurringTemplates = recurringTemplates;

  await Promise.all([loadInvoices(), loadReport()]);

  syncSelects();
  renderCustomers();
  renderProducts();
  renderInvoices();
  renderPayments();
  renderRecurringTemplates();
  renderReports();
  renderOverview();
  renderSettings();
  renderPasswordUserOptions();
}

async function login(username, password) {
  const response = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });

  state.token = response.token;
  localStorage.setItem("billing_token", state.token);
  state.user = response.user;

  currentUserNode.textContent = `${state.user.name} (${state.user.role})`;
  applyRoleVisibility();

  loginView.classList.add("hidden");
  workspaceView.classList.remove("hidden");

  await refreshBaseData();
  setStatus("Logged in.");
}

async function restoreSession() {
  if (!state.token) {
    resetAuthState();
    return;
  }

  try {
    const me = await requestJson("/api/auth/me");
    state.user = me.user;
    currentUserNode.textContent = `${state.user.name} (${state.user.role})`;
    applyRoleVisibility();
    loginView.classList.add("hidden");
    workspaceView.classList.remove("hidden");
    await refreshBaseData();
  } catch (_error) {
    resetAuthState();
  }
}

async function doLogout() {
  try {
    if (state.token) {
      await requestJson("/api/auth/logout", { method: "POST" });
    }
  } catch (_error) {
    // Ignore logout failure and clear local session anyway.
  }
  resetAuthState();
}

async function submitInvoice() {
  const payload = {
    customerId: Number(invoiceCustomerSelect.value),
    gstType: invoiceGstTypeSelect.value,
    dueDays: Number(invoiceDueDaysInput.value || 15),
    invoiceDiscount: Number(invoiceDiscountInput.value || 0),
    shipping: Number(invoiceShippingInput.value || 0),
    roundOff: Number(invoiceRoundoffInput.value || 0),
    notes: invoiceNotesInput.value,
    items: getInvoiceRowsPayload()
  };

  if (!payload.customerId || payload.items.length === 0) {
    setStatus("Select customer and add at least one item.", true);
    return;
  }

  await requestJson("/api/invoices", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  lineItemsContainer.innerHTML = "";
  createLineItemRow(lineItemsContainer);
  invoiceNotesInput.value = "";
  invoiceDiscountInput.value = "0";
  invoiceShippingInput.value = "0";
  invoiceRoundoffInput.value = "0";
  await Promise.all([loadInvoices(), loadReport()]);
  renderInvoices();
  renderPayments();
  renderOverview();
  renderReports();
  updateInvoicePreview();
  setStatus("Invoice generated.");
}

async function addInvoicePaymentPrompt(invoiceId) {
  const invoice = state.invoices.find((entry) => entry.id === Number(invoiceId));
  if (!invoice) {
    setStatus("Invoice not found.", true);
    return;
  }

  const amountRaw = window.prompt(`Payment amount (due ${formatCurrency(invoice.dueAmount)}):`, String(invoice.dueAmount));
  if (amountRaw === null) {
    return;
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    setStatus("Invalid payment amount.", true);
    return;
  }

  const method = window.prompt("Payment method (cash, bank, upi, card):", "upi") || "upi";
  const note = window.prompt("Payment note (optional):", "") || "";

  await requestJson(`/api/invoices/${invoice.id}/payments`, {
    method: "POST",
    body: JSON.stringify({ amount, method, note })
  });

  await Promise.all([loadInvoices(), loadReport()]);
  renderInvoices();
  renderPayments();
  renderOverview();
  renderReports();
  setStatus(`Payment added to ${invoice.invoiceNumber || `#${invoice.id}`}.`);
}

async function shareInvoice(invoiceId) {
  const invoice = state.invoices.find((entry) => entry.id === Number(invoiceId));
  if (!invoice) {
    setStatus("Invoice not found.", true);
    return;
  }

  const pdfPath = `/api/invoices/${invoice.id}/pdf`;
  const cacheBuster = Date.now();
  const pdfUrl = `${window.location.origin}${pdfPath}?token=${encodeURIComponent(state.token)}&v=${cacheBuster}`;

  if (navigator.share && typeof File !== "undefined") {
    try {
      const response = await fetch(pdfPath, {
        headers: { Authorization: `Bearer ${state.token}` },
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("Unable to fetch invoice PDF.");
      }
      const blob = await response.blob();
      const file = new File([blob], `${invoice.invoiceNumber || `invoice-${invoice.id}`}.pdf`, {
        type: "application/pdf"
      });

      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber || invoice.id}`,
          text: `Invoice for ${invoice.customer?.name || "customer"}`,
          files: [file]
        });
        setStatus("Invoice shared.");
        return;
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        setStatus(error.message || "Share failed.", true);
      }
      return;
    }
  }

  const message = [
    `Invoice ${invoice.invoiceNumber || `#${invoice.id}`}`,
    `Customer: ${invoice.customer?.name || "Unknown"}`,
    `Total: ${formatCurrency(invoice.total)}`,
    `Due: ${formatCurrency(invoice.dueAmount)}`,
    `PDF: ${pdfUrl}`
  ].join("\n");

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  setStatus("WhatsApp opened with invoice link.");
}

function downloadInvoice(invoiceId) {
  requestJson(`/api/invoices/${invoiceId}`).then(async (invoice) => {
    const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${state.token}` },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error("Unable to download PDF.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `${invoice.invoiceNumber || `invoice-${invoiceId}`}-${stamp}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Invoice PDF downloaded.");
  }).catch((error) => {
    setStatus(error.message, true);
  });
}

async function deleteInvoice(invoiceId) {
  const invoice = state.invoices.find((entry) => entry.id === Number(invoiceId));
  if (!invoice) {
    setStatus("Invoice not found.", true);
    return;
  }

  if (!window.confirm(`Delete ${invoice.invoiceNumber || `#${invoice.id}`}?`)) {
    return;
  }

  await requestJson(`/api/invoices/${invoice.id}`, { method: "DELETE" });
  await Promise.all([loadInvoices(), loadReport()]);
  renderInvoices();
  renderPayments();
  renderOverview();
  renderReports();
  setStatus("Invoice removed.");
}

async function deleteCustomer(customerId) {
  const customer = state.customers.find((entry) => entry.id === Number(customerId));
  if (!customer) {
    setStatus("Customer not found.", true);
    return;
  }

  if (!window.confirm(`Delete customer "${customer.name}"?`)) {
    return;
  }

  await requestJson(`/api/customers/${customer.id}`, { method: "DELETE" });
  if (Number(customerIdInput?.value || 0) === customer.id) {
    resetCustomerForm();
  }
  await refreshBaseData();
  setStatus("Customer removed.");
}

async function deleteProduct(productId) {
  const product = state.products.find((entry) => entry.id === Number(productId));
  if (!product) {
    return;
  }

  if (!window.confirm(`Delete product "${product.name}"?`)) {
    return;
  }

  await requestJson(`/api/products/${product.id}`, { method: "DELETE" });
  await refreshBaseData();
  setStatus("Product removed.");
}

async function submitRecurringTemplate() {
  const items = getRecurringRowsPayload();
  if (items.length === 0) {
    setStatus("Add at least one recurring item.", true);
    return;
  }

  const payload = {
    name: recurringNameInput.value,
    customerId: Number(recurringCustomerSelect.value),
    frequency: recurringFrequencySelect.value,
    startDate: recurringStartDateInput.value,
    gstType: recurringGstTypeSelect.value,
    dueDays: Number(recurringDueDaysInput.value || 15),
    notes: recurringNotesInput.value,
    invoiceDiscount: Number(recurringDiscountInput.value || 0),
    shipping: Number(recurringShippingInput.value || 0),
    roundOff: Number(recurringRoundoffInput.value || 0),
    items
  };

  await requestJson("/api/recurring", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  recurringForm.reset();
  recurringItemsContainer.innerHTML = "";
  createRecurringItemRow(recurringItemsContainer);
  await refreshBaseData();
  setStatus("Recurring template saved.");
}

async function toggleRecurringTemplate(templateId, active) {
  await requestJson(`/api/recurring/${templateId}`, {
    method: "PUT",
    body: JSON.stringify({ active: !active })
  });
  await refreshBaseData();
  setStatus("Recurring template updated.");
}

async function removeRecurringTemplate(templateId) {
  if (!window.confirm("Delete recurring template?")) {
    return;
  }
  await requestJson(`/api/recurring/${templateId}`, { method: "DELETE" });
  await refreshBaseData();
  setStatus("Recurring template removed.");
}

async function runRecurringNowAction() {
  const response = await requestJson("/api/recurring/run", { method: "POST" });
  await refreshBaseData();
  setStatus(`Recurring run completed. Created ${response.createdCount || 0} invoices.`);
}

async function saveSettings() {
  const formData = new FormData(settingsForm);
  const payload = Object.fromEntries(formData.entries());
  payload.financialYearStartMonth = Number(payload.financialYearStartMonth || 4);

  state.settings = await requestJson("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  renderSettings();
  updateInvoicePreview();
  setStatus("Settings saved.");
}

async function downloadBackup() {
  if (!isAdmin()) {
    setStatus("Only admin can download backup.", true);
    return;
  }

  const response = await fetch("/api/backup", {
    headers: {
      Authorization: `Bearer ${state.token}`
    }
  });
  if (!response.ok) {
    let message = "Backup download failed.";
    try {
      const body = await response.json();
      message = body.error || message;
    } catch (_error) {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const matched = contentDisposition.match(/filename=([^;]+)/i);
  const filename = matched ? matched[1].replaceAll("\"", "").trim() : "invoiceflow-pro-backup.json";

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  setStatus("Backup downloaded.");
}

async function restoreBackup() {
  if (!isAdmin()) {
    setStatus("Only admin can restore backup.", true);
    return;
  }
  const backupFile = restoreBackupFileInput?.files?.[0];
  if (!backupFile) {
    setStatus("Select a backup JSON file first.", true);
    return;
  }

  const rawText = await backupFile.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (_error) {
    setStatus("Selected file is not valid JSON.", true);
    return;
  }

  const confirmed = window.confirm(
    "This will overwrite all current app data with the backup. Continue?"
  );
  if (!confirmed) {
    return;
  }

  const response = await requestJson("/api/backup/restore", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  restoreBackupForm.reset();
  await refreshBaseData();
  const summary = response.summary || {};
  setStatus(
    `Backup restored. Invoices: ${Number(summary.invoices || 0)}, Customers: ${Number(summary.customers || 0)}.`
  );
}

async function updateMyPassword() {
  const formData = new FormData(changePasswordForm);
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword !== confirmPassword) {
    setStatus("New password and confirmation do not match.", true);
    return;
  }

  await requestJson("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword })
  });

  changePasswordForm.reset();
  setStatus("Password updated.");
}

async function adminResetUserPassword() {
  if (!isAdmin()) {
    setStatus("Only admin can reset user passwords.", true);
    return;
  }

  const formData = new FormData(adminResetPasswordForm);
  const userId = Number(formData.get("userId"));
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!Number.isInteger(userId) || userId <= 0) {
    setStatus("Select a valid user.", true);
    return;
  }

  if (newPassword !== confirmPassword) {
    setStatus("New password and confirmation do not match.", true);
    return;
  }

  await requestJson(`/api/users/${userId}/password`, {
    method: "PUT",
    body: JSON.stringify({ newPassword })
  });

  adminResetPasswordForm.reset();
  renderPasswordUserOptions();
  setStatus("User password reset.");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  try {
    await login(username, password);
  } catch (error) {
    setStatus(error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  await doLogout();
  setStatus("Logged out.");
});

tabNav.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-tab]');
  if (!button) {
    return;
  }
  event.preventDefault();
  const tabId = button.dataset.tab;
  setActiveTab(tabId);
});

sidebarToggleButton?.addEventListener("click", () => {
  const opening = !workspaceView.classList.contains("sidebar-open");
  workspaceView.classList.toggle("sidebar-open", opening);
  sidebarOverlay?.classList.toggle("hidden", !opening);
});

sidebarOverlay?.addEventListener("click", () => {
  closeMobileSidebar();
});

topMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.dataset.tabOpen;
    if (!tabId) {
      return;
    }
    setActiveTab(tabId);
    button.closest("details")?.removeAttribute("open");
  });
});

globalSearchInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  const query = globalSearchInput.value.trim();
  state.invoiceFilters = { ...state.invoiceFilters, query };
  filterQueryInput.value = query;
  setActiveTab("invoices");
  try {
    await Promise.all([loadInvoices(), loadReport()]);
    renderInvoices();
    renderPayments();
    renderOverview();
    renderReports();
    setStatus(query ? `Showing results for "${query}".` : "Search cleared.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1080) {
    closeMobileSidebar();
  }
});

invoiceGstTypeSelect.addEventListener("change", updateInvoicePreview);
invoiceDiscountInput.addEventListener("input", updateInvoicePreview);
invoiceShippingInput.addEventListener("input", updateInvoicePreview);
invoiceRoundoffInput.addEventListener("input", updateInvoicePreview);

addLineItemButton.addEventListener("click", () => {
  createLineItemRow(lineItemsContainer);
  updateInvoicePreview();
});

addRecurringItemButton?.addEventListener("click", () => {
  createRecurringItemRow(recurringItemsContainer);
});

invoiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await submitInvoice();
  } catch (error) {
    setStatus(error.message, true);
  }
});

invoiceFilterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.invoiceFilters = {
    query: filterQueryInput.value.trim(),
    status: filterStatusSelect.value,
    customerId: filterCustomerSelect.value,
    dateFrom: filterDateFromInput.value,
    dateTo: filterDateToInput.value
  };

  try {
    await Promise.all([loadInvoices(), loadReport()]);
    renderInvoices();
    renderPayments();
    renderOverview();
    renderReports();
    setStatus("Invoice filter applied.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

clearInvoiceFiltersButton.addEventListener("click", async () => {
  state.invoiceFilters = {
    query: "",
    status: "all",
    customerId: "",
    dateFrom: "",
    dateTo: ""
  };
  filterQueryInput.value = "";
  filterStatusSelect.value = "all";
  filterCustomerSelect.value = "";
  filterDateFromInput.value = "";
  filterDateToInput.value = "";

  try {
    await Promise.all([loadInvoices(), loadReport()]);
    renderInvoices();
    renderPayments();
    renderOverview();
    renderReports();
    setStatus("Invoice filter cleared.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

invoiceTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action][data-invoice-id]");
  if (!button) {
    return;
  }

  const invoiceId = Number(button.dataset.invoiceId);
  const action = button.dataset.action;

  try {
    if (action === "share-invoice") {
      await shareInvoice(invoiceId);
      return;
    }
    if (action === "download-invoice") {
      downloadInvoice(invoiceId);
      return;
    }
    if (action === "pay-invoice") {
      await addInvoicePaymentPrompt(invoiceId);
      return;
    }
    if (action === "remove-invoice") {
      await deleteInvoice(invoiceId);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

paymentTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='pay-invoice'][data-invoice-id]");
  if (!button) {
    return;
  }

  try {
    await addInvoicePaymentPrompt(Number(button.dataset.invoiceId));
  } catch (error) {
    setStatus(error.message, true);
  }
});

customerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(customerForm);
  const payload = Object.fromEntries(formData.entries());
  const customerId = Number(payload.customerId || 0);
  delete payload.customerId;

  try {
    if (customerId > 0) {
      await requestJson(`/api/customers/${customerId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setStatus("Customer updated.");
    } else {
      await requestJson("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setStatus("Customer saved.");
    }
    resetCustomerForm();
    await refreshBaseData();
  } catch (error) {
    setStatus(error.message, true);
  }
});

customerTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action][data-customer-id]");
  if (!button) {
    return;
  }
  const customerId = Number(button.dataset.customerId);
  const action = button.dataset.action;
  try {
    if (action === "statement") {
      await openCustomerStatement(customerId);
      return;
    }
    if (action === "edit-customer") {
      startCustomerEdit(customerId);
      return;
    }
    if (action === "remove-customer") {
      await deleteCustomer(customerId);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

customerCancelButton?.addEventListener("click", () => {
  resetCustomerForm();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const payload = Object.fromEntries(formData.entries());
  payload.price = Number(payload.price || 0);
  payload.taxRate = Number(payload.taxRate || 0);

  try {
    await requestJson("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    productForm.reset();
    productForm.querySelector("input[name='taxRate']").value = "18";
    await refreshBaseData();
    setStatus("Product saved.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

productListNode.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='remove-product'][data-product-id]");
  if (!button) {
    return;
  }

  try {
    await deleteProduct(Number(button.dataset.productId));
  } catch (error) {
    setStatus(error.message, true);
  }
});

recurringForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await submitRecurringTemplate();
  } catch (error) {
    setStatus(error.message, true);
  }
});

runRecurringNowButton?.addEventListener("click", async () => {
  try {
    await runRecurringNowAction();
  } catch (error) {
    setStatus(error.message, true);
  }
});

recurringTableBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action][data-recurring-id]");
  if (!button) {
    return;
  }

  const templateId = Number(button.dataset.recurringId);
  const action = button.dataset.action;
  try {
    if (action === "toggle-recurring") {
      await toggleRecurringTemplate(templateId, button.dataset.active === "true");
      return;
    }
    if (action === "remove-recurring") {
      await removeRecurringTemplate(templateId);
    }
  } catch (error) {
    setStatus(error.message, true);
  }
});

reportFilterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.reportFilters = {
    dateFrom: reportDateFromInput.value,
    dateTo: reportDateToInput.value
  };

  try {
    await loadReport();
    renderReports();
    renderOverview();
    setStatus("Report refreshed.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

settingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await saveSettings();
  } catch (error) {
    setStatus(error.message, true);
  }
});

changePasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await updateMyPassword();
  } catch (error) {
    setStatus(error.message, true);
  }
});

adminResetPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await adminResetUserPassword();
  } catch (error) {
    setStatus(error.message, true);
  }
});

downloadBackupButton?.addEventListener("click", async () => {
  try {
    await downloadBackup();
  } catch (error) {
    setStatus(error.message, true);
  }
});

restoreBackupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await restoreBackup();
  } catch (error) {
    setStatus(error.message, true);
  }
});

statusCloseButton?.addEventListener("click", () => {
  if (statusToast) {
    statusToast.hide();
    return;
  }
  statusToastEl?.classList.remove("show");
});

drawerCloseButton?.addEventListener("click", () => {
  closeDrawer();
});

drawerEl?.addEventListener("click", (event) => {
  if (!drawer && event.target === drawerEl) {
    closeDrawer();
  }
});

drawerEl?.addEventListener('hidden.bs.modal', () => {
  drawerBody.innerHTML = '';
});

async function init() {
  createLineItemRow(lineItemsContainer);
  createRecurringItemRow(recurringItemsContainer);

  const today = new Date().toISOString().slice(0, 10);
  if(recurringStartDateInput) {
    recurringStartDateInput.value = today;
  }

  await restoreSession();
}

init();
