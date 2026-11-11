import { Router } from 'express';
import { login, register, refreshToken, githubAuth, githubCallback, googleAuth, googleCallback, facebookAuth, facebookCallback, appleAuth, appleCallback, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, requestResendVerificationEmail, emailDeliveryEvent, requestLoginCode, loginWithCode, mergeGuestSession, } from '../controllers/auth.controller.js';
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
router.post('/resend-verification-request', requestResendVerificationEmail);
router.post('/email-events', emailDeliveryEvent);
// Passwordless login routes
router.post('/request-login-code', requestLoginCode);
router.post('/login-with-code', loginWithCode);
router.post('/merge-guest-session', authenticate, mergeGuestSession);
// OAuth routes
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);
router.get('/apple', appleAuth);
router.get('/apple/callback', appleCallback);
export default router;
//# sourceMappingURL=auth.routes.js.map