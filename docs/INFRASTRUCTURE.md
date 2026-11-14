# Infrastructure

## Database: Aiven PostgreSQL

| | |
|---|---|
| Aiven project | `alpha-scout` |
| Service | `pg-308b0a94` |
| Plan | `developer-1` (1 CPU, 1 GB RAM, 8 GB disk, max 15 connections) |
| Cloud | `do-nyc` (DigitalOcean New York) |
| PostgreSQL | 18.6 |
| TimescaleDB | 2.30.2, enabled in `defaultdb` |
| TimescaleDB license | **apache** |
| Connection pooling (PgBouncer) | not available on this plan |
| Backups | daily, ~03:12 UTC |

**License limits:** Aiven runs the Apache-licensed TimescaleDB build. Hypertables work, but
Timescale Community (TSL) features are unavailable: compression/columnstore, continuous
aggregates, retention/compression policies and background jobs. Plan the time-series design
with this in mind, or use a provider with TSL features if they become necessary.

**Connections:** keep `max_connections` (15) in mind. The app pool uses `max: 5` per instance.

**TLS:** Aiven signs server certs with a per-project CA. `pg` treats `sslmode=require` as full
verification, so set `DATABASE_CA_CERT` to the PEM from Aiven console > service > Overview >
"CA certificate". Literal `\n` sequences are accepted for single-line env values.

**Local parity:** `docker-compose.yml` uses `timescale/timescaledb:2.30.2-pg18`.

**Migrations on Aiven:** `0001_enable_timescaledb.sql` is applied and recorded in
`schema_migrations`, so `npm run db:migrate` against Aiven picks up from there.

## Hosting: Vercel

| | |
|---|---|
| Team | Leverage Workshop's projects |
| Project | `alpha-scout` |
| Git | `Leverage-Workshop/alpha-scout`, production branch `main` |
| Node | 24.x |

Health checks: `/api/health/db` and `/api/health/ai` (both return 503 on failure).

Environment variables (server-only, Production + Preview):

- `DATABASE_URL`: Aiven service URI (sensitive)
- `DATABASE_CA_CERT`: Aiven project CA PEM
- `AI_MODEL_ID`: unset until a model is chosen

AI Gateway authenticates with Vercel OIDC on deployments, so no `AI_GATEWAY_API_KEY` is
set in Vercel. For local Gateway calls, set `AI_GATEWAY_API_KEY` in `.env.local` or run
`vercel env pull` to fetch a short-lived OIDC token.

## DNS: Cloudflare

| | |
|---|---|
| Zone | `leverageworkshop.com` |
| Record | `alphascout` CNAME → Vercel-assigned target, **DNS only** (not proxied) |
| URL | https://alphascout.leverageworkshop.com |

Same pattern as `rouxtutor.leverageworkshop.com`. Keep the record unproxied so Vercel can
issue and renew the TLS certificate.

## Setup status

- [x] Aiven service running, TimescaleDB enabled and verified
- [x] Vercel project created, linked to GitHub, Node 24, Next.js preset
- [x] `alphascout.leverageworkshop.com` added to Vercel and CNAME'd in Cloudflare; TLS issued
- [x] AI Gateway reachable from Vercel via OIDC (`/api/health/ai` → 200)
- [x] `DATABASE_URL` and `DATABASE_CA_CERT` set in Vercel (Production + Preview);
      `/api/health/db` → 200 (2026-11-13)

Both DB vars are Vercel **sensitive** variables. They can't be read back or renamed, so a typo in
a key means deleting the variable and re-adding it. Copy local values from the Aiven console, not
from Vercel. The app reads exactly `DATABASE_CA_CERT`; without it, `pg` fails with
`SELF_SIGNED_CERT_IN_CHAIN`.
