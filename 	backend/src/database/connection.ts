import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  return pool;
}

export async function initializeDatabase() {
  const db = getPool();
  // Test connection
  await db.query('SELECT NOW()');
  console.log('Database connection established');
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
