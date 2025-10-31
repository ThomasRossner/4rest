-- Transfer ownership of all tables to roots_user
-- Run with: docker exec -i roots-postgres psql -U postgres -d roots_of_impact < database/transfer-ownership.sql

-- Transfer ownership of all existing tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO roots_user;';
    END LOOP;
END $$;

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO roots_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO roots_user;
