#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy deploy/.env.production.example to .env and edit it first."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

APP_PORT="${APP_PORT:-3007}"

echo "==> Building and starting production containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

echo "==> Waiting for app health..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Deployment complete."
echo "App is listening on http://127.0.0.1:${APP_PORT}"
echo "Point your domain (eventbooking.com) nginx config to that port."
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npm run seed"
