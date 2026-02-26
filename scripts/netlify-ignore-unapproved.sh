#!/usr/bin/env bash
set -euo pipefail

if [[ "${NETLIFY_APPROVED_DEPLOY:-}" == "true" ]]; then
  echo "Approved deploy detected (NETLIFY_APPROVED_DEPLOY=true); build will proceed."
  exit 1
fi

echo "Skipping Netlify auto-deploy to reduce deploy spend."
echo "Set NETLIFY_APPROVED_DEPLOY=true for an approved deploy."
exit 0
