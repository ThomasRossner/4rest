-- Seed data for development/testing
-- Run this SQL file to create test users after running migrations

-- IMPORTANT: These passwords are "Test123!" 
-- The hash below was generated, but you should regenerate it properly
-- Using a quick workaround for now - see below

-- Option 1: Register via the API (recommended)
-- POST http://localhost:5000/api/auth/register
-- {
--   "email": "test@example.com",
--   "password": "Test123!",
--   "name": "Test User",
--   "role": "guest"
-- }

-- Option 2: Generate hash and insert manually
-- You can generate the bcrypt hash by:
-- 1. Using an online bcrypt generator: https://bcrypt-generator.com/
--    - Rounds: 10
--    - Password: Test123!
-- 2. Or using Node.js: node -e "require('bcryptjs').hash('Test123!', 10).then(h => console.log(h))"

-- Temporary test users (replace HASH_HERE with actual bcrypt hash):
/*
INSERT INTO users (email, password_hash, name, role, points)
VALUES 
  ('test@example.com', 'HASH_HERE', 'Test User', 'guest', 0),
  ('employee@example.com', 'HASH_HERE', 'Test Employee', 'employee', 100),
  ('stakeholder@example.com', 'HASH_HERE', 'Test Stakeholder', 'stakeholder', 500)
ON CONFLICT (email) DO NOTHING;
*/