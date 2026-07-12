#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env file. Run: cp deploy/env.vps.example .env"
  exit 1
fi

chmod +x deploy/validate-env.sh
./deploy/validate-env.sh .env

APP_PORT="$(grep '^APP_PORT=' .env | cut -d= -f2- | tr -d '[:space:]' || echo 3007)"
APP_URL="$(grep '^APP_URL=' .env | cut -d= -f2- | tr -d '[:space:]')"

if [ -z "$APP_URL" ]; then
  echo "Set APP_URL in .env, e.g.:"
  echo "  APP_URL=http://163.47.151.250:3007"
  exit 1
fi

echo "==> Deploying event_booking at $APP_URL"
echo "==> App port: $APP_PORT"
echo "==> Building and starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml up --build -d

echo "==> Waiting for app health..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo "Deployment complete."
echo "Open in browser: $APP_URL"
echo ""
echo "Seed database (first time):"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec backend npm run seed"
