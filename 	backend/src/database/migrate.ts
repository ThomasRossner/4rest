import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const pool = getPool();
  
  try {
    console.log('Starting database migrations...');
    
    // Read migration files
    const migration1 = readFileSync(
      join(__dirname, '../../../database/migrations/001_initial_schema.sql'),
      'utf-8'
    );
    
    const migration2 = readFileSync(
      join(__dirname, '../../../database/migrations/002_gdpr_consent.sql'),
      'utf-8'
    );
    
    const migration3 = readFileSync(
      join(__dirname, '../../../database/migrations/003_oauth_support.sql'),
      'utf-8'
    );
    
    const migration4 = readFileSync(
      join(__dirname, '../../../database/migrations/004_sihot_integration.sql'),
      'utf-8'
    );
    
    const migration5 = readFileSync(
      join(__dirname, '../../../database/migrations/005_user_default_role.sql'),
      'utf-8'
    );
    
    const migration6 = readFileSync(
      join(__dirname, '../../../database/migrations/006_user_type.sql'),
      'utf-8'
    );
    
    const migration7 = readFileSync(
      join(__dirname, '../../../database/migrations/007_tasks_rewards_audience.sql'),
      'utf-8'
    );
    
    // Create migrations table to track executed migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check which migrations have been run
    const executedMigrations = await pool.query(
      'SELECT migration_name FROM schema_migrations'
    );
    const executed = new Set(
      executedMigrations.rows.map((row: any) => row.migration_name)
    );
    
    // Run migration 1 if not executed
    if (!executed.has('001_initial_schema')) {
      console.log('Running migration: 001_initial_schema.sql');
      await pool.query(migration1);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 001 completed');
    } else {
      console.log('✓ Migration 001 already executed');
    }
    
    // Run migration 2 if not executed
    if (!executed.has('002_gdpr_consent')) {
      console.log('Running migration: 002_gdpr_consent.sql');
      await pool.query(migration2);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('002_gdpr_consent') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 002 completed');
    } else {
      console.log('✓ Migration 002 already executed');
    }
    
    // Run migration 3 if not executed
    if (!executed.has('003_oauth_support')) {
      console.log('Running migration: 003_oauth_support.sql');
      await pool.query(migration3);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('003_oauth_support') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 003 completed');
    } else {
      console.log('✓ Migration 003 already executed');
    }
    
    if (!executed.has('004_sihot_integration')) {
      console.log('Running migration: 004_sihot_integration.sql');
      await pool.query(migration4);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('004_sihot_integration') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 004 completed');
    } else {
      console.log('✓ Migration 004 already executed');
    }
    
    if (!executed.has('005_user_default_role')) {
      console.log('Running migration: 005_user_default_role.sql');
      await pool.query(migration5);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('005_user_default_role') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 005 completed');
    } else {
      console.log('✓ Migration 005 already executed');
    }
    
    if (!executed.has('006_user_type')) {
      console.log('Running migration: 006_user_type.sql');
      await pool.query(migration6);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('006_user_type') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 006 completed');
    } else {
      console.log('✓ Migration 006 already executed');
    }
    
    if (!executed.has('007_tasks_rewards_audience')) {
      console.log('Running migration: 007_tasks_rewards_audience.sql');
      await pool.query(migration7);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('007_tasks_rewards_audience') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 007 completed');
    } else {
      console.log('✓ Migration 007 already executed');
    }
    
    console.log('\nAll migrations completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
