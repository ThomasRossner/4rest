import { RequestHandler } from 'express';
import { AuthRequest } from './authenticate.js';
import { UserRole } from '../constants/enums.js';

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

