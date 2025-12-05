import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.error('[DATABASE] DATABASE_URL is not set!');
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Determine SSL setting: only use SSL if explicitly enabled via DATABASE_SSL env var
    // For container-to-container connections, SSL is not needed
    const useSSL = process.env.DATABASE_SSL === 'true' || 
                   (process.env.DATABASE_SSL === undefined && process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('amazonaws.com'));
    
    console.log('[DATABASE] Initializing connection pool', {
      hasUrl: !!process.env.DATABASE_URL,
      useSSL,
      databaseSSL: process.env.DATABASE_SSL,
      nodeEnv: process.env.NODE_ENV,
    });
    
    const poolConfig: any = {
      connectionString: process.env.DATABASE_URL,
    };
    
    // Explicitly set SSL to false if not using SSL
    if (useSSL) {
      poolConfig.ssl = { rejectUnauthorized: false };
    } else {
      poolConfig.ssl = false;
    }
    
    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      console.error('[DATABASE] Unexpected database error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
    });

    pool.on('connect', () => {
      console.log('[DATABASE] New client connected');
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
