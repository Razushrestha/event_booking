#!/usr/bin/env bash
# Quick fix for nginx 500 error (permission / missing dist)
set -euo pipefail

cd ~/event_booking

echo "==> Rebuilding frontend..."
cp deploy/native/frontend.env.example frontend/.env
npm run build

echo "==> Copying to /var/www/event-booking..."
sudo mkdir -p /var/www/event-booking
sudo rm -rf /var/www/event-booking/dist
sudo cp -r frontend/dist /var/www/event-booking/
sudo chown -R www-data:www-data /var/www/event-booking

echo "==> Updating nginx..."
sudo cp deploy/native/nginx.conf /etc/nginx/sites-available/event-booking
sudo nginx -t
sudo systemctl reload nginx

echo "==> Restarting API..."
pm2 restart event-booking-api

echo "==> Testing..."
curl -s http://127.0.0.1:3007/health || echo "Health check failed — run: pm2 logs event-booking-api"
echo ""
echo "Done. Open: http://163.47.151.250:3007"
