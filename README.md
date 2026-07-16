<div align="center">
  <h1>⚡ InvoiceFlow</h1>
  <p><strong>GST & Non-GST Billing & Registry System</strong></p>

  <p>
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
    <a href="https://github.com/OK45batwal/invoiceflow-billing">
      <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/github/last-commit/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="Last Commit">
    <img src="https://img.shields.io/github/repo-size/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="Repo Size">
    <img src="https://img.shields.io/github/license/OK45batwal/invoiceflow-billing?style=flat-square&color=6366f1" alt="License">
  </p>
</div>

---

## 📸 Screenshots Gallery

<p align="center">
  <img src="public/screenshots/dashboard_v2.png" width="49%" alt="Bento Grid Dashboard" />
  <img src="public/screenshots/invoice_editor_v2.png" width="49%" alt="Split-Screen Invoice Creator" />
</p>

<p align="center">
  <img src="public/screenshots/customers_v2.png" width="32%" alt="Hybrid Customers Directory" />
  <img src="public/screenshots/products_v2.png" width="32%" alt="Hybrid Inventory Catalog" />
  <img src="public/screenshots/reports_v2.png" width="32%" alt="Reports & Tax Analytics" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Bento Grid Dashboard** | Asymmetrical dashboard with live turnover metrics, SVG charts, and quick-action shortcuts |
| 🧾 **Split-Screen Invoice Creator** | Real-time A4 print preview alongside the form — GST & Non-GST, inter-state & intra-state |
| 💼 **Dual Business Profiles** | Manage separate GST and Non-GST profiles with full banking and address details |
| 👥 **Customer Directory** | Searchable table with filters, state indicators, and billing history |
| 📦 **Product Catalog** | Track SKU, HSN codes, pricing, GST brackets, and stock levels with color-coded alerts |
| 📈 **Reports & Tax Analytics** | Sales ledgers, GSTR-1 summaries, and daily/monthly aggregation views |
| 💾 **Offline Backup & Restore** | One-click JSON export/import of all local data for migration or safekeeping |
| 🌓 **Dark Mode** | Full theme toggle with system preference detection |

---

## 🛠️ Tech Stack

<table>
  <tr>
    <th colspan="2" align="center">Frontend</th>
    <th colspan="2" align="center">Backend & Infra</th>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="32" /><br><b>React 19</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="32" /><br><b>TypeScript</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="32" /><br><b>Express.js</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="32" /><br><b>Node.js</b></td>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="32" /><br><b>Tailwind v4</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="32" /><br><b>Vite 8</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg" width="32" /><br><b>Supabase</b></td>
    <td align="center"><img src="https://img.icons8.com/color/48/cloudflare.png" width="32" /><br><b>Cloudflare Workers</b></td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/OK45batwal/invoiceflow-billing.git
cd invoiceflow-billing
npm install
npm --prefix server install
```

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5001
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Run

```bash
npm run dev
```

- **Frontend**: [http://localhost:5174](http://localhost:5174)
- **API**: [http://localhost:5001](http://localhost:5001)

---

## ☁️ Deploy

This project is configured for **Cloudflare Workers + Assets**:

```bash
npx wrangler deploy
```

Set secrets for production:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

---

<div align="center">
  <p>
    <a href="https://invoiceflow-billing.okbatwal.workers.dev">🌐 Live Demo</a>
    ·
    <a href="https://github.com/OK45batwal/invoiceflow-billing/issues">🐛 Report Bug</a>
    ·
    <a href="https://github.com/OK45batwal/invoiceflow-billing/issues">✨ Request Feature</a>
  </p>
  <p>Built with ❤️ for Indian businesses</p>
</div>
