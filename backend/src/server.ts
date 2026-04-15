import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDatabase } from './database/connection.js';
import { runMigrations } from './database/migrate.js';
import { startSihotSyncScheduler } from './services/sihot-sync.service.js';
import { startContestScheduler } from './services/contest-scheduler.service.js';
import { registerWebSocketServer } from './ws/socketRegistry.js';

// Load environment variables BEFORE importing passport config
// Use explicit path to ensure .env is loaded from backend directory
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });
console.log(`[SERVER] Loading environment from: ${envPath}`);
console.log(`[SERVER] EMAIL_MOCK_MODE: ${process.env.EMAIL_MOCK_MODE}`);
console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);

import passport from './config/passport.js';

const app = express();
// WICHTIG: Port 5000 ist bei Apple belegt (AirPlay Receiver)
// Backend läuft daher auf Port 5001
const PORT = process.env.PORT || 5001;

/** Typische lokale Vite-URLs; in .env steht oft nur :3000, dann schlägt Login von :3001 fehl (CORS). */
const LOCAL_DEV_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3000',
];

function getCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
  const fromEnv = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (process.env.NODE_ENV === 'production') {
    if (fromEnv.length === 0) return 'http://localhost:3001';
    return fromEnv.length === 1 ? fromEnv[0] : fromEnv;
  }

  // Development: Env-Origins + lokale Vite-Ports (auch wenn nur CORS_ORIGIN=:3000 gesetzt)
  return Array.from(new Set([...fromEnv, ...LOCAL_DEV_ORIGINS]));
}

// Middleware
const corsOriginResolved = getCorsOrigin();
if (process.env.NODE_ENV !== 'production') {
  console.log('[SERVER] CORS allowed origins:', corsOriginResolved);
}
app.use(cors({ origin: corsOriginResolved, credentials: true }));
// Increase body size limit for large JSON payloads (e.g., tasks with quiz questions)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware for Passport (OAuth flows)
// Use Redis store if available, otherwise fall back to MemoryStore
let sessionStore: any = undefined;

if (process.env.REDIS_URL) {
  try {
    const RedisStore = require('connect-redis').default;
    const { createClient } = require('redis');
    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.on('error', (err: Error) => {
      console.warn('Redis connection error, falling back to MemoryStore:', err.message);
    });
    redisClient.connect().catch(() => {
      console.warn('Failed to connect to Redis, falling back to MemoryStore');
    });
    sessionStore = new RedisStore({ client: redisClient });
    console.log('Using Redis for session storage');
  } catch (error: any) {
    console.warn('Redis store not available, using MemoryStore:', error.message);
  }
}

if (!sessionStore) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Warning: Using MemoryStore for sessions in production. This is not recommended.');
    console.warn('Set REDIS_URL to use Redis for session storage.');
  }
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', setupRoutes());

// Static serving for uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not ensure upload directory exists:', e);
}
app.use('/uploads', express.static(uploadDir));

// Error handler
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });
registerWebSocketServer(wss);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    // Handle WebSocket messages (e.g., forest updates)
    console.log('Received message:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    console.log('Database connected');
    await runMigrations();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      startSihotSyncScheduler();
      // Start contest scheduler - runs every 15 minutes to check for expired contests
      startContestScheduler(15 * 60 * 1000);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
