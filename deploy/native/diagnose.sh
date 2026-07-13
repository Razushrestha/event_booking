#!/usr/bin/env bash
# Diagnose API / login / home page issues
set -euo pipefail

cd ~/event_booking

echo "========== 1. MongoDB =========="
sudo systemctl is-active mongod || echo "FAIL: MongoDB not running"

echo ""
echo "========== 2. PM2 API =========="
pm2 status || echo "PM2 not running"

echo ""
echo "========== 3. Backend .env =========="
if [ -f backend/.env ]; then
  grep -E "^(MONGO_URI|FRONTEND_URL|PORT|NODE_ENV)=" backend/.env || true
else
  echo "FAIL: backend/.env missing"
fi

echo ""
echo "========== 4. API direct (port 8000) =========="
curl -s http://127.0.0.1:8000/health || echo "FAIL: API not responding on port 8000"

echo ""
echo "========== 5. API via Nginx (port 3007) =========="
curl -s http://127.0.0.1:3007/health || echo "FAIL: Nginx proxy not working"
curl -s http://127.0.0.1:3007/api/v1/ | head -c 200 || echo "FAIL: Landing API not working"

echo ""
echo "========== 6. Database users =========="
mongosh event --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "FAIL: Cannot query users (DB empty or MongoDB down)"

echo ""
echo "========== 7. Frontend build URL =========="
grep -o 'baseURL:"[^"]*"' /var/www/event-booking/dist/assets/*.js 2>/dev/null | head -1 || \
grep -o "VITE_BACKEND_URL[^,]*" frontend/.env 2>/dev/null || echo "Check frontend/.env"

echo ""
echo "========== 8. Nginx errors (last 5 lines) =========="
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || true

echo ""
echo "========== 9. PM2 logs (last 10 lines) =========="
pm2 logs event-booking-api --lines 10 --nostream 2>/dev/null || true
