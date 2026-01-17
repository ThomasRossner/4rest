import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const pool = getPool();
  
  try {
    console.log('Running migrations 052 and 053...');
    
    const migrations = [
      '052_photo_task_verification',
      '053_mailbox_messages',
    ];
    
    for (const migrationName of migrations) {
      console.log(`Running migration: ${migrationName}.sql`);
      
      const migrationPath = join(__dirname, '../database/migrations', `${migrationName}.sql`);
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      await pool.query(migrationContent);
      
      // Mark as executed
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
        [migrationName]
      );
      
      console.log(`✓ Migration ${migrationName} executed successfully`);
    }
    
    console.log('All migrations completed successfully!');
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
