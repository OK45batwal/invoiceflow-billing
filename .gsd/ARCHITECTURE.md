# ARCHITECTURE.md - Billing App Baseline

> Brownfield architecture snapshot captured on 2026-03-31.

## Overview

InvoiceFlow Pro is a single-process Node.js application that serves a static frontend and a REST API from the same Express server. Business rules, validation, and persistence live in a central store module, while invoice PDF generation happens on the server. Data is persisted to JSON by default, with optional SQLite storage for environments that support `node:sqlite`.

```text
+-------------------+
| Browser UI        |
| public/*.html/css |
| public/app.js     |
+---------+---------+
          |
          v
+-------------------+
| Express server    |
| src/server.js     |
+-----+--------+----+
      |        |
      |        +-------------------+
      v                            |
+-------------------+      +-------+--------+
| Auth + sessions   |      | PDF generation |
| src/auth.js       |      | src/invoicePdf |
+-------------------+      +----------------+
      |
      v
+-------------------+
| Billing store     |
| src/store.js      |
+-----+-------------+
      |
      v
+-------------------+
| data/store.json   |
| data/store.sqlite |
+-------------------+
```

## Components

### Frontend shell
- **Purpose:** Render the billing UI, login flow, and responsive layouts, then call the REST API from the browser.
- **Location:** `public/`
- **Key files:** `public/index.html`, `public/app.js`, `public/styles.css`, `public/mobile.css`, `public/login.html`, `public/login.css`
- **Pattern:** Static multi-screen frontend with client-side state and API-driven updates

### HTTP and API layer
- **Purpose:** Define routes, validate auth and role access, and translate HTTP requests into store operations.
- **Location:** `src/server.js`
- **Pattern:** Express route handlers with thin controller logic

### Auth and session layer
- **Purpose:** Hash passwords, verify credentials, create bearer-token sessions, and sanitize exposed user objects.
- **Location:** `src/auth.js`
- **Pattern:** In-memory session map with simple role-based authorization

### Billing domain and persistence layer
- **Purpose:** Own the application state, migration helpers, validation, invoice calculations, recurring execution, reporting, and persistence.
- **Location:** `src/store.js`
- **Pattern:** Centralized service module combining business rules and storage operations

### Invoice PDF renderer
- **Purpose:** Convert invoice and settings data into PDF buffers that include totals and payment details.
- **Location:** `src/invoicePdf.js`
- **Pattern:** Server-side document rendering

### Persistence
- **Purpose:** Store application data locally in either JSON or SQLite form.
- **Location:** `data/store.json`, `data/store.sqlite`
- **Pattern:** JSON by default, SQLite as an opt-in runtime mode

## Data Flow

1. The browser loads static assets from the Express server.
2. The user authenticates through `/api/auth/login` and receives a bearer token.
3. The frontend sends authenticated requests to billing endpoints in `src/server.js`.
4. Route handlers apply auth and role checks, then delegate to `src/store.js`.
5. The store module reads or writes JSON or SQLite-backed state and returns hydrated domain objects.
6. PDF requests delegate to `src/invoicePdf.js`, which returns a generated buffer to the HTTP response.

## Technical Debt

- No automated test suite currently covers the main billing flows.
- `src/store.js` is a large monolithic module that mixes persistence, migration, validation, and domain rules.
- Session state is in-memory only, which is acceptable locally but fragile across restarts or multiple instances.
- The frontend is concentrated in large static files, which increases change risk and makes verification more manual.

## Conventions

**Naming:**
- ESM modules under `src/`
- Static assets under `public/`
- REST endpoints under `/api/*`

**Structure:**
- Backend route layer in `src/server.js`
- Shared domain and storage logic in `src/store.js`
- UI served directly from the same application process

---

*Last updated: 2026-03-31*
