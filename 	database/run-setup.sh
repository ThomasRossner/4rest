#!/bin/bash
# Setup database user and database

echo "Setting up database user and database..."
docker exec -i roots-postgres psql -U postgres < database/setup-db.sql

echo "Running migrations..."
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/001_initial_schema.sql
docker exec -i roots-postgres psql -U roots_user -d roots_of_impact < database/migrations/002_gdpr_consent.sql

echo "Database setup complete!"
