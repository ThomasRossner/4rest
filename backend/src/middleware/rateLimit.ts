import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate.js';

/**
 * Simple in-memory rate limiter with cooldown period
 * Tracks last request time per user to prevent rapid repeated requests
 */
interface RateLimitStore {
  [userId: string]: number; // timestamp of last request
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate limit middleware that enforces a cooldown period between requests
 * @param cooldownMs - Cooldown period in milliseconds (default: 5000ms = 5 seconds)
 */
export function rateLimit(cooldownMs: number = 5000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authReq.user.id;
    const now = Date.now();
    const lastRequest = rateLimitStore[userId];

    if (lastRequest && (now - lastRequest) < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastRequest);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} before making another request`,
        retryAfter: remainingSeconds,
      });
    }

    // Update last request time
    rateLimitStore[userId] = now;

    // Clean up old entries periodically (older than 1 hour)
    if (Object.keys(rateLimitStore).length > 1000) {
      const oneHourAgo = now - 3600000;
      Object.keys(rateLimitStore).forEach((key) => {
        if (rateLimitStore[key] < oneHourAgo) {
          delete rateLimitStore[key];
        }
      });
    }

    next();
  };
}

