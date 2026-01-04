import passport from 'passport';
import { signUserToken } from './jwt.js';
/**
 * Gets the frontend URL from environment or defaults to localhost
 */
export function getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
}
/**
 * Creates a reusable OAuth callback handler
 * Eliminates code duplication across OAuth providers (DRY principle)
 */
export function createOAuthCallback(provider, envCheck) {
    return async (req, res, next) => {
        if (!envCheck()) {
            return res.redirect(`${getFrontendUrl()}/login?error=oauth_not_configured`);
        }
        passport.authenticate(provider, { session: false }, async (err, user) => {
            if (err) {
                console.error(`${provider} OAuth authentication error:`, err);
                return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
            }
            if (!user) {
                console.error(`${provider} OAuth: No user returned from authentication`);
                return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
            }
            try {
                console.log(`${provider} OAuth callback: User authenticated, generating token for user:`, user.id);
                const userEmail = user.email || user.oauth_email || '';
                const token = signUserToken({ id: user.id, email: userEmail, role: user.role });
                console.log(`${provider} OAuth: Token generated, redirecting to frontend`);
                const redirectUrl = `${getFrontendUrl()}/auth/callback?token=${token}`;
                return res.redirect(redirectUrl);
            }
            catch (error) {
                console.error(`${provider} OAuth: Token generation error:`, error);
                return res.redirect(`${getFrontendUrl()}/login?error=token_generation_failed`);
            }
        })(req, res, next);
    };
}
//# sourceMappingURL=oauth.js.map