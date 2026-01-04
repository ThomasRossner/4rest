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
    
    const migration8 = readFileSync(
      join(__dirname, '../../../database/migrations/008_task_reward_templates.sql'),
      'utf-8'
    );
    
    const migration9 = readFileSync(
      join(__dirname, '../../../database/migrations/009_drop_task_templates.sql'),
      'utf-8'
    );
    
    const migration10 = readFileSync(
      join(__dirname, '../../../database/migrations/010_enum_user_fields.sql'),
      'utf-8'
    );
    
    const migration11 = readFileSync(
      join(__dirname, '../../../database/migrations/011_drop_reward_templates.sql'),
      'utf-8'
    );
    
    const migration12 = readFileSync(
      join(__dirname, '../../../database/migrations/012_email_verification_password_reset.sql'),
      'utf-8'
    );
    
    const migration13 = readFileSync(
      join(__dirname, '../../../database/migrations/013_passwordless_login.sql'),
      'utf-8'
    );
    
    const migration14 = readFileSync(
      join(__dirname, '../../../database/migrations/014_allow_passwordless_accounts.sql'),
      'utf-8'
    );
    
    const migration15 = readFileSync(
      join(__dirname, '../../../database/migrations/015_locations.sql'),
      'utf-8'
    );
    
    const migration16 = readFileSync(
      join(__dirname, '../../../database/migrations/016_locations_active.sql'),
      'utf-8'
    );
    
    const migration17 = readFileSync(
      join(__dirname, '../../../database/migrations/017_reward_qr_tokens.sql'),
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
    
    if (!executed.has('008_task_reward_templates')) {
      console.log('Running migration: 008_task_reward_templates.sql');
      await pool.query(migration8);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('008_task_reward_templates') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 008 completed');
    } else {
      console.log('✓ Migration 008 already executed');
    }

    if (!executed.has('009_drop_task_templates')) {
      console.log('Running migration: 009_drop_task_templates.sql');
      await pool.query(migration9);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('009_drop_task_templates') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 009 completed');
    } else {
      console.log('✓ Migration 009 already executed');
    }

    if (!executed.has('010_enum_user_fields')) {
      console.log('Running migration: 010_enum_user_fields.sql');
      await pool.query(migration10);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('010_enum_user_fields') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 010 completed');
    } else {
      console.log('✓ Migration 010 already executed');
    }
    
    if (!executed.has('011_drop_reward_templates')) {
      console.log('Running migration: 011_drop_reward_templates.sql');
      await pool.query(migration11);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('011_drop_reward_templates') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 011 completed');
    } else {
      console.log('✓ Migration 011 already executed');
    }
    
    if (!executed.has('012_email_verification_password_reset')) {
      console.log('Running migration: 012_email_verification_password_reset.sql');
      await pool.query(migration12);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('012_email_verification_password_reset') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 012 completed');
    } else {
      console.log('✓ Migration 012 already executed');
    }

    if (!executed.has('013_passwordless_login')) {
      console.log('Running migration: 013_passwordless_login.sql');
      await pool.query(migration13);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('013_passwordless_login') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 013 completed');
    } else {
      console.log('✓ Migration 013 already executed');
    }

    if (!executed.has('014_allow_passwordless_accounts')) {
      console.log('Running migration: 014_allow_passwordless_accounts.sql');
      await pool.query(migration14);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('014_allow_passwordless_accounts') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 014 completed');
    } else {
      console.log('✓ Migration 014 already executed');
    }
    
    if (!executed.has('015_locations')) {
      console.log('Running migration: 015_locations.sql');
      await pool.query(migration15);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('015_locations') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 015 completed');
    } else {
      console.log('✓ Migration 015 already executed');
    }
    
    if (!executed.has('016_locations_active')) {
      console.log('Running migration: 016_locations_active.sql');
      await pool.query(migration16);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('016_locations_active') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 016 completed');
    } else {
      console.log('✓ Migration 016 already executed');
    }
    
    if (!executed.has('017_reward_qr_tokens')) {
      console.log('Running migration: 017_reward_qr_tokens.sql');
      await pool.query(migration17);
      await pool.query(
        "INSERT INTO schema_migrations (migration_name) VALUES ('017_reward_qr_tokens') ON CONFLICT DO NOTHING"
      );
      console.log('✓ Migration 017 completed');
    } else {
      console.log('✓ Migration 017 already executed');
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
