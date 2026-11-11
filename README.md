# Alpha Scout

Trading research app: search historical market price data to evaluate trade setups.
Research and evidence gathering only, with no order execution. See [docs/PRODUCT.md](docs/PRODUCT.md).

## Stack

Next.js 16.4 (App Router) · React 19.3 · TypeScript 5 · Tailwind CSS 4 · Base UI · Zustand ·
PostgreSQL 18 + TimescaleDB 2.30 (Aiven) · Vercel AI SDK + AI Gateway · Vitest · Vercel · Cloudflare DNS.

## Local setup

Requires Node 24 (`nvm use`) and Docker.

```bash
npm install
cp .env.example .env.local      # defaults point at the local Docker DB
npm run db:up                   # TimescaleDB 2.30.2 on Postgres 18, port 5432
npm run db:migrate              # applies db/migrations/*.sql
npm run db:check                # confirms timescaledb is enabled
npm run dev
```

Health endpoints:

- `GET /api/health/db`: Postgres + TimescaleDB versions (503 if the extension is missing)
- `GET /api/health/ai`: authenticated round trip to Vercel AI Gateway, with no model call

## Scripts

| Script | Purpose |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` / `test` | ESLint, `tsc --noEmit`, Vitest |
| `db:up` / `db:down` | Local TimescaleDB via Docker Compose |
| `db:migrate` | Apply pending SQL migrations (tracked in `schema_migrations`) |
| `db:check` | Exit non-zero unless `timescaledb` is enabled |

DB integration tests in `tests/` run only when `DATABASE_URL` is set:
`DATABASE_URL=postgresql://alpha_scout:alpha_scout@localhost:5432/alpha_scout npm test`.

## Infrastructure

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for Aiven, Vercel and Cloudflare details.
