import { getPool } from '../database/connection.js';
import { USER_ROLES, USER_TYPES } from '../constants/enums.js';
import bcrypt from 'bcryptjs';
function ensureRole(value) {
    const rolesArray = Array.from(USER_ROLES);
    if (typeof value === 'string' && rolesArray.includes(value)) {
        return value;
    }
    return 'guest';
}
function ensureUserType(value) {
    if (typeof value === 'string' && USER_TYPES.includes(value)) {
        return value;
    }
    return 'explorer';
}
export async function createUser(data) {
    const db = getPool();
    try {
        const resolvedRole = ensureRole(data.role);
        const resolvedUserType = ensureUserType(data.user_type);
        const preferredLang = data.preferred_language === 'en' ? 'en' : 'de';
        const values = [
            data.email || null,
            data.password_hash || null,
            data.name,
            resolvedRole,
            resolvedUserType,
            data.points ?? 0,
            data.avatar_url || null,
            data.oauth_provider || null,
            data.oauth_id || null,
            data.oauth_email || null,
            data.sihot_guest_id || null,
            data.sihot_guest_data ? JSON.stringify(data.sihot_guest_data) : null,
            preferredLang,
        ];
        const result = await db.query(`INSERT INTO users (email, password_hash, name, role, user_type, points, avatar_url, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($12)::jsonb, $13)
       RETURNING *`, values);
        if (!result.rows[0]) {
            throw new Error('User creation returned no rows');
        }
        console.log('User created successfully:', result.rows[0].id);
        return result.rows[0];
    }
    catch (error) {
        console.error('Error in createUser:', error);
        console.error('Error code:', error.code);
        console.error('Error detail:', error.detail);
        console.error('Error constraint:', error.constraint);
        throw error;
    }
}
export async function getUserByEmail(email) {
    try {
        const db = getPool();
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('[getUserByEmail] Database error:', {
            message: error.message,
            code: error.code,
            email,
        });
        throw error;
    }
}
export async function getUserById(id) {
    const db = getPool();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
}
export async function getUserByOAuth(provider, oauthId) {
    const db = getPool();
    const result = await db.query('SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2', [provider, oauthId]);
    return result.rows[0] || null;
}
export async function createOrUpdateOAuthUser(data) {
    const db = getPool();
    if (data.userId) {
        // Update existing user
        try {
            const result = await db.query(`UPDATE users 
         SET oauth_provider = $1, oauth_id = $2, oauth_email = $3, 
             name = COALESCE($4, name), avatar_url = COALESCE($5, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`, [data.oauthProvider, data.oauthId, data.oauthEmail || null, data.name, data.avatarUrl || null, data.userId]);
            if (!result.rows[0]) {
                throw new Error(`User with ID ${data.userId} not found for OAuth update`);
            }
            return result.rows[0];
        }
        catch (error) {
            console.error('Error updating OAuth user:', error);
            throw error;
        }
    }
    // Create new user
    try {
        const userData = {
            email: data.email || data.oauthEmail || null,
            oauth_provider: data.oauthProvider,
            oauth_id: data.oauthId,
            oauth_email: data.oauthEmail || null,
            name: data.name,
            role: ensureRole(data.role),
            user_type: ensureUserType(data.userType),
            points: 0,
            avatar_url: data.avatarUrl || null,
        };
        console.log('Creating OAuth user with data:', JSON.stringify(userData, null, 2));
        const user = await createUser(userData);
        console.log('OAuth user created successfully:', user.id);
        return user;
    }
    catch (error) {
        console.error('Error creating OAuth user:', error);
        console.error('Error details:', error.message, error.code, error.detail);
        throw error;
    }
}
export async function getUserProgressService(userId) {
    const db = getPool();
    const progressResult = await db.query(`SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     WHERE u.id = $1
     GROUP BY u.id`, [userId]);
    const co2Result = await db.query(`SELECT COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved
     FROM user_tasks ut
     JOIN tasks t ON ut.task_id = t.id
     WHERE ut.user_id = $1`, [userId]);
    return {
        tasksCompleted: parseInt(progressResult.rows[0]?.tasks_completed || '0'),
        treesPlanted: parseInt(progressResult.rows[0]?.trees_planted || '0'),
        totalPoints: parseInt(progressResult.rows[0]?.total_points || '0'),
        co2Saved: parseFloat(co2Result.rows[0]?.co2_saved || '0'),
    };
}
export async function getPreferredLanguage(userId) {
    const db = getPool();
    const result = await db.query('SELECT preferred_language FROM users WHERE id = $1', [userId]);
    const row = result.rows[0];
    if (!row)
        return null;
    return row.preferred_language === 'en' ? 'en' : 'de';
}
export async function getMeService(userId) {
    const db = getPool();
    const result = await db.query(`SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data, preferred_language
     FROM users WHERE id = $1`, [userId]);
    if (!result.rows[0]) {
        return null;
    }
    const user = result.rows[0];
    const lang = user.preferred_language === 'en' ? 'en' : 'de';
    return {
        id: user.id,
        email: user.email || user.oauth_email || null,
        name: user.name,
        role: user.role,
        userType: user.user_type,
        points: user.points || 0,
        avatar: user.avatar_url || null,
        sihotGuestId: user.sihot_guest_id || null,
        sihotGuest: user.sihot_guest_data?.guest ?? null,
        sihotReservations: user.sihot_guest_data?.reservations ?? [],
        preferredLanguage: lang,
    };
}
export async function getUserProfileService(userId) {
    const db = getPool();
    const result = await db.query(`SELECT id, email, oauth_email, name, role, user_type, points, avatar_url, sihot_guest_id, sihot_guest_data, preferred_language
     FROM users WHERE id = $1`, [userId]);
    if (!result.rows[0]) {
        return null;
    }
    const user = result.rows[0];
    const lang = user.preferred_language === 'en' ? 'en' : 'de';
    return {
        id: user.id,
        email: user.email || user.oauth_email || null,
        name: user.name,
        role: user.role,
        userType: user.user_type,
        points: user.points || 0,
        avatar_url: user.avatar_url || null,
        sihotGuestId: user.sihot_guest_id || null,
        sihotGuest: user.sihot_guest_data?.guest ?? null,
        sihotReservations: user.sihot_guest_data?.reservations ?? [],
        preferredLanguage: lang,
    };
}
export async function updateUserProfileService(userId, data) {
    const db = getPool();
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (data.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
    }
    if (data.avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(data.avatar_url);
    }
    if (data.role) {
        updates.push(`role = $${paramIndex++}`);
        values.push(ensureRole(data.role));
    }
    if (data.user_type) {
        updates.push(`user_type = $${paramIndex++}`);
        values.push(ensureUserType(data.user_type));
    }
    const preferredLang = data.preferred_language ?? data.preferredLanguage;
    if (preferredLang !== undefined) {
        const lang = preferredLang === 'en' ? 'en' : 'de';
        updates.push(`preferred_language = $${paramIndex++}`);
        values.push(lang);
    }
    if (updates.length === 0) {
        return getUserProfileService(userId);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    const result = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, role, points, avatar_url, preferred_language`, values);
    return result.rows[0];
}
export async function setUserPasswordService(userId, password) {
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(userId, passwordHash);
}
export async function updateUserPassword(userId, passwordHash) {
    const db = getPool();
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, userId]);
}
/**
 * Delete user_tasks entries for a user (oldest first)
 */
export async function deleteUserTasks(userId, count) {
    const db = getPool();
    const result = await db.query(`DELETE FROM user_tasks 
     WHERE user_id = $1 
     AND id IN (
       SELECT id FROM user_tasks 
       WHERE user_id = $1 
       ORDER BY completed_at ASC 
       LIMIT $2
     )
     RETURNING id`, [userId, count]);
    return result.rows.length;
}
/**
 * Adjust user points directly
 */
export async function adjustUserPoints(userId, pointsDelta) {
    const db = getPool();
    const result = await db.query(`UPDATE users 
     SET points = GREATEST(0, points + $1), 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING points`, [pointsDelta, userId]);
    if (!result.rows[0]) {
        throw new Error(`User with ID ${userId} not found`);
    }
    return result.rows[0].points;
}
export async function listUsersService(filters) {
    const db = getPool();
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;
    if (filters?.role) {
        conditions.push(`role = $${paramIndex++}`);
        params.push(filters.role);
    }
    if (filters?.active !== undefined) {
        conditions.push(`active = $${paramIndex++}`);
        params.push(filters.active);
    }
    if (filters?.search) {
        conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR oauth_email ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    const countResult = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);
    const result = await db.query(`SELECT id, email, oauth_email, name, role, user_type, points, active, created_at, deleted_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset]);
    const users = result.rows.map((row) => ({
        id: row.id,
        email: row.email || row.oauth_email || null,
        name: row.name,
        role: row.role,
        user_type: row.user_type,
        points: row.points || 0,
        active: row.active !== false,
        created_at: row.created_at,
        deleted_at: row.deleted_at,
    }));
    return { users, total };
}
export async function getUserDetailsService(userId) {
    const db = getPool();
    const userResult = await db.query(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [userId]);
    if (!userResult.rows[0]) {
        return null;
    }
    const user = userResult.rows[0];
    // Get statistics
    const statsResult = await db.query(`SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points_earned,
       COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved,
       COUNT(DISTINCT rr.id) as rewards_redeemed,
       MIN(ut.completed_at) as first_task_date,
       MAX(ut.completed_at) as last_task_date
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     LEFT JOIN reward_redemptions rr ON u.id = rr.user_id AND rr.status = 'used'
     WHERE u.id = $1
     GROUP BY u.id`, [userId]);
    const stats = statsResult.rows[0] || {
        tasks_completed: 0,
        trees_planted: 0,
        total_points_earned: 0,
        co2_saved: 0,
        rewards_redeemed: 0,
        first_task_date: null,
        last_task_date: null,
    };
    return {
        ...user,
        statistics: {
            tasksCompleted: parseInt(stats.tasks_completed || '0', 10),
            treesPlanted: parseInt(stats.trees_planted || '0', 10),
            totalPoints: parseInt(stats.total_points_earned || '0', 10),
            co2Saved: parseFloat(stats.co2_saved || '0'),
            rewardsRedeemed: parseInt(stats.rewards_redeemed || '0', 10),
            firstTaskDate: stats.first_task_date,
            lastTaskDate: stats.last_task_date,
        },
    };
}
export async function updateUserRoleService(userId, role, adminUserId) {
    const db = getPool();
    // Prevent admin from changing their own role
    if (userId === adminUserId) {
        throw new Error('Cannot change your own role');
    }
    const validatedRole = ensureRole(role);
    const result = await db.query(`UPDATE users 
     SET role = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`, [validatedRole, userId]);
    if (!result.rows[0]) {
        throw new Error(`User with ID ${userId} not found`);
    }
    return result.rows[0];
}
export async function updateUserPointsService(userId, points) {
    const db = getPool();
    const result = await db.query(`UPDATE users 
     SET points = GREATEST(0, $1), updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`, [points, userId]);
    if (!result.rows[0]) {
        throw new Error(`User with ID ${userId} not found`);
    }
    return result.rows[0];
}
export async function toggleUserActiveService(userId, adminUserId) {
    const db = getPool();
    // Prevent admin from deactivating themselves
    if (userId === adminUserId) {
        throw new Error('Cannot deactivate yourself');
    }
    const result = await db.query(`UPDATE users 
     SET active = NOT active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`, [userId]);
    if (!result.rows[0]) {
        throw new Error(`User with ID ${userId} not found`);
    }
    return result.rows[0];
}
export async function resetUserPasswordService(userId) {
    const db = getPool();
    const { sendPasswordResetEmail } = await import('./auth-email.service.js');
    // Get user details
    const userResult = await db.query(`SELECT id, email, name FROM users WHERE id = $1 AND deleted_at IS NULL`, [userId]);
    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }
    const user = userResult.rows[0];
    if (!user.email) {
        throw new Error('User has no email address');
    }
    // Send password reset email
    await sendPasswordResetEmail(user.id, user.email, user.name);
    return { message: 'Password reset email sent successfully' };
}
export async function deleteUserService(userId, adminUserId, hardDelete = false) {
    const db = getPool();
    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
        throw new Error('Cannot delete yourself');
    }
    if (hardDelete) {
        // Hard delete: Remove user and all related data
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    else {
        // Soft delete: Mark as deleted
        await db.query(`UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP, 
           active = FALSE, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`, [userId]);
    }
}
/**
 * Ruft den zeitlichen Verlauf von Punkten, Bäumen und CO2 für einen Benutzer ab
 */
export async function createUserByAdminService(email, role, name) {
    // Check if user already exists (including soft-deleted users)
    const db = getPool();
    const existingUserResult = await db.query(`SELECT id, deleted_at FROM users WHERE email = $1`, [email]);
    if (existingUserResult.rows.length > 0) {
        const existingUser = existingUserResult.rows[0];
        if (existingUser.deleted_at === null) {
            throw new Error('User with this email already exists');
        }
        // If user is soft-deleted, reactivate and update it
        const userName = name || email.split('@')[0];
        const resolvedRole = ensureRole(role);
        const resolvedUserType = ensureUserType('explorer');
        const updateResult = await db.query(`UPDATE users 
       SET password_hash = NULL,
           name = $1,
           role = $2,
           user_type = $3,
           points = 0,
           email_verified = true,
           active = false,
           deleted_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`, [userName, resolvedRole, resolvedUserType, existingUser.id]);
        if (!updateResult.rows[0]) {
            throw new Error('Failed to reactivate soft-deleted user');
        }
        return updateResult.rows[0];
    }
    // Extract name from email if not provided
    const userName = name || email.split('@')[0];
    const resolvedRole = ensureRole(role);
    const resolvedUserType = ensureUserType('explorer');
    const values = [
        email,
        null, // No password - user will set it via email link
        userName,
        resolvedRole,
        resolvedUserType,
        0, // points
        null, // avatar_url
        null, // oauth_provider
        null, // oauth_id
        null, // oauth_email
        null, // sihot_guest_id
        null, // sihot_guest_data
    ];
    try {
        const result = await db.query(`INSERT INTO users (email, password_hash, name, role, user_type, points, avatar_url, oauth_provider, oauth_id, oauth_email, sihot_guest_id, sihot_guest_data, email_verified, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($12)::jsonb, true, false)
       RETURNING *`, values);
        if (!result.rows[0]) {
            throw new Error('User creation returned no rows');
        }
        return result.rows[0];
    }
    catch (error) {
        // Handle duplicate key error (in case of race condition)
        if (error.code === '23505' && error.constraint === 'users_email_key') {
            // Check if it's a soft-deleted user
            const checkResult = await db.query(`SELECT id, deleted_at FROM users WHERE email = $1`, [email]);
            if (checkResult.rows.length > 0 && checkResult.rows[0].deleted_at !== null) {
                // Retry with update
                const userName = name || email.split('@')[0];
                const resolvedRole = ensureRole(role);
                const resolvedUserType = ensureUserType('explorer');
                const updateResult = await db.query(`UPDATE users 
           SET password_hash = NULL,
               name = $1,
               role = $2,
               user_type = $3,
               points = 0,
               email_verified = true,
               active = false,
               deleted_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4
           RETURNING *`, [userName, resolvedRole, resolvedUserType, checkResult.rows[0].id]);
                if (!updateResult.rows[0]) {
                    throw new Error('Failed to reactivate soft-deleted user');
                }
                return updateResult.rows[0];
            }
            throw new Error('User with this email already exists');
        }
        throw error;
    }
}
export async function getUserTimelineService(userId, days = 30) {
    const db = getPool();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Hole alle abgeschlossenen Aufgaben mit Datum und Punkten
    const tasksResult = await db.query(`SELECT 
       DATE(ut.completed_at) as date,
       SUM(ut.points_earned) as points,
       COUNT(DISTINCT ut.id) as task_count
     FROM user_tasks ut
     WHERE ut.user_id = $1 AND ut.completed_at >= $2
     GROUP BY DATE(ut.completed_at)
     ORDER BY DATE(ut.completed_at) ASC`, [userId, startDate]);
    // Hole alle gepflanzten Bäume mit Datum
    const treesResult = await db.query(`SELECT 
       DATE(ft.planted_at) as date,
       COUNT(*) as tree_count
     FROM forest_trees ft
     WHERE ft.user_id = $1 AND ft.planted_at >= $2
     GROUP BY DATE(ft.planted_at)
     ORDER BY DATE(ft.planted_at) ASC`, [userId, startDate]);
    // Hole CO2-Einsparungen aus abgeschlossenen Aufgaben
    const co2Result = await db.query(`SELECT 
       DATE(ut.completed_at) as date,
       SUM(t.co2_savings_kg) as co2
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.user_id = $1 AND ut.completed_at >= $2 AND t.co2_savings_kg > 0
     GROUP BY DATE(ut.completed_at)
     ORDER BY DATE(ut.completed_at) ASC`, [userId, startDate]);
    // Erstelle ein Set aller Daten
    const allDates = new Set();
    tasksResult.rows.forEach((row) => allDates.add(row.date));
    treesResult.rows.forEach((row) => allDates.add(row.date));
    co2Result.rows.forEach((row) => allDates.add(row.date));
    // Erstelle Map für schnellen Zugriff
    const tasksMap = new Map(tasksResult.rows.map((row) => [row.date, { points: parseInt(row.points || 0, 10), tasks: parseInt(row.task_count || 0, 10) }]));
    const treesMap = new Map(treesResult.rows.map((row) => [row.date, parseInt(row.tree_count || 0, 10)]));
    const co2Map = new Map(co2Result.rows.map((row) => [row.date, parseFloat(row.co2 || 0)]));
    // Erstelle Timeline mit kumulativen Werten
    const sortedDates = Array.from(allDates).sort();
    let cumulativePoints = 0;
    let cumulativeTrees = 0;
    let cumulativeCo2 = 0;
    const timeline = sortedDates.map((date) => {
        const dayPoints = tasksMap.get(date)?.points || 0;
        const dayTrees = treesMap.get(date) || 0;
        const dayCo2 = co2Map.get(date) || 0;
        cumulativePoints += dayPoints;
        cumulativeTrees += dayTrees;
        cumulativeCo2 += dayCo2;
        return {
            date,
            points: cumulativePoints,
            trees: cumulativeTrees,
            co2: cumulativeCo2,
        };
    });
    return timeline;
}
export async function getUserStatisticsService(userId) {
    const db = getPool();
    const statsResult = await db.query(`SELECT 
       COUNT(DISTINCT ut.task_id) as tasks_completed,
       COUNT(DISTINCT ft.id) as trees_planted,
       COALESCE(SUM(ut.points_earned), 0) as total_points_earned,
       COALESCE(SUM(t.co2_savings_kg), 0) as co2_saved,
       COUNT(DISTINCT rr.id) as rewards_redeemed,
       MIN(ut.completed_at) as first_task_date,
       MAX(ut.completed_at) as last_task_date,
       COUNT(DISTINCT CASE WHEN ut.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN ut.task_id END) as tasks_last_7_days,
       COUNT(DISTINCT CASE WHEN ut.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN ut.task_id END) as tasks_last_30_days
     FROM users u
     LEFT JOIN user_tasks ut ON u.id = ut.user_id
     LEFT JOIN tasks t ON ut.task_id = t.id
     LEFT JOIN forest_trees ft ON u.id = ft.user_id
     LEFT JOIN reward_redemptions rr ON u.id = rr.user_id AND rr.status = 'used'
     WHERE u.id = $1
     GROUP BY u.id`, [userId]);
    const stats = statsResult.rows[0] || {
        tasks_completed: 0,
        trees_planted: 0,
        total_points_earned: 0,
        co2_saved: 0,
        rewards_redeemed: 0,
        first_task_date: null,
        last_task_date: null,
        tasks_last_7_days: 0,
        tasks_last_30_days: 0,
    };
    return {
        tasksCompleted: parseInt(stats.tasks_completed || '0', 10),
        treesPlanted: parseInt(stats.trees_planted || '0', 10),
        totalPointsEarned: parseInt(stats.total_points_earned || '0', 10),
        co2Saved: parseFloat(stats.co2_saved || '0'),
        rewardsRedeemed: parseInt(stats.rewards_redeemed || '0', 10),
        firstTaskDate: stats.first_task_date,
        lastTaskDate: stats.last_task_date,
        tasksLast7Days: parseInt(stats.tasks_last_7_days || '0', 10),
        tasksLast30Days: parseInt(stats.tasks_last_30_days || '0', 10),
    };
}
//# sourceMappingURL=user.service.js.map