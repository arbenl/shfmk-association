#!/usr/bin/env bash
set -euo pipefail

# Simple logout regression check.
# Requires: BASE_URL (default http://localhost:3000), ADMIN_EMAIL, ADMIN_PASSWORD
BASE_URL=${BASE_URL:-http://localhost:3000}

if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "ADMIN_EMAIL and ADMIN_PASSWORD are required."
  exit 1
fi

COOKIE_JAR=$(mktemp)
cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

echo "Logging in..."
curl -s -D "$COOKIE_JAR" -o /dev/null \
  -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"

echo "Checking protected page..."
curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE_URL/admin/registrations" | grep -qE "200|302"

echo "Logging out..."
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -o /dev/null -X POST "$BASE_URL/api/admin/logout"

echo "Re-check protected page (should redirect)..."
HTTP_CODE=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE_URL/admin/registrations")
if [[ "$HTTP_CODE" != "302" && "$HTTP_CODE" != "401" && "$HTTP_CODE" != "403" ]]; then
  echo "Expected redirect/unauthorized after logout, got $HTTP_CODE"
  exit 1
fi

echo "Logout test passed."
