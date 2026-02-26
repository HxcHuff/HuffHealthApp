#!/usr/bin/env bash
set -euo pipefail

echo "Scale preflight checks"
echo "======================"

required_vars=(
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  NEXT_PUBLIC_APP_URL
  ENCRYPTION_KEY
  DRIP_ENGINE_MODE
  DRIP_ENGINE_API_KEY
  DRIP_WEBHOOK_SECRET
)

missing=0
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[MISSING] ${var}"
    missing=1
  else
    echo "[OK] ${var}"
  fi
done

if [[ "${DRIP_ENGINE_MODE:-}" != "internal" && "${DRIP_ENGINE_MODE:-}" != "external" ]]; then
  echo "[INVALID] DRIP_ENGINE_MODE must be internal or external"
  missing=1
fi

if [[ "${missing}" -ne 0 ]]; then
  echo
  echo "Preflight failed. Fill missing variables before launch."
  exit 1
fi

echo
echo "Preflight passed."
