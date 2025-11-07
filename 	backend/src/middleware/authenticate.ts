import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Authentication not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      id?: string;
      email?: string;
      role?: string;
    };

    if (!decoded || typeof decoded.id !== 'string' || typeof decoded.role !== 'string') {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const authReq = req as AuthRequest;
    authReq.user = {
      id: decoded.id,
      email: typeof decoded.email === 'string' ? decoded.email : '',
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
