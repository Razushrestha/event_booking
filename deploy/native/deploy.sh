#!/usr/bin/env bash
# Deploy event_booking without Docker
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

APP_ROOT="$ROOT_DIR"

echo "==> Project: $APP_ROOT"

if [ ! -f "backend/.env" ]; then
  echo "Missing backend/.env — run: cp deploy/native/backend.env.example backend/.env && nano backend/.env"
  exit 1
fi

echo "==> Installing dependencies..."
npm install

echo "==> Building frontend..."
cp deploy/native/frontend.env.example frontend/.env
npm run build

echo "==> Preparing backend uploads folder..."
mkdir -p backend/uploads

echo "==> Starting API with PM2..."
pm2 delete event-booking-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Configuring Nginx on port 3007..."
sudo sed "s|APP_ROOT|${APP_ROOT}|g" deploy/native/nginx.conf | sudo tee /etc/nginx/sites-available/event-booking > /dev/null
sudo ln -sf /etc/nginx/sites-available/event-booking /etc/nginx/sites-enabled/event-booking
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> Waiting for API health..."
for i in {1..20}; do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo "Deployment complete (no Docker)."
echo "Site:  http://163.47.151.250:3007"
echo "API:   http://163.47.151.250:3007/api/v1/"
echo ""
echo "Seed database (first time):"
echo "  cd $APP_ROOT && npm run seed"
echo ""
echo "PM2 logs:"
echo "  pm2 logs event-booking-api"
