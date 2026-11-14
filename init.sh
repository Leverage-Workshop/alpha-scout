#!/usr/bin/env bash
# Standard startup + verification path for Alpha Scout. Run from the repo root.
#   ./init.sh          lint, typecheck, test, build (the pre-push gate from AGENTS.md)
#   ./init.sh --quick  same, minus `npm run build`
# DB integration tests run only when DATABASE_URL is exported (Vitest does not read .env.local):
#   npm run db:up && npm run db:migrate
#   DATABASE_URL=postgresql://alpha_scout:alpha_scout@localhost:5432/alpha_scout ./init.sh
set -euo pipefail

cd "$(dirname "$0")"

QUICK=false
for arg in "$@"; do
  case "$arg" in
    --quick) QUICK=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

echo "=== Harness Initialization ==="

want_node="$(cat .nvmrc)"
have_node="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$have_node" != "$want_node" ]; then
  echo "Node $want_node required (found $(node -v)). Run: nvm use" >&2
  exit 1
fi

# Install from the committed lockfile only when node_modules is missing or stale.
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "=== npm ci ==="
  npm ci
fi

echo "=== npm run lint ==="
npm run lint

echo "=== npm run typecheck ==="
npm run typecheck

echo "=== npm test ==="
if [ -z "${DATABASE_URL:-}" ]; then
  echo "(DATABASE_URL not set: DB integration tests will be skipped)"
fi
npm test

if [ "$QUICK" = false ]; then
  echo "=== npm run build ==="
  npm run build
fi

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read progress.md and feature_list.json to see current state"
echo "2. Pick ONE unblocked feature (or continue the in-progress one)"
echo "3. Implement only that feature"
echo "4. Re-run ./init.sh and record evidence before claiming done"
