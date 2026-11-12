# Agent guidance

Read `docs/PRODUCT.md` first. Functional requirements (§7) are TBD: don't build speculative
research, ingestion or chat features until the product owner defines them.

## Commands

Before pushing, run: `npm run lint && npm run typecheck && npm test && npm run build`.
With the local DB up (`npm run db:up && npm run db:migrate`), also run tests with
`DATABASE_URL` set so the integration tests execute.

## Conventions

- Node 24, npm, committed `package-lock.json`. Pin known-compatible versions; don't bulk-upgrade.
- `src/` uses the `@/*` alias. Server-only modules import `server-only`.
- Database: plain `pg` for now (query layer intentionally unselected). Parameterize every query.
  Schema changes go in a new `db/migrations/NNNN_name.sql` and are never edited after merge.
- Secrets live in env vars only. Never use `NEXT_PUBLIC_` for DB or AI credentials.
- AI: use the Vercel AI SDK (`ai`) via AI Gateway with `getModelId()`. No default model yet.
  Models narrate verified results; they must not produce numeric facts or historical matches.
- TimescaleDB on Aiven is the Apache-licensed build: no compression, continuous aggregates or
  policies (see `docs/INFRASTRUCTURE.md`).
