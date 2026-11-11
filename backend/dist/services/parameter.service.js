import { getPool } from '../database/connection.js';
export async function getTaskParameters(parameterType) {
    const db = getPool();
    let query = 'SELECT * FROM task_parameters WHERE active = TRUE';
    const params = [];
    if (parameterType) {
        query += ' AND parameter_type = $1';
        params.push(parameterType);
    }
    query += ' ORDER BY parameter_type, display_order, value';
    const result = await db.query(query, params);
    return result.rows;
}
export async function getRewardParameters(parameterType) {
    const db = getPool();
    let query = 'SELECT * FROM reward_parameters WHERE active = TRUE';
    const params = [];
    if (parameterType) {
        query += ' AND parameter_type = $1';
        params.push(parameterType);
    }
    query += ' ORDER BY parameter_type, display_order, value';
    const result = await db.query(query, params);
    return result.rows;
}
export async function createTaskParameter(parameterType, value, displayOrder = 0, weight) {
    const db = getPool();
    const result = await db.query(`INSERT INTO task_parameters (parameter_type, value, display_order, weight)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [parameterType, value, displayOrder, weight ?? displayOrder]);
    return result.rows[0];
}
export async function createRewardParameter(parameterType, value, displayOrder = 0, weight) {
    const db = getPool();
    const result = await db.query(`INSERT INTO reward_parameters (parameter_type, value, display_order, weight)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [parameterType, value, displayOrder, weight ?? displayOrder]);
    return result.rows[0];
}
export async function updateTaskParameter(id, updates) {
    const db = getPool();
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    if (updates.value !== undefined) {
        updateFields.push(`value = $${paramIndex++}`);
        values.push(updates.value);
    }
    if (updates.display_order !== undefined) {
        updateFields.push(`display_order = $${paramIndex++}`);
        values.push(updates.display_order);
    }
    if (updates.weight !== undefined) {
        updateFields.push(`weight = $${paramIndex++}`);
        values.push(updates.weight);
    }
    if (updates.active !== undefined) {
        updateFields.push(`active = $${paramIndex++}`);
        values.push(updates.active);
    }
    if (updateFields.length === 0) {
        throw new Error('No fields to update');
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const result = await db.query(`UPDATE task_parameters SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
    if (!result.rows[0]) {
        throw new Error('Task parameter not found');
    }
    return result.rows[0];
}
export async function updateRewardParameter(id, updates) {
    const db = getPool();
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    if (updates.value !== undefined) {
        updateFields.push(`value = $${paramIndex++}`);
        values.push(updates.value);
    }
    if (updates.display_order !== undefined) {
        updateFields.push(`display_order = $${paramIndex++}`);
        values.push(updates.display_order);
    }
    if (updates.weight !== undefined) {
        updateFields.push(`weight = $${paramIndex++}`);
        values.push(updates.weight);
    }
    if (updates.active !== undefined) {
        updateFields.push(`active = $${paramIndex++}`);
        values.push(updates.active);
    }
    if (updateFields.length === 0) {
        throw new Error('No fields to update');
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const result = await db.query(`UPDATE reward_parameters SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
    if (!result.rows[0]) {
        throw new Error('Reward parameter not found');
    }
    return result.rows[0];
}
export async function deleteTaskParameter(id) {
    const db = getPool();
    await db.query('DELETE FROM task_parameters WHERE id = $1', [id]);
}
export async function deleteRewardParameter(id) {
    const db = getPool();
    await db.query('DELETE FROM reward_parameters WHERE id = $1', [id]);
}
//# sourceMappingURL=parameter.service.js.map