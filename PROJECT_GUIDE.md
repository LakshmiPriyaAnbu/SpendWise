# SpendWise — Beginner's Guide to the Whole Project

This document explains what SpendWise is, how it's built, and where every piece of
functionality lives — written for someone who has never seen this codebase before.
If a term might be unfamiliar, it's explained inline the first time it's used.

---

## 1. What is SpendWise, in one paragraph?

SpendWise is a **personal finance tracker** — like a mini Mint/Splitwise for your
own spending. A user logs in, adds transactions (either by typing them, scanning a
receipt, or importing a bank statement CSV), and the app organizes those
transactions into categories (Food, Rent, Shopping...), tracks monthly budgets per
category, and shows analytics (charts, trends, "insights" like *"you're overspending
on Food this month"*) plus exportable reports.

It's a **full-stack** project: there's a backend (server), a database, a web
frontend, and even a native iOS app — all talking to the same API.

---

## 2. The big picture — how the pieces fit together

```
                     ┌─────────────────────────┐
                     │   Angular Web App (web/) │   ← what you see in the browser
                     │   or iOS App (ios/)       │   ← what you see on iPhone
                     └────────────┬─────────────┘
                                  │  HTTPS requests (JSON)
                                  │  e.g. GET /api/transactions
                                  ▼
                     ┌─────────────────────────┐
                     │  Express API (server/)   │   ← the "brain": business logic,
                     │  Node.js + TypeScript    │     validation, auth checks
                     └────────────┬─────────────┘
                                  │  SQL queries (via Prisma ORM)
                                  ▼
                     ┌─────────────────────────┐
                     │  PostgreSQL database     │   ← where the data actually lives
                     └─────────────────────────┘

           Both web/ and server/ import types from shared/ so the
           "shape" of a Transaction, Category, etc. is defined ONCE
           and can never drift out of sync between frontend and backend.
```

This whole thing lives in **one Git repository** but is split into multiple
independent sub-projects — that's called a **monorepo** ("mono" = one repo, many
packages). You can see this declared in the root [package.json](package.json):

```json
"workspaces": ["shared", "server", "web"]
```

This tells npm: "these three folders are separate packages that can depend on each
other, but I manage them together with one `npm install`."

---

## 3. Folder-by-folder tour

```
SpendWise/
├── shared/     ← TypeScript types used by BOTH web and server (the "contract")
├── server/     ← the API — Node.js + Express + Prisma + PostgreSQL
├── web/        ← the Angular web app (what runs in the browser)
├── ios/        ← the native iOS app (SwiftUI) — talks to the same API
├── docs/       ← the original visual design prototype the UI was built to match
├── .claude/    ← project-specific "skills" (docs for AI assistants working here)
├── docker-compose.yml  ← spins up a local PostgreSQL database
├── render.yaml          ← deployment blueprint for Render.com hosting
└── package.json         ← the monorepo root: scripts to run everything together
```

### 3.1 `shared/` — the contract between frontend and backend

This is the smallest but most important folder to understand first, because
everything else imports from it.

- [shared/src/models/index.ts](shared/src/models/index.ts) — defines what a
  `Transaction`, `Category`, `Budget`, `Settings`, `Insight`, `User` etc. *look
  like* (their fields and types). Example: a `Transaction` always has `merchant`,
  `categoryId`, `date`, `amount`, etc.
- [shared/src/api/index.ts](shared/src/api/index.ts) — defines every API
  **endpoint path** (`API_ROUTES`) and the exact **request/response shapes** for
  each one (e.g. `CreateTxRequest`, `AnalyticsSummary`). If the server sends back
  an `AnalyticsSummary`, this file says exactly what fields that object has.

Both `server/` and `web/` import this package as `@spendwise/shared`. This means
if someone renames a field here, TypeScript will immediately show errors in both
the frontend and backend code that used the old name — nothing can quietly drift
out of sync.

**Important beginner note about money:** every amount in this app is stored as a
plain **integer number of paise** (1 rupee = 100 paise), not rupees, and not a
float. So ₹120.50 is stored as `12050`. This avoids the classic floating-point
rounding bugs you get with money (`0.1 + 0.2 !== 0.3` in almost every language).
Expenses are **negative** paise, income is **positive** paise — so summing a
list of transactions directly gives you the net balance.

### 3.2 `server/` — the API (the "backend")

This is a Node.js app written in TypeScript, using the **Express** web framework.
"Express" is a library for building HTTP APIs — you define routes like
`GET /api/transactions` and a function that handles them.

```
server/
├── src/
│   ├── main.ts        ← the entry point: starts the HTTP server, prints "listening on..."
│   ├── app.ts          ← wires together all the routes (see below) + serves the built
│   │                     Angular app in production
│   ├── middleware/
│   │   ├── auth.ts      ← checks the login token on every request (see auth flow below)
│   │   └── error.ts      ← catches errors thrown anywhere and turns them into a
│   │                       clean JSON error response instead of crashing
│   ├── lib/            ← small shared helpers (see below)
│   └── modules/         ← one folder per feature area (see below)
└── prisma/
    ├── schema.prisma    ← the database schema — defines DB tables in a readable DSL
    ├── migrations/       ← auto-generated SQL scripts that build up the schema over time
    └── seed.ts            ← creates a demo user + demo data for local development
```

**What is Prisma?** It's an **ORM** (Object-Relational Mapper) — a library that
lets you write `prisma.transaction.findMany({ where: { userId } })` in TypeScript
instead of hand-writing SQL. `schema.prisma` is the single source of truth for the
database structure; running `npm run migrate` reads it and generates/runs the SQL
needed to update the real PostgreSQL database to match.

**`server/src/modules/` — one folder per feature.** Each module typically has a
`*.router.ts` (defines the HTTP routes, e.g. `POST /`, `GET /:id`) and a
`*.service.ts` (the actual logic: talks to the database via Prisma, applies
business rules). This separation means routers only deal with HTTP concerns
(reading the request, sending the response) while services contain the real logic
and can be unit-tested without spinning up a server.

| Module | What it does | Key files |
|---|---|---|
| `auth` | Register / login, issues JWT tokens, hashes passwords | [auth.service.ts](server/src/modules/auth/auth.service.ts) |
| `transactions` | CRUD (Create/Read/Update/Delete) for income & expense entries | [transactions.service.ts](server/src/modules/transactions/transactions.service.ts) |
| `categories` | The 8 default spending categories + user-created custom ones | [categories.service.ts](server/src/modules/categories/categories.service.ts), [palette.ts](server/src/modules/categories/palette.ts) |
| `budgets` | Per-category, per-month spending limits | [budgets.service.ts](server/src/modules/budgets/budgets.service.ts) |
| `analytics` | Computes the dashboard summary: totals, category breakdown, trend chart, "insights" | [analytics.service.ts](server/src/modules/analytics/analytics.service.ts), [insights.ts](server/src/modules/analytics/insights.ts) |
| `receipts` | Receipt photo → extracted merchant/amount/line-items (currently a **mock OCR** — see note below) | [receipts.router.ts](server/src/modules/receipts/receipts.router.ts) |
| `imports` | Parses a bank statement CSV, auto-categorizes rows by keyword, flags duplicates | [imports.router.ts](server/src/modules/imports/imports.router.ts) |
| `reports` | Summaries + CSV/PDF export + export history | [reports.router.ts](server/src/modules/reports/reports.router.ts) |
| `settings` | Currency, theme, privacy toggles | [settings.router.ts](server/src/modules/settings/settings.router.ts) |

**`server/src/lib/` — small reusable helpers**, not tied to one feature:
- [prisma.ts](server/src/lib/prisma.ts) — the shared Prisma client instance.
- [env.ts](server/src/lib/env.ts) — reads environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`) once, in one place.
- [http.ts](server/src/lib/http.ts) — `HttpError` class + a `wrap()` helper so route handlers can just `throw` errors instead of manually calling `res.status(...).json(...)` everywhere.
- [duplicates.ts](server/src/lib/duplicates.ts) — the shared rule used by both receipt scanning and CSV import to flag "this might already exist": same amount + similar merchant name + within 10 days.
- [serialize.ts](server/src/lib/serialize.ts) — converts Prisma's raw database rows into the clean shapes defined in `shared/`.
- [guards.ts](server/src/lib/guards.ts), [constants.ts](server/src/lib/constants.ts), [messages.ts](server/src/lib/messages.ts) — small validation guards, shared constants (like token expiry), and user-facing error message strings.

**How a login/auth request actually flows** (a good example to understand the
whole backend pattern):
1. User submits email+password on the login page → `POST /api/auth/login`.
2. [auth.router.ts](server/src/modules/auth/auth.router.ts) receives it, calls `auth.service.ts`'s `login()`.
3. `login()` looks up the user in Postgres via Prisma, compares the password
   against the stored **bcrypt hash** (passwords are never stored in plain text),
   and if it matches, signs a **JWT** (JSON Web Token — a signed, tamper-proof
   string that encodes "this is user X, valid until time Y").
4. The token + user info is sent back to the browser, which stores the token in
   `localStorage` and attaches it as `Authorization: Bearer <token>` on every
   future request.
5. On the server, [middleware/auth.ts](server/src/middleware/auth.ts) runs before
   *every* route except `/api/auth/*` and `/api/health` (see the ordering in
   [app.ts](server/src/app.ts)) — it verifies the token's signature and expiry, and
   if valid, attaches `req.userId` so every downstream route handler knows *who*
   is making the request without re-checking credentials.

### 3.3 `web/` — the Angular web app (the "frontend")

Built with **Angular 20**, using its modern **standalone components** style
(no `NgModule` files) and **signals** for state (a signal is a reactive value —
when it changes, anything reading it automatically re-renders, similar to how
`useState` works in React, but built into Angular itself).

```
web/src/app/
├── app.ts, app.config.ts, app.routes.ts   ← app bootstrap + all page routes
├── core/          ← app-wide singleton services (one instance shared everywhere)
├── features/       ← one folder per screen/page
├── layout/          ← the shell around every page (sidebar/tab bar, top bar)
└── shared/ui/        ← small reusable presentational components (icons, chips, charts...)
```

**`core/` — app-wide services**, each injected wherever needed:
- [auth.service.ts](web/src/app/core/auth.service.ts) — holds the logged-in
  user as a signal, exposes `login()`/`register()`/`logout()`, persists the
  token to `localStorage`.
- [auth.guard.ts](web/src/app/core/auth.guard.ts) — a **route guard**: blocks
  navigation to any page under `/` (dashboard, transactions, etc.) if the user
  isn't logged in, redirecting to `/login` instead. Wired up in
  [app.routes.ts](web/src/app/app.routes.ts).
- [auth.interceptor.ts](web/src/app/core/auth.interceptor.ts) — an **HTTP
  interceptor**: automatically attaches the `Authorization: Bearer <token>`
  header to every outgoing API request, so individual components never have to
  think about auth headers.
- [api.service.ts](web/src/app/core/api.service.ts) — the single place that
  knows how to call every backend endpoint (wraps Angular's `HttpClient`). Every
  feature component calls methods on this service instead of using `HttpClient`
  directly — one place to change if an endpoint shape changes.
- [money.pipe.ts](web/src/app/core/money.pipe.ts) — formats raw paise integers
  into readable Indian-style currency strings (₹1,20,000).
- [month.service.ts](web/src/app/core/month.service.ts) — tracks "which month
  is currently selected" (for the dashboard/analytics month picker) as a shared
  signal so multiple components stay in sync.
- [toast.service.ts](web/src/app/core/toast.service.ts) — shows small
  temporary notification popups (e.g. "Transaction added").

**`features/` — one folder per screen**, matching the routes in
[app.routes.ts](web/src/app/app.routes.ts):

| Route | Folder | What the user does there |
|---|---|---|
| `/login`, `/register` | `auth/` | Sign in or create an account |
| `/dashboard` | `dashboard/` | Landing page: balance, this month's spend, top categories, budget mini-view, top insight |
| `/transactions` | `transactions/` | Browse/search/filter all transactions |
| `/add` | `add-transaction/` | Manually add an income/expense entry |
| `/scan` | `scan-receipt/` | Upload a receipt photo → auto-filled transaction |
| `/import` | `import-statement/` | Upload a bank CSV → review & confirm parsed rows |
| `/budgets` | `budgets/` | Set a ₹ limit per category per month |
| `/analytics` | `analytics/` | Charts: category breakdown, spending trend, top merchants |
| `/reports` | `reports/` | Summary by date range + CSV/PDF export + past export history |
| `/settings` | `settings/` | Currency, theme, privacy toggles |

Each feature folder usually has three files: `*.component.ts` (logic — calls
`ApiService`, holds signals for the data), `*.component.html` (the template –
what's rendered), `*.component.scss` (styles for just that page).

Every page follows roughly the same pattern seen in
[dashboard.component.ts](web/src/app/features/dashboard/dashboard.component.ts):
inject `ApiService`, call it inside an `effect()` (a function that re-runs
whenever a signal it reads — like the selected month — changes), store the
result in a `signal`, and derive display values with `computed()` (a value that
recalculates automatically whenever the signals it depends on change).

**`layout/`** — [shell.component.html](web/src/app/layout/shell.component.html)
is the frame every logged-in page sits inside: the sidebar/tab navigation, the
top bar, and a `<router-outlet>` where the current feature page is rendered. This
is what `app.routes.ts` loads as the parent route for everything except
login/register.

**`shared/ui/`** — small "dumb" components with no business logic, reused across
many features: `icon.component.ts` (SVG icon system), `donut-chart.component.ts`
and `progress-bar.component.ts` (used on dashboard/analytics/budgets),
`category-chip.component.ts`, `segmented-tabs.component.ts`, `toast.component.ts`,
`empty-state.component.ts` (the "nothing here yet" placeholder screens).

### 3.4 `ios/` — the native iOS app

A SwiftUI app that talks to the *same* Express API as the web app (see
[README.md](README.md) note about pointing `APIClient.baseURL` at the deployed
server). Structured the same way conceptually as `web/`, and follows a strict
MVVM split: **views only lay out UI**, **view models own state and talk to the
API**, and there is exactly one place to change any given color or string.

- `App/` — app entry point + the tab bar (`MainTabView.swift`).
- `Core/` — `APIClient.swift` (networking, equivalent to `api.service.ts`),
  `SessionStore.swift` (equivalent to `auth.service.ts`), `Models.swift`
  (Swift equivalent of `shared/src/models`), `Money.swift` (paise formatting),
  `DateFormatting.swift` (`AppDate` — every date format the app uses; views
  and view models must call into this rather than building their own
  `DateFormatter`).
- `DesignSystem/` — colors/spacing constants ("Emerald" design system, shared
  conceptually with the web app — see `.claude/skills/spendwise-design`) plus
  small reusable presentational views shared by more than one screen:
  `CategoryStyle.swift` (`CategoryIconTile`), `SpendingDonutChart.swift`
  (`SpendingDonutChart` + `CategoryLegendRow`, used by both Home and
  Insights), `ErrorStateView.swift` (the message + Retry button shown on every
  screen's full-page error state).
- `Resources/Strings.swift` — every piece of user-facing copy, namespaced by
  feature (`Strings.Home`, `Strings.Add`, ...). Views must reference a
  constant here instead of hardcoding text, so wording changes happen in one
  place.
- `Features/` — one folder per screen: `Home`, `Activity`, `Add`, `Scan`,
  `Budgets`, `Insights`, `Auth` — mirroring the web app's feature set (this app
  is marked "planned"/in-progress per the README, so not every web feature has
  an iOS screen yet). Every screen with state or networking has a matching
  `*ViewModel.swift` (`@Observable @MainActor` class, e.g. `HomeViewModel`,
  `ActivityViewModel`, `AddTransactionViewModel`, `BudgetsViewModel`,
  `ScanViewModel`, `LoginViewModel`) that owns the screen's data and exposes
  `load(api:)`/action methods; the `*View.swift` file only renders that state
  and forwards user actions back to the view model.

### 3.5 Everything else

- [docs/design/SpendWiseApp.dc.html](docs/design/SpendWiseApp.dc.html) — a
  static HTML mockup (the original design prototype) that is the visual
  "source of truth" — when a UI detail is ambiguous, this file shows the
  intended look.
- `.claude/skills/` — reference docs (not app code) that describe this
  project's conventions in detail: `angular-dev` (Angular patterns used here),
  `api-conventions` (REST contract rules), `spendwise-design` (the "Emerald"
  color/spacing/typography system). Worth reading if you're about to write new
  UI or API code and want it to match existing conventions.
- [docker-compose.yml](docker-compose.yml) — starts a local PostgreSQL 17
  database in Docker for development (`npm run db`).
- [render.yaml](render.yaml) — a deployment blueprint for
  [Render.com](https://render.com): one web service that both serves the API
  *and* the built Angular app as static files (see the `existsSync(webDist)`
  block in [app.ts](server/src/app.ts)), plus a managed Postgres database.

---

## 4. Key functionality, end-to-end

A quick map of "feature → which files make it work", useful when you want to
change or understand one specific thing:

- **Sign up / log in** → web: `features/auth/`, `core/auth.service.ts` · server: `modules/auth/`
- **Add a transaction by hand** → web: `features/add-transaction/` · server: `modules/transactions/`
- **Scan a receipt** → web: `features/scan-receipt/` · server: `modules/receipts/` (currently returns a **mock/sample OCR extraction** — see README note; a real OCR provider can be swapped in without changing the API contract) — duplicate check uses [duplicates.ts](server/src/lib/duplicates.ts)
- **Import a bank statement** → web: `features/import-statement/` · server: `modules/imports/` — parses `date,description,amount` CSV rows, keyword-categorizes them, and flags duplicates the same way receipts do
- **Set budgets** → web: `features/budgets/` · server: `modules/budgets/`
- **Dashboard summary / charts / "insights"** → web: `features/dashboard/`, `features/analytics/` · server: `modules/analytics/analytics.service.ts` (aggregates the numbers) + `insights.ts` (the actual *rules*, e.g. "flag `watch` if a category is ≥20% above last month, `alert` if over budget, `great` if savings rate improved")
- **Export a report** → web: `features/reports/` · server: `modules/reports/`
- **Settings / privacy toggles** → web: `features/settings/` · server: `modules/settings/`

---

## 5. How a request actually travels (worked example: loading the dashboard)

1. Browser loads `/dashboard` → Angular's router guard
   ([auth.guard.ts](web/src/app/core/auth.guard.ts)) confirms a token exists.
2. [dashboard.component.ts](web/src/app/features/dashboard/dashboard.component.ts)'s
   constructor runs an `effect()` that calls `api.summary(month)`.
3. That calls `ApiService.summary()`
   ([api.service.ts](web/src/app/core/api.service.ts)), which does
   `HttpClient.get('/api/analytics/summary?month=...')`.
4. Before the request leaves the browser, the
   [auth.interceptor.ts](web/src/app/core/auth.interceptor.ts) attaches the
   `Authorization: Bearer <token>` header automatically.
5. In dev, Angular's dev server proxies `/api/*` to `localhost:3000` (see
   [proxy.conf.json](web/proxy.conf.json)); in production, the same Express
   server serves both the API and the static Angular files, so there's no
   cross-origin request at all.
6. Express's [app.ts](server/src/app.ts) middleware chain runs:
   `authMiddleware` verifies the JWT and sets `req.userId` → the request reaches
   [analytics.router.ts](server/src/modules/analytics/analytics.router.ts) →
   which calls `analytics.service.ts`.
7. The service runs several Prisma queries against PostgreSQL (this month's
   transactions, last month's transactions, budgets), computes totals, category
   breakdowns, a 6-month trend, and calls `computeInsights()` from
   [insights.ts](server/src/modules/analytics/insights.ts) to generate the
   "insight" cards.
8. It returns a plain object shaped exactly like `AnalyticsSummary` (defined in
   `shared/src/api/index.ts`) as JSON.
9. Back in Angular, the promise resolves, the component's `summary` signal is
   set, and every `computed()` value that depends on it (top categories,
   savings %, budget mini-rows) — and therefore the template — updates
   automatically. No manual "re-render" call anywhere.

---

## 6. Running it locally

From [README.md](README.md), the short version:

```bash
npm install        # installs all three workspaces (shared, server, web) at once
npm run db          # starts PostgreSQL in Docker (port 5433)
npm run migrate     # creates the database tables from prisma/schema.prisma
npm run seed        # inserts a demo user + demo transactions/budgets
npm run dev         # runs the API (port 3000) and Angular dev server (port 4200) together
```

Then open `http://localhost:4200` — a demo login (`lakshmi@email.com` /
`spendwise123`) is prefilled, or you can register a new account.

Run the automated tests (currently server-side only — insight rules, duplicate
detection, CSV parsing) with:

```bash
npm test
```

---

## 7. Glossary (quick beginner reference)

| Term | Meaning here |
|---|---|
| **Monorepo** | One Git repo containing multiple independent packages (`shared`, `server`, `web`) that can depend on each other. |
| **REST API** | A convention for structuring web APIs around URLs + HTTP verbs, e.g. `GET /api/transactions` (list), `POST /api/transactions` (create), `PATCH /api/transactions/:id` (update), `DELETE /api/transactions/:id`. |
| **JWT (JSON Web Token)** | A signed string proving "this request is from user X" without the server needing to look anything up per-request beyond verifying the signature. |
| **ORM (Prisma)** | A library that lets you query the database using TypeScript function calls instead of writing raw SQL. |
| **Migration** | A versioned script that changes the database schema (add a table/column etc.), generated from `schema.prisma`. |
| **Standalone component (Angular)** | A component that declares its own dependencies directly, without needing an `NgModule` wrapper — the modern Angular style used throughout `web/`. |
| **Signal (Angular)** | A reactive container for a value; reading it inside a template or `computed()`/`effect()` automatically re-runs that code when the value changes. |
| **Interceptor (Angular)** | Code that runs on every outgoing HTTP request/response, used here to attach the auth token. |
| **Guard (Angular)** | Code that runs before a route navigation completes, used here to block unauthenticated access. |
| **Middleware (Express)** | A function that runs on every incoming request before it reaches the route handler, used here for auth checking and error handling. |
| **Paise** | 1/100th of a rupee — the app's internal unit for all money values, stored as integers to avoid rounding errors. |
