const loginView = document.querySelector("#login-view");
const workspaceView = document.querySelector("#workspace-view");
const loginForm = document.querySelector("#login-form");
const logoutButton = document.querySelector("#logout-btn");
const currentUserNode = document.querySelector("#current-user");
const currentUserRoleNode = document.querySelector("#current-user-role");
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
const headerNavButtons = [...document.querySelectorAll("[data-top-nav][data-tab-open]")];

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
const invoiceEditorSummary = document.querySelector("#invoice-editor-summary");
const lineItemsContainer = document.querySelector("#line-items");
const addLineItemButton = document.querySelector("#add-line-item");
const headerDownloadInvoiceButton = document.querySelector("#header-download-invoice");
const headerEmailInvoiceButton = document.querySelector("#header-email-invoice");
const headerSaveInvoiceButton = document.querySelector("#header-save-invoice");
const headerSendInvoiceButton = document.querySelector("#header-send-invoice");
const headerCreateInvoiceButton = document.querySelector("#header-create-invoice");
const previewModeButtons = [...document.querySelectorAll("[data-preview-mode]")];
const previewActionButtons = [...document.querySelectorAll("[data-preview-action]")];

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
const overviewFilterForm = document.querySelector("#overview-filter-form");
const overviewFilterQueryInput = document.querySelector("#overview-filter-query");
const overviewFilterStatusSelect = document.querySelector("#overview-filter-status");
const overviewFilterCustomerSelect = document.querySelector("#overview-filter-customer");
const overviewFilterDateFromInput = document.querySelector("#overview-filter-date-from");
const overviewFilterDateToInput = document.querySelector("#overview-filter-date-to");
const overviewClearFiltersButton = document.querySelector("#overview-clear-filters");
const overviewActiveFilters = document.querySelector("#overview-active-filters");
const overviewInvoiceList = document.querySelector("#overview-invoice-list");
const overviewActivityList = document.querySelector("#overview-activity-list");
const overviewSharingDefaults = document.querySelector("#overview-sharing-defaults");
const overviewListCaption = document.querySelector("#overview-list-caption");
const overviewListCount = document.querySelector("#overview-list-count");
const overviewOutstandingBadge = document.querySelector("#overview-outstanding-badge");
const overviewRevenueBadge = document.querySelector("#overview-revenue-badge");
const overviewOverdueBadge = document.querySelector("#overview-overdue-badge");
const overviewBaseBadge = document.querySelector("#overview-base-badge");
const overviewOutstandingNote = document.querySelector("#overview-outstanding-note");
const overviewRevenueNote = document.querySelector("#overview-revenue-note");
const overviewOverdueNote = document.querySelector("#overview-overdue-note");
const overviewBaseNote = document.querySelector("#overview-base-note");
const overviewExportButton = document.querySelector("#overview-export-btn");
const overviewShareWorkspaceButton = document.querySelector("#overview-share-workspace-btn");
const overviewOpenInvoicesButton = document.querySelector("#overview-open-invoices");
const overviewQuickShareButton = document.querySelector("#overview-quick-share");
const overviewQuickDownloadButton = document.querySelector("#overview-quick-download");
const overviewQuickCreateButton = document.querySelector("#overview-quick-create");
const overviewQuickSettingsButton = document.querySelector("#overview-quick-settings");
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
  theme: "light",
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
  invoicePreviewMode: "preview",
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
    return `₹ ${(amount / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (amount >= 1000) {
    return `₹ ${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `₹ ${Math.round(amount)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatRelativeTime(value) {
  const target = new Date(value || "");
  const timestamp = target.getTime();
  if (Number.isNaN(timestamp)) {
    return "Updated recently";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return `Updated ${formatLongDate(value)}`;
}

function applyTheme() {
  state.theme = "light";
  document.body.dataset.theme = "light";
  document.documentElement.setAttribute("data-bs-theme", "light");
  localStorage.removeItem("billing_theme");
}

function formatLongDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatPreviewText(value, fallback = "Not set") {
  const text = String(value || "").trim();
  if (!text) {
    return escapeHtml(fallback);
  }
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function getLatestInvoice() {
  if (!Array.isArray(state.invoices) || state.invoices.length === 0) {
    return null;
  }

  return [...state.invoices].sort((left, right) => {
    const leftDate = new Date(left?.createdAt || 0).getTime();
    const rightDate = new Date(right?.createdAt || 0).getTime();
    return rightDate - leftDate;
  })[0];
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
  setSidebarOpen(false);
}

function setSidebarOpen(open) {
  const shouldOpen = Boolean(open) && window.matchMedia("(max-width: 1080px)").matches;
  workspaceView?.classList.toggle("sidebar-open", shouldOpen);
  sidebarOverlay?.classList.toggle("hidden", !shouldOpen);
  sidebarToggleButton?.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  document.body.classList.toggle("mobile-nav-open", shouldOpen);
}

function updateLayoutMetrics() {
  const topbarHeight = document.querySelector(".app-topbar")?.offsetHeight || 0;
  if (topbarHeight > 0) {
    document.documentElement.style.setProperty("--app-topbar-height", `${topbarHeight}px`);
  }
}

function renderCurrentUserChip() {
  const name = state.user?.name || "Workspace User";
  const role = state.user?.role ? String(state.user.role) : "Finance";

  if (currentUserNode) {
    currentUserNode.textContent = name;
  }
  if (currentUserRoleNode) {
    currentUserRoleNode.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  }
}

function updateHeaderNavState(activeTab) {
  headerNavButtons.forEach((button) => {
    const active = button.dataset.tabOpen === activeTab;
    button.classList.toggle("is-active", active);
  });
}

function syncResponsiveTables(root = document) {
  const tables = root.querySelectorAll(".table-responsive .table");
  tables.forEach((table) => {
    const headers = [...table.querySelectorAll("thead th")].map((header) =>
      header.textContent.replace(/\s+/g, " ").trim()
    );

    if (headers.length === 0) {
      delete table.dataset.responsiveStack;
      return;
    }

    table.dataset.responsiveStack = "true";
    [...table.querySelectorAll("tbody tr")].forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (!(cell instanceof HTMLTableCellElement)) {
          return;
        }

        if (cell.hasAttribute("colspan")) {
          delete cell.dataset.label;
          return;
        }

        cell.dataset.label = headers[index] || `Column ${index + 1}`;
      });
    });
  });
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
  closeMobileSidebar();
  renderCurrentUserChip();
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
  syncResponsiveTables(drawerBody);
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

  updateHeaderNavState(tabId);
  updateHeaderActionState();
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

function updatePreviewModeButtons() {
  previewModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.previewMode === state.invoicePreviewMode);
  });
}

function updateHeaderActionState() {
  const activeTab = document.querySelector(".nav-link.active[data-tab]")?.dataset.tab || "overview";
  const latestInvoice = getLatestInvoice();
  const hasInvoice = Boolean(latestInvoice);
  const canSaveDraft = activeTab === "invoices";

  if (headerDownloadInvoiceButton) {
    headerDownloadInvoiceButton.disabled = !hasInvoice;
  }
  if (headerEmailInvoiceButton) {
    headerEmailInvoiceButton.disabled = !hasInvoice;
  }
  if (headerSaveInvoiceButton) {
    headerSaveInvoiceButton.disabled = !canSaveDraft;
  }
  if (headerSendInvoiceButton) {
    headerSendInvoiceButton.disabled = !(canSaveDraft || hasInvoice);
  }
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

function inputNumberValue(rawValue, fallback = 0) {
  const value = Number(rawValue);
  return Number.isFinite(value) ? String(value) : String(fallback);
}

function syncLineItemIndices(container, labelPrefix = "Item") {
  [...container.querySelectorAll(".line-item")].forEach((row, index) => {
    const label = row.querySelector(".item-index");
    if (label) {
      label.textContent = `${labelPrefix} #${index + 1}`;
    }
  });
}

function applyRowProductDefaults(row) {
  const product = productById(Number(row.querySelector(".row-product")?.value));
  if (!product) {
    return;
  }

  const unitPriceInput = row.querySelector(".row-unit-price");
  const taxRateInput = row.querySelector(".row-tax-rate");

  if (unitPriceInput) {
    unitPriceInput.value = inputNumberValue(product.price, 0);
  }
  if (taxRateInput) {
    taxRateInput.value = inputNumberValue(product.taxRate, 0);
  }
}

function createLineItemRow(container, initial = {}) {
  const fallbackProduct = productById(initial.productId) || state.products[0] || null;
  const selectedProductId = initial.productId || fallbackProduct?.id || "";
  const unitPriceValue =
    initial.unitPrice !== undefined && initial.unitPrice !== null
      ? initial.unitPrice
      : fallbackProduct?.price || 0;
  const taxRateValue =
    initial.taxRate !== undefined && initial.taxRate !== null
      ? initial.taxRate
      : fallbackProduct?.taxRate || 0;

  const row = document.createElement("div");
  row.className = "line-item item-entry-card";
  row.innerHTML = `
    <div class="item-entry-header">
      <div>
        <p class="item-index">Item #1</p>
        <p class="item-caption">Choose a product and fine-tune quantity, price, and GST before you send.</p>
      </div>
      <button type="button" class="row-remove item-remove-btn">
        <i class="bi bi-trash3"></i>
        Remove
      </button>
    </div>
    <div class="item-entry-grid">
      <label class="premium-field premium-field-span-2">
        <span class="field-label">Product</span>
        <select class="form-select row-product" required>
          ${buildProductOptions(selectedProductId)}
        </select>
      </label>
      <label class="premium-field">
        <span class="field-label">Qty</span>
        <input
          class="form-control row-qty"
          type="number"
          min="0.01"
          step="0.01"
          value="${inputNumberValue(initial.quantity, 1)}"
          required
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Unit Price</span>
        <input
          class="form-control row-unit-price"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(unitPriceValue, 0)}"
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Tax %</span>
        <input
          class="form-control row-tax-rate"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(taxRateValue, 0)}"
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Line Discount</span>
        <input
          class="form-control row-discount"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(initial.lineDiscount, 0)}"
        />
      </label>
    </div>
    <div class="item-entry-meta">
      <div class="item-meta-pill">
        <span>Taxable</span>
        <strong class="row-taxable">${formatCurrency(0)}</strong>
      </div>
      <div class="item-meta-pill">
        <span>Tax</span>
        <strong class="row-tax">${formatCurrency(0)}</strong>
      </div>
      <div class="item-meta-pill item-meta-pill-strong">
        <span>Total</span>
        <strong class="row-total">${formatCurrency(0)}</strong>
      </div>
    </div>
  `;

  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    syncLineItemIndices(container);
    updateInvoicePreview();
  });
  row.querySelector(".row-product").addEventListener("change", () => {
    applyRowProductDefaults(row);
    updateInvoicePreview();
  });
  row.querySelector(".row-qty").addEventListener("input", updateInvoicePreview);
  row.querySelector(".row-unit-price").addEventListener("input", updateInvoicePreview);
  row.querySelector(".row-tax-rate").addEventListener("input", updateInvoicePreview);
  row.querySelector(".row-discount").addEventListener("input", updateInvoicePreview);

  container.append(row);
  syncLineItemIndices(container);
}

function createRecurringItemRow(container, initial = {}) {
  const fallbackProduct = productById(initial.productId) || state.products[0] || null;
  const selectedProductId = initial.productId || fallbackProduct?.id || "";
  const unitPriceValue =
    initial.unitPrice !== undefined && initial.unitPrice !== null
      ? initial.unitPrice
      : fallbackProduct?.price || 0;
  const taxRateValue =
    initial.taxRate !== undefined && initial.taxRate !== null
      ? initial.taxRate
      : fallbackProduct?.taxRate || 0;

  const row = document.createElement("div");
  row.className = "line-item item-entry-card recurring-item-card";
  row.innerHTML = `
    <div class="item-entry-header">
      <div>
        <p class="item-index">Item #1</p>
        <p class="item-caption">Saved with the recurring template and reused on every schedule run.</p>
      </div>
      <button type="button" class="row-remove item-remove-btn">
        <i class="bi bi-trash3"></i>
        Remove
      </button>
    </div>
    <div class="item-entry-grid">
      <label class="premium-field premium-field-span-2">
        <span class="field-label">Product</span>
        <select class="form-select row-product" required>
          ${buildProductOptions(selectedProductId)}
        </select>
      </label>
      <label class="premium-field">
        <span class="field-label">Qty</span>
        <input
          class="form-control row-qty"
          type="number"
          min="0.01"
          step="0.01"
          value="${inputNumberValue(initial.quantity, 1)}"
          required
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Unit Price</span>
        <input
          class="form-control row-unit-price"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(unitPriceValue, 0)}"
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Tax %</span>
        <input
          class="form-control row-tax-rate"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(taxRateValue, 0)}"
        />
      </label>
      <label class="premium-field">
        <span class="field-label">Line Discount</span>
        <input
          class="form-control row-discount"
          type="number"
          min="0"
          step="0.01"
          value="${inputNumberValue(initial.lineDiscount, 0)}"
        />
      </label>
    </div>
  `;

  row.querySelector(".row-remove").addEventListener("click", () => {
    row.remove();
    syncLineItemIndices(container);
  });
  row.querySelector(".row-product").addEventListener("change", () => {
    applyRowProductDefaults(row);
  });

  container.append(row);
  syncLineItemIndices(container);
}

function getInvoiceRowsPayload() {
  return [...lineItemsContainer.querySelectorAll(".line-item")]
    .map((row) => ({
      productId: Number(row.querySelector(".row-product")?.value),
      quantity: Number(row.querySelector(".row-qty")?.value),
      unitPrice: Number(row.querySelector(".row-unit-price")?.value),
      taxRate: Number(row.querySelector(".row-tax-rate")?.value),
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
      unitPrice: Number(row.querySelector(".row-unit-price")?.value),
      taxRate: Number(row.querySelector(".row-tax-rate")?.value),
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

function calculateLinePreview(product, qty, lineDiscount, gstType, overrides = {}) {
  const quantity = Number(qty || 0);
  const discount = Math.max(0, Number(lineDiscount || 0));
  const overrideUnitPrice = Number(overrides.unitPrice);
  const overrideTaxRate = Number(overrides.taxRate);
  const unitPrice =
    Number.isFinite(overrideUnitPrice) && overrideUnitPrice >= 0
      ? overrideUnitPrice
      : Number(product.price || 0);
  const taxRate =
    Number.isFinite(overrideTaxRate) && overrideTaxRate >= 0
      ? overrideTaxRate
      : Number(product.taxRate || 0);
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
    quantity,
    unitPrice,
    taxRate,
    lineDiscount: discount
  };
}

function updateInvoicePreview() {
  const rows = [...lineItemsContainer.querySelectorAll(".line-item")];
  const gstType = invoiceGstTypeSelect.value || "intra";
  const issueDate = new Date();
  const dueDays = Number(invoiceDueDaysInput.value || 15);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + Math.max(0, dueDays));

  let subtotalTaxable = 0;
  let lineDiscountTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  const previewItems = [];

  for (const row of rows) {
    const productId = Number(row.querySelector(".row-product")?.value);
    const quantity = Number(row.querySelector(".row-qty")?.value);
    const unitPrice = Number(row.querySelector(".row-unit-price")?.value);
    const taxRate = Number(row.querySelector(".row-tax-rate")?.value);
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

    const calc = calculateLinePreview(product, quantity, lineDiscount, gstType, {
      unitPrice,
      taxRate
    });
    taxableNode.textContent = formatCurrency(calc.taxable);
    taxNode.textContent = formatCurrency(calc.tax);
    totalNode.textContent = formatCurrency(calc.total);

    subtotalTaxable += calc.taxable;
    lineDiscountTotal += calc.lineDiscount;
    cgstTotal += calc.cgst;
    sgstTotal += calc.sgst;
    igstTotal += calc.igst;
    previewItems.push({
      name: product.name || "Item",
      quantity: calc.quantity,
      unitPrice: calc.unitPrice,
      taxRate: calc.taxRate,
      lineDiscount: calc.lineDiscount,
      total: calc.total
    });
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
  const selectedCustomer = state.customers.find(
    (customer) => customer.id === Number(invoiceCustomerSelect.value)
  );
  const companyContactLines = [
    companyProfile.address,
    [companyProfile.phone, companyProfile.email].filter(Boolean).join(" | "),
    companyProfile.gstin ? `GSTIN ${companyProfile.gstin}` : gstType === "none" ? "Non-GST billing profile" : ""
  ].filter(Boolean);
  const customerLines = [
    selectedCustomer?.address,
    [selectedCustomer?.phone, selectedCustomer?.email].filter(Boolean).join(" | "),
    gstType === "none" ? "" : selectedCustomer?.gstin ? `GSTIN ${selectedCustomer.gstin}` : "GSTIN not provided"
  ].filter(Boolean);
  const previewRows = previewItems.length
    ? previewItems
        .map(
          (item) => `
            <tr>
              <td>
                <strong>${escapeHtml(item.name)}</strong>
                <span>GST ${escapeHtml(String(item.taxRate))}%</span>
              </td>
              <td>${escapeHtml(String(item.quantity))}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.lineDiscount)}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>
          `
        )
        .join("")
    : `
      <tr class="preview-empty-row">
        <td colspan="5">Add line items to see the live invoice table here.</td>
      </tr>
    `;
  const notesCopy = formatPreviewText(
    invoiceNotesInput.value,
    "Add payment terms, delivery instructions, or a thank-you note for the customer."
  );
  const summaryBadge = previewItems.length > 0 ? "Ready to send" : "Draft preview";

  if (invoiceCompanyBanner) {
    const modeText = gstType === "none" ? "Without GST Company" : "GST Company";
    invoiceCompanyBanner.innerHTML = `
      <div class="company-profile-banner">
        <div>
          <p class="company-profile-label">${escapeHtml(modeText)}</p>
          <h4>${escapeHtml(companyName)}</h4>
          <p>${formatPreviewText(companyContactLines.join("\n"), "Add your company details in Settings.")}</p>
        </div>
        <div class="company-profile-meta">
          <span>${gstType === "none" ? "No GST applied" : escapeHtml(companyProfile.gstin || "GSTIN missing")}</span>
        </div>
      </div>
    `;
  }

  if (invoiceEditorSummary) {
    invoiceEditorSummary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${formatCurrency(subtotalTaxable)}</strong>
      </div>
      <div class="summary-row">
        <span>Tax</span>
        <strong>${formatCurrency(taxTotal)}</strong>
      </div>
      <div class="summary-row">
        <span>Discounts</span>
        <strong>${formatCurrency(lineDiscountTotal + invoiceDiscount)}</strong>
      </div>
      <div class="summary-row">
        <span>Shipping + Round Off</span>
        <strong>${formatCurrency(shipping + roundOff)}</strong>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-total-row">
        <div>
          <span>Total payable</span>
          <h4>${formatCurrency(finalTotal)}</h4>
        </div>
        <span class="preview-ready-badge">${escapeHtml(summaryBadge)}</span>
      </div>
    `;
  }

  invoicePreview.innerHTML = `
    <div class="invoice-preview-page ${state.invoicePreviewMode === "notes" ? "is-notes-view" : ""}">
      <article class="invoice-doc">
        <div class="invoice-doc-top">
          <div class="invoice-doc-from">
            <p class="invoice-doc-overline">From</p>
            <h2>${escapeHtml(companyName)}</h2>
            <p>${formatPreviewText(companyContactLines.join("\n"), "Add your company details in Settings.")}</p>
          </div>
          <div class="invoice-doc-title">
            <span class="invoice-doc-type">${escapeHtml(invoiceTypeText)}</span>
            <h1>Invoice</h1>
            <p>Invoice number is generated automatically on save.</p>
          </div>
        </div>

        <div class="invoice-doc-bill">
          <div class="invoice-doc-customer">
            <p class="invoice-doc-overline">Billed to</p>
            <h3>${escapeHtml(selectedCustomer?.name || "Choose a customer")}</h3>
            <p>${formatPreviewText(customerLines.join("\n"), "Select a customer to populate billing details.")}</p>
          </div>
          <div class="invoice-doc-info-grid">
            <div>
              <span>Issued</span>
              <strong>${escapeHtml(formatLongDate(issueDate))}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>${escapeHtml(formatLongDate(dueDate))}</strong>
            </div>
            <div>
              <span>Terms</span>
              <strong>${escapeHtml(`${Math.max(0, dueDays)} days`)}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>INR (₹)</strong>
            </div>
          </div>
        </div>

        <div class="invoice-doc-table-wrap">
          <table class="invoice-doc-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${previewRows}</tbody>
          </table>
        </div>

        <div class="invoice-doc-bottom">
          <section class="invoice-doc-notes">
            <p class="invoice-doc-overline">Notes</p>
            <div class="invoice-doc-note-copy">${notesCopy}</div>
          </section>

          <aside class="invoice-doc-total-card">
            <span class="preview-ready-badge">${escapeHtml(summaryBadge)}</span>
            <div class="invoice-doc-total-row">
              <span>Taxable</span>
              <strong>${formatCurrency(subtotalTaxable)}</strong>
            </div>
            <div class="invoice-doc-total-row">
              <span>CGST / SGST</span>
              <strong>${formatCurrency(cgstTotal + sgstTotal)}</strong>
            </div>
            <div class="invoice-doc-total-row">
              <span>IGST</span>
              <strong>${formatCurrency(igstTotal)}</strong>
            </div>
            <div class="invoice-doc-total-row">
              <span>Invoice Discount</span>
              <strong>${formatCurrency(invoiceDiscount)}</strong>
            </div>
            <div class="invoice-doc-total-row">
              <span>Shipping</span>
              <strong>${formatCurrency(shipping)}</strong>
            </div>
            <div class="invoice-doc-total-row">
              <span>Round Off</span>
              <strong>${formatCurrency(roundOff)}</strong>
            </div>
            <div class="invoice-doc-total-row invoice-doc-total-row-strong">
              <span>Total</span>
              <strong>${formatCurrency(finalTotal)}</strong>
            </div>
          </aside>
        </div>

        <footer class="invoice-doc-footer">
          <span>Thank you for your business.</span>
          <span>Preview generated live from the editor.</span>
        </footer>
      </article>
    </div>
  `;

  const validItems = getInvoiceRowsPayload().length;
  invoiceSubmitButton.disabled = !(
    Number(invoiceCustomerSelect.value) > 0 &&
    validItems > 0 &&
    state.products.length > 0
  );
  updatePreviewModeButtons();
  updateHeaderActionState();
}

function syncInvoiceFilterControls() {
  if (filterQueryInput) {
    filterQueryInput.value = state.invoiceFilters.query;
  }
  if (filterStatusSelect) {
    filterStatusSelect.value = state.invoiceFilters.status;
  }
  if (filterCustomerSelect) {
    filterCustomerSelect.value = state.invoiceFilters.customerId;
  }
  if (filterDateFromInput) {
    filterDateFromInput.value = state.invoiceFilters.dateFrom;
  }
  if (filterDateToInput) {
    filterDateToInput.value = state.invoiceFilters.dateTo;
  }

  if (overviewFilterQueryInput) {
    overviewFilterQueryInput.value = state.invoiceFilters.query;
  }
  if (overviewFilterStatusSelect) {
    overviewFilterStatusSelect.value = state.invoiceFilters.status;
  }
  if (overviewFilterCustomerSelect) {
    overviewFilterCustomerSelect.value = state.invoiceFilters.customerId;
  }
  if (overviewFilterDateFromInput) {
    overviewFilterDateFromInput.value = state.invoiceFilters.dateFrom;
  }
  if (overviewFilterDateToInput) {
    overviewFilterDateToInput.value = state.invoiceFilters.dateTo;
  }
}

function syncSelects() {
  invoiceCustomerSelect.innerHTML = buildCustomerOptions(invoiceCustomerSelect.value);
  recurringCustomerSelect.innerHTML = buildCustomerOptions(recurringCustomerSelect.value);

  const customerOptions = [
    '<option value="">All Customers</option>',
    ...state.customers.map(
      (customer) =>
        `<option value="${customer.id}" ${
          Number(state.invoiceFilters.customerId) === customer.id ? "selected" : ""
        }>${escapeHtml(customer.name)}</option>`
    )
  ].join("");
  filterCustomerSelect.innerHTML = customerOptions;
  if (overviewFilterCustomerSelect) {
    overviewFilterCustomerSelect.innerHTML = customerOptions;
  }

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

  syncInvoiceFilterControls();
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
  syncResponsiveTables();
}

function getDashboardStatusMeta(status) {
  const normalized = String(status || "unpaid").toLowerCase();
  if (normalized === "paid") {
    return { label: "Paid", tone: "paid", icon: "bi bi-check2-circle" };
  }
  if (normalized === "partial") {
    return { label: "Partial", tone: "partial", icon: "bi bi-hourglass-split" };
  }
  if (normalized === "overdue") {
    return { label: "Overdue", tone: "overdue", icon: "bi bi-exclamation-circle" };
  }
  return { label: normalized === "unpaid" ? "Outstanding" : normalized, tone: "unpaid", icon: "bi bi-receipt" };
}

function renderOverviewActiveFilters() {
  if (!overviewActiveFilters) {
    return;
  }

  const chips = [];
  const customer = state.customers.find((entry) => entry.id === Number(state.invoiceFilters.customerId));

  if (state.invoiceFilters.query) {
    chips.push({ key: "query", label: `Search: ${state.invoiceFilters.query}` });
  }
  if (state.invoiceFilters.status && state.invoiceFilters.status !== "all") {
    chips.push({ key: "status", label: `Status: ${state.invoiceFilters.status}` });
  }
  if (customer) {
    chips.push({ key: "customerId", label: `Client: ${customer.name}` });
  }
  if (state.invoiceFilters.dateFrom) {
    chips.push({ key: "dateFrom", label: `From: ${formatLongDate(state.invoiceFilters.dateFrom)}` });
  }
  if (state.invoiceFilters.dateTo) {
    chips.push({ key: "dateTo", label: `To: ${formatLongDate(state.invoiceFilters.dateTo)}` });
  }

  if (chips.length === 0) {
    overviewActiveFilters.innerHTML = '<span class="dashboard-filter-empty">No filters applied. Showing the latest invoice activity.</span>';
    return;
  }

  overviewActiveFilters.innerHTML = [
    ...chips.map(
      (chip) => `
        <span class="dashboard-filter-chip">
          ${escapeHtml(chip.label)}
          <button type="button" class="dashboard-chip-clear" data-clear-filter="${chip.key}" aria-label="Remove ${escapeHtml(chip.label)}">
            <i class="bi bi-x"></i>
          </button>
        </span>
      `
    ),
    '<button type="button" class="dashboard-clear-all" data-clear-filter="all">Clear all</button>'
  ].join("");
}

function renderOverviewInvoiceFeed(invoices) {
  if (!overviewInvoiceList) {
    return;
  }

  if (invoices.length === 0) {
    overviewInvoiceList.innerHTML = `
      <div class="dashboard-empty-state">
        <i class="bi bi-receipt-cutoff"></i>
        <div>
          <strong>No invoices found</strong>
          <p>Create a new invoice or adjust the filters to see matching activity.</p>
        </div>
      </div>
    `;
    return;
  }

  overviewInvoiceList.innerHTML = invoices
    .slice(0, 4)
    .map((invoice, index) => {
      const statusMeta = getDashboardStatusMeta(invoice.status);
      const dueDate = invoice?.dueDate ? formatLongDate(invoice.dueDate) : "No due date";
      const secondaryAmount =
        Number(invoice.dueAmount || 0) > 0.009
          ? `Due ${formatCurrency(invoice.dueAmount)}`
          : `Paid ${formatCurrency(invoice.paidAmount)}`;
      return `
        <article class="dashboard-invoice-row ${index === 0 ? "is-featured" : ""}">
          <div class="dashboard-invoice-primary">
            <span class="dashboard-invoice-icon">
              <i class="${statusMeta.icon}"></i>
            </span>
            <div class="dashboard-invoice-copy">
              <div class="dashboard-invoice-title-row">
                <button type="button" class="dashboard-text-link" data-tab-open="invoices">
                  ${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}
                </button>
                ${index === 0 ? '<span class="dashboard-inline-tag">Recent</span>' : ""}
              </div>
              <p class="dashboard-invoice-meta">${escapeHtml(formatRelativeTime(invoice.createdAt))}</p>
            </div>
          </div>
          <div class="dashboard-invoice-client">
            <strong>${escapeHtml(invoice.customer?.name || "Unknown customer")}</strong>
            <span>Due ${escapeHtml(dueDate)}</span>
          </div>
          <div class="dashboard-invoice-amount">
            <strong>${formatCurrency(invoice.total)}</strong>
            <span>${escapeHtml(secondaryAmount)}</span>
          </div>
          <div class="dashboard-invoice-status">
            <span class="dashboard-status-chip is-${statusMeta.tone}">
              <span class="dashboard-status-dot"></span>
              ${escapeHtml(statusMeta.label)}
            </span>
          </div>
          <div class="dashboard-invoice-actions">
            <button type="button" class="dashboard-icon-btn" data-action="download-invoice" data-invoice-id="${invoice.id}" aria-label="Download PDF">
              <i class="bi bi-download"></i>
            </button>
            <button type="button" class="dashboard-icon-btn" data-action="share-invoice" data-invoice-id="${invoice.id}" aria-label="Share invoice">
              <i class="bi bi-share"></i>
            </button>
            <button type="button" class="dashboard-icon-btn" data-action="pay-invoice" data-invoice-id="${invoice.id}" aria-label="Add payment">
              <i class="bi bi-wallet2"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderOverviewActivityFeed(invoices) {
  if (!overviewActivityList) {
    return;
  }

  const latestInvoices = [...invoices].slice(0, 2);
  if (latestInvoices.length === 0) {
    overviewActivityList.innerHTML = '<p class="dashboard-empty-copy">No recent invoice activity yet.</p>';
    return;
  }

  overviewActivityList.innerHTML = latestInvoices
    .map((invoice) => {
      const statusMeta = getDashboardStatusMeta(invoice.status);
      return `
        <article class="dashboard-activity-item">
          <div class="dashboard-activity-head">
            <div>
              <div class="dashboard-activity-title-row">
                <button type="button" class="dashboard-text-link" data-tab-open="invoices">
                  ${escapeHtml(invoice.invoiceNumber || `#${invoice.id}`)}
                </button>
                <span class="dashboard-status-chip is-${statusMeta.tone}">
                  <span class="dashboard-status-dot"></span>
                  ${escapeHtml(statusMeta.label)}
                </span>
              </div>
              <p class="dashboard-activity-copy">${escapeHtml(invoice.customer?.name || "Unknown customer")} • ${formatCurrency(invoice.total)}</p>
            </div>
            <div class="dashboard-activity-actions">
              <button type="button" class="dashboard-icon-btn" data-action="download-invoice" data-invoice-id="${invoice.id}" aria-label="Download invoice">
                <i class="bi bi-download"></i>
              </button>
              <button type="button" class="dashboard-icon-btn" data-action="share-invoice" data-invoice-id="${invoice.id}" aria-label="Share invoice">
                <i class="bi bi-share"></i>
              </button>
            </div>
          </div>
          <div class="dashboard-activity-metrics">
            <div>
              <span>Updated</span>
              <strong>${escapeHtml(formatRelativeTime(invoice.createdAt).replace(/^Updated /, ""))}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>${formatCurrency(invoice.dueAmount)}</strong>
            </div>
            <div>
              <span>Due Date</span>
              <strong>${escapeHtml(invoice?.dueDate ? formatLongDate(invoice.dueDate) : "Not set")}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderOverviewSharingDefaults() {
  if (!overviewSharingDefaults) {
    return;
  }

  const bankLabel = state.settings?.bankName || "No bank profile";
  const paymentHandle = state.settings?.upiId
    || (state.settings?.bankAccountNumber ? maskAccountNumber(state.settings.bankAccountNumber) : "")
    || "Add a bank or UPI handle";

  const rows = [
    {
      icon: "bi bi-lock",
      title: "Share-ready PDFs",
      copy: "Latest invoice download and share actions are available from the dashboard.",
      badge: "Ready"
    },
    {
      icon: "bi bi-bank",
      title: bankLabel,
      copy: paymentHandle,
      badge: state.settings?.bankName || state.settings?.upiId ? "Configured" : "Missing"
    },
    {
      icon: "bi bi-image",
      title: "Brand assets",
      copy: "Workspace logo and invoice branding are live in preview and PDF exports.",
      badge: "Live"
    }
  ];

  overviewSharingDefaults.innerHTML = rows
    .map(
      (row) => `
        <article class="dashboard-sharing-item">
          <span class="dashboard-sharing-icon"><i class="${row.icon}"></i></span>
          <span class="dashboard-sharing-copy">
            <strong>${escapeHtml(row.title)}</strong>
            <span>${escapeHtml(row.copy)}</span>
          </span>
          <span class="dashboard-sharing-badge">${escapeHtml(row.badge)}</span>
        </article>
      `
    )
    .join("");
}

function renderOverview() {
  const totals = state.report?.totals || {};
  const revenue = Number(totals.revenue || 0);
  const outstanding = Number(totals.outstanding || 0);
  const overdueInvoices = Number(totals.overdueInvoices || 0);
  const outstandingCount = state.invoices.filter((invoice) => Number(invoice.dueAmount || 0) > 0.009).length;
  const statusSummary = countInvoiceStatuses(state.invoices);

  if (metricRevenue) {
    metricRevenue.textContent = formatCurrency(revenue);
  }
  if (metricOutstanding) {
    metricOutstanding.textContent = formatCurrency(outstanding);
  }
  if (metricOverdue) {
    metricOverdue.textContent = String(overdueInvoices);
  }
  if (metricBase) {
    metricBase.textContent = `${state.customers.length} / ${state.products.length}`;
  }
  if (overviewOutstandingBadge) {
    overviewOutstandingBadge.textContent = `${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"}`;
  }
  if (overviewRevenueBadge) {
    overviewRevenueBadge.textContent = `${Number(totals.invoiceCount || state.invoices.length)} invoice${Number(totals.invoiceCount || state.invoices.length) === 1 ? "" : "s"}`;
  }
  if (overviewOverdueBadge) {
    overviewOverdueBadge.textContent = `${overdueInvoices} flagged`;
  }
  if (overviewBaseBadge) {
    overviewBaseBadge.textContent = `${state.customers.length + state.products.length} records`;
  }
  if (overviewOutstandingNote) {
    overviewOutstandingNote.textContent = outstandingCount > 0
      ? `${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"} still waiting for payment.`
      : "All clear. No open dues right now.";
  }
  if (overviewRevenueNote) {
    overviewRevenueNote.textContent = `${statusSummary.paid} paid and ${statusSummary.partial} partial invoice${statusSummary.partial === 1 ? "" : "s"} in the current report view.`;
  }
  if (overviewOverdueNote) {
    overviewOverdueNote.textContent = overdueInvoices > 0
      ? "Review and follow up on the invoices that have crossed their due date."
      : "No overdue invoices in the current view.";
  }
  if (overviewBaseNote) {
    overviewBaseNote.textContent = `${state.customers.length} customer${state.customers.length === 1 ? "" : "s"} and ${state.products.length} product${state.products.length === 1 ? "" : "s"} ready to invoice.`;
  }

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

  renderDoughnutOverview(statusSummary);

  const monthlySeries = buildMonthlyOverviewSeries(state.invoices, 6);
  renderMiniBarChart(incomeBars, monthlySeries, "income", "income");
  renderMiniBarChart(outcomeBars, monthlySeries, "outcome", "outcome");

  const recent = [...state.invoices].slice(0, 8);
  if (overviewListCaption) {
    overviewListCaption.textContent = `${state.invoices.length} matching invoice${state.invoices.length === 1 ? "" : "s"} • Sorted by updated time`;
  }
  if (overviewListCount) {
    const shownCount = Math.min(state.invoices.length, 4);
    overviewListCount.textContent = state.invoices.length
      ? `Showing ${shownCount} of ${state.invoices.length} invoice${state.invoices.length === 1 ? "" : "s"}`
      : "Showing 0 invoices";
  }

  renderOverviewActiveFilters();
  renderOverviewInvoiceFeed(recent);
  renderOverviewActivityFeed(recent);
  renderOverviewSharingDefaults();
  syncResponsiveTables();
}

function renderCustomers() {
  if (state.customers.length === 0) {
    customerTableBody.innerHTML = `<tr><td colspan="4">No customers yet.</td></tr>`;
    syncResponsiveTables();
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
  syncResponsiveTables();
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
    syncResponsiveTables();
    updateHeaderActionState();
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
  syncResponsiveTables();
  updateHeaderActionState();
}

function renderPayments() {
  const payable = state.invoices.filter((invoice) => Number(invoice.dueAmount || 0) > 0.009);
  if (payable.length === 0) {
    paymentTableBody.innerHTML = `<tr><td colspan="7">No pending payments.</td></tr>`;
    syncResponsiveTables();
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
  syncResponsiveTables();
}

function renderRecurringTemplates() {
  if (!isAdmin()) {
    recurringTableBody.innerHTML = "";
    syncResponsiveTables();
    return;
  }

  if (state.recurringTemplates.length === 0) {
    recurringTableBody.innerHTML = `<tr><td colspan="6">No recurring templates yet.</td></tr>`;
    syncResponsiveTables();
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
  syncResponsiveTables();
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
  syncResponsiveTables();
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

async function refreshInvoiceDashboardViews() {
  await Promise.all([loadInvoices(), loadReport()]);
  renderInvoices();
  renderPayments();
  renderOverview();
  renderReports();
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

  renderCurrentUserChip();
  applyRoleVisibility();

  loginView.classList.add("hidden");
  workspaceView.classList.remove("hidden");

  await refreshBaseData();
  updateLayoutMetrics();
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
    renderCurrentUserChip();
    applyRoleVisibility();
    loginView.classList.add("hidden");
    workspaceView.classList.remove("hidden");
    await refreshBaseData();
    updateLayoutMetrics();
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

async function submitInvoice(options = {}) {
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

  const createdInvoice = await requestJson("/api/invoices", {
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
  if (options.shareAfterCreate && createdInvoice?.id) {
    await shareInvoice(createdInvoice.id);
  }
  return createdInvoice;
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

function emailInvoice(invoiceId) {
  const invoice = state.invoices.find((entry) => entry.id === Number(invoiceId));
  if (!invoice) {
    setStatus("Invoice not found.", true);
    return;
  }

  const customerEmail = String(invoice.customer?.email || "").trim();
  if (!customerEmail) {
    setStatus("Selected invoice customer has no email address.", true);
    return;
  }

  const companyName = state.settings?.companyName || "InvoiceFlow Pro";
  const subject = `Invoice ${invoice.invoiceNumber || `#${invoice.id}`} from ${companyName}`;
  const body = [
    `Hello ${invoice.customer?.name || "Customer"},`,
    "",
    `Please find invoice ${invoice.invoiceNumber || `#${invoice.id}`} for ${formatCurrency(invoice.total)}.`,
    `Outstanding amount: ${formatCurrency(invoice.dueAmount)}.`,
    "",
    "Attach the generated PDF from InvoiceFlow Pro before sending.",
    "",
    `Regards,`,
    companyName
  ].join("\n");

  window.location.href = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  setStatus("Email draft opened.");
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

function withLatestInvoice(callback, emptyMessage) {
  const latestInvoice = getLatestInvoice();
  if (!latestInvoice) {
    setStatus(emptyMessage, true);
    return null;
  }

  callback(latestInvoice);
  return latestInvoice;
}

async function handleHeaderSendAction() {
  const activeTab = document.querySelector(".nav-link.active[data-tab]")?.dataset.tab || "overview";
  const canSubmitDraft =
    activeTab === "invoices" &&
    Number(invoiceCustomerSelect.value) > 0 &&
    getInvoiceRowsPayload().length > 0;

  if (canSubmitDraft) {
    await submitInvoice({ shareAfterCreate: true });
    return;
  }

  const latestInvoice = getLatestInvoice();
  if (!latestInvoice) {
    setStatus("Create an invoice first to send it.", true);
    return;
  }

  await shareInvoice(latestInvoice.id);
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

async function applyInvoiceFilterState(nextFilters, successMessage) {
  state.invoiceFilters = {
    ...state.invoiceFilters,
    ...nextFilters
  };
  syncInvoiceFilterControls();
  await refreshInvoiceDashboardViews();
  setStatus(successMessage);
}

async function resetInvoiceFilterState(successMessage) {
  state.invoiceFilters = {
    query: "",
    status: "all",
    customerId: "",
    dateFrom: "",
    dateTo: ""
  };
  syncInvoiceFilterControls();
  await refreshInvoiceDashboardViews();
  setStatus(successMessage);
}

async function handleInvoiceActionButton(button) {
  const invoiceId = Number(button.dataset.invoiceId);
  const action = button.dataset.action;

  if (!Number.isInteger(invoiceId) || invoiceId <= 0 || !action) {
    return;
  }

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
  setSidebarOpen(!workspaceView.classList.contains("sidebar-open"));
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
  setActiveTab("invoices");
  try {
    await applyInvoiceFilterState({ query }, query ? `Showing results for "${query}".` : "Search cleared.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

window.addEventListener("resize", () => {
  updateLayoutMetrics();
  if (window.innerWidth > 1080) {
    closeMobileSidebar();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileSidebar();
  }
});

previewModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.invoicePreviewMode = button.dataset.previewMode || "preview";
    updateInvoicePreview();
  });
});

previewActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.previewAction === "print") {
      window.print();
    }
  });
});

headerDownloadInvoiceButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      downloadInvoice(invoice.id);
    },
    "Create at least one invoice before downloading a PDF."
  );
});

headerEmailInvoiceButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      shareInvoice(invoice.id);
    },
    "Create at least one invoice before sharing it."
  );
});

headerSaveInvoiceButton?.addEventListener("click", () => {
  if (invoiceForm?.requestSubmit) {
    invoiceForm.requestSubmit();
    return;
  }
  invoiceSubmitButton?.click();
});

headerCreateInvoiceButton?.addEventListener("click", () => {
  setActiveTab("invoices");
  invoiceCustomerSelect?.focus();
});

overviewExportButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      downloadInvoice(invoice.id);
    },
    "Create at least one invoice before exporting a PDF."
  );
});

overviewShareWorkspaceButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      shareInvoice(invoice.id);
    },
    "Create at least one invoice before sharing it."
  );
});

overviewOpenInvoicesButton?.addEventListener("click", () => {
  setActiveTab("invoices");
});

overviewQuickShareButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      shareInvoice(invoice.id);
    },
    "Create at least one invoice before sharing it."
  );
});

overviewQuickDownloadButton?.addEventListener("click", () => {
  withLatestInvoice(
    (invoice) => {
      downloadInvoice(invoice.id);
    },
    "Create at least one invoice before downloading a PDF."
  );
});

overviewQuickCreateButton?.addEventListener("click", () => {
  setActiveTab("invoices");
  invoiceCustomerSelect?.focus();
});

overviewQuickSettingsButton?.addEventListener("click", () => {
  setActiveTab("settings");
});

headerSendInvoiceButton?.addEventListener("click", async () => {
  try {
    await handleHeaderSendAction();
  } catch (error) {
    setStatus(error.message, true);
  }
});

invoiceCustomerSelect.addEventListener("change", updateInvoicePreview);
invoiceGstTypeSelect.addEventListener("change", updateInvoicePreview);
invoiceDueDaysInput.addEventListener("input", updateInvoicePreview);
invoiceDiscountInput.addEventListener("input", updateInvoicePreview);
invoiceShippingInput.addEventListener("input", updateInvoicePreview);
invoiceRoundoffInput.addEventListener("input", updateInvoicePreview);
invoiceNotesInput.addEventListener("input", updateInvoicePreview);

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
  try {
    await applyInvoiceFilterState(
      {
        query: filterQueryInput.value.trim(),
        status: filterStatusSelect.value,
        customerId: filterCustomerSelect.value,
        dateFrom: filterDateFromInput.value,
        dateTo: filterDateToInput.value
      },
      "Invoice filter applied."
    );
  } catch (error) {
    setStatus(error.message, true);
  }
});

clearInvoiceFiltersButton.addEventListener("click", async () => {
  try {
    await resetInvoiceFilterState("Invoice filter cleared.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

overviewFilterForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await applyInvoiceFilterState(
      {
        query: overviewFilterQueryInput?.value.trim() || "",
        status: overviewFilterStatusSelect?.value || "all",
        customerId: overviewFilterCustomerSelect?.value || "",
        dateFrom: overviewFilterDateFromInput?.value || "",
        dateTo: overviewFilterDateToInput?.value || ""
      },
      "Dashboard filters applied."
    );
  } catch (error) {
    setStatus(error.message, true);
  }
});

overviewClearFiltersButton?.addEventListener("click", async () => {
  try {
    await resetInvoiceFilterState("Dashboard filters cleared.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

overviewActiveFilters?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-clear-filter]");
  if (!button) {
    return;
  }

  const key = button.dataset.clearFilter;
  if (!key) {
    return;
  }

  try {
    if (key === "all") {
      await resetInvoiceFilterState("Dashboard filters cleared.");
      return;
    }

    await applyInvoiceFilterState(
      {
        [key]: key === "status" ? "all" : ""
      },
      "Dashboard filter updated."
    );
  } catch (error) {
    setStatus(error.message, true);
  }
});

invoiceTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action][data-invoice-id]");
  if (!button) {
    return;
  }

  try {
    await handleInvoiceActionButton(button);
  } catch (error) {
    setStatus(error.message, true);
  }
});

overviewInvoiceList?.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab-open]");
  if (tabButton?.dataset.tabOpen) {
    setActiveTab(tabButton.dataset.tabOpen);
    return;
  }

  const button = event.target.closest("button[data-action][data-invoice-id]");
  if (!button) {
    return;
  }

  try {
    await handleInvoiceActionButton(button);
  } catch (error) {
    setStatus(error.message, true);
  }
});

overviewActivityList?.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-tab-open]");
  if (tabButton?.dataset.tabOpen) {
    setActiveTab(tabButton.dataset.tabOpen);
    return;
  }

  const button = event.target.closest("button[data-action][data-invoice-id]");
  if (!button) {
    return;
  }

  try {
    await handleInvoiceActionButton(button);
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
  applyTheme();
  renderCurrentUserChip();
  updateHeaderNavState("overview");
  sidebarToggleButton?.setAttribute("aria-controls", "tab-nav");
  sidebarToggleButton?.setAttribute("aria-expanded", "false");
  createLineItemRow(lineItemsContainer);
  createRecurringItemRow(recurringItemsContainer);
  syncResponsiveTables();
  syncInvoiceFilterControls();
  updateLayoutMetrics();

  const today = new Date().toISOString().slice(0, 10);
  if(recurringStartDateInput) {
    recurringStartDateInput.value = today;
  }

  await restoreSession();
}

init();
