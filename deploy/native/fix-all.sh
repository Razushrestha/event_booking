#!/usr/bin/env bash
# Fix: Failed to load home page + Login failed
set -euo pipefail

cd ~/event_booking

echo "==> 1. Start MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

echo "==> 2. Check backend/.env exists..."
if [ ! -f backend/.env ]; then
  echo "Creating backend/.env from example..."
  cp deploy/native/backend.env.example backend/.env
  echo "WARNING: Edit backend/.env with your JWT secrets if not already set"
fi

echo "==> 3. Install deps & rebuild frontend with correct API URL..."
npm install
cp deploy/native/frontend.env.example frontend/.env
npm run build

echo "==> 4. Publish frontend..."
sudo mkdir -p /var/www/event-booking
sudo rm -rf /var/www/event-booking/dist
sudo cp -r frontend/dist /var/www/event-booking/
sudo chown -R www-data:www-data /var/www/event-booking

echo "==> 5. Restart API..."
pm2 delete event-booking-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "==> 6. Reload Nginx..."
sudo cp deploy/native/nginx.conf /etc/nginx/sites-available/event-booking
sudo ln -sf /etc/nginx/sites-available/event-booking /etc/nginx/sites-enabled/event-booking
sudo nginx -t
sudo systemctl reload nginx

echo "==> 7. Wait for API..."
sleep 5

echo "==> 8. Seed database (creates admin user)..."
npm run seed

echo "==> 9. Test..."
echo -n "Health: "; curl -s http://127.0.0.1:3007/health | head -c 80; echo
echo -n "Users: "; mongosh event --quiet --eval "db.users.countDocuments()"

echo ""
echo "DONE. Open: http://163.47.151.250:3007"
echo "Login: admin@eventsolution.com.np / Admin@123"
