import { getPool } from '../database/connection.js';

export interface TaskParameter {
  id: string;
  parameter_type: 'type' | 'category' | 'difficulty' | 'time_required' | 'location_tool';
  value: string;
  display_order: number;
  weight?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardParameter {
  id: string;
  parameter_type: 'reward_art' | 'kategorie' | 'kosten';
  value: string;
  display_order: number;
  weight?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTaskParameters(parameterType?: string): Promise<TaskParameter[]> {
  const db = getPool();
  let query = 'SELECT * FROM task_parameters WHERE active = TRUE';
  const params: any[] = [];

  if (parameterType) {
    query += ' AND parameter_type = $1';
    params.push(parameterType);
  }

  query += ' ORDER BY parameter_type, display_order, value';

  const result = await db.query(query, params);
  return result.rows;
}

export async function getRewardParameters(parameterType?: string): Promise<RewardParameter[]> {
  const db = getPool();
  let query = 'SELECT * FROM reward_parameters WHERE active = TRUE';
  const params: any[] = [];

  if (parameterType) {
    query += ' AND parameter_type = $1';
    params.push(parameterType);
  }

  query += ' ORDER BY parameter_type, display_order, value';

  const result = await db.query(query, params);
  return result.rows;
}

export async function createTaskParameter(
  parameterType: string,
  value: string,
  displayOrder: number = 0,
  weight?: number
): Promise<TaskParameter> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO task_parameters (parameter_type, value, display_order, weight)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [parameterType, value, displayOrder, weight ?? displayOrder]
  );
  return result.rows[0];
}

export async function createRewardParameter(
  parameterType: string,
  value: string,
  displayOrder: number = 0,
  weight?: number
): Promise<RewardParameter> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO reward_parameters (parameter_type, value, display_order, weight)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [parameterType, value, displayOrder, weight ?? displayOrder]
  );
  return result.rows[0];
}

export async function updateTaskParameter(
  id: string,
  updates: { value?: string; display_order?: number; weight?: number; active?: boolean }
): Promise<TaskParameter> {
  const db = getPool();
  const updateFields: string[] = [];
  const values: any[] = [];
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

  const result = await db.query(
    `UPDATE task_parameters SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Task parameter not found');
  }

  return result.rows[0];
}

export async function updateRewardParameter(
  id: string,
  updates: { value?: string; display_order?: number; weight?: number; active?: boolean }
): Promise<RewardParameter> {
  const db = getPool();
  const updateFields: string[] = [];
  const values: any[] = [];
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

  const result = await db.query(
    `UPDATE reward_parameters SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error('Reward parameter not found');
  }

  return result.rows[0];
}

export async function deleteTaskParameter(id: string): Promise<void> {
  const db = getPool();
  await db.query('DELETE FROM task_parameters WHERE id = $1', [id]);
}

export async function deleteRewardParameter(id: string): Promise<void> {
  const db = getPool();
  await db.query('DELETE FROM reward_parameters WHERE id = $1', [id]);
}

