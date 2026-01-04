import { getPool } from '../database/connection.js';
// GDPR: Right to access (data export)
export async function exportUserData(req, res, next) {
    try {
        const userId = req.params.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const db = getPool();
        // Collect all user data
        const userData = {
            profile: await db.query('SELECT * FROM users WHERE id = $1', [userId]),
            tasks: await db.query('SELECT * FROM user_tasks WHERE user_id = $1', [userId]),
            trees: await db.query('SELECT * FROM forest_trees WHERE user_id = $1', [userId]),
            redemptions: await db.query('SELECT * FROM reward_redemptions WHERE user_id = $1', [userId]),
        };
        res.json({
            exported_at: new Date().toISOString(),
            data: userData,
        });
    }
    catch (error) {
        next(error);
    }
}
// GDPR: Right to deletion
export async function deleteUserData(req, res, next) {
    try {
        const userId = req.params.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const db = getPool();
        // Soft delete: anonymize user data instead of hard delete
        // This preserves statistics while removing personal identifiers
        const result = await db.query(`UPDATE users 
       SET email = CONCAT('deleted_', id, '@deleted.local'),
           name = 'Deleted User',
           password_hash = '',
           avatar_url = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User data deleted successfully', affected: result.rowCount });
    }
    catch (error) {
        next(error);
    }
}
export async function updateConsent(userId, consent) {
    const db = getPool();
    await db.query(`INSERT INTO user_consent (user_id, consent_data, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) 
     DO UPDATE SET consent_data = $2, updated_at = CURRENT_TIMESTAMP`, [userId, JSON.stringify(consent)]);
}
//# sourceMappingURL=gdpr.js.map