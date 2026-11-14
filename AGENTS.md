# Agent guidance

Read `docs/PRODUCT.md` first. Functional requirements (§7) are TBD: don't build speculative
research, ingestion or chat features until the product owner defines them.

## Startup Workflow

Before writing code:

1. Read this file and `docs/PRODUCT.md` (plus `docs/INFRASTRUCTURE.md` for DB/hosting work).
2. Read `progress.md` (current state, blockers) and `feature_list.json` (feature status).
3. Run `./init.sh`. If the baseline fails, fix that before adding scope.
4. Check recent work with `git log --oneline -5`.

## Verification Commands

- `./init.sh`: the pre-push gate (`npm ci` when the lockfile changed, then lint, typecheck,
  test, build). `./init.sh --quick` skips the build.
- DB integration tests run only when `DATABASE_URL` is exported (Vitest does not read
  `.env.local`): `npm run db:up && npm run db:migrate`, then
  `DATABASE_URL=postgresql://alpha_scout:alpha_scout@localhost:5432/alpha_scout ./init.sh`.
  Required for any change touching `src/lib/db`, `scripts/` or `db/migrations`.

## Working Rules

- **One feature at a time**: work on the `in-progress` feature in `feature_list.json`, or move
  exactly one unblocked `not-started` feature to `in-progress`.
- **Stay in scope**: only build what a `feature_list.json` entry describes. New features are added
  only after the product owner approves them; never invent entries to justify work.
- **Blocked means blocked**: don't work around a `blocked_on` reason; report it.

## Definition of Done

A feature is done only when:

- [ ] The behavior in its `description` is implemented
- [ ] `./init.sh` passes, plus DB integration tests if the DB was touched
- [ ] Evidence (commands run, results, commit/PR) is recorded in the feature's `evidence`
- [ ] `progress.md` reflects the new state

## End of Session

1. Update `progress.md`: Current State plus a dated History entry.
2. Update `feature_list.json` status and evidence.
3. For multi-session work, fill in `session-handoff.md`.
4. Ship the work (below) and leave the tree clean on `main` so `./init.sh` runs next time.

## Shipping: every finished request ends in a merged PR

When the work for a request is finished and `./init.sh` passes, open a PR and merge it without
asking again. Skip this only when the request changed no files, or the user says not to merge.

1. **Branch** off an up-to-date `main` as `<type>/<short-name>` (types: feat, fix, refactor, docs,
   test, chore, perf, ci). Never commit directly to `main`.
2. **Commit** with a conventional message (`<type>: <description>`), including the harness
   updates (`progress.md`, `feature_list.json`) in the same PR.
3. **Open the PR**: `git push -u origin HEAD`, then
   `gh pr create --title "<type>: <description>" --body-file <file>`. Write the body file by
   filling in every section of `.github/pull_request_template.md`; `gh` does not apply the
   template when `--body`/`--body-file` is given. Delete sections that don't apply; tick only
   checks you actually ran.
4. **Wait for checks**: `gh pr checks --watch`. The Vercel checks can take a minute to appear; if
   none are reported yet, wait briefly and re-run.
5. **Merge** once every check passes: `gh pr merge --squash --delete-branch`, then
   `git checkout main && git pull --ff-only`.
6. **Report** the PR URL and the merge commit to the user.

If a check fails or the PR conflicts, fix it on the branch and repeat from step 4. Never merge a
red PR, never use `gh pr merge --admin`, and never force-push `main`. If you can't get it green,
leave the PR open, record the blocker in `progress.md`, and tell the user.

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
