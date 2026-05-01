# SPEC.md - Project Specification

> **Status**: `FINALIZED`
>
> Brownfield baseline captured for InvoiceFlow Pro on 2026-03-31.

## Vision

InvoiceFlow Pro is a local-first billing app for small businesses that need fast invoice creation, GST-aware billing, PDF export, role-based access, and simple deployment without taking on the weight of a full ERP or SaaS platform.

## Goals

1. **Run daily billing in one place** - Manage customers, products, invoices, payments, recurring templates, and company settings from a single app.
2. **Support Indian invoicing workflows** - Handle GST and non-GST billing, financial-year invoice numbering, HSN/SAC details, and printable PDF invoices with UPI and bank details.
3. **Keep operations lightweight** - Run locally by default, with straightforward deployment to low-cost hosting and a storage model that works with JSON first and SQLite when needed.

## Non-Goals (Out of Scope)

- Multi-tenant SaaS account management
- Online payment gateway integration or checkout flows
- Full accounting, bookkeeping, or statutory filing workflows
- Native Android or iOS apps

## Users

Primary users are small-business owners, billing admins, and staff operators.

- `admin` users manage settings, security, recurring templates, backups, and destructive actions.
- `staff` users create invoices, add payments, and handle day-to-day billing work.

## Constraints

- Existing stack must remain Node.js + Express + vanilla HTML/CSS/JS.
- The app must work with local JSON storage by default.
- SQLite support is optional and depends on a Node.js runtime with built-in `node:sqlite` support.
- Authentication remains simple role-based token/session auth rather than an external identity provider.
- The app should stay usable on local machines and simple hosted platforms such as Render.

## Success Criteria

- [x] Users can authenticate as `admin` or `staff` and reach the correct app flows.
- [x] Users can manage customers, products, invoices, payments, recurring templates, and settings through the UI and API.
- [x] The system can produce invoice PDFs with billing details, totals, and payment information.
- [x] The app can run locally with JSON storage and can be configured for SQLite-backed persistence when needed.

## User Stories

### As an admin

- I want to configure company billing settings, manage users, and control backup or destructive actions
- So that the business can operate safely from one shared system

### As billing staff

- I want to create invoices quickly, add payments, and look up customer history
- So that day-to-day billing work stays fast and accurate

### As the business owner

- I want exportable PDFs, recurring billing, and simple deployment
- So that invoicing stays reliable without adopting a heavyweight platform

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| Express API for auth, billing, reports, settings, and backup flows | Must-have | Current backend contract lives in `src/server.js` |
| Centralized billing domain logic and persistence | Must-have | Current implementation lives in `src/store.js` |
| Server-side PDF generation for invoices | Must-have | Current implementation lives in `src/invoicePdf.js` |
| Mobile-aware UI for login and billing workflows | Should-have | Current UI lives under `public/` |
| Low-friction local and hosted deployment | Should-have | Render/local workflows documented in `README.md` |

---

*Last updated: 2026-03-31*
