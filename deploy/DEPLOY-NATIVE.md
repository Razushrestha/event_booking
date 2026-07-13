# Deploy event_booking on VPS — NO DOCKER

**URL:** http://163.47.151.250:3007  
**MongoDB:** installed on the server at `mongodb://127.0.0.1:27017/event`

---

## STEP 1 — SSH into VPS

```bash
ssh root@163.47.151.250
```

---

## STEP 2 — One-time server setup (Node + MongoDB + Nginx + PM2)

```bash
cd ~
git clone https://github.com/Razushrestha/event_booking.git
cd event_booking
git pull
chmod +x deploy/native/install.sh deploy/native/deploy.sh
./deploy/native/install.sh
```

This installs:
- Node.js 20
- MongoDB 7
- Nginx
- PM2 (keeps API running)

---

## STEP 3 — Configure backend `.env`

```bash
cd ~/event_booking
cp deploy/native/backend.env.example backend/.env
nano backend/.env
```

Default file already has your secrets and IP. Save if unchanged: `Ctrl+X` → `Y` → `Enter`

---

## STEP 4 — Deploy app

```bash
cd ~/event_booking
./deploy/native/deploy.sh
```

This will:
1. Install npm packages
2. Build frontend
3. Start backend with PM2 on port 8000
4. Configure Nginx on port 3007

---

## STEP 5 — Seed MongoDB (first time)

```bash
cd ~/event_booking
npm run seed
```

---

## STEP 6 — Verify

```bash
# MongoDB running?
sudo systemctl status mongod

# API running?
pm2 status

# Site health
curl http://127.0.0.1:3007/health
```

Open in browser: **http://163.47.151.250:3007**

**Admin login:**
- Email: `admin@eventsolution.com.np`
- Password: `Admin@123`

---

## MongoDB commands

```bash
# Open MongoDB shell
mongosh event

# Count users
mongosh event --eval "db.users.countDocuments()"

# Re-seed
cd ~/event_booking && npm run seed
```

---

## Useful commands

```bash
# API logs
pm2 logs event-booking-api

# Restart API
pm2 restart event-booking-api

# Restart Nginx
sudo systemctl reload nginx

# Update after git push
cd ~/event_booking
git pull
./deploy/native/deploy.sh
```

---

## Architecture (no Docker)

```
Browser → http://163.47.151.250:3007
              ↓
           [Nginx :3007]
           /          \
    frontend/dist    /api → [Node.js PM2 :8000]
                              ↓
                         [MongoDB :27017]
                         database: event
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site not loading | Open port 3007 in VPS provider firewall |
| MongoDB error | `sudo systemctl start mongod` |
| API not running | `pm2 restart event-booking-api` |
| 502 Bad Gateway | `pm2 logs event-booking-api` |
