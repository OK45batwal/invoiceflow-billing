<div align="center">
  <br />
  <img src="public/favicon.svg" width="100" alt="InvoiceFlow Logo" />
  
  # ⚡ InvoiceFlow
  
  ### GST & Non-GST Billing System for Modern Businesses
  
  *A high-performance, split-screen billing registry with offline capabilities and tax analytics.*
  
  <p align="center">
    <a href="https://invoiceflow-billing.okbatwal.workers.dev">
      <img src="https://img.shields.io/badge/Live%20Demo-View%20Site-6366f1?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Live Demo">
    </a>
    <a href="https://github.com/OK45batwal/invoiceflow-billing">
      <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
    </a>
    <a href="https://github.com/OK45batwal/invoiceflow-billing">
      <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind v4">
    </a>
    <a href="https://github.com/OK45batwal/invoiceflow-billing">
      <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
    </a>
    <a href="https://github.com/OK45batwal/invoiceflow-billing">
      <img src="https://img.shields.io/badge/Supabase-FF6600?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
    </a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/github/last-commit/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="Last Commit">
    <img src="https://img.shields.io/github/repo-size/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="Repo Size">
    <img src="https://img.shields.io/github/license/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="License">
  </p>
</div>

---

## 📸 Interactive Visual Gallery

<table border="0">
  <tr>
    <td width="50%">
      <p align="center"><b>📊 Asymmetrical Bento Dashboard</b></p>
      <img src="public/screenshots/dashboard_v2.png" alt="Bento Grid Dashboard" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
    <td width="50%">
      <p align="center"><b>🧾 Split-Screen Live Editor</b></p>
      <img src="public/screenshots/invoice_editor_v2.png" alt="Split-Screen Invoice Creator" style="border-radius: 8px; border: 1px solid #e2e8f0;" />
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <p align="center"><b>🗄️ Directories & Analytics Catalog</b></p>
      <div align="center">
        <img src="public/screenshots/customers_v2.png" width="32%" alt="Customers" style="border-radius: 6px; margin-right: 1%;" />
        <img src="public/screenshots/products_v2.png" width="32%" alt="Products" style="border-radius: 6px; margin-right: 1%;" />
        <img src="public/screenshots/reports_v2.png" width="32%" alt="Reports" style="border-radius: 6px;" />
      </div>
    </td>
  </tr>
</table>

---

## ✨ Features Highlight

### 🧾 Billing & Invoice Generation
* **Live A4 Preview**: Split-screen design updates a print-ready A4 stylesheet in real-time as you enter items, prices, and discounts.
* **Dual Profiles**: Manage distinct **GST** and **Non-GST** profiles.
* **Smart Tax Calculations**: Automated CGST, SGST, IGST, and round-offs based on inter-state supply rules.
* **UPI QR Codes**: Generates payment QR codes in real-time on Non-GST cash memos.

### 📉 Business Intelligence & Inventory
* **Bento Grid Dashboard**: Visual summary of turnover, tax payable, outstanding dues, and sales metrics using dynamic charts.
* **Smart Products Catalog**: Color-coded stock level indicators and quick-search cataloging with HSN mapping.
* **Customer Directory**: Complete logs of billing history, locations, and mobile directory mappings.
* **GSTR-1 Tax Analytics**: Generate formatted sales ledgers and GSTR-1 summaries.

### 🛡️ Enterprise Performance & Reliability
* **Database Circuit Breaker**: Custom `dbBreaker` protects connection pools by fast-failing into offline mode if the DB experiences lag or downtime.
* **Batch Writes Optimizer**: Minimizes network latency through optimized transaction bundling.
* **Backward Compatible Restore**: Support for importing legacy JSON backup strings and objects.

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="40" alt="React 19" />
      <br />
      <b>React 19</b>
    </td>
    <td align="center" width="25%">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="40" alt="TypeScript" />
      <br />
      <b>TypeScript</b>
    </td>
    <td align="center" width="25%">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="40" alt="Tailwind v4" />
      <br />
      <b>Tailwind v4</b>
    </td>
    <td align="center" width="25%">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="40" alt="Vite 8" />
      <br />
      <b>Vite 8</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="40" alt="Express" />
      <br />
      <b>Express.js</b>
    </td>
    <td align="center">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="40" alt="Node.js" />
      <br />
      <b>Node.js</b>
    </td>
    <td align="center">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg" width="40" alt="Supabase" />
      <br />
      <b>Supabase DB</b>
    </td>
    <td align="center">
      <img src="https://img.icons8.com/color/48/cloudflare.png" width="40" alt="Cloudflare Workers" />
      <br />
      <b>Cloudflare Assets</b>
    </td>
  </tr>
</table>

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+
- npm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/OK45batwal/invoiceflow-billing.git
cd invoiceflow-billing
npm install
npm --prefix server install
```

### 2. Configure Environment variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Run Development Servers
```bash
npm run dev
```
* **Frontend Client**: [http://localhost:5173](http://localhost:5173) (or printed port)
* **Backend Registry API**: [http://localhost:5001](http://localhost:5001)

---

## ☁️ Production Deployment

InvoiceFlow is fully optimized to compile and deploy to **Cloudflare Workers**:

```bash
npx wrangler deploy
```

Set secrets for your production Supabase database instance:
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

---

<div align="center">
  <p>
    <a href="https://invoiceflow-billing.okbatwal.workers.dev">🌐 Live Deployment</a>
    ·
    <a href="https://github.com/OK45batwal/invoiceflow-billing/issues">🐛 Report Bug</a>
    ·
    <a href="https://github.com/OK45batwal/invoiceflow-billing/issues">✨ Feature Request</a>
  </p>
  <p>Built with ❤️ for Indian businesses</p>
</div>
