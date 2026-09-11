-- Setup script to create user and database
-- Run with: docker exec -i roots-postgres psql -U postgres < database/setup-db.sql

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'roots_user') THEN
        CREATE USER roots_user WITH PASSWORD 'roots_password';
        ALTER USER roots_user CREATEDB;
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE roots_of_impact OWNER roots_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'roots_of_impact')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE roots_of_impact TO roots_user;

-- Connect to the database and grant schema permissions
\c roots_of_impact
GRANT ALL ON SCHEMA public TO roots_user;
ALTER SCHEMA public OWNER TO roots_user;
