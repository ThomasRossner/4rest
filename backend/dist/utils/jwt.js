import jwt from 'jsonwebtoken';
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
}
function getJwtOptions() {
    const options = {};
    options.expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d');
    return options;
}
/**
 * Signs a JWT token for a user
 * Extracted from auth controller for reusability (DRY principle)
 */
export function signUserToken(payload) {
    return jwt.sign(payload, getJwtSecret(), getJwtOptions());
}
//# sourceMappingURL=jwt.js.map