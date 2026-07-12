# Deploy event_booking to VPS (no domain — use IP on port 3007)

Host the app at **http://YOUR_VPS_IP:3007**

Example: your site will be at **http://163.47.151.250:3007**

## What you need

- Ubuntu 22.04+ VPS
- Your VPS public IP address
- Port **3007** open in firewall
- SSH access

## 1. Prepare the VPS

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
sudo apt install -y git
```

## 2. Clone the project

```bash
cd ~
git clone https://github.com/Razushrestha/event_booking.git
cd event_booking
```

## 3. Configure environment

```bash
cp deploy/.env.production.example .env
nano .env
```

**Set your VPS IP and port 3007:**

```env
APP_DOMAIN=163.47.151.250
APP_PORT=3007
APP_URL=http://163.47.151.250:3007

JWT_SECRET_KEY=<run: openssl rand -hex 32>
JWT_REFRESH_SECRET=<run: openssl rand -hex 32>
ADMIN_BOOTSTRAP_SECRET=<run: openssl rand -hex 24>
```

Replace `123.45.67.89` with your actual IP.

## 4. Open port 3007 on the VPS

In your VPS provider firewall panel, allow **inbound TCP port 3007**.

On the server:

```bash
sudo ufw allow 3007
sudo ufw allow 22
sudo ufw enable
```

## 5. Deploy

```bash
chmod +x deploy/deploy-ip.sh
./deploy/deploy-ip.sh
```

## 6. Seed the database (first time)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec backend npm run seed
```

Default admin login:

- Email: `admin@eventsolution.com.np`
- Password: `Admin@123`

## 7. Verify

- Site: `http://YOUR_VPS_IP:3007`
- Health: `http://YOUR_VPS_IP:3007/health`
- API: `http://YOUR_VPS_IP:3007/api/v1/`

## Database (MongoDB)

MongoDB runs inside Docker on port **27017** (internal only). The backend connects automatically — no extra setup needed.

To access the database on the VPS:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml exec mongodb mongosh event
```

## Useful commands

```bash
# Logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml logs -f

# Restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml restart

# Stop
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ip.yml down

# Update code
git pull
./deploy/deploy-ip.sh
```

## When you get a domain later

Update `.env` with your domain and port 80/443, then follow `deploy/DEPLOY.md`.
