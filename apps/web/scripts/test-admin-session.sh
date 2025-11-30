#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://127.0.0.1:3000}
EMAIL=${ADMIN_EMAIL:-admin.test+shfmk@gmail.com}
PASS=${ADMIN_PASSWORD:-changeme}

COOKIE_JAR=$(mktemp)

echo "1) Login..."
curl -s -i -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  "$BASE_URL/api/admin/login" | head -n 20

echo
echo "Cookies saved to $COOKIE_JAR"

echo
echo "2) Access protected route with cookies..."
curl -s -b "$COOKIE_JAR" -o /dev/null -w "HTTP %{http_code}\\n" "$BASE_URL/admin/registrations"

rm -f "$COOKIE_JAR"
