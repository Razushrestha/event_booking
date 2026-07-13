#!/usr/bin/env bash
# One-time VPS setup — Node.js, MongoDB, Nginx, PM2 (no Docker)
set -euo pipefail

echo "==> Updating system..."
sudo apt update && sudo apt upgrade -y

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

echo "==> Installing MongoDB 7..."
if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt update
  sudo apt install -y mongodb-org
fi

sudo systemctl start mongod
sudo systemctl enable mongod

echo "==> Installing Nginx and PM2..."
sudo apt install -y nginx git
sudo npm install -g pm2

echo "==> Opening firewall ports..."
sudo ufw allow 22
sudo ufw allow 3007
sudo ufw --force enable

echo ""
echo "MongoDB status:"
sudo systemctl status mongod --no-pager | head -5
echo ""
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo ""
echo "Setup complete. Next: clone repo, configure .env, run ./deploy/native/deploy.sh"
