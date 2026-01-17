import 'dotenv/config';
import { getPool } from './src/database/connection.js';

async function runMigration051() {
  const pool = getPool();
  try {
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name IN ('allowed_teams', 'allowed_contests')
    `);
    
    const existingColumns = checkResult.rows.map((row: any) => row.column_name);
    
    if (existingColumns.includes('allowed_teams') && existingColumns.includes('allowed_contests')) {
      console.log('✓ Migration 051 already applied - columns exist');
      await pool.query(
        `INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING`,
        ['051_replace_allowed_roles_with_teams_contests']
      );
      process.exit(0);
    }
    
    console.log('Adding missing columns...');
    
    // Add columns if they don't exist
    if (!existingColumns.includes('allowed_teams')) {
      await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS allowed_teams UUID[] DEFAULT ARRAY[]::UUID[]');
      console.log('✓ Added allowed_teams to tasks');
    }
    
    if (!existingColumns.includes('allowed_contests')) {
      await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS allowed_contests UUID[] DEFAULT ARRAY[]::UUID[]');
      console.log('✓ Added allowed_contests to tasks');
    }
    
    // Add to rewards table
    const rewardsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'rewards' AND column_name IN ('allowed_teams', 'allowed_contests')
    `);
    const existingRewardColumns = rewardsCheck.rows.map((row: any) => row.column_name);
    
    if (!existingRewardColumns.includes('allowed_teams')) {
      await pool.query('ALTER TABLE rewards ADD COLUMN IF NOT EXISTS allowed_teams UUID[] DEFAULT ARRAY[]::UUID[]');
      console.log('✓ Added allowed_teams to rewards');
    }
    
    if (!existingRewardColumns.includes('allowed_contests')) {
      await pool.query('ALTER TABLE rewards ADD COLUMN IF NOT EXISTS allowed_contests UUID[] DEFAULT ARRAY[]::UUID[]');
      console.log('✓ Added allowed_contests to rewards');
    }
    
    await pool.query(
      `INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING`,
      ['051_replace_allowed_roles_with_teams_contests']
    );
    console.log('✓ Migration 051 completed');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration051();
