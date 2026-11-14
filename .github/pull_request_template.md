## Summary

<!-- What this PR does and why, in 1–3 sentences. Lead with the outcome, then the problem it
solves and why this approach. Avoid vague titles like "fix bug" or "phase 1". -->

**Type:** <!-- feat | fix | refactor | docs | test | chore | perf | ci -->
**Related:** <!-- feat-XXX from feature_list.json, issue link, or "none" -->

## Changes

<!-- Key changes, plus any decision a future reader can't see from the code. -->

-

## How to review

<!-- Where to start, which files matter most, what to scrutinize. Delete if trivial. -->

## Test plan

- [ ] `./init.sh` passes (lint, typecheck, test, build)
- [ ] DB integration tests pass with `DATABASE_URL` set, or n/a (no changes to `src/lib/db`, `scripts/`, `db/migrations`)
- [ ] Manual verification: <!-- what you ran or clicked, and what you saw -->

## Risk and rollback

<!-- What could break and how to undo it (usually: revert this PR). Write "Low: docs only" when that's true. -->

<!-- Delete any section below that doesn't apply. -->

### Database / migrations

<!-- New db/migrations/NNNN_*.sql? Is it safe on Aiven's Apache TimescaleDB build? Is it reversible? -->

### Config and secrets

<!-- New or changed env vars to set in Vercel (Production + Preview). Never NEXT_PUBLIC_ for secrets. -->

### Screenshots

<!-- Before/after for UI changes. -->

## Checklist

- [ ] Scoped to one feature or request; no speculative features (see `AGENTS.md`)
- [ ] Queries parameterized, inputs validated, no secrets committed
- [ ] `feature_list.json` and `progress.md` updated (or n/a)
- [ ] Docs updated if behavior or setup changed (README, `docs/`)
