# Complete VPS deployment — event_booking + MongoDB

**Your VPS IP:** `163.47.151.250`  
**Your live URL:** http://163.47.151.250:3007  
**MongoDB database name:** `event` (runs inside Docker automatically)

---

## Architecture (what gets installed)

```
Browser → http://163.47.151.250:3007
              ↓
         [Frontend nginx]
              ↓
         [Backend API :8000]
              ↓
         [MongoDB :27017]  ← database name: event
```

You do **not** install MongoDB separately. Docker starts all 3 services together.

---

# PART A — Connect to VPS

## Step 1: Open terminal on your PC

Windows: PowerShell or CMD

## Step 2: SSH into your VPS

```bash
ssh root@163.47.151.250
```

If you have a username:

```bash
ssh yourusername@163.47.151.250
```

Enter your VPS password when prompted.

---

# PART B — Prepare the server

## Step 3: Update the server

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 4: Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
```

## Step 5: Install Git

```bash
sudo apt install -y git
```

---

# PART C — Download the project

## Step 6: Clone from GitHub

```bash
cd ~
git clone https://github.com/Razushrestha/event_booking.git
cd event_booking
```

---

# PART D — Configure environment + MongoDB connection

## Step 7: Generate secret keys

Run these 3 commands and **save each output**:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 24
```

## Step 8: Create `.env` file

```bash
cp deploy/env.vps.example .env
nano .env
```

Paste and edit (use your secrets from Step 7):

```env
APP_DOMAIN=163.47.151.250
APP_PORT=3007
APP_URL=http://163.47.151.250:3007

JWT_SECRET_KEY=paste-first-secret-here
JWT_REFRESH_SECRET=paste-second-secret-here
JWT_GENERATE=paste-first-secret-here
ADMIN_BOOTSTRAP_SECRET=paste-third-secret-here

EMAIL=
PASSWORD=
```

Save: `Ctrl + X` → `Y` → `Enter`

> **MongoDB:** The backend connects automatically via `MONGO_URI=mongodb://mongodb:27017/event` inside Docker. You do not add MongoDB settings to `.env`.

---

# PART E — Firewall

## Step 9: Open ports on the VPS

```bash
sudo ufw allow 22
sudo ufw allow 3007
sudo ufw enable
```

Type `y` to confirm.

## Step 10: Open port in VPS provider panel

Log in to your VPS provider website and add firewall rule:

| Setting | Value |
|---------|-------|
| Direction | Inbound |
| Protocol | TCP |
| Port | 3007 |
| Source | 0.0.0.0/0 |

Also allow port **22** for SSH.

---

# PART F — Deploy app + MongoDB

## Step 11: Run deploy script

```bash
chmod +x deploy/deploy-ip.sh
./deploy/deploy-ip.sh
```

Wait 3–10 minutes. Docker will:
1. Download MongoDB 7 image
2. Build backend (Express API)
3. Build frontend (React app)
4. Start all containers

## Step 12: Check all containers are running

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml ps
```

You should see:

| Container | Status |
|-----------|--------|
| mongodb | running (healthy) |
| backend | running |
| frontend | running |

## Step 13: Check MongoDB is healthy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec mongodb mongosh --eval "db.adminCommand('ping')"
```

Should show: `{ ok: 1 }`

---

# PART G — Populate MongoDB (seed data)

## Step 14: Seed the database

This creates users, events, tickets, bookings, and all sample data in MongoDB:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec backend npm run seed
```

Wait until you see success messages.

## Step 15: Verify data in MongoDB

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec mongodb mongosh event --eval "db.users.countDocuments()"
```

Should return a number greater than 0 (e.g. `6`).

---

# PART H — Test the live site

## Step 16: Test health endpoint

```bash
curl http://127.0.0.1:3007/health
```

## Step 17: Open in browser (on your PC)

| Page | URL |
|------|-----|
| Home | http://163.47.151.250:3007 |
| Login | http://163.47.151.250:3007/login |
| Admin | http://163.47.151.250:3007/admin/dashboard |

## Step 18: Login as admin

| Field | Value |
|-------|-------|
| Email | `admin@eventsolution.com.np` |
| Password | `Admin@123` |

Change this password after first login.

---

# MongoDB reference

## Database details

| Item | Value |
|------|-------|
| Database name | `event` |
| Host (inside Docker) | `mongodb` |
| Port (inside Docker) | `27017` |
| Connection string (internal) | `mongodb://mongodb:27017/event` |

## Open MongoDB shell on VPS

```bash
cd ~/event_booking
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec mongodb mongosh event
```

Useful commands inside mongosh:

```javascript
show collections
db.users.find().pretty()
db.events.find().pretty()
db.tickets.countDocuments()
exit
```

## Re-seed database (reset all data)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec backend npm run seed
```

## Backup MongoDB

```bash
cd ~/event_booking
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec mongodb mongodump --db event --out /data/backup
docker cp $(docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml ps -q mongodb):/data/backup ./mongodb-backup
```

---

# Useful commands later

```bash
cd ~/event_booking

# View all logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml logs -f

# View MongoDB logs only
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml logs -f mongodb

# Restart everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml restart

# Stop everything
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml down

# Update after git push
git pull
./deploy/deploy-ip.sh
```

---

# Troubleshooting

| Problem | Solution |
|---------|----------|
| Site not loading | Check port 3007 open in VPS provider firewall |
| `Permission denied` Docker | Run `newgrp docker` or logout and SSH again |
| MongoDB not healthy | `docker compose ... logs mongodb` |
| Seed fails | Make sure MongoDB container is healthy first |
| Blank page | Wait 2 min, hard refresh `Ctrl+Shift+R` |
| Login fails | Re-run seed command |

---

# Quick copy-paste (all commands in order)

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install -y git
cd ~
git clone https://github.com/Razushrestha/event_booking.git
cd event_booking
cp deploy/env.vps.example .env
nano .env
sudo ufw allow 22 && sudo ufw allow 3007 && sudo ufw enable
chmod +x deploy/deploy-ip.sh
./deploy/deploy-ip.sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec backend npm run seed
```

Then open: **http://163.47.151.250:3007**
