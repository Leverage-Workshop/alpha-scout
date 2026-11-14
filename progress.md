# Session Progress Log

Running log for agent sessions. Update **Current State** in place; add a dated entry to
**History** at the end of each session (newest first).

## Current State

**Last Updated:** 2026-11-13
**Active Feature:** none. The only open feature (feat-003) is blocked on the product owner.

### What's Done

- [x] feat-001 Phase 0 foundation (PR #1, PR #2)
- [x] Agent harness, PR template and shipping workflow (PR #3)
- [x] feat-002 Production DB health: `/api/health/db` → 200 in production

### What's Next

1. feat-003: once the product owner answers `docs/PRODUCT.md` §9, replace feat-003 with concrete,
   approved features (each with dependencies and a verifiable outcome).

## Blockers / Risks

- **feat-003**: product owner input. No product features are authorized yet.
- **Local `.env.local` targets Aiven production** once filled in, so `db:migrate` locally migrates production.
  Use the Docker DB for development work.
- **Risk**: Aiven `developer-1` caps at 15 connections; the app pool uses `max: 5` per instance.

## Decisions Made

- **Harness lives at the repo root** (`init.sh`, `feature_list.json`, `progress.md`, `session-handoff.md`),
  routed from `AGENTS.md`. `CLAUDE.md` stays a one-line `@AGENTS.md` import.
- **`init.sh` installs only when the lockfile is newer than `node_modules`**, to keep startup fast.
  `--quick` skips `next build`.
- **Every finished request ships as a squash-merged PR** once checks are green (`AGENTS.md` "Shipping").
  The only checks are Vercel's, since `main` has no branch protection.
- **PR template** at `.github/pull_request_template.md`. Core sections follow common industry guidance:
  summary/why, changes, how to review, test plan, risk/rollback. Migrations, config and screenshots are conditional.

## Evidence of Completion

- 2026-11-13 harness setup: `./init.sh` passed (lint, typecheck, test, build).
  The harness-creator validator scored 100/100 (baseline before the harness: 24/100).

## History

### 2026-11-13: feat-002 production DB health

- The first attempt failed with `SELF_SIGNED_CERT_IN_CHAIN` because the CA was saved in Vercel as `DATABASE_CERT`.
  Sensitive vars can't be renamed, so it was re-added as `DATABASE_CA_CERT` (Production + Preview).
  `DATABASE_URL` was extended to Preview.
- Verified `/api/health/db` → 200; ticked the last box in `docs/INFRASTRUCTURE.md`.

### 2026-11-13: harness setup

- Installed the `harness-creator` skill (walkinglabs/learn-harness-engineering) and scaffolded the harness.
- Files: `AGENTS.md` (startup workflow, working rules, definition of done, end of session, shipping),
  `init.sh`, `feature_list.json`, `progress.md`, `session-handoff.md`, `.github/pull_request_template.md`.
