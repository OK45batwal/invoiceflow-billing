
const loginView = document.querySelector("#login-view");
const workspaceView = document.querySelector("#workspace-view");
const loginForm = document.querySelector("#login-form");
const logoutButton = document.querySelector("#logout-btn");
const currentUserNode = document.querySelector("#current-user");
const statusNode = document.querySelector("#status");

const tabNav = document.querySelector("#tab-nav");
const tabButtons = [...document.querySelectorAll(".tab")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const adminOnlyNodes = [...document.querySelectorAll(".admin-only")];

const customerForm = document.querySelector("#customer-form");
const customerTableBody = document.querySelector("#customer-table-body");

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

const metricRevenue = document.querySelector("#metric-revenue");
const metricOutstanding = document.querySelector("#metric-outstanding");
const metricOverdue = document.querySelector("#metric-overdue");
const metricBase = document.querySelector("#metric-base");
const overviewRecentBody = document.querySelector("#overview-recent-body");

const drawer = document.querySelector("#drawer");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", Boolean(isError));
  statusNode.classList.add("show");
  clearTimeout(state.statusTimer);
  state.statusTimer = setTimeout(() => {
    statusNode.classList.remove("show");
  }, 2600);
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
  drawer.classList.remove("hidden");
}

function closeDrawer() {
  drawer.classList.add("hidden");
  drawerBody.innerHTML = "";
}

function setActiveTab(tabId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabId);
  });
}

function applyRoleVisibility() {
  const admin = isAdmin();
  adminOnlyNodes.forEach((node) => {
    node.classList.toggle("hidden", !admin);
  });

  if (!admin) {
    const activeTab = tabButtons.find((button) => button.classList.contains("active"));
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
  row.className = "line-item";
  row.innerHTML = `
    <label>
      Product
      <select class="row-product" required>
        ${buildProductOptions(initial.productId)}
      </select>
    </label>
    <label>
      Qty
      <input class="row-qty" type="number" min="0.01" step="0.01" value="${initial.quantity || 1}" required />
    </label>
    <label>
      Line Discount
      <input class="row-discount" type="number" min="0" step="0.01" value="${initial.lineDiscount || 0}" />
    </label>
    <p class="meta">
      Taxable: <strong class="row-taxable">${formatCurrency(0)}</strong><br />
      Tax: <strong class="row-tax">${formatCurrency(0)}</strong><br />
      Total: <strong class="row-total">${formatCurrency(0)}</strong>
    </p>
    <button type="button" class="table-btn remove-btn row-remove">Remove</button>
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
  row.className = "line-item";
  row.innerHTML = `
    <label>
      Product
      <select class="row-product" required>
        ${buildProductOptions(initial.productId)}
      </select>
    </label>
    <label>
      Qty
      <input class="row-qty" type="number" min="0.01" step="0.01" value="${initial.quantity || 1}" required />
    </label>
    <label>
      Line Discount
      <input class="row-discount" type="number" min="0" step="0.01" value="${initial.lineDiscount || 0}" />
    </label>
    <p class="meta">Repeats on schedule with current product tax settings.</p>
    <button type="button" class="table-btn remove-btn row-remove">Remove</button>
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

  invoicePreview.innerHTML = `
    <div><strong>Invoice Type:</strong> ${invoiceTypeText}</div>
    <div><strong>Taxable:</strong> ${formatCurrency(subtotalTaxable)}</div>
    <div><strong>Line Discount:</strong> ${formatCurrency(lineDiscountTotal)}</div>
    <div><strong>CGST:</strong> ${formatCurrency(cgstTotal)}</div>
    <div><strong>SGST:</strong> ${formatCurrency(sgstTotal)}</div>
    <div><strong>IGST:</strong> ${formatCurrency(igstTotal)}</div>
    <div><strong>Tax Total:</strong> ${formatCurrency(taxTotal)}</div>
    <div><strong>Invoice Discount:</strong> ${formatCurrency(invoiceDiscount)}</div>
    <div><strong>Shipping:</strong> ${formatCurrency(shipping)}</div>
    <div><strong>Round Off:</strong> ${formatCurrency(roundOff)}</div>
    <div><strong>Final Total:</strong> ${formatCurrency(finalTotal)}</div>
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
function renderOverview() {
  const report = state.report;
  metricRevenue.textContent = formatCurrency(report?.totals?.revenue || 0);
  metricOutstanding.textContent = formatCurrency(report?.totals?.outstanding || 0);
  metricOverdue.textContent = String(report?.totals?.overdueInvoices || 0);
  metricBase.textContent = `${state.customers.length} / ${state.products.length}`;

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
        <td><button class="table-btn secondary-btn" data-action="statement" data-customer-id="${customer.id}">Statement</button></td>
      </tr>
    `
    )
    .join("");
}

function renderProducts() {
  if (state.products.length === 0) {
    productListNode.innerHTML = `<p class="helper-text">No products yet.</p>`;
    return;
  }

  productListNode.innerHTML = state.products
    .map(
      (product) => `
      <article class="product-item">
        <div>
          <p class="name">${escapeHtml(product.name)}</p>
          <p class="meta">${escapeHtml(product.hsnSac || "-")} | ${escapeHtml(product.pricingModel)} | ${formatCurrency(product.price)} | GST ${Number(product.taxRate)}%</p>
        </div>
        ${
          isAdmin()
            ? `<button class="table-btn remove-btn" data-action="remove-product" data-product-id="${product.id}">Remove</button>`
            : ""
        }
      </article>
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
          <div class="table-actions">
            <button class="table-btn share-btn" data-action="share-invoice" data-invoice-id="${invoice.id}">Share</button>
            <button class="table-btn download-btn" data-action="download-invoice" data-invoice-id="${invoice.id}">PDF</button>
            <button class="table-btn secondary-btn" data-action="pay-invoice" data-invoice-id="${invoice.id}">Pay</button>
            ${
              isAdmin()
                ? `<button class="table-btn remove-btn" data-action="remove-invoice" data-invoice-id="${invoice.id}">Delete</button>`
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
        <td><button class="table-btn secondary-btn" data-action="pay-invoice" data-invoice-id="${invoice.id}">Add Payment</button></td>
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
        <td>${template.active ? '<span class="pill paid">active</span>' : '<span class="pill unpaid">paused</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="table-btn secondary-btn" data-action="toggle-recurring" data-recurring-id="${template.id}" data-active="${template.active}">
              ${template.active ? "Pause" : "Activate"}
            </button>
            <button class="table-btn remove-btn" data-action="remove-recurring" data-recurring-id="${template.id}">Delete</button>
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
      <div class="cards-grid" style="margin-bottom:0.8rem;">
        <article class="metric-card"><p>Total Billed</p><h3>${formatCurrency(statement.summary?.totalBilled || 0)}</h3></article>
        <article class="metric-card"><p>Total Paid</p><h3>${formatCurrency(statement.summary?.totalPaid || 0)}</h3></article>
        <article class="metric-card"><p>Total Due</p><h3>${formatCurrency(statement.summary?.totalDue || 0)}</h3></article>
        <article class="metric-card"><p>Overdue</p><h3>${statement.summary?.overdueInvoices || 0}</h3></article>
      </div>
      <h3 style="margin-bottom:0.35rem;">Invoices</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>No.</th><th>Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead>
          <tbody>${invoiceRows || `<tr><td colspan="6">No invoices.</td></tr>`}</tbody>
        </table>
      </div>
      <h3 style="margin:0.8rem 0 0.35rem;">Payments</h3>
      <div class="table-wrap">
        <table>
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
  const pdfUrl = `${window.location.origin}${pdfPath}?token=${encodeURIComponent(state.token)}`;

  if (navigator.share && typeof File !== "undefined") {
    try {
      const response = await fetch(pdfPath, {
        headers: { Authorization: `Bearer ${state.token}` }
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
      headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
      throw new Error("Unable to download PDF.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.invoiceNumber || `invoice-${invoiceId}`}.pdf`;
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
  setStatus("Settings saved.");
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

tabNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tab]");
  if (!button || button.classList.contains("hidden")) {
    return;
  }
  setActiveTab(button.dataset.tab);
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

  try {
    await requestJson("/api/customers", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    customerForm.reset();
    await refreshBaseData();
    setStatus("Customer saved.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

customerTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='statement'][data-customer-id]");
  if (!button) {
    return;
  }
  await openCustomerStatement(Number(button.dataset.customerId));
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

drawerCloseButton.addEventListener("click", closeDrawer);
drawer.addEventListener("click", (event) => {
  if (event.target === drawer) {
    closeDrawer();
  }
});

async function init() {
  createLineItemRow(lineItemsContainer);
  createRecurringItemRow(recurringItemsContainer);

  const today = new Date().toISOString().slice(0, 10);
  recurringStartDateInput.value = today;

  await restoreSession();
}

init();
