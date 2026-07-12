# event_booking

Event management platform with an Express/MongoDB API and a React + Vite frontend.

## Project structure

```
Eventsolution/
├── backend/          # Express API (port 8000)
├── frontend/         # React + TypeScript + Vite (port 5173)
├── package.json      # Root workspace scripts
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or a remote connection string

## Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Update `backend/.env` with your MongoDB URI and JWT secrets.  
   The frontend `.env.example` already points to `http://localhost:8000`.

3. Start both apps in development:

   ```bash
   npm run dev
   ```

4. Populate the database with sample data:

   ```bash
   npm run seed
   ```

   Or run them separately:

   ```bash
   npm run dev:backend    # http://localhost:8000
   npm run dev:frontend   # http://localhost:5173
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend and frontend together |
| `npm run dev:backend` | Start API with nodemon |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run seed` | Reset and populate MongoDB with sample data |
| `npm run build` | Build frontend for production |
| `npm run start:backend` | Run API in production mode |
| `npm run start:frontend` | Preview production frontend build |

## Production checklist

Before deploying:

1. Set strong secrets in `backend/.env`:
   - `JWT_SECRET_KEY`
   - `JWT_REFRESH_SECRET`
   - `ADMIN_BOOTSTRAP_SECRET` (only for first admin setup)
2. Set `NODE_ENV=production` and `FRONTEND_URL` to your live frontend URL.
3. Use MongoDB Atlas or a managed MongoDB instance.
4. Do not expose `POST /admin/add` without the bootstrap secret header:
   - `x-bootstrap-secret: <ADMIN_BOOTSTRAP_SECRET>`
5. Health check endpoint: `GET /health`

## API

- Base URL: `http://localhost:8000/api/v1`
- Static uploads: `http://localhost:8000`

## Tech stack

**Backend:** Express, MongoDB/Mongoose, JWT, WebSockets, Nodemailer  
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, Firebase

## Docker

Run the full stack (MongoDB, API, and frontend) with Docker:

```bash
cp deploy/.env.production.example .env
docker compose up --build -d
```

Or use the npm scripts:

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1 |
| MongoDB | localhost:27017 |

The frontend container proxies `/api` and `/uploads` to the backend, so the app works without CORS issues in Docker.

## VPS deployment

### No domain yet? Use your VPS IP

Full guide: **[deploy/DEPLOY-IP.md](deploy/DEPLOY-IP.md)**

```bash
cp deploy/.env.production.example .env
# Set APP_URL=http://YOUR_VPS_IP:3007 in .env
chmod +x deploy/deploy-ip.sh
./deploy/deploy-ip.sh
npm run docker:seed
```

Your site: **http://163.47.151.250:3007**

### With a domain later (eventbooking.com)

Guide: **[deploy/DEPLOY.md](deploy/DEPLOY.md)**

```bash
# Set APP_URL=https://eventbooking.com in .env
./deploy/deploy.sh
sudo certbot --nginx -d eventbooking.com
```

## Git

This repo is initialized with git. To make your first commit:

```bash
git add .
git commit -m "Initial commit: EventSolution monorepo"
```
