#!/bin/bash
# Reset database - WARNING: This deletes all data!

echo "⚠️  WARNING: This will delete all data in the database!"
# Auto-confirm for automation (comment out to enable confirmation prompt)
# read -p "Are you sure? (yes/no): " confirm
# if [ "$confirm" != "yes" ]; then
#     echo "Aborted."
#     exit 1
# fi
confirm="yes"

echo "Dropping and recreating database..."
docker exec -i roots-postgres psql -U postgres << EOF
DROP DATABASE IF EXISTS roots_of_impact;
CREATE DATABASE roots_of_impact OWNER roots_user;
GRANT ALL PRIVILEGES ON DATABASE roots_of_impact TO roots_user;
EOF

echo "Granting schema permissions..."
docker exec -i roots-postgres psql -U postgres -d roots_of_impact << EOF
GRANT ALL ON SCHEMA public TO roots_user;
ALTER SCHEMA public OWNER TO roots_user;
EOF

echo "Running migrations..."
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/001_initial_schema.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/002_gdpr_consent.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/003_oauth_support.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/004_sihot_integration.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/005_user_default_role.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/006_user_type.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/007_tasks_rewards_audience.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/008_task_reward_templates.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/009_drop_task_templates.sql

echo "✅ Database reset complete!"
