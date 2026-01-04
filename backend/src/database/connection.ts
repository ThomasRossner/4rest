import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    // Determine SSL setting: only use SSL if explicitly enabled via DATABASE_SSL env var
    // For container-to-container connections, SSL is not needed
    const useSSL = process.env.DATABASE_SSL === 'true' || 
                   (process.env.DATABASE_SSL === undefined && process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('amazonaws.com'));
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
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
