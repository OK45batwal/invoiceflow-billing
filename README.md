# InvoiceFlow Pro

A billing app with:

- GST-ready invoicing (CGST/SGST/IGST, HSN/SAC, inclusive/exclusive tax)
- Separate invoice type support: `With GST` and `Without GST`
- Financial year invoice numbering (`PREFIX-YYYY-YY-0001`)
- Payment tracking (`unpaid`, `partial`, `paid`, `overdue`)
- PDF invoices with UPI QR and bank details
- Discounts, shipping, and round-off support
- Customer statements
- Recurring invoice templates (weekly/monthly)
- Invoice search and filters
- Reports dashboard
- Backup and restore (JSON)
- Email OTP login backed by Firebase Firestore

## Tech Stack

- Node.js
- Express
- Vanilla HTML/CSS/JS app UI
- React login screen
- Firestore for OTP users
- JSON or SQLite for billing data

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

## Local Configuration

Create `.env` from `.env.example`.

Firebase options:
- Production and Render: use `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
- Local development: you can alternatively use Google Application Default Credentials on your own machine

SMTP options:
- For real OTP email delivery, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`
- If SMTP is missing in local development, the app falls back to a development OTP response for testing

## Storage Options

Main billing data is stored separately from OTP users.

- Billing data: JSON by default
- Optional billing data mode: SQLite
- OTP users: Firebase Firestore collection `otpUsers`

SQLite mode:

```bash
STORAGE_DRIVER=sqlite
# Optional custom DB path:
# SQLITE_PATH=./data/store.sqlite
```

Notes:
- SQLite mode uses Node's built-in `node:sqlite` module, so use Node 22+ if you enable it.
- If `STORAGE_DRIVER=sqlite` is not set, the app uses JSON storage.

## Deployment on Render

This repo includes `render.yaml` for a Render Web Service.

### Render Checklist

1. Push this project to GitHub.
2. In Render, create a **Blueprint** service from the repo.
3. Confirm the service uses:
   - Build command: `npm install`
   - Start command: `npm start`
4. Attach a persistent disk mounted at `/var/data`.
5. Set the required environment variables.
6. Deploy and confirm `GET /api/health` returns `{"status":"ok"}`.
7. Open the app, request an OTP, and complete one login.

### Required Render Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | `my-billing-app` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `firebase-adminsdk-xxxxx@my-billing-app.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key with `\n` preserved | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | `true` for port 465, `false` for 587 | `false` |
| `SMTP_USER` | SMTP username | `you@gmail.com` |
| `SMTP_PASS` | SMTP password or app password | `your-app-password` |
| `SMTP_FROM` | Sender used for OTP emails | `InvoiceFlow Pro <you@gmail.com>` |
| `DEFAULT_OTP_ROLE` | Role for newly verified users | `admin` |
| `OTP_APP_NAME` | App name used in OTP emails | `InvoiceFlow Pro` |
| `NODE_ENV` | Runtime mode | `production` |
| `DATA_DIR` | Render disk mount path | `/var/data` |
| `STORAGE_DRIVER` | Billing data storage engine | `json` |

### Firebase Setup for Render

1. Create or open your Firebase project.
2. Enable Cloud Firestore.
3. Create the `(default)` Firestore database in Native mode.
4. Generate a Firebase service account key JSON.
5. Copy these values into Render:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

Notes:
- Local `gcloud auth application-default login` does not transfer to Render.
- Render production should use the `FIREBASE_*` values directly.
- OTP users are stored in Firestore collection `otpUsers`.

### SMTP Setup for Render

1. Configure an SMTP account.
2. For Gmail, use a Google app password.
3. Set all `SMTP_*` variables in Render.

Without SMTP, OTP delivery will fail in production.

### Persistent Storage on Render

- Customers, invoices, recurring templates, reports data, and app settings stay in the file-based store under `/var/data`.
- Firestore is used only for verified OTP users.

### Production Risks

- Missing `FIREBASE_*` values: OTP verification fails.
- Firestore API disabled or no `(default)` database: OTP user persistence fails.
- Missing `SMTP_*` values: OTP email sending fails.
- No persistent disk: main billing data is lost on reset or redeploy.

### Post-Deploy Test

1. Visit your Render URL.
2. Enter your email on the login page.
3. Request an OTP.
4. Confirm the OTP email arrives.
5. Verify the OTP and confirm the billing app opens.

## API Endpoints

- `GET /api/health`
- `POST /send-otp`
- `POST /verify-otp`
- `POST /api/auth/login` (deprecated, returns OTP migration message)
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
- `GET /api/backup`
- `POST /api/backup/restore`
