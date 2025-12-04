#!/bin/sh
# Backend entrypoint script
# Waits for PostgreSQL, runs database initialization, then starts the server

set -e

echo "==> Starting Roots of Impact Backend..."

# Extract database connection details from DATABASE_URL or use defaults
if [ -n "${DATABASE_URL:-}" ]; then
  # Parse DATABASE_URL: postgresql://user:password@host:port/database
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
  DB_HOST="${POSTGRES_HOST:-postgres}"
  DB_PORT="${POSTGRES_PORT:-5432}"
  DB_USER="${POSTGRES_USER:-roots_user}"
  DB_PASSWORD="${POSTGRES_PASSWORD:-roots_password}"
  DB_NAME="${POSTGRES_DB:-roots_of_impact}"
fi

# Export for init-db.sh
export POSTGRES_HOST="${DB_HOST}"
export POSTGRES_PORT="${DB_PORT}"
export POSTGRES_USER="${DB_USER}"
export POSTGRES_PASSWORD="${DB_PASSWORD}"
export POSTGRES_DB="${DB_NAME}"

echo "==> Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

# Wait for PostgreSQL to be ready
RETRIES=30
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c '\q' 2>/dev/null || [ $RETRIES -eq 0 ]; do
  echo "   PostgreSQL is unavailable - waiting... ($RETRIES retries left)"
  RETRIES=$((RETRIES-1))
  sleep 2
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: Could not connect to PostgreSQL after 60 seconds"
  exit 1
fi

echo "   PostgreSQL is ready!"

# Run database initialization
INIT_SCRIPT="/app/../scripts/init-db.sh"
if [ ! -f "$INIT_SCRIPT" ]; then
  INIT_SCRIPT="/scripts/init-db.sh"
fi

if [ -f "$INIT_SCRIPT" ]; then
  echo "==> Running database initialization..."
  bash "$INIT_SCRIPT"
else
  echo "WARN: init-db.sh not found, skipping database initialization"
  echo "   Searched: /app/../scripts/init-db.sh and /scripts/init-db.sh"
fi

# Start the application
echo "==> Starting backend server..."
exec "$@"

