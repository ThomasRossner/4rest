import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map<string, number[]>();

function clientKey(req: Request): string {
  const xf = req.headers['x-forwarded-for'];
  const raw = typeof xf === 'string' ? xf.split(',')[0]?.trim() : '';
  return raw || req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Einfaches In-Memory-Rate-Limit für öffentliche Task-Endpunkte (pro IP).
 */
export function publicTaskRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = clientKey(req);
  const now = Date.now();
  let arr = hits.get(key) || [];
  arr = arr.filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  arr.push(now);
  hits.set(key, arr);
  next();
}
