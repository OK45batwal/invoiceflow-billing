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

## Hosting On Render (No Payment)

This repo includes `render.yaml` configured for Render free web service.

1. Push this project to GitHub.
2. In Render, choose **New +** -> **Blueprint** and select your repo.
3. Deploy service `invoiceflow-pro` (free plan).
4. Set strong values for:

```bash
DEFAULT_ADMIN_PASSWORD
DEFAULT_STAFF_PASSWORD
```

5. Open your Render URL on mobile (for example: `https://invoiceflow-pro.onrender.com`).

Notes:
- Free plan works without adding a paid persistent disk.
- Data is not permanently guaranteed on free plan (it can reset on redeploy/restart).
- Seed passwords are used when the store file is created for the first time.
- If users are still on default `admin123` / `staff123`, setting `DEFAULT_ADMIN_PASSWORD` / `DEFAULT_STAFF_PASSWORD` now will auto-migrate those default accounts on next deploy.

If you need fully permanent storage later, move to a paid plan and attach a disk.

## Login

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

`admin` can manage settings, recurring templates, and destructive actions.
`staff` can create invoices and add payments.
After login, go to **Overview -> Account Security** to change passwords.

## API Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/password`
- `GET /api/users`
- `PUT /api/users/:id/password`
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
