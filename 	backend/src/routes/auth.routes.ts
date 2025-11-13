import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  githubAuth,
  githubCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  requestLoginCode,
  loginWithCode,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
router.post('/refresh', refreshToken);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email verification routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerificationEmail);

// Passwordless login routes
router.post('/request-login-code', requestLoginCode);
router.post('/login-with-code', loginWithCode);

// GitHub OAuth routes
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

export default router;
