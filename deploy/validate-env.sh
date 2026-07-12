#!/usr/bin/env bash
# Checks .env file format before deploy
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

ERRORS=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    echo "ERROR: Invalid line (must be KEY=value):"
    echo "  $line"
    ERRORS=$((ERRORS + 1))
  fi
done < "$ENV_FILE"

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "Fix your .env file. Each secret must have a name, for example:"
  echo "  JWT_SECRET_KEY=your-secret-here"
  echo "NOT just:"
  echo "  your-secret-here"
  exit 1
fi

for key in APP_URL JWT_SECRET_KEY JWT_REFRESH_SECRET ADMIN_BOOTSTRAP_SECRET; do
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    echo "ERROR: Missing required variable: $key"
    ERRORS=$((ERRORS + 1))
  fi
done

if grep -q "replace-with" "$ENV_FILE"; then
  echo "WARNING: .env still contains placeholder values (replace-with-...)"
fi

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi

echo "OK: $ENV_FILE format is valid"
