#!/usr/bin/env bash
set -euo pipefail

# Start dev infra (PostgreSQL + Redis). Funktioniert mit Docker Desktop, Colima oder anderer Engine.
# Bei Colima: zuerst "colima start", ggf. DOCKER_HOST=unix://$HOME/.colima/default/docker.sock setzen.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

cd "$REPO_ROOT"

if ! docker info &>/dev/null; then
  echo "[dev-up] Docker ist nicht erreichbar. Bei Colima: 'colima start' ausführen."
  echo "          Optional: export DOCKER_HOST=unix://\$HOME/.colima/default/docker.sock"
  exit 1
fi

# Compose-Variante (docker compose oder docker-compose)
if docker compose version &>/dev/null 2>&1; then
  echo "[dev-up] Starte mit docker compose ..."
  COMPOSE_FILE=docker-compose.dev.yml docker compose up -d
elif command -v docker-compose &>/dev/null; then
  echo "[dev-up] Starte mit docker-compose ..."
  docker-compose -f docker-compose.dev.yml up -d
else
  echo "[dev-up] Starte Postgres und Redis per docker run ..."
  docker run -d --name roots-postgres -e POSTGRES_USER=roots_user \
    -e POSTGRES_PASSWORD=roots_password -e POSTGRES_DB=roots_of_impact \
    -p 5432:5432 postgres:15-alpine 2>/dev/null || true
  docker run -d --name roots-redis -p 6379:6379 redis:7-alpine 2>/dev/null || true
  docker start roots-postgres roots-redis 2>/dev/null || true
fi

echo "[dev-up] Done. PostgreSQL (5432) und Redis (6379) laufen."


