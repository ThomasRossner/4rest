import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import passport from 'passport';
import { createUser, getUserByEmail } from '../services/user.service.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { sihot } from '../integrations/sihot.js';
import type { SihotGuest, SihotReservation } from '../integrations/sihot.js';

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

function signUserToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, getJwtSecret(), getJwtOptions());
}

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
    const token = signUserToken({ id: user.id, email: userEmail, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: userEmail,
        name: user.name,
        role: user.role,
        points: user.points || 0,
        sihotGuestId: user.sihot_guest_id || null,
        sihotGuest: user.sihot_guest_data?.guest ?? null,
        sihotReservations: user.sihot_guest_data?.reservations ?? [],
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

    const { combinedName, sihotGuestPayload, sihotGuest } = await enrichWithSihotData(
      email,
      name
    );

    const user = await createUser({
      email,
      password_hash: passwordHash,
      name: combinedName,
      role,
      sihot_guest_id: sihotGuest?.guestId || null,
      sihot_guest_data: sihotGuestPayload,
    });

    const emailAddress = user.email ?? '';
    const token = signUserToken({ id: user.id, email: emailAddress, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: emailAddress,
        name: user.name,
        role: user.role,
        points: 0,
        sihotGuestId: user.sihot_guest_id || null,
        sihotGuest: user.sihot_guest_data?.guest ?? null,
        sihotReservations: user.sihot_guest_data?.reservations ?? [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

async function enrichWithSihotData(email: string, fallbackName: string): Promise<{
  combinedName: string;
  sihotGuestPayload: Record<string, any> | null;
  sihotGuest?: SihotGuest;
}> {
  if (!email) {
    return { combinedName: fallbackName, sihotGuestPayload: null };
  }

  try {
    const guest = await sihot.findGuestByEmail(email);
    if (!guest) {
      return { combinedName: fallbackName, sihotGuestPayload: null };
    }

    let reservations: SihotReservation[] = [];
    try {
      reservations = await sihot.getReservationsByGuest(guest.guestId);
    } catch (reservationError) {
      console.warn('[SIHOT] Failed to fetch reservations for guest', guest.guestId, reservationError);
    }

    const normalizedReservations = reservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      confirmationNumber: reservation.confirmationNumber,
      propertyId: reservation.propertyId,
      roomNumber: reservation.roomNumber,
      status: reservation.status,
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
      balance: reservation.balance,
    }));

    const combinedName = `${guest.firstName} ${guest.lastName}`.trim() || fallbackName;

    const payload = {
      guest: {
        guestId: guest.guestId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email ?? email,
        phone: guest.phone ?? null,
        loyaltyLevel: guest.loyaltyLevel ?? null,
        preferences: guest.preferences ?? [],
        language: guest.language ?? null,
        notes: guest.notes ?? null,
      },
      reservations: normalizedReservations,
    };

    return {
      combinedName,
      sihotGuestPayload: payload,
      sihotGuest: guest,
    };
  } catch (error) {
    console.warn('[SIHOT] Guest lookup failed during registration:', error);
    return { combinedName: fallbackName, sihotGuestPayload: null };
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = signUserToken({
      id: authReq.user.id,
      email: authReq.user.email,
      role: authReq.user.role,
    });

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
      const token = signUserToken({ id: user.id, email: userEmail, role: user.role });

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
