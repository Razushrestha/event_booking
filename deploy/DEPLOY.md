# Deploy EventSolution to VPS (eventbooking)

This guide deploys the app at **https://eventbooking.com** (replace with your real domain if different).

## What you need

- Ubuntu 22.04+ VPS (2 GB RAM minimum recommended)
- Domain `eventbooking.com` pointed to your VPS IP (A record for `@` and `www`)
- SSH access to the server

## 1. Prepare the VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Install nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx git
```

## 2. Upload the project

**Option A — Git (recommended)**

```bash
cd ~
git clone <your-repo-url> eventsolution
cd eventsolution
```

**Option B — Copy from your PC**

```bash
scp -r Eventsolution user@YOUR_VPS_IP:~/eventsolution
```

## 3. Configure environment

```bash
cd ~/eventsolution
cp deploy/.env.production.example .env
nano .env
```

Update these values:

| Variable | Example |
|----------|---------|
| `APP_DOMAIN` | `eventbooking.com` |
| `APP_URL` | `https://eventbooking.com` |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
| `ADMIN_BOOTSTRAP_SECRET` | `openssl rand -hex 24` |

If your domain is different (e.g. `eventbooking.yourname.com.np`), use that everywhere instead of `eventbooking.com`.

## 4. Start the app with Docker

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

The app runs internally on **http://127.0.0.1:8080**.

## 5. Seed the database (first time only)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npm run seed
```

Default admin login after seed:

- Email: `admin@eventsolution.com.np`
- Password: `Admin@123`

**Change this password immediately after first login.**

## 6. Configure nginx on the VPS

Edit the domain in the config if yours is not `eventbooking.com`.

**First time (before SSL):**

```bash
sudo cp deploy/nginx/eventbooking.initial.conf /etc/nginx/sites-available/eventbooking
sudo ln -sf /etc/nginx/sites-available/eventbooking /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl reload nginx
```

**Then add HTTPS with certbot:**

```bash
sudo certbot --nginx -d eventbooking.com -d www.eventbooking.com
```

After certbot succeeds, optionally switch to the full config:

```bash
sudo cp deploy/nginx/eventbooking.conf /etc/nginx/sites-available/eventbooking
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Verify

- Site: https://eventbooking.com
- Health: https://eventbooking.com/health (proxied to backend)
- API: https://eventbooking.com/api/v1/

## 8. Create admin (if not using seed)

```bash
curl -X POST https://eventbooking.com/api/v1/admin/add \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_ADMIN_BOOTSTRAP_SECRET" \
  -d '{"email":"admin@eventbooking.com","password":"YourStrongPassword123"}'
```

## 9. Firebase Google sign-in (optional)

In [Firebase Console](https://console.firebase.google.com):

1. Add **Authorized domain**: `eventbooking.com`
2. Copy project ID into `.env` as `FIREBASE_PROJECT_ID` and `VITE_PUBLIC_FIREBASE_PROJECT_ID`
3. Rebuild frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d frontend
```

## Updating after code changes

```bash
cd ~/eventsolution
git pull   # if using git
./deploy/deploy.sh
```

## Useful commands

```bash
# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Stop
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Backup MongoDB volume
docker run --rm -v eventsolution_mongodb_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/mongodb-backup.tar.gz /data
```

## Subdomain instead of eventbooking.com?

If your URL is e.g. `eventbooking.mydomain.com`:

1. Set `APP_DOMAIN=eventbooking.mydomain.com` and `APP_URL=https://eventbooking.mydomain.com` in `.env`
2. Replace `eventbooking.com` with your subdomain in `deploy/nginx/eventbooking.conf`
3. Run certbot with your subdomain: `sudo certbot --nginx -d eventbooking.mydomain.com`
