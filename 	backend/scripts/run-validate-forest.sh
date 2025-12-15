#!/usr/bin/env bash
set -euo pipefail

# Run the forest validation/fix script from the backend root so that .env is picked up correctly.
# This script is intended to be called from cron or other schedulers.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

mkdir -p logs

echo "[$(date --iso-8601=seconds)] Starting validate-forest…" >> logs/validate-forest.log
npm run validate-forest >> logs/validate-forest.log 2>&1
echo "[$(date --iso-8601=seconds)] validate-forest finished." >> logs/validate-forest.log


