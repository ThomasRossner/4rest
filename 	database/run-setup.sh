#!/bin/bash
# Setup database user and database

echo "Setting up database user and database..."
docker exec -i roots-postgres psql -U postgres < database/setup-db.sql

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
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/010_enum_user_fields.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/011_drop_reward_templates.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/012_email_verification_password_reset.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/013_passwordless_login.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/014_allow_passwordless_accounts.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/015_locations.sql

echo "Database setup complete!"
