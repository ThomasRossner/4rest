import { getPool } from '../database/connection.js';
import { addUserPoints, plantTree } from './gamification.service.js';
import { UserRole, UserType, HotelId, HOTEL_IDS } from '../constants/enums.js';

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
}

export async function getAllTasks(
  filters?: { limit?: number; offset?: number; type?: string },
  userId?: string,
  options?: { includeAll?: boolean }
) {
  const db = getPool();
  let userRole: UserRole | null = null;
  let userType: UserType | null = null;
  const params: any[] = [];
  let paramIndex = 1;

  let applyAudienceFilters = !(options?.includeAll ?? false);

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

  const configuredHotelId = process.env.HOTEL_ID;
  const hotelId: HotelId | null =
    configuredHotelId && (HOTEL_IDS as readonly string[]).includes(configuredHotelId)
      ? (configuredHotelId as HotelId)
      : null;

  let select = 'DISTINCT ON (t.id) t.*';
  let from = ' FROM tasks t';
  if (userId) {
    select += `, (ut.user_id IS NOT NULL) AS completed`;
    from += ` LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $${paramIndex++}`;
    params.push(userId);
  }

  let query = `SELECT ${select}${from} WHERE t.active = TRUE`;

  if (applyAudienceFilters) {
    if (userRole) {
      query += ` AND (t.allowed_roles IS NULL OR COALESCE(array_length(t.allowed_roles, 1), 0) = 0 OR $${paramIndex++} = ANY(t.allowed_roles))`;
      params.push(userRole);
    } else {
      query += ' AND (t.allowed_roles IS NULL OR COALESCE(array_length(t.allowed_roles, 1), 0) = 0)';
    }

    if (userType) {
      query += ` AND (t.allowed_user_types IS NULL OR COALESCE(array_length(t.allowed_user_types, 1), 0) = 0 OR $${paramIndex++} = ANY(t.allowed_user_types))`;
      params.push(userType);
    } else {
      query += ' AND (t.allowed_user_types IS NULL OR COALESCE(array_length(t.allowed_user_types, 1), 0) = 0)';
    }

    if (hotelId) {
      query += ` AND (t.allowed_hotel_ids IS NULL OR COALESCE(array_length(t.allowed_hotel_ids, 1), 0) = 0 OR $${paramIndex++} = ANY(t.allowed_hotel_ids))`;
      params.push(hotelId);
    } else {
      query += ' AND (t.allowed_hotel_ids IS NULL OR COALESCE(array_length(t.allowed_hotel_ids, 1), 0) = 0)';
    }
  }

  if (filters?.type) {
    query += ` AND t.type = $${paramIndex++}`;
    params.push(filters.type);
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
  const result = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  const db = getPool();
  const quizPayload = data.quiz_questions
    ? typeof data.quiz_questions === 'string'
      ? data.quiz_questions
      : JSON.stringify(data.quiz_questions)
    : null;

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
       allowed_hotel_ids
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
  await db.query('UPDATE tasks SET active = FALSE WHERE id = $1', [id]);
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
  await plantTree(userId, taskId);

  return {
    success: true,
    pointsEarned: task.points,
    message: 'Task completed successfully',
  };
}

export async function uploadPhoto(file: Express.Multer.File): Promise<string> {
  // In production, this would upload to cloud storage (S3, Azure Blob, etc.)
  // For now, return a local file path
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${file.filename}`;
}

export async function uploadVideo(file: Express.Multer.File): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${file.filename}`;
}
