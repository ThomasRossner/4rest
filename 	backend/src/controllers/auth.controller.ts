import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { createUser, getUserByEmail } from '../services/user.service.js';
import { AuthRequest } from '../middleware/authenticate.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials - account uses social login' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userEmail = user.email || user.oauth_email || '';
    const token = jwt.sign(
      { id: user.id, email: userEmail, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: userEmail,
        name: user.name,
        role: user.role,
        points: user.points || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role = 'guest' } = req.body;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, password_hash: passwordHash, name, role });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = jwt.sign(
      { id: authReq.user.id, email: authReq.user.email, role: authReq.user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GitHub OAuth handlers
export function githubAuth(req: Request, res: Response, next: any) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  } catch (error: any) {
    console.error('GitHub OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
}

export async function githubCallback(req: Request, res: Response, next: any) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  passport.authenticate('github', { session: false }, async (err: any, user: any) => {
    if (err) {
      console.error('GitHub OAuth authentication error:', err);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
    
    if (!user) {
      console.error('GitHub OAuth: No user returned from authentication');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    try {
      console.log('GitHub OAuth callback: User authenticated, generating token for user:', user.id);
      // Generate JWT token
      const userEmail = user.email || user.oauth_email || '';
      const token = jwt.sign(
        { id: user.id, email: userEmail, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      console.log('GitHub OAuth: Token generated, redirecting to frontend');
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
      return res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('GitHub OAuth: Token generation error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
    }
  })(req, res, next);
}
