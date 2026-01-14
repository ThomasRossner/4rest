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
import { startSihotSyncScheduler } from './services/sihot-sync.service.js';
import { startRecurringRewardsScheduler } from './services/reward-recurrence.service.js';
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
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000';
// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware for Passport (OAuth flows)
// Use Redis store if available, otherwise fall back to MemoryStore
let sessionStore = undefined;
if (process.env.REDIS_URL) {
    try {
        const RedisStore = require('connect-redis').default;
        const { createClient } = require('redis');
        const redisClient = createClient({
            url: process.env.REDIS_URL,
        });
        redisClient.on('error', (err) => {
            console.warn('Redis connection error, falling back to MemoryStore:', err.message);
        });
        redisClient.connect().catch(() => {
            console.warn('Failed to connect to Redis, falling back to MemoryStore');
        });
        sessionStore = new RedisStore({ client: redisClient });
        console.log('Using Redis for session storage');
    }
    catch (error) {
        console.warn('Redis store not available, using MemoryStore:', error.message);
    }
}
if (!sessionStore) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Warning: Using MemoryStore for sessions in production. This is not recommended.');
        console.warn('Set REDIS_URL to use Redis for session storage.');
    }
}
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
}));
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
}
catch (e) {
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
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            startSihotSyncScheduler();
            // Start recurring rewards scheduler - runs every hour
            startRecurringRewardsScheduler(60 * 60 * 1000);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map