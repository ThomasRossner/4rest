#!/usr/bin/env bash
set -euo pipefail

echo "[start-cron] Starting cron service in WSL (requires sudo)..."

if ! command -v service >/dev/null 2>&1; then
  echo "[start-cron] 'service' command not found. Is this a standard Ubuntu/Debian WSL distro?"
  exit 1
fi

sudo service cron start

echo "[start-cron] Cron service started."

# Ensure hourly validate-forest job is present in crontab
CRON_JOB="0 * * * * /mnt/c/Users/sergejp/Documents/GitHub/roots-of-impact/backend/scripts/run-validate-forest.sh"

echo "[start-cron] Ensuring hourly validate-forest cron job is configured..."

EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if ! printf '%s\n' "$EXISTING_CRON" | grep -Fq "$CRON_JOB"; then
  printf '%s\n%s\n' "$EXISTING_CRON" "$CRON_JOB" | crontab -
  echo "[start-cron] Added cron job: $CRON_JOB"
else
  echo "[start-cron] Cron job already present."
fi

echo "[start-cron] Done. Cron is running and validate-forest will run every hour."

