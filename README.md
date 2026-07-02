# SpendWise

SpendWise is a full-stack personal finance tracker with receipt scanning, statement import, transaction categorization, budget tracking, spending analytics, and exportable financial reports.

Monorepo:

| Folder | What it is |
|---|---|
| `web/` | Angular 20 web app (standalone components, signals, Emerald design system) |
| `server/` | Express + TypeScript API (Prisma, PostgreSQL, JWT auth) |
| `shared/` | `@spendwise/shared` — TypeScript models/DTOs shared by web & server |
| `ios/` | Native iOS app (SwiftUI) — planned |
| `docs/design/` | The claude.ai/design prototype the UI is built from |
| `.claude/skills/` | Project skills: design system, Angular conventions, API contract |

## Run it

Prereqs: Node 20+, Docker (for PostgreSQL).

```bash
npm install
npm run db          # start Postgres 17 in Docker (port 5433)
npm run migrate     # prisma migrate dev
npm run seed        # demo user + data
npm run dev         # API on :3000 + web on :4200
```

Open http://localhost:4200 — demo login is prefilled (`lakshmi@email.com` / `spendwise123`), or register a fresh account.

## Deploy (Render)

The repo ships a [render.yaml](render.yaml) blueprint: one web service (Express serves both the API and the built Angular app) plus managed Postgres.

1. Push to GitHub.
2. In the [Render dashboard](https://dashboard.render.com/blueprints) choose **New → Blueprint** and connect this repo — Render reads `render.yaml` and provisions everything (`JWT_SECRET` is auto-generated, `DATABASE_URL` comes from the provisioned database, migrations run on every deploy via `prisma migrate deploy`).
3. Open the service URL and **register an account** (production isn't seeded — seeding is for local dev).

Free-tier caveats: the service spins down when idle (~1 min cold start) and free databases are time-limited. Starter service + basic database (~$14/mo) makes it always-on.

For the iOS app against production, point `APIClient.baseURL` (ios/SpendWise/Core/APIClient.swift) at your Render URL — it's HTTPS, so no ATS exception is needed.

## Notes

- All money amounts are integer **paise** end-to-end; the UI formats with Indian lakh/crore grouping (₹1,20,000).
- Receipt scan uses a mock-OCR pipeline (returns a sample extraction) with **real** duplicate detection; swap in a real OCR provider in `server/src/modules/receipts/` without changing the API contract.
- Statement import parses CSV (`date,description,amount`) with keyword categorization and duplicate flagging.
- Tests: `npm test` (server unit tests — insight rules, duplicate detection, CSV parsing).
