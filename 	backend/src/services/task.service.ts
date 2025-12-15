import { getPool } from '../database/connection.js';
import { addUserPoints, plantTree, addGrowthPointsToRandomTree } from './gamification.service.js';
import { UserRole, UserType } from '../constants/enums.js';
import { Location } from './location.service.js';
import { buildAudienceFilterClauses, getConfiguredHotelId } from '../utils/queryBuilder.js';
import { validateRecurrence } from '../utils/validation.js';

type TaskRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  points: number;
  video_url?: string;
  quiz_questions?: any;
  qr_code?: string;
  photo_required?: boolean;
  co2_savings_kg?: number;
  external_id?: string;
  allowed_roles?: UserRole[];
  allowed_user_types?: UserType[];
  allowed_hotel_ids?: HotelId[];
  location_id: string;
  location?: Location;
  active?: boolean;
  recurrence?: TaskRecurrence;
  target_latitude?: number;
  target_longitude?: number;
}

export async function getAllTasks(
  filters?: { limit?: number; offset?: number; type?: string },
  userId?: string,
  options?: { includeAll?: boolean; includeInactive?: boolean }
) {
  const db = getPool();
  let userRole: UserRole | null = null;
  let userType: UserType | null = null;
  const params: any[] = [];
  let paramIndex = 1;

  let applyAudienceFilters = !(options?.includeAll ?? false);
  const includeInactive = options?.includeInactive ?? false;

  if (userId) {
    const userResult = await db.query('SELECT role, user_type FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0]) {
      userRole = userResult.rows[0].role as UserRole;
      userType = userResult.rows[0].user_type as UserType;
      if (userRole === 'administrator') {
        applyAudienceFilters = false;
      }
    }
  }

  const hotelId = getConfiguredHotelId();

  let select = 'DISTINCT ON (t.id) t.*, row_to_json(l.*) AS location';
  let from = ' FROM tasks t JOIN locations l ON l.id = t.location_id';
  if (userId) {
    select += `, (ut.user_id IS NOT NULL) AS completed`;
    from += ` LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $${paramIndex++}`;
    params.push(userId);
  }

  const clauses: string[] = [];
  if (!includeInactive) {
    clauses.push('t.active = TRUE');
  }

  if (applyAudienceFilters) {
    const paramIndexObj = { current: paramIndex };
    const audienceClauses = buildAudienceFilterClauses(
      { userRole, userType, hotelId, applyFilters: true },
      params,
      paramIndexObj
    );
    // Prefix table alias for task-specific queries
    clauses.push(...audienceClauses.map((clause) => clause.replace(/\b(allowed_\w+)\b/g, 't.$1')));
    paramIndex = paramIndexObj.current;
  }

  if (filters?.type) {
    clauses.push(`t.type = $${paramIndex++}`);
    params.push(filters.type);
  }

  let query = `SELECT ${select}${from}`;
  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }

  query += ' ORDER BY t.id, t.created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);
  }

  const result = await db.query(query, params);
  const unique = new Map<string, any>();
  for (const row of result.rows) {
    unique.set(row.id, row);
  }
  return Array.from(unique.values());
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT t.*, row_to_json(l.*) AS location
     FROM tasks t
     JOIN locations l ON l.id = t.location_id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  const db = getPool();
  const quizPayload = data.quiz_questions
    ? typeof data.quiz_questions === 'string'
      ? data.quiz_questions
      : JSON.stringify(data.quiz_questions)
    : null;

  const recurrence = validateRecurrence((data as any).recurrence);

  const result = await db.query(
    `INSERT INTO tasks (
       title,
       description,
       type,
       points,
       video_url,
       quiz_questions,
       qr_code,
       photo_required,
       co2_savings_kg,
       external_id,
       allowed_roles,
       allowed_user_types,
       allowed_hotel_ids,
       location_id,
       active,
       recurrence,
       target_latitude,
       target_longitude
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      data.title,
      data.description ?? null,
      data.type,
      data.points ?? 0,
      data.video_url ?? null,
      quizPayload,
      data.qr_code ?? null,
      data.photo_required ?? false,
      data.co2_savings_kg ?? 0,
      (data as any).external_id ?? null,
      (data.allowed_roles ?? []) as UserRole[],
      (data.allowed_user_types ?? []) as UserType[],
      (data.allowed_hotel_ids ?? []) as HotelId[],
      data.location_id,
      data.active ?? true,
      recurrence,
      (data as any).target_latitude ?? null,
      (data as any).target_longitude ?? null,
    ]
  );
  return result.rows[0];
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
  const db = getPool();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      if (key === 'quiz_questions' && typeof value === 'object') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(JSON.stringify(value));
      } else if (key === 'recurrence') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(validateRecurrence(value as string));
      } else {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }
  });

  if (updates.length === 0) {
    return getTaskById(id);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await db.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteTask(id: string): Promise<void> {
  const db = getPool();
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
}

export async function setTasksActiveState(ids: string[], active: boolean): Promise<void> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  await db.query(
    'UPDATE tasks SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[])',
    [active, ids]
  );
}

export async function bulkDeleteTasks(ids: string[]): Promise<void> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  await db.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [ids]);
}

export async function completeTask(taskId: string, userId: string, data?: any) {
  const db = getPool();

  // Check if already completed
  const existing = await db.query(
    'SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2',
    [userId, taskId]
  );

  if (existing.rows.length > 0) {
    throw new Error('Task already completed');
  }

  // Get task details
  const task = await getTaskById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  // Validate quiz answers if provided
  if (data?.quiz_answers && task.quiz_questions) {
    const questions = typeof task.quiz_questions === 'string' 
      ? JSON.parse(task.quiz_questions)
      : task.quiz_questions;
    
    let correctAnswers = 0;
    data.quiz_answers.forEach((answer: any) => {
      const question = questions[answer.questionIndex];
      if (question && question.correctAnswer === answer.answer) {
        correctAnswers++;
      }
    });

    // Require at least 70% correct answers
    const requiredCorrect = Math.ceil(questions.length * 0.7);
    if (correctAnswers < requiredCorrect) {
      throw new Error(`Need at least ${requiredCorrect} correct answers to complete this task`);
    }
  }

  // Insert completion record
  await db.query(
    `INSERT INTO user_tasks (user_id, task_id, photo_url, quiz_answers, points_earned)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      taskId,
      data?.photo_url,
      data?.quiz_answers ? JSON.stringify(data.quiz_answers) : null,
      task.points,
    ]
  );

  // Award points and plant tree
  await addUserPoints(userId, task.points);
  const newTreeId = await plantTree(userId, taskId);
  
  // Distribute task points to growth of a random existing tree (not the newly planted one)
  await addGrowthPointsToRandomTree(userId, task.points, newTreeId);

  return {
    success: true,
    pointsEarned: task.points,
    message: 'Task completed successfully',
  };
}

export async function uploadPhoto(file: Express.Multer.File): Promise<string> {
  // In production, this would upload to cloud storage (S3, Azure Blob, etc.)
  // For now, return a local file path
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  return `${baseUrl}/uploads/${file.filename}`;
}

export async function uploadVideo(file: Express.Multer.File): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  return `${baseUrl}/uploads/${file.filename}`;
}
