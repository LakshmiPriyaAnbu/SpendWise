---
name: angular-dev
description: Angular conventions for the SpendWise web app in web/ — standalone components, signals, folder rules, routing, API access, and how to run/build/test. Use when writing or reviewing any code under web/.
---

# SpendWise Angular Conventions (web/)

Angular 20, standalone components only (no NgModules), SCSS, strict TypeScript.

## State & components
- Use **signals** for all component/service state (`signal`, `computed`, `effect`). No RxJS state subjects; RxJS only at the HttpClient boundary (convert with `toSignal` or subscribe-and-set).
- Use `inject()` instead of constructor injection.
- Use native control flow (`@if`, `@for` with `track`, `@switch`) — never `*ngIf/*ngFor`.
- `ChangeDetectionStrategy.OnPush` on every component.
- Component files: co-locate `*.ts`, `*.html`, `*.scss` (inline template OK for tiny shared UI atoms).
- Selectors prefixed `sw-` (e.g. `sw-stat-card`).

## Folder rules
```
web/src/app/
├── core/        # singletons: auth.service, auth.interceptor, auth.guard,
│                # one api service per domain (transactions.api.ts, …),
│                # toast.service, money.pipe
├── shared/ui/   # dumb reusable components: sw-icon, sw-donut-chart, sw-stat-card,
│                # sw-category-chip, sw-progress-bar, sw-segmented-tabs, sw-toast, sw-empty-state
├── layout/      # shell.component (sidebar + topbar + router-outlet)
└── features/<screen>/   # one folder per route, lazy-loaded
```
- Features may import from `core/` and `shared/`, never from other features.
- Types come from `@spendwise/shared` — never redeclare API models locally.

## Routing
- Routes in `app.routes.ts`; every feature lazy: `loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)`.
- Authenticated routes are children of the shell route, protected by `authGuard`; `/login` and `/register` sit outside the shell.
- Route ids match the design spec screens: dashboard, transactions, add, scan, import, budgets, analytics, reports, settings.

## API access
- All HTTP through domain api services in `core/`, using route constants from `@spendwise/shared`.
- Dev proxy: `web/proxy.conf.json` maps `/api` → `http://localhost:3000` (never hardcode host/port in services).
- JWT: `auth.interceptor` adds `Authorization: Bearer <token>` from `AuthService` (token persisted in localStorage); 401 → redirect `/login`.
- Amounts over the wire are **integer paise**; convert to rupees only in the `money` pipe / display layer.

## Design fidelity
Follow the `spendwise-design` skill for all visual decisions. Global styles in `web/src/styles.scss` define CSS custom properties for the Emerald tokens + the four keyframe animations; components use `var(--sw-*)` tokens rather than raw hex.

## Commands
- Dev (from repo root): `npm run dev` (starts Postgres + server + web) or `npm run dev -w web` for web alone (`ng serve --proxy-config proxy.conf.json`, port 4200).
- Build: `npm run build -w web`. Tests: `npm test -w web` (only add tests for pipes/services with logic, e.g. money pipe).
- After generating anything with `ng generate`, fix it to match these conventions (standalone, OnPush, signals).
