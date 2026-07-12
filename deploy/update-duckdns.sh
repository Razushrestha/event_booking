#!/usr/bin/env bash
# Updates DuckDNS to point eventbooking.duckdns.org to this server's public IP
# Usage:
#   export DUCKDNS_TOKEN=your-token-from-duckdns.org
#   ./deploy/update-duckdns.sh

set -euo pipefail

DOMAIN="${DUCKDNS_DOMAIN:-eventbooking}"
TOKEN="${DUCKDNS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Set your DuckDNS token first:"
  echo "  export DUCKDNS_TOKEN=your-token"
  echo "  ./deploy/update-duckdns.sh"
  exit 1
fi

RESULT=$(curl -s "https://www.duckdns.org/update?domains=${DOMAIN}&token=${TOKEN}&ip=")
echo "DuckDNS update: $RESULT"
echo "Hostname: http://${DOMAIN}.duckdns.org"
