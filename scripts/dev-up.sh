#!/usr/bin/env bash
set -euo pipefail

# Helper script to start dev infra (Docker) in one go.
# Intended to be run from WSL in the repo root.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

cd "$REPO_ROOT"

echo "[dev-up] Starting Docker dev services with docker-compose.dev.yml ..."
docker-compose -f docker-compose.dev.yml up -d

echo "[dev-up] Done. Docker services are up."


