#!/usr/bin/env bash
set -euo pipefail

# Helper script to start dev infra (Docker) and cron for validate-forest in one go.
# Intended to be run from WSL in the repo root.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

cd "$REPO_ROOT"

echo "[dev-up] Starting Docker dev services with docker-compose.dev.yml ..."
docker-compose -f docker-compose.dev.yml up -d

echo "[dev-up] Starting cron service (for hourly validate-forest) via backend npm script ..."
cd "$REPO_ROOT/backend"
npm run start-cron

echo "[dev-up] Done. Docker services are up and cron is running."


