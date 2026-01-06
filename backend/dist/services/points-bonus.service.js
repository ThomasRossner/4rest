import { getPool } from '../database/connection.js';
import { getUserById } from './user.service.js';
/**
 * Generate a QR code token for points bonus
 * @param employeeUserId - ID of the employee/administrator generating the QR code
 * @param pointsAmount - Amount of points to award
 * @returns QR token data
 */
export async function generatePointsBonusQr(employeeUserId, pointsAmount) {
    const db = getPool();
    // Verify user exists and has permission (employee or administrator role)
    const user = await getUserById(employeeUserId);
    if (!user) {
        throw new Error('User not found');
    }
    if (user.role !== 'employee' && user.role !== 'administrator') {
        throw new Error('Only employees and administrators can generate points bonus QR codes');
    }
    if (!Number.isInteger(pointsAmount) || pointsAmount <= 0) {
        throw new Error('Points amount must be a positive integer');
    }
    // Generate unique QR token
    const crypto = await import('node:crypto');
    const qrToken = crypto.randomBytes(32).toString('hex');
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const result = await db.query(`INSERT INTO points_bonus_qr_tokens (qr_token, points_amount, generated_by, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [qrToken, pointsAmount, employeeUserId, expiresAt]);
    return {
        id: result.rows[0].id,
        qr_token: result.rows[0].qr_token,
        points_amount: result.rows[0].points_amount,
        generated_by: result.rows[0].generated_by,
        generated_at: result.rows[0].generated_at,
        redeemed_by: result.rows[0].redeemed_by,
        redeemed_at: result.rows[0].redeemed_at,
        status: result.rows[0].status,
        expires_at: result.rows[0].expires_at,
    };
}
/**
 * Redeem a points bonus QR code token
 * @param qrToken - QR token to redeem
 * @param userId - ID of the user redeeming the QR code
 * @returns Redemption result with points awarded
 */
export async function redeemPointsBonusQr(qrToken, userId) {
    const db = getPool();
    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    // Only guests (guest or stakeholder role) can redeem points bonus QR codes
    // Employees and administrators cannot redeem QR codes they generate
    if (user.role === 'employee' || user.role === 'administrator') {
        throw new Error('Only guests can redeem points bonus QR codes');
    }
    // Find QR token
    const tokenResult = await db.query(`SELECT * FROM points_bonus_qr_tokens
     WHERE qr_token = $1 AND status = 'pending'`, [qrToken]);
    if (tokenResult.rows.length === 0) {
        throw new Error('QR code not found or already used');
    }
    const token = tokenResult.rows[0];
    // Check if expired
    const now = new Date();
    if (new Date(token.expires_at) < now) {
        // Mark as expired
        await db.query(`UPDATE points_bonus_qr_tokens SET status = 'expired' WHERE id = $1`, [token.id]);
        throw new Error('QR code has expired');
    }
    // Award points
    await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [token.points_amount, userId]);
    // Mark token as redeemed
    await db.query(`UPDATE points_bonus_qr_tokens
     SET status = 'redeemed', redeemed_by = $1, redeemed_at = CURRENT_TIMESTAMP
     WHERE id = $2`, [userId, token.id]);
    // Get updated user points
    const updatedUserResult = await db.query('SELECT points FROM users WHERE id = $1', [userId]);
    const newPointsBalance = updatedUserResult.rows[0]?.points || 0;
    return {
        pointsAwarded: token.points_amount,
        newPointsBalance,
    };
}
/**
 * Mark expired QR tokens as expired (cleanup function)
 * Can be called periodically by a background job
 */
export async function markExpiredTokens() {
    const db = getPool();
    const result = await db.query(`UPDATE points_bonus_qr_tokens
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
     RETURNING id`);
    return result.rowCount || 0;
}
//# sourceMappingURL=points-bonus.service.js.map