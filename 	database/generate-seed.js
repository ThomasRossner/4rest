import bcrypt from 'bcryptjs';

const password = 'Test123!';

async function generateHashes() {
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated bcrypt hash:', hash);
  
  const seedSQL = `-- Seed data for development/testing
-- Run this after migrations to create test users

-- Test user credentials:
-- Email: test@example.com
-- Password: Test123!
-- Role: guest

INSERT INTO users (email, password_hash, name, role, points)
VALUES (
  'test@example.com',
  '${hash}',
  'Test User',
  'guest',
  0
)
ON CONFLICT (email) DO NOTHING;

-- Test employee user:
-- Email: employee@example.com
-- Password: Test123!
-- Role: employee

INSERT INTO users (email, password_hash, name, role, points)
VALUES (
  'employee@example.com',
  '${hash}',
  'Test Employee',
  'employee',
  100
)
ON CONFLICT (email) DO NOTHING;

-- Test stakeholder user:
-- Email: stakeholder@example.com
-- Password: Test123!
-- Role: stakeholder

INSERT INTO users (email, password_hash, name, role, points)
VALUES (
  'stakeholder@example.com',
  '${hash}',
  'Test Stakeholder',
  'stakeholder',
  500
)
ON CONFLICT (email) DO NOTHING;`;

  console.log('\n\nSeed SQL:\n');
  console.log(seedSQL);
}

generateHashes().catch(console.error);
