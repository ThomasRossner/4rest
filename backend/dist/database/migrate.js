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
        ];
        // Read all migration files
        const migrationFiles = migrations.map((name) => ({
            name,
            content: readFileSync(join(__dirname, '../../../database/migrations', `${name}.sql`), 'utf-8'),
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
        const executedMigrations = await pool.query('SELECT migration_name FROM schema_migrations');
        const executed = new Set(executedMigrations.rows.map((row) => row.migration_name));
        // Run each migration if not already executed
        for (const migration of migrationFiles) {
            if (!executed.has(migration.name)) {
                console.log(`Running migration: ${migration.name}.sql`);
                await pool.query(migration.content);
                await pool.query(`INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT DO NOTHING`, [migration.name]);
                console.log(`✓ Migration ${migration.name.split('_')[0]} completed`);
            }
            else {
                console.log(`✓ Migration ${migration.name.split('_')[0]} already executed`);
            }
        }
        console.log('\nAll migrations completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map