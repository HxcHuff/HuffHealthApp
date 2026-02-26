#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--approve" ]]; then
  echo "Refusing live deploy without explicit approval."
  echo "Usage: npm run deploy:live -- --approve"
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI is not installed. Run: npm i -g netlify-cli"
  exit 1
fi

export NETLIFY_APPROVED_DEPLOY=true
echo "Running approved production deploy..."
netlify deploy --build --prod
