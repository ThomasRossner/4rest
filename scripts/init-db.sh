#!/bin/bash
# Database initialization script for Docker containers
# This script runs migrations and seeds the database

set -euo pipefail

# Get database connection details from environment
PGHOST="${POSTGRES_HOST:-postgres}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-roots_user}"
PGPASSWORD="${POSTGRES_PASSWORD:-roots_password}"
PGDATABASE="${POSTGRES_DB:-roots_of_impact}"

# Export for psql
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

# Database root directory (adjust path based on container structure)
if [ -d "/app/../database" ]; then
  DB_ROOT="/app/../database"
elif [ -d "/database" ]; then
  DB_ROOT="/database"
else
  DB_ROOT="/app/database"
fi
MIGRATIONS_DIR="${DB_ROOT}/migrations"

echo "   Using database directory: ${DB_ROOT}"

echo "==> Starting database initialization..."

# Wait for PostgreSQL to be ready
echo "==> Waiting for PostgreSQL to be ready..."
until PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -c '\q' 2>/dev/null; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "   PostgreSQL is ready!"

# Check if database is already initialized
echo "==> Checking if database is already initialized..."
INITIALIZED=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations');" 2>/dev/null || echo "false")

if [ "$INITIALIZED" = "t" ]; then
  echo "   Database already initialized, checking migrations..."
  
  # Get count of executed migrations
  MIGRATION_COUNT=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -tAc "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null || echo "0")
  echo "   Found $MIGRATION_COUNT executed migrations"
  
  if [ "$MIGRATION_COUNT" -ge 16 ]; then
    echo "   All migrations already executed, skipping migration step"
    SKIP_MIGRATIONS=true
  else
    echo "   Some migrations missing, will run migration script"
    SKIP_MIGRATIONS=false
  fi
else
  echo "   Database not initialized, will run all migrations"
  SKIP_MIGRATIONS=false
fi

# Run migrations if needed
if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "==> Running database migrations..."
  
  # Use Node.js migration script if available, otherwise run SQL directly
  if [ -f "/app/dist/database/migrate.js" ]; then
    echo "   Using Node.js migration script..."
    cd /app
    node dist/database/migrate.js
  else
    echo "   Using direct SQL migrations..."
    
    # Create schema_migrations table if it doesn't exist
    PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

    # Run each migration file
    for migration_file in "${MIGRATIONS_DIR}"/0*.sql; do
      if [ -f "$migration_file" ]; then
        migration_name=$(basename "$migration_file" .sql)
        echo "   Running migration: $migration_name"
        
        # Check if migration already executed
        EXISTS=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -tAc "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE migration_name = '${migration_name}');" 2>/dev/null || echo "false")
        
        if [ "$EXISTS" != "t" ]; then
          PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "$migration_file"
          PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" -c "INSERT INTO schema_migrations (migration_name) VALUES ('${migration_name}') ON CONFLICT DO NOTHING;"
          echo "     ✓ Migration $migration_name completed"
        else
          echo "     ✓ Migration $migration_name already executed"
        fi
      fi
    done
  fi
  
  echo "   All migrations completed!"
else
  echo "==> Skipping migrations (already up to date)"
fi

# Seed data
echo "==> Seeding database with initial data..."

# Seed locations
if [ -f "${DB_ROOT}/seed_locations.sql" ]; then
  echo "   Seeding locations..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_locations.sql" >/dev/null 2>&1 || true
  echo "     ✓ Locations seeded"
fi

# Seed example tasks
if [ -f "${DB_ROOT}/seed_example_task.sql" ]; then
  echo "   Seeding example QR task..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_example_task.sql" >/dev/null 2>&1 || true
  echo "     ✓ QR task seeded"
fi

if [ -f "${DB_ROOT}/seed_example_video_task.sql" ]; then
  echo "   Seeding example video task..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_example_video_task.sql" >/dev/null 2>&1 || true
  echo "     ✓ Video task seeded"
fi

if [ -f "${DB_ROOT}/seed_example_photo_task.sql" ]; then
  echo "   Seeding example photo task..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_example_photo_task.sql" >/dev/null 2>&1 || true
  echo "     ✓ Photo task seeded"
fi

# Seed rewards
if [ -f "${DB_ROOT}/seed_example_reward.sql" ]; then
  echo "   Seeding example rewards..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_example_reward.sql" >/dev/null 2>&1 || true
  echo "     ✓ Basic rewards seeded"
fi

if [ -f "${DB_ROOT}/seed_example_rewards_extra.sql" ]; then
  echo "   Seeding extra rewards..."
  PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" < "${DB_ROOT}/seed_example_rewards_extra.sql" >/dev/null 2>&1 || true
  echo "     ✓ Extra rewards seeded"
fi

# Seed test users (directly via SQL)
echo "   Seeding test users..."
PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" <<EOF >/dev/null 2>&1 || true
-- Create test users if they don't exist
-- Password: Test123! (bcrypt hash)
INSERT INTO users (email, password_hash, name, role, email_verified, created_at, updated_at)
VALUES
  ('test@example.com', '\$2a\$10\$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Test User', 'guest', TRUE, NOW(), NOW()),
  ('employee@example.com', '\$2a\$10\$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Test Employee', 'employee', TRUE, NOW(), NOW()),
  ('stakeholder@example.com', '\$2a\$10\$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Test Stakeholder', 'stakeholder', TRUE, NOW(), NOW()),
  ('admin@example.com', '\$2a\$10\$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Admin User', 'administrator', TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
  email_verified = TRUE,
  email_verification_token = NULL,
  email_verification_expires = NULL,
  updated_at = NOW();
EOF

# Generate proper bcrypt hash for Test123! password
# Using Node.js to generate the hash synchronously
if command -v node >/dev/null 2>&1; then
  echo "   Generating password hashes for test users..."
  # Use sync version of bcrypt
  TEST_PASSWORD_HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test123!', 10))" 2>/dev/null || echo "")
  
  if [ -n "$TEST_PASSWORD_HASH" ] && [ "$TEST_PASSWORD_HASH" != "undefined" ]; then
    PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}" <<EOF >/dev/null 2>&1 || true
UPDATE users SET password_hash = '${TEST_PASSWORD_HASH}' WHERE email IN (
  'test@example.com',
  'employee@example.com',
  'stakeholder@example.com',
  'admin@example.com'
) AND (password_hash LIKE '\$2a\$10\$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq' OR password_hash IS NULL);
EOF
    echo "     ✓ Password hashes updated"
  else
    echo "     ⚠ Could not generate password hash, using placeholder (users may need password reset)"
  fi
fi

echo "     ✓ Test users seeded"
echo ""
echo "✅ Database initialization complete!"
echo ""
echo "Test users (password: Test123!):"
echo "  - test@example.com (guest)"
echo "  - employee@example.com (employee)"
echo "  - stakeholder@example.com (stakeholder)"
echo "  - admin@example.com (administrator)"

