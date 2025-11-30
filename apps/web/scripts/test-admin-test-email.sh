#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo ".env.local not found" >&2
  exit 1
fi

SECRET=$(grep -E '^ADMIN_SECRET_KEY=' .env.local | head -n1 | sed 's/^ADMIN_SECRET_KEY=//; s/^["'\'']\(.*\)["'\'']$/\1/' | tr -d '\r' | xargs)
if [[ -z "$SECRET" ]]; then
  echo "ADMIN_SECRET_KEY missing in .env.local" >&2
  exit 1
fi

TO=${1:-"you@example.com"}

echo "Calling /api/admin/test-email -> $TO"
curl -v -s http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $SECRET" \
  -d "{\"to\":\"$TO\"}"
