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
        await db.query('BEGIN');
        // Remove or detach references that are not cascading.
        await db.query('UPDATE user_tasks SET verified_by = NULL WHERE verified_by = $1', [userId]);
        await db.query('UPDATE photo_task_verifications SET approved_by = NULL WHERE approved_by = $1', [userId]);
        await db.query('UPDATE points_bonus_qr_tokens SET redeemed_by = NULL WHERE redeemed_by = $1', [userId]);
        await db.query('DELETE FROM points_bonus_qr_tokens WHERE generated_by = $1', [userId]);
        const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }
        await db.query('COMMIT');
        res.json({ message: 'User permanently deleted', affected: result.rowCount });
    }
    catch (error) {
        try {
            const db = getPool();
            await db.query('ROLLBACK');
        }
        catch {
            // ignore rollback errors
        }
        next(error);
    }
}
export async function getUserConsent(userId) {
    const db = getPool();
    const result = await db.query(`SELECT consent_data FROM user_consent WHERE user_id = $1`, [userId]);
    if (!result.rows[0])
        return null;
    const raw = result.rows[0].consent_data;
    if (raw == null)
        return null;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof data !== 'object' || data === null)
        return null;
    return {
        analytics: !!data.analytics,
        marketing: !!data.marketing,
        // Kern-Einwilligung: immer aktiv, nicht widerrufbar über diese API (Nutzung der App)
        dataProcessing: true,
    };
}
export async function updateConsent(userId, consent) {
    const db = getPool();
    const normalized = {
        analytics: !!consent.analytics,
        marketing: !!consent.marketing,
        dataProcessing: true,
    };
    await db.query(`INSERT INTO user_consent (user_id, consent_data, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) 
     DO UPDATE SET consent_data = $2, updated_at = CURRENT_TIMESTAMP`, [userId, JSON.stringify(normalized)]);
}
//# sourceMappingURL=gdpr.js.map