---
name: api-conventions
description: SpendWise REST API contract and server conventions — endpoints, JWT auth flow, shared DTO rules, money-as-paise, error envelope, duplicate detection. Use when writing or reviewing code under server/ or shared/, or wiring any client (Angular/iOS) to the API.
---

# SpendWise API Conventions (server/ + shared/)

Express + TypeScript + Prisma + PostgreSQL. All request/response types live in `@spendwise/shared` (`shared/src`) — server and clients import them; nobody redeclares them.

## Module shape
Each domain under `server/src/modules/<domain>/` has:
- `<domain>.router.ts` — Express Router, zod-validated input, thin handlers
- `<domain>.service.ts` — business logic, Prisma access
Routers are mounted in `app.ts` under `/api/<domain>`. Async handlers wrapped so errors reach the central error middleware.

## Auth
- `POST /api/auth/register` `{name,email,password}` → `{token, user}` (bcrypt hash, creates the 8 default categories + default settings for the new user)
- `POST /api/auth/login` `{email,password}` → `{token, user}`
- JWT HS256, secret from `env JWT_SECRET`, payload `{sub: userId}`, expiry 7d. `authMiddleware` verifies `Authorization: Bearer <t>` and sets `req.userId`; applied to every route except `/api/auth/*` and `/api/health`.
- Every query is scoped by `userId`. Never return another user's rows.

## Money
Amounts are **signed integers in paise** everywhere (DB, API, DTOs). Expense = negative, income = positive. Clients convert to ₹ for display only. Never floats.

## Error envelope
Errors return `{ error: { code: string, message: string } }` with proper status (400 validation, 401 auth, 404 missing, 409 conflict, 500 fallback). Zod validation failures → 400 with the first issue's message.

## Endpoints
| Method & path | Notes |
|---|---|
| `GET /api/transactions?month=YYYY-MM&type=all\|income\|expense&q=` | sorted date desc |
| `POST /api/transactions` | `{merchant, categoryId, date, paymentMethod, amount, notes?}` |
| `PATCH /api/transactions/:id` / `DELETE …/:id` | |
| `GET /api/categories` | defaults + user's custom |
| `POST /api/categories` `{name}` | server assigns next color from the 7-hue custom palette, icon `other` |
| `DELETE /api/categories/:id` | only custom categories; reassign txs to `other` |
| `GET /api/budgets?month=` / `PUT /api/budgets` | per-category monthly amounts |
| `GET /api/analytics/summary?month=` | totals (balance/income/expense/savings), category breakdown w/ pct, budget usage, 6-month trend, top merchants, insights |
| `POST /api/receipts/scan` (multipart `file`) | mock-OCR: returns `{merchant, date, total, lineItems[], suggestedCategoryId, confidence, duplicate?}` |
| `POST /api/imports/parse` (multipart CSV) | → `{bank, maskedAccount, rows: [{…, duplicate: boolean, include: boolean}]}` |
| `POST /api/imports/confirm` `{rows}` | creates transactions, returns counts |
| `GET /api/reports/summary?range=` · `POST /api/reports/export` `{range, format: csv\|pdf, include[]}` → file download · `GET /api/reports/history` | |
| `GET /api/settings` / `PATCH /api/settings` | currency, budgetResetDay, theme, privacy toggles |
| `GET /api/health` | unauthenticated liveness |

## Duplicate detection (shared rule)
A candidate transaction is a duplicate if an existing transaction for the same user has the **same absolute amount** and a **similar merchant** (case-insensitive, normalized: strip non-alphanumerics; one contains the other) within **±10 days**. Used by both receipt scan and statement import. Import preview defaults duplicate rows' `include` to `false`.

## Insight rules (analytics)
Generated per month, each `{tag: 'watch'|'alert'|'great', title, description}`:
1. **watch** — any category ≥20% higher spend than previous month
2. **alert** — any category over its budget (include over-amount)
3. **great** — savings rate improved vs previous month, or ≥30%
Sidebar Budgets badge = count of over-budget categories (from summary).

## Environment & commands
- `server/.env`: `DATABASE_URL=postgresql://spendwise:spendwise@localhost:5432/spendwise`, `JWT_SECRET`, `PORT=3000`.
- Postgres via root `docker-compose.yml` (`docker compose up -d db`).
- `npm run dev -w server` (tsx watch) · `npm run migrate -w server` (prisma migrate dev) · `npm run seed -w server` · `npm test -w server` (vitest).
- Seed: demo user `lakshmi@email.com` / password `spendwise123`, the spec's 8 categories with budgets, ~12 July-2026 transactions + prior months for the 6-month trend, subscriptions.
