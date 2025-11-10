import { RequestHandler } from 'express';
import { AuthRequest } from './authenticate.js';

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

