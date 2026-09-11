import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { UserRole } from '../constants/enums.js';

function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret as Secret;
}

function getJwtOptions(): SignOptions {
  const options: SignOptions = {};
  options.expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];
  return options;
}

/**
 * Signs a JWT token for a user
 * Extracted from auth controller for reusability (DRY principle)
 */
export function signUserToken(payload: { id: string; email: string; role: UserRole }): string {
  return jwt.sign(payload, getJwtSecret(), getJwtOptions());
}

