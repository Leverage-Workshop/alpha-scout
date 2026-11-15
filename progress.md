# Session Progress Log

Running log for agent sessions. Update **Current State** in place; add a dated entry to
**History** at the end of each session (newest first).

## Current State

**Last Updated:** 2026-11-15
**Active Feature:** none. feat-003 (full product definition) is still blocked on the product owner.

### What's Done

- [x] feat-001 Phase 0 foundation (PR #1, PR #2)
- [x] Agent harness, PR template and shipping workflow (PR #3)
- [x] feat-002 Production DB health: `/api/health/db` → 200 in production
- [x] feat-004 Landing page prompt box, rendered as streaming Markdown (now a chat on `POST /api/chat`)
- [x] feat-005 NFL team report tool (experiment): `getTeamReport` via ESPN's public API, shown in the chat UI

### What's Next

1. feat-003: once the product owner answers `docs/PRODUCT.md` §9, replace feat-003 with concrete,
   approved features (each with dependencies and a verifiable outcome).

## Blockers / Risks

- **feat-003**: product owner input. No product features are authorized yet.
- **Local `.env.local` targets Aiven production** once filled in, so `db:migrate` locally migrates production.
  Use the Docker DB for development work.
- **`/api/chat` is unauthenticated with no rate limit**: anyone with the URL can spend Gateway credits.
  Caps: 20 messages, 4000 chars per message, 4096 output tokens, 4 tool steps.
- **feat-005 uses ESPN's unofficial, unauthenticated API**: it can change or break without notice.
- **Risk**: Aiven `developer-1` caps at 15 connections; the app pool uses `max: 5` per instance.

## Decisions Made

- **Harness lives at the repo root** (`init.sh`, `feature_list.json`, `progress.md`, `session-handoff.md`),
  routed from `AGENTS.md`. `CLAUDE.md` stays a one-line `@AGENTS.md` import.
- **`init.sh` installs only when the lockfile is newer than `node_modules`**, to keep startup fast.
  `--quick` skips `next build`.
- **Every finished request ships as a squash-merged PR** once checks are green (`AGENTS.md` "Shipping").
  The only checks are Vercel's, since `main` has no branch protection.
- **Local app port is 3100** (`next dev -p 3100` / `next start -p 3100`): 3000 is used by other
  local services. Vercel ignores this and sets its own port.
- **Prompt box uses `useCompletion` (`@ai-sdk/react` 4.0.173, pinned to match `ai` 7.0.169) and Streamdown 2.7.1**
  for streaming Markdown. The product owner requested it directly (feat-004).
- **The landing page is a `useChat` conversation** (replacing `useCompletion`) so tool calls can be shown. The
  `/api/completion` route was removed. Tools live in `src/lib/ai/tools.ts`; `ChatMessage` types the UI parts.
- **ESLint ignores `.claude/**` and `.agents/**`**: vendored skill example scripts broke `npm run lint` on `main`.
- **PR template** at `.github/pull_request_template.md`. Core sections follow common industry guidance:
  summary/why, changes, how to review, test plan, risk/rollback. Migrations, config and screenshots are conditional.

## Evidence of Completion

- 2026-11-13 harness setup: `./init.sh` passed (lint, typecheck, test, build).
  The harness-creator validator scored 100/100 (baseline before the harness: 24/100).

## History

### 2026-11-15: NFL team report tool (feat-005, experiment)

- Added `getTeamReport` (team name → ESPN record, standing, next game, team-focused news) and switched the
  landing page to `useChat` on `POST /api/chat` with `stopWhen: isStepCount(4)`. The UI shows each tool call.
- `./init.sh` passed. A live local request called the tool for "Eagles" and streamed a grounded summary.

### 2026-11-15: landing page prompt box (feat-004)

- Replaced the landing copy with a textarea → `POST /api/completion` (validated, `streamText` via Gateway) →
  streamed Markdown rendered by Streamdown. Added route, validation and component tests.
- Fixed the lint baseline by ignoring vendored skill dirs. `./init.sh` passed; a local production server
  with a valid model streamed a Markdown reply.

### 2026-11-14: local port 3100

- Pinned `npm run dev` / `npm start` to port 3100 (3000 is used by another local service).
  `./init.sh` passed; `npm run dev` served `http://localhost:3100/` → 200.

### 2026-11-13: feat-002 production DB health

- The first attempt failed with `SELF_SIGNED_CERT_IN_CHAIN` because the CA was saved in Vercel as `DATABASE_CERT`.
  Sensitive vars can't be renamed, so it was re-added as `DATABASE_CA_CERT` (Production + Preview).
  `DATABASE_URL` was extended to Preview.
- Verified `/api/health/db` → 200; ticked the last box in `docs/INFRASTRUCTURE.md`.

### 2026-11-13: harness setup

- Installed the `harness-creator` skill (walkinglabs/learn-harness-engineering) and scaffolded the harness.
- Files: `AGENTS.md` (startup workflow, working rules, definition of done, end of session, shipping),
  `init.sh`, `feature_list.json`, `progress.md`, `session-handoff.md`, `.github/pull_request_template.md`.
