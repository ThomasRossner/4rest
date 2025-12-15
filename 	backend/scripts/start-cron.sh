#!/usr/bin/env bash
set -euo pipefail

echo "[start-cron] Starting cron service in WSL (requires sudo)..."

if ! command -v service >/dev/null 2>&1; then
  echo "[start-cron] 'service' command not found. Is this a standard Ubuntu/Debian WSL distro?"
  exit 1
fi

sudo service cron start

echo "[start-cron] Cron service started. Your 02:00 validate-forest job (from crontab) will now run automatically."


