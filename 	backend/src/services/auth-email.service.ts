import crypto from 'crypto';
import { getPool } from '../database/connection.js';
import { emailService } from './email.service.js';
import { emailTemplates } from './email-templates.service.js';

const TOKEN_EXPIRY_HOURS = {
  passwordReset: 1,
  emailVerification: 24,
};

export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const db = getPool();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS.emailVerification);

  await db.query(
    `UPDATE users 
     SET email_verification_token = $1, email_verification_expires = $2 
     WHERE id = $3`,
    [token, expires, userId]
  );

  return token;
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  const db = getPool();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS.passwordReset);

  await db.query(
    `UPDATE users 
     SET password_reset_token = $1, password_reset_expires = $2 
     WHERE id = $3`,
    [token, expires, userId]
  );

  return token;
}

export async function sendWelcomeEmail(userId: string, email: string, name: string, role: string): Promise<void> {
  try {
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = emailTemplates.getWelcomeEmail({
      name,
      email,
      role,
      appUrl,
    });

    await emailService.sendEmail({
      to: email,
      subject: 'Welcome to Roots of Impact!',
      html,
    });
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email failure shouldn't block verification
  }
}

export async function sendEmailVerificationEmail(
  userId: string,
  email: string,
  name: string,
  token?: string
): Promise<void> {
  try {
    const verificationToken = token || await generateEmailVerificationToken(userId);
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const html = emailTemplates.getEmailVerificationEmail({
      name,
      email,
      verificationUrl,
      expiresIn: `${TOKEN_EXPIRY_HOURS.emailVerification} hours`,
    });

    await emailService.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - Roots of Impact',
      html,
    });
  } catch (error: any) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(userId: string, email: string, name: string): Promise<void> {
  try {
    const resetToken = await generatePasswordResetToken(userId);
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const html = emailTemplates.getPasswordResetEmail({
      name,
      email,
      resetUrl,
      expiresIn: `${TOKEN_EXPIRY_HOURS.passwordReset} hour`,
    });

    await emailService.sendEmail({
      to: email,
      subject: 'Reset Your Password - Roots of Impact',
      html,
    });
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

export async function verifyEmailToken(token: string): Promise<{ userId: string; email: string } | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email FROM users 
     WHERE email_verification_token = $1 
     AND email_verification_expires > NOW() 
     AND email_verified = FALSE`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Mark email as verified and clear token
  await db.query(
    `UPDATE users 
     SET email_verified = TRUE, 
         email_verification_token = NULL, 
         email_verification_expires = NULL 
     WHERE id = $1`,
    [user.id]
  );

  return { userId: user.id, email: user.email };
}

export async function verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string } | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email FROM users 
     WHERE password_reset_token = $1 
     AND password_reset_expires > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return { userId: result.rows[0].id, email: result.rows[0].email };
}

export async function clearPasswordResetToken(userId: string): Promise<void> {
  const db = getPool();
  await db.query(
    `UPDATE users 
     SET password_reset_token = NULL, password_reset_expires = NULL 
     WHERE id = $1`,
    [userId]
  );
}

