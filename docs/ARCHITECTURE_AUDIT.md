# ARCHITECTURE_AUDIT.md — Alnafar.store Rebuild

## Current Architecture

- **Backend**: Express.js monolith (`server.js` ~4000 lines)
- **Frontend**: React 18 SPA + Vite + Tailwind CSS
- **Database**: SQLite (dev) / Turso (prod) via `db-adapter.js`
- **Auth**: JWT with bcrypt, 7-day expiry
- **Deploy**: Vercel (serverless)

## Security Issues Fixed (Phase 2)

| Issue | Status |
|---|---|
| Hardcoded VAPID keys | FIXED — removed fallback defaults |
| JWT secret fallback `dev_secret_change_me` | FIXED — requires env var, random fallback in dev only |
| CORS wide open `cors()`` | FIXED — configurable allowed origins |
| Rate limiting only on login | FIXED — added to uploads, orders, AI, backup/restore |
| `express.json({ limit: '50mb' })` | FIXED — reduced to 5mb |
| Missing security headers | FIXED — added HSTS, Permissions-Policy |
| No requireAdmin on destructive endpoints | FIXED — added to delete/restore/settings |
| Settings endpoint leaking telegram_bot_token | FIXED — public endpoint returns safe fields only |

## Database Issues Fixed (Phase 3)

| Issue | Status |
|---|---|
| No database indexes | FIXED — added 15 performance indexes |
| No audit logging | FIXED — `audit_logs` table + API endpoint |
| No migration tracking | FIXED — `schema_migrations` table |
| Invoice numbering race condition | FIXED — mutex-protected `getDailyInvoiceNumber()` |

## Backend Issues Fixed (Phase 4)

| Issue | Status |
|---|---|
| Monolithic server.js | PARTIALLY FIXED — extracted middleware modules |
| Inline auth/rate-limit/audit code | FIXED — separate files in `middleware/` |

## Business Logic Fixed (Phase 5)

| Issue | Status |
|---|---|
| No order status transition validation | FIXED — enforced transition rules |
| No audit logging on financial ops | FIXED — added to payments, status changes |
| Settings update not audited | FIXED — added audit logging |

## Design System (Phase 6)

| Issue | Status |
|---|---|
| No unified design tokens | FIXED — comprehensive CSS custom properties |
| Inconsistent colors | FIXED — semantic color tokens |
| No status badges | FIXED — badge component classes |
| No button system | FIXED — btn variants |
| No loading states | FIXED — skeleton animation |
| No empty states | FIXED — empty-state component |
| No toast system | FIXED — toast notification styles |

## Remaining Work

### CRITICAL
- [ ] Invoice creation trusts frontend prices (should calculate server-side)
- [ ] No input validation library (Zod/Joi) on most endpoints
- [ ] No global error handler middleware

### HIGH
- [ ] Automated tests (Phase 10)

### MEDIUM
- [ ] No E2E tests
- [ ] Socket.IO is disabled (mocked for Vercel)
- [ ] No proper backup strategy for Turso

## Files Changed

### New Files
- `backend/middleware/auth.js` — JWT auth + RBAC
- `backend/middleware/rateLimit.js` — Rate limiting
- `backend/middleware/audit.js` — Audit logging helper
- `docs/ARCHITECTURE_AUDIT.md` — This document

### Modified Files
- `backend/server.js` — Security hardening, audit logging, business logic
- `frontend/src/styles.css` — Design system tokens
- `.env.example` — Updated with new required vars
- `frontend/src/App.jsx` — Lazy loading, toast notifications
- `frontend/src/Admin.jsx` — Dashboard home, Audit Logs, design tokens
- `vercel.json` — Routes fixed
- `package.json` — Build scripts, removed sqlite3
