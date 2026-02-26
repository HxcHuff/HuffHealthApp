#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.sandbox.local"
ENV_TEMPLATE="${ROOT_DIR}/.env.sandbox.example"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.sandbox.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from template."
fi

set -a
source "${ENV_FILE}"
set +a

run_prisma_migrate() {
  # Sandbox uses schema push to avoid migration-history conflicts in local preview environments.
  DATABASE_URL="${DATABASE_URL}" npx prisma db push --accept-data-loss
}

run_prisma_seed() {
  DATABASE_URL="${DATABASE_URL}" npx tsx prisma/seed.ts
}

run_app() {
  DATABASE_URL="${DATABASE_URL}" \
  NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
  NEXTAUTH_URL="${NEXTAUTH_URL}" \
  NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
  NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME:-HuffHealth}" \
  NEXT_PUBLIC_APP_TAGLINE="${NEXT_PUBLIC_APP_TAGLINE:-CRM & Client Portal}" \
  RESEND_API_KEY="${RESEND_API_KEY:-}" \
  FACEBOOK_APP_ID="${FACEBOOK_APP_ID:-}" \
  FACEBOOK_APP_SECRET="${FACEBOOK_APP_SECRET:-}" \
  FACEBOOK_VERIFY_TOKEN="${FACEBOOK_VERIFY_TOKEN:-}" \
  ENCRYPTION_KEY="${ENCRYPTION_KEY:-}" \
  DRIP_ENGINE_URL="${DRIP_ENGINE_URL:-}" \
  DRIP_ENGINE_API_KEY="${DRIP_ENGINE_API_KEY:-}" \
  NEXT_PUBLIC_DRIP_ENGINE_URL="${NEXT_PUBLIC_DRIP_ENGINE_URL:-}" \
  npm run dev
}

cmd="${1:-}"

case "${cmd}" in
  up)
    docker compose -f "${COMPOSE_FILE}" up -d
    ;;
  down)
    docker compose -f "${COMPOSE_FILE}" down
    ;;
  setup)
    docker compose -f "${COMPOSE_FILE}" up -d
    run_prisma_migrate
    run_prisma_seed
    ;;
  reset)
    docker compose -f "${COMPOSE_FILE}" down -v
    docker compose -f "${COMPOSE_FILE}" up -d
    run_prisma_migrate
    run_prisma_seed
    ;;
  dev)
    docker compose -f "${COMPOSE_FILE}" up -d
    run_prisma_migrate
    run_prisma_seed
    run_app
    ;;
  *)
    echo "Usage: bash ./scripts/sandbox.sh {up|down|setup|reset|dev}"
    exit 1
    ;;
esac
