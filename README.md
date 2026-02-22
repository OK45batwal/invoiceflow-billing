# InvoiceFlow Pro

A local-first billing app with:

- GST-ready invoicing (CGST/SGST/IGST, HSN/SAC, inclusive/exclusive tax)
- Separate invoice type support: `With GST` and `Without GST`
- Financial year invoice numbering (`PREFIX-YYYY-YY-0001`)
- Payment tracking (`unpaid`, `partial`, `paid`, `overdue`)
- PDF invoices with UPI QR + bank details
- Discounts, shipping, and round-off support
- Customer statements
- Recurring invoice templates (weekly/monthly)
- Invoice search and filters
- Reports dashboard
- Role-based login (`admin`, `staff`)

## Tech Stack

- Node.js
- Express
- Vanilla HTML/CSS/JS frontend
- JSON file storage at `data/store.json`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

PowerShell note (Windows): if you get `npm.ps1 cannot be loaded`, run:

```powershell
npm.cmd install
npm.cmd run dev
```

3. Open:

`http://localhost:3000`

## Permanent Hosting (Production-Style on Render)

This repo now includes `render.yaml` for a persistent production deploy.

1. Push this project to GitHub.
2. In Render, choose **New +** -> **Blueprint** and select your repo.
3. Keep the generated service `invoiceflow-pro` and deploy.
4. Set strong values for:

```bash
DEFAULT_ADMIN_PASSWORD
DEFAULT_STAFF_PASSWORD
```

5. Open your Render URL on mobile (for example: `https://invoiceflow-pro.onrender.com`).

Notes:
- Persistent data is stored on Render disk path `/var/data` via `DATA_DIR`.
- Render persistent disks require a paid plan (the blueprint uses `starter`).
- Seed passwords are used when the store file is created for the first time.

## Login

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

`admin` can manage settings, recurring templates, and destructive actions.
`staff` can create invoices and add payments.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id/statement`
- `GET /api/products`
- `POST /api/products`
- `DELETE /api/products/:id`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `GET /api/invoices/:id/pdf`
- `POST /api/invoices`
- `POST /api/invoices/:id/payments`
- `DELETE /api/invoices/:id`
- `GET /api/recurring`
- `POST /api/recurring`
- `PUT /api/recurring/:id`
- `DELETE /api/recurring/:id`
- `POST /api/recurring/run`
- `GET /api/reports/summary`
- `GET /api/settings`
- `PUT /api/settings`
