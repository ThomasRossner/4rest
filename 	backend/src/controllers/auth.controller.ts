import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import passport from 'passport';
import { createUser, getUserByEmail, getUserById, updateUserPassword } from '../services/user.service.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { sihot } from '../integrations/sihot.js';
import type { SihotGuest, SihotReservation } from '../integrations/sihot.js';
import { USER_ROLES, USER_TYPES, UserRole, UserType } from '../constants/enums.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  verifyEmailToken,
  verifyPasswordResetToken,
  clearPasswordResetToken,
} from '../services/auth-email.service.js';

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

function signUserToken(payload: { id: string; email: string; role: UserRole }) {
  return jwt.sign(payload, getJwtSecret(), getJwtOptions());
}

function normalizeRole(role: unknown): UserRole {
  if (typeof role === 'string' && (USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }
  return 'stakeholder';
}

function normalizeUserType(userType: unknown): UserType {
  if (typeof userType === 'string' && (USER_TYPES as readonly string[]).includes(userType)) {
    return userType as UserType;
  }
  return 'explorer';
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

    // Check if email verification is required
    // Only require verification for users with email (not OAuth-only users)
    const hasEmail = !!user.email;
    const isEmailVerified = user.email_verified === true;
    
    if (hasEmail && !isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        message: 'Please verify your email address before signing in. Check your inbox for the verification link.'
      });
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
        userType: user.user_type,
        emailVerified: isEmailVerified,
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
    const { email, password, name, role = 'stakeholder', userType = 'explorer' } = req.body;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { combinedName, sihotGuestPayload, sihotGuest } = await enrichWithSihotData(
      email,
      name
    );

    const normalizedRole = normalizeRole(role);
    const normalizedUserType = normalizeUserType(userType);

    const user = await createUser({
      email,
      password_hash: passwordHash,
      name: combinedName,
      role: normalizedRole,
      user_type: normalizedUserType,
      sihot_guest_id: sihotGuest?.guestId || null,
      sihot_guest_data: sihotGuestPayload,
    });

    const emailAddress = user.email ?? '';
    const token = signUserToken({ id: user.id, email: emailAddress, role: user.role });

    // Send email verification email (non-blocking)
    // Welcome email will be sent after successful email verification
    sendEmailVerificationEmail(user.id, emailAddress, user.name).catch((error) => {
      console.error('Failed to send verification email:', error);
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: emailAddress,
        name: user.name,
        role: user.role,
        points: 0,
        userType: user.user_type,
        emailVerified: user.email_verified === true,
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

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await getUserByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Only send reset email if user has a password (not OAuth-only account)
    if (user.password_hash) {
      try {
        await sendPasswordResetEmail(user.id, user.email || email, user.name);
      } catch (error: any) {
        console.error('Failed to send password reset email:', error);
        // Still return success to prevent information leakage
      }
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenData = await verifyPasswordResetToken(token);
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(tokenData.userId, passwordHash);
    await clearPasswordResetToken(tokenData.userId);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while resetting password' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const tokenData = await verifyEmailToken(token);
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Only send welcome email if this was the first time the email was verified
    if (tokenData.wasJustVerified) {
      // Get user details to send welcome email
      const user = await getUserById(tokenData.userId);
      
      if (user && user.email) {
        // Send welcome email after successful verification (non-blocking)
        sendWelcomeEmail(user.id, user.email, user.name, user.role).catch((error) => {
          console.error('Failed to send welcome email:', error);
        });
      }
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while verifying email' });
  }
}

export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserByEmail(authReq.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.json({ message: 'Email is already verified' });
    }

    const email = user.email || user.oauth_email || authReq.user.email;
    await sendEmailVerificationEmail(user.id, email, user.name);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while sending verification email' });
  }
}
