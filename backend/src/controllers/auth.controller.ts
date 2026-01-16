import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { createUser, getUserByEmail, getUserById, updateUserPassword } from '../services/user.service.js';
import { validateTeamRegistrationToken, joinTeamById } from '../services/team.service.js';
import { validateContestRegistrationToken, joinContestById } from '../services/contest.service.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { sihot } from '../integrations/sihot.js';
import type { SihotGuest, SihotReservation } from '../integrations/sihot.js';
import { USER_ROLES, USER_TYPES, UserRole, UserType } from '../constants/enums.js';
import { getPool } from '../database/connection.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  verifyEmailToken,
  verifyPasswordResetToken,
  clearPasswordResetToken,
  generateLoginCode,
  verifyLoginCode,
  sendLoginCodeEmail,
  clearLoginCode,
  sendPasswordSetupEmail,
} from '../services/auth-email.service.js';
import { signUserToken } from '../utils/jwt.js';
import { createOAuthCallback, getFrontendUrl } from '../utils/oauth.js';

function normalizeRole(role: unknown): UserRole {
  if (typeof role === 'string' && (USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }
  return 'guest';
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has no password (passwordless account)
    if (!user.password_hash) {
      // Check if email is verified
      const hasEmail = !!user.email;
      const isEmailVerified = user.email_verified === true;
      
      if (hasEmail && isEmailVerified && user.email) {
        // Send password setup email (non-blocking)
        sendPasswordSetupEmail(user.id, user.email, user.name).catch((error) => {
          console.error('Failed to send password setup email:', error);
        });
        
        return res.status(403).json({ 
          error: 'Password setup required',
          code: 'PASSWORD_SETUP_REQUIRED',
          email: user.email,
          message: 'This account uses passwordless login. A password setup link has been sent to your email. Please check your inbox to set a password.'
        });
      }
      
      // OAuth-only account or unverified email
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
    console.error('[LOGIN ERROR]', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      email: req.body?.email,
      hasPassword: !!req.body?.password,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'An internal error occurred. Please try again later.' 
        : error.message 
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role = 'guest', userType = 'explorer', teamRegistrationToken, contestRegistrationToken } = req.body;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // Check if user is soft-deleted
      if (existingUser.deleted_at) {
        // Reactivate soft-deleted user
        const db = getPool();
        const passwordHash = await bcrypt.hash(password, 10);
        const { combinedName, sihotGuestPayload, sihotGuest } = await enrichWithSihotData(
          email,
          name
        );
        const normalizedRole = normalizeRole(role);
        const normalizedUserType = normalizeUserType(userType);

        const updateResult = await db.query(
          `UPDATE users 
           SET password_hash = $1,
               name = $2,
               role = $3,
               user_type = $4,
               points = 0,
               email_verified = false,
               active = true,
               deleted_at = NULL,
               sihot_guest_id = $5,
               sihot_guest_data = $6,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7
           RETURNING *`,
          [passwordHash, combinedName, normalizedRole, normalizedUserType, sihotGuest?.guestId || null, sihotGuestPayload, existingUser.id]
        );

        if (!updateResult.rows[0]) {
          return res.status(500).json({ error: 'Failed to reactivate user' });
        }

        const user = updateResult.rows[0];

        // Send verification email for reactivated user
        await sendEmailVerificationEmail(user.id, user.email || '', user.name);

        // Automatisch Team oder Contest beitreten (falls Token vorhanden)
        let joinedTeam = null;
        let joinedContest = null;
        
        if (teamRegistrationToken) {
          const teamId = await validateTeamRegistrationToken(teamRegistrationToken);
          if (teamId) {
            try {
              joinedTeam = await joinTeam(user.id, teamId);
            } catch (error) {
              console.error('Failed to join team after reactivation:', error);
            }
          }
        }
        
        if (contestRegistrationToken) {
          const contestId = await validateContestRegistrationToken(contestRegistrationToken);
          if (contestId) {
            try {
              joinedContest = await joinContest(user.id, contestId);
            } catch (error) {
              console.error('Failed to join contest after reactivation:', error);
            }
          }
        }

        return res.status(200).json({
          message: 'User reactivated successfully. Please verify your email.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            userType: user.user_type,
          },
          ...(joinedTeam && { team: joinedTeam }),
          ...(joinedContest && { contest: joinedContest }),
        });
      }
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validiere Team/Contest-Registrierungs-Token (falls vorhanden)
    let teamId: string | null = null;
    let contestId: string | null = null;
    
    if (teamRegistrationToken) {
      teamId = await validateTeamRegistrationToken(teamRegistrationToken);
      if (!teamId) {
        return res.status(400).json({ error: 'Invalid or disabled team registration token' });
      }
    }
    
    if (contestRegistrationToken) {
      contestId = await validateContestRegistrationToken(contestRegistrationToken);
      if (!contestId) {
        return res.status(400).json({ error: 'Invalid or disabled contest registration token' });
      }
    }
    
    // Es darf nur entweder Team oder Contest sein, nicht beides
    if (teamId && contestId) {
      return res.status(400).json({ error: 'Cannot register for both team and contest at the same time' });
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

    // Automatisch Team oder Contest beitreten (falls Token vorhanden)
    let joinedTeam = null;
    let joinedContest = null;
    
    if (teamId) {
      try {
        joinedTeam = await joinTeamById(user.id, teamId);
      } catch (error: any) {
        // Wenn Join fehlschlägt (z.B. Benutzer bereits in Team), ignorieren wir den Fehler
        // Der Benutzer wurde bereits erstellt
        console.warn('Failed to join team after registration:', error.message);
      }
    }
    
    if (contestId) {
      try {
        joinedContest = await joinContestById(user.id, contestId);
      } catch (error: any) {
        // Wenn Join fehlschlägt, ignorieren wir den Fehler
        console.warn('Failed to join contest after registration:', error.message);
      }
    }

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
      joinedTeam: joinedTeam ? { id: joinedTeam.id, name: joinedTeam.name } : null,
      joinedContest: joinedContest ? { id: joinedContest.id, name: joinedContest.name } : null,
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
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  } catch (error: any) {
    console.error('GitHub OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
  }
}

export const githubCallback = createOAuthCallback('github', () => 
  !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
);

// Google OAuth handlers
export function googleAuth(req: Request, res: Response, next: any) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
  }
}

export const googleCallback = createOAuthCallback('google', () => 
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
);

// Facebook OAuth handlers
export function facebookAuth(req: Request, res: Response, next: any) {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
  } catch (error: any) {
    console.error('Facebook OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
  }
}

export const facebookCallback = createOAuthCallback('facebook', () => 
  !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
);

// Apple OAuth handlers
export function appleAuth(req: Request, res: Response, next: any) {
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
  }
  
  try {
    passport.authenticate('apple')(req, res, next);
  } catch (error: any) {
    console.error('Apple OAuth error:', error);
    return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
  }
}

export const appleCallback = createOAuthCallback('apple', () => 
  !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)
);

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

    // Check if this is a password setup (user has no password) or password reset
    const user = await getUserById(tokenData.userId);
    const isPasswordSetup = user && !user.password_hash;

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(tokenData.userId, passwordHash);
    await clearPasswordResetToken(tokenData.userId);

    // If user is inactive and this is a password setup (admin-created account), activate the user
    if (user && !(user as any).active && isPasswordSetup) {
      const db = getPool();
      await db.query(
        `UPDATE users SET active = true WHERE id = $1`,
        [tokenData.userId]
      );
    }

    const message = isPasswordSetup 
      ? 'Password has been set successfully and your account has been activated. You can now sign in with your email and password.'
      : 'Password has been reset successfully';

    res.json({ message });
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

export async function requestLoginCode(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await getUserByEmail(email);
    
    // If user doesn't exist, create account automatically
    if (!user) {
      // Extract name from email (part before @) or use a default
      const emailName = email.split('@')[0];
      const defaultName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._-]/g, ' ');

      // Enrich with Sihot data if available
      const { combinedName, sihotGuestPayload, sihotGuest } = await enrichWithSihotData(
        email,
        defaultName
      );

      // Create user with email verified (since they're receiving the code at this email)
      // No password hash - passwordless account
      user = await createUser({
        email,
        password_hash: null, // No password for passwordless accounts
        name: combinedName,
        role: 'guest',
        user_type: 'explorer',
        sihot_guest_id: sihotGuest?.guestId || null,
        sihot_guest_data: sihotGuestPayload,
      });

      // Mark email as verified since they're receiving the code at this email address
      const db = getPool();
      await db.query(
        'UPDATE users SET email_verified = TRUE WHERE id = $1',
        [user.id]
      );
      user.email_verified = true;

      // Send welcome email (non-blocking) since email is already verified
      sendWelcomeEmail(user.id, user.email || '', user.name, user.role).catch((error) => {
        console.error('Failed to send welcome email:', error);
      });
    } else {
      // Check if email is verified (required for passwordless login)
      if (!user.email_verified) {
        return res.status(403).json({ 
          error: 'Email verification required',
          message: 'Please verify your email address before using passwordless login.'
        });
      }
    }

    // Generate and send login code
    const code = await generateLoginCode(user.id);
    await sendLoginCodeEmail(user.id, user.email || '', user.name, code);

    res.json({ message: 'If an account exists with this email, a login code has been sent.' });
  } catch (error: any) {
    console.error('Request login code error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while sending login code' });
  }
}

export async function loginWithCode(req: Request, res: Response) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const codeData = await verifyLoginCode(email, code);
    if (!codeData) {
      return res.status(401).json({ error: 'Invalid or expired login code' });
    }

    const user = await getUserById(codeData.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
        emailVerified: user.email_verified === true,
        sihotGuestId: user.sihot_guest_id || null,
        sihotGuest: user.sihot_guest_data?.guest ?? null,
        sihotReservations: user.sihot_guest_data?.reservations ?? [],
      },
    });
  } catch (error: any) {
    console.error('Login with code error:', error);
    res.status(500).json({ error: error.message || 'An error occurred while logging in' });
  }
}
