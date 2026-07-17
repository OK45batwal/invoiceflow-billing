# Ponytail Audit — Over-engineering Findings

Ranked biggest cut first.

| Tag | What to cut | Replacement | File |
|-----|------------|-------------|------|
| delete | `html2canvas` dependency — not imported anywhere in src/ | Remove from package.json | package.json:22 |
| delete | `tailwind.config.js` (43 lines) — Tailwind v4 uses @theme in CSS; this v3 config is dead/ignored | Delete file | tailwind.config.js |
| delete | `framer-motion` dependency — 4 trivial fade/scale animations (Dialog, ShareDialog, ToastContainer, Dashboard) | Replace with CSS transitions/animations | src/components/ui/Dialog.tsx, ToastContainer.tsx, ShareDialog.tsx, Dashboard.tsx |
| delete | CircuitBreaker class (129 lines) in db.js — hand-rolled circuit breaker for single-user billing app | Replace with `Promise.race(timeout, fetch())` | server/db.js:52-127 |
| shrink | `res.json` monkeypatch in server.js (remaps 500→503) | Set `res.status(503)` directly at source | server/server.js:52-62 |
| delete | `.glass` CSS utility (12 lines) — used in one component (ToastContainer) | Inline Tailwind classes | src/index.css:103-115 |
| delete | Custom scrollbar CSS (15 lines) | Native scrollbars work fine | src/index.css:87-100 |
| delete | `@custom-variant dark` (1 line) — built-in in Tailwind v4 | Remove | src/index.css:3 |
| yagni | `GSTInvoice.tsx` / `NonGSTInvoice.tsx` — 6-line wrappers for InvoiceEditor | Inline type prop into route in App.tsx | src/pages/GSTInvoice.tsx, NonGSTInvoice.tsx |
| shrink | api.ts offline localStorage fallback (~200 lines of draft recovery) | Show "server unreachable" toast, bail | src/services/api.ts |
| shrink | AppContext optimistic update pattern (~250 lines, 9 repetitions with reconcile/rollback) | Show spinner, call API, update on response | src/context/AppContext.tsx |
| yagni | `activeCustomerCreations` ref (Map of Promises for inline customer dedup) | Create customer first, then invoice | src/context/AppContext.tsx:60, 289-303 |
| shrink | `isCloudflare` runtime detection (dual deployment branching) | Pick one deployment (Docker or Worker) | server/server.js:11 |
| delete | `server/wrangler.toml` — duplicate legacy wrangler config | Delete file | server/wrangler.toml |

**Net: ~-600 lines, -3 deps (html2canvas, framer-motion, tailwind.config.js devDep), -2 files (GSTInvoice.tsx, NonGSTInvoice.tsx), -2 configs (tailwind.config.js, server/wrangler.toml)**
