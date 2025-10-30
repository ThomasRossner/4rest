#!/bin/bash
# Seed test users (via API) and an example task (via SQL) for local development

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

BACKEND_URL="http://localhost:5000/api"
PG_CONTAINER="roots-postgres"
PG_USER="roots_user"
PG_DB="roots_of_impact"

echo "==> Seeding test users via API (${BACKEND_URL})"

create_user() {
  local email="$1"; local name="$2"; local role="$3"; local password="Test123!"
  curl -s -X POST "${BACKEND_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"name\":\"${name}\",\"role\":\"${role}\"}" \
    >/dev/null || true
  echo "   - ensured user exists: ${email} (${role})"
}

# Ensure backend is reachable (non-fatal)
if curl -s "${BACKEND_URL}/statistics" >/dev/null; then
  :
else
  echo "WARN: Backend not reachable at ${BACKEND_URL}. Make sure 'cd backend && npm run dev' is running."
fi

create_user "test@example.com" "Test User" "guest"
create_user "employee@example.com" "Test Employee" "employee"
create_user "stakeholder@example.com" "Test Stakeholder" "stakeholder"

echo "\n==> Seeding example task into Postgres (container: ${PG_CONTAINER})"

if docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" < "${ROOT_DIR}/database/seed_example_task.sql" >/dev/null; then
  echo "   - example task seeded (or already exists)"
else
  echo "ERROR: Failed to seed example task. Is the Postgres container running?"
  echo "       Start DBs with: docker-compose -f docker-compose.dev.yml up -d"
  exit 1
fi

echo "\n==> Seeding example reward into Postgres (container: ${PG_CONTAINER})"

if docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" < "${ROOT_DIR}/database/seed_example_reward.sql" >/dev/null; then
  echo "   - example reward seeded (or already exists)"
else
  echo "ERROR: Failed to seed example reward. Is the Postgres container running?"
  echo "       Start DBs with: docker-compose -f docker-compose.dev.yml up -d"
  exit 1
fi

echo "\n✅ Seeding complete."
echo "Users (password for all): Test123!"
echo " - test@example.com (guest)"
echo " - employee@example.com (employee)"
echo " - stakeholder@example.com (stakeholder)"
echo "Task: 'Bring your reusable bottle' (QR: QR-LOBBY-WATER-001)"
echo "Reward: 'Free Coffee' (15 pts, code: COFFEE-ON-US)"


