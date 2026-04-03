import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Run all pending migrations. When used from server, do not pass any argument. When run as CLI, call runMigrations().then(...).finally(...) with exit/pool.end(). */
export async function runMigrations(): Promise<void> {
  const pool = getPool();

  try {
    console.log('Starting database migrations...');
    
    // Define all migrations in order
    const migrations = [
      '001_initial_schema',
      '002_gdpr_consent',
      '003_oauth_support',
      '004_sihot_integration',
      '005_user_default_role',
      '006_user_type',
      '007_tasks_rewards_audience',
      '008_task_reward_templates',
      '009_drop_task_templates',
      '010_enum_user_fields',
      '011_drop_reward_templates',
      '012_email_verification_password_reset',
      '013_passwordless_login',
      '014_allow_passwordless_accounts',
      '015_locations',
      '016_locations_active',
      '017_reward_qr_tokens',
      '018_tree_growth_stages',
      '019_reward_recurrence',
      '020_task_recurrence',
      '021_visit_location_task',
      '022_article_quiz_task',
      '023_survey_task',
      '024_reward_location_categories',
      '025_points_bonus_qr_tokens',
      '026_task_prerequisites',
      '027_task_metadata',
      '028_populate_task_metadata',
      '029_reward_metadata',
      '030_populate_reward_metadata',
      '031_task_zielgruppe',
      '033_parameter_tables',
      '034_add_parameter_weight',
      '034_users_active',
      '035_points_calculation_factor',
      '036_reward_cost_calculation_factor',
      '037_reward_model_simplification',
      '038_task_model_simplification',
      '039_remove_reward_kosten_moegliche_punkte',
      '040_reward_zielgruppe',
      '041_restore_moegliche_punkte',
      '042_zielgruppe_multiselect',
      // Migration 043: Teams/Contests must come before other 043 migrations
      '043_teams_contests',
      '043_add_front_office_to_zielgruppe',
      // Migration 044: Replace mitarbeitende depends on 043_add_front_office
      '044_replace_mitarbeitende_with_front_office',
      '044_reward_redemption_metadata',
      // Migration 045: Contest start_date depends on 043_teams_contests
      '045_contest_start_date',
      '045_remove_stakeholder_from_zielgruppe',
      // Migration 046: Contest rewards_awarded depends on 043_teams_contests
      '046_contest_rewards_awarded',
      '046_remove_duplicate_zielgruppe',
      // Migration 047: Both are independent
      '047_add_unique_constraint_qr_code',
      '047_task_reward_thumbnails',
      '048_fix_user_role_enum',
      '049_team_contest_registration_qr_codes',
      '050_replace_front_office_with_rezeption_redaktion',
      '051_replace_allowed_roles_with_teams_contests',
      '052_photo_task_verification',
      '053_mailbox_messages',
      '054_remove_event_group',
      '055_users_preferred_language',
      '056_tasks_i18n',
      '057_rewards_i18n',
      '058_locations_i18n',
      '059_contests_i18n',
      '060_teams_i18n',
      '061_luise_demo_accounts',
      '062_tasks_quiz_survey_i18n',
      '063_forest_category_points',
      '064_player_profile',
      '065_onboarding_config',
      '066_backfill_forest_points_from_user_tasks',
      '067_quiz_question_locks',
      '068_guest_public_tasks',
      '069_repair_survey_questions_nulls',
    ];
    
    // Read all migration files
    const migrationFiles = migrations.map((name) => ({
      name,
      content: readFileSync(
        join(__dirname, '../../../database/migrations', `${name}.sql`),
      'utf-8'
      ),
    }));
    
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
    
    // Run each migration if not already executed
    for (const migration of migrationFiles) {
      if (!executed.has(migration.name)) {
        console.log(`Running migration: ${migration.name}.sql`);
        await pool.query(migration.content);
      await pool.query(
          `INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING`,
          [migration.name]
      );
        console.log(`✓ Migration ${migration.name.split('_')[0]} completed`);
    } else {
        console.log(`✓ Migration ${migration.name.split('_')[0]} already executed`);
    }
    }
    
    console.log('All migrations completed successfully.');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    console.error(error);
    throw error;
  }
}

// When run as standalone script (npm run migrate)
const isMainModule = process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.includes('migrate.js');
if (isMainModule) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
    .finally(() => getPool().end());
}
