# Free hostname for event_booking (no paid domain needed)

Use **eventbooking.duckdns.org** instead of `http://163.47.151.250:3007`

> DNS names cannot contain underscores. Use **eventbooking** or **event-booking**, not `event_booking`.

## Your new URL

```
http://eventbooking.duckdns.org:3007
```

Or without port (if you open port 80):

```
http://eventbooking.duckdns.org
```

---

## Step 1 — Register free hostname (5 minutes)

1. Open https://www.duckdns.org
2. Sign in with Google / GitHub / Twitter
3. In **sub domain**, type: `eventbooking`
4. Your domain will be: `eventbooking.duckdns.org`
5. In **current ip**, enter: `163.47.151.250`
6. Click **add domain**
7. Copy your **token** from the DuckDNS page (you need it for auto-updates)

---

## Step 2 — Update VPS `.env`

SSH into your VPS:

```bash
cd ~/event_booking
nano .env
```

Set:

```env
APP_HOSTNAME=eventbooking.duckdns.org
APP_DOMAIN=eventbooking.duckdns.org
APP_PORT=3007
APP_URL=http://eventbooking.duckdns.org:3007
```

Or copy the ready file:

```bash
cp deploy/env.hostname.example .env
nano .env   # add your JWT secrets
```

---

## Step 3 — Redeploy

```bash
./deploy/deploy-ip.sh
```

---

## Step 4 — Test

Wait 1–2 minutes, then open:

```
http://eventbooking.duckdns.org:3007
```

---

## Step 5 — Keep hostname pointing to your VPS (optional)

If your VPS IP ever changes, run this on the server (replace YOUR_TOKEN):

```bash
echo 'curl -s "https://www.duckdns.org/update?domains=eventbooking&token=YOUR_TOKEN&ip=" >> ~/duckdns.log' | crontab -
```

Or use the script:

```bash
chmod +x deploy/update-duckdns.sh
# Edit deploy/update-duckdns.sh with your token first
./deploy/update-duckdns.sh
```

---

## Alternative names on DuckDNS

| You want | Register as | Your URL |
|----------|-------------|----------|
| event_booking | `eventbooking` | http://eventbooking.duckdns.org:3007 |
| event-booking | `event-booking` | http://event-booking.duckdns.org:3007 |
| eventbooking | `eventbooking` | http://eventbooking.duckdns.org:3007 |

---

## Open port 80 for URL without `:3007`

```bash
sudo ufw allow 80
```

Redeploy — the app is also available on port 80:

```
http://eventbooking.duckdns.org
```

Update `.env`:

```env
APP_URL=http://eventbooking.duckdns.org
```

Then redeploy again.
