import { getPool } from '../database/connection.js';
import { addUserPoints, plantTree, addGrowthPointsToRandomTree } from './gamification.service.js';
import { UserRole, UserType, HotelId } from '../constants/enums.js';
import { Location } from './location.service.js';
import { buildAudienceFilterClauses, getConfiguredHotelId } from '../utils/queryBuilder.js';
import { validateRecurrence, validateUrl, validateGpsCoordinates, validateQrCode } from '../utils/validation.js';

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
  article_url?: string;
  article_content?: string;
  survey_questions?: any;
  survey_type?: string;
  prerequisite_task_id?: string;
  prerequisite_task_count?: number;
  prerequisite_task_ids?: string[];
  is_available?: boolean;
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
  
  // Add prerequisite fields to select
  select += ', t.prerequisite_task_id, t.prerequisite_task_count, t.prerequisite_task_ids';

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
  
  const tasks = Array.from(unique.values());
  
  // Check availability for each task if userId is provided
  if (userId) {
    for (const task of tasks) {
      task.is_available = await checkPrerequisiteMet(task.id, userId);
    }
  } else {
    // If no userId, all tasks are considered available (for admin views)
    for (const task of tasks) {
      task.is_available = true;
    }
  }
  
  return tasks;
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
  
  // Validate prerequisites
  await validatePrerequisites(data, null);

  // Validate task type-specific fields
  if (data.type === 'video' && data.video_url) {
    validateUrl(data.video_url, 'Video URL');
  }
  
  if (data.type === 'qr' && data.qr_code) {
    validateQrCode(data.qr_code);
  }
  
  if (data.type === 'visit_location') {
    const coords = validateGpsCoordinates(
      (data as any).target_latitude,
      (data as any).target_longitude
    );
    if (!coords) {
      throw new Error('Target latitude and longitude are required for visit_location tasks');
    }
  }
  
  if (data.type === 'quiz' && !quizPayload) {
    throw new Error('Quiz questions are required for quiz tasks');
  }
  
  if (data.type === 'article_quiz') {
    if (!(data as any).article_url && !(data as any).article_content) {
      throw new Error('Article URL or article content is required for article_quiz tasks');
    }
    if ((data as any).article_url) {
      validateUrl((data as any).article_url, 'Article URL');
    }
    if (!quizPayload) {
      throw new Error('Quiz questions are required for article_quiz tasks');
    }
  }
  
  const surveyPayload = data.survey_questions
    ? typeof data.survey_questions === 'string'
      ? data.survey_questions
      : JSON.stringify(data.survey_questions)
    : null;
  
  if (data.type === 'survey') {
    if (!surveyPayload) {
      throw new Error('Survey questions are required for survey tasks');
    }
  }

  const prerequisiteTaskIdsArray = (data as any).prerequisite_task_ids 
    ? Array.isArray((data as any).prerequisite_task_ids) 
      ? (data as any).prerequisite_task_ids 
      : JSON.parse((data as any).prerequisite_task_ids)
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
       allowed_hotel_ids,
       location_id,
       active,
       recurrence,
       target_latitude,
       target_longitude,
       article_url,
       article_content,
       survey_questions,
       survey_type,
       prerequisite_task_id,
       prerequisite_task_count,
       prerequisite_task_ids
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
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
      (data as any).article_url ?? null,
      (data as any).article_content ?? null,
      surveyPayload,
      (data as any).survey_type ?? null,
      (data as any).prerequisite_task_id ?? null,
      (data as any).prerequisite_task_count ?? null,
      prerequisiteTaskIdsArray,
    ]
  );
  return result.rows[0];
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
  const db = getPool();
  
  // Get existing task to validate type-specific fields
  const existingTask = await getTaskById(id);
  if (!existingTask) {
    return null;
  }
  
  // Validate prerequisites
  await validatePrerequisites(data, id);
  
  const taskType = data.type || existingTask.type;
  
  // Validate task type-specific fields
  if (taskType === 'video' && data.video_url !== undefined) {
    if (data.video_url) {
      validateUrl(data.video_url, 'Video URL');
    }
  }
  
  if (taskType === 'qr' && data.qr_code !== undefined) {
    if (data.qr_code) {
      validateQrCode(data.qr_code);
    }
  }
  
  if (taskType === 'visit_location' && ((data as any).target_latitude !== undefined || (data as any).target_longitude !== undefined)) {
    const lat = (data as any).target_latitude !== undefined ? (data as any).target_latitude : existingTask.target_latitude;
    const lng = (data as any).target_longitude !== undefined ? (data as any).target_longitude : existingTask.target_longitude;
    const coords = validateGpsCoordinates(lat, lng);
    if (!coords) {
      throw new Error('Target latitude and longitude are required for visit_location tasks');
    }
  }
  
  if (taskType === 'quiz' && data.quiz_questions !== undefined && !data.quiz_questions) {
    throw new Error('Quiz questions are required for quiz tasks');
  }
  
  if (taskType === 'article_quiz') {
    if ((data as any).article_url !== undefined || (data as any).article_content !== undefined) {
      const articleUrl = (data as any).article_url !== undefined ? (data as any).article_url : existingTask.article_url;
      const articleContent = (data as any).article_content !== undefined ? (data as any).article_content : existingTask.article_content;
      if (!articleUrl && !articleContent) {
        throw new Error('Article URL or article content is required for article_quiz tasks');
      }
      if (articleUrl) {
        validateUrl(articleUrl, 'Article URL');
      }
    }
    if (data.quiz_questions !== undefined && !data.quiz_questions) {
      throw new Error('Quiz questions are required for article_quiz tasks');
    }
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      if ((key === 'quiz_questions' || key === 'survey_questions') && typeof value === 'object') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(JSON.stringify(value));
      } else if (key === 'recurrence') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(validateRecurrence(value as string));
      } else if (key === 'prerequisite_task_ids' && Array.isArray(value)) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
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
  const surveyResponsesPayload = data?.survey_responses
    ? JSON.stringify(data.survey_responses)
    : null;
  
  await db.query(
    `INSERT INTO user_tasks (user_id, task_id, photo_url, quiz_answers, survey_responses, points_earned)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      taskId,
      data?.photo_url,
      data?.quiz_answers ? JSON.stringify(data.quiz_answers) : null,
      surveyResponsesPayload,
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

/**
 * Validates prerequisite fields for a task
 * @param data Task data with prerequisite fields
 * @param taskId Current task ID (null for new tasks, set for updates)
 */
async function validatePrerequisites(data: Partial<Task>, taskId: string | null): Promise<void> {
  const db = getPool();
  const prerequisiteTaskId = (data as any).prerequisite_task_id;
  const prerequisiteTaskCount = (data as any).prerequisite_task_count;
  const prerequisiteTaskIds = (data as any).prerequisite_task_ids;
  
  // If no prerequisites are set, validation passes
  if (!prerequisiteTaskId && !prerequisiteTaskIds) {
    return;
  }
  
  // Validate Type 1: prerequisite_task_id
  if (prerequisiteTaskId) {
    // Check if task exists
    const taskCheck = await db.query('SELECT id FROM tasks WHERE id = $1', [prerequisiteTaskId]);
    if (taskCheck.rows.length === 0) {
      throw new Error(`Prerequisite task with ID ${prerequisiteTaskId} does not exist`);
    }
    
    // Check for circular dependency (task cannot be its own prerequisite)
    if (taskId && prerequisiteTaskId === taskId) {
      throw new Error('Task cannot be its own prerequisite');
    }
  }
  
  // Validate Type 2: prerequisite_task_count and prerequisite_task_ids
  if (prerequisiteTaskIds) {
    const taskIdsArray = Array.isArray(prerequisiteTaskIds) 
      ? prerequisiteTaskIds 
      : (typeof prerequisiteTaskIds === 'string' ? JSON.parse(prerequisiteTaskIds) : []);
    
    if (!Array.isArray(taskIdsArray) || taskIdsArray.length === 0) {
      throw new Error('prerequisite_task_ids must be a non-empty array');
    }
    
    // Check if all tasks exist
    const placeholders = taskIdsArray.map((_, i) => `$${i + 1}`).join(', ');
    const taskCheck = await db.query(
      `SELECT id FROM tasks WHERE id IN (${placeholders})`,
      taskIdsArray
    );
    
    if (taskCheck.rows.length !== taskIdsArray.length) {
      const foundIds = new Set(taskCheck.rows.map((r: any) => r.id));
      const missingIds = taskIdsArray.filter((id: string) => !foundIds.has(id));
      throw new Error(`Prerequisite tasks with IDs ${missingIds.join(', ')} do not exist`);
    }
    
    // Check for circular dependency
    if (taskId && taskIdsArray.includes(taskId)) {
      throw new Error('Task cannot be in its own prerequisite_task_ids array');
    }
    
    // Validate prerequisite_task_count
    if (prerequisiteTaskCount !== undefined && prerequisiteTaskCount !== null) {
      if (!Number.isInteger(prerequisiteTaskCount) || prerequisiteTaskCount < 1) {
        throw new Error('prerequisite_task_count must be an integer >= 1');
      }
      if (prerequisiteTaskCount > taskIdsArray.length) {
        throw new Error(`prerequisite_task_count (${prerequisiteTaskCount}) cannot be greater than the number of tasks in prerequisite_task_ids (${taskIdsArray.length})`);
      }
    } else {
      // If prerequisite_task_ids is set but count is not, default to requiring all
      throw new Error('prerequisite_task_count is required when prerequisite_task_ids is set');
    }
  } else if (prerequisiteTaskCount !== undefined && prerequisiteTaskCount !== null) {
    throw new Error('prerequisite_task_count requires prerequisite_task_ids to be set');
  }
}

/**
 * Checks if all prerequisites for a task are met by a user
 * @param taskId Task ID to check prerequisites for
 * @param userId User ID to check completion for
 * @returns true if all prerequisites are met, false otherwise
 */
export async function checkPrerequisiteMet(taskId: string, userId: string): Promise<boolean> {
  const db = getPool();
  
  // Get task with prerequisites
  const taskResult = await db.query(
    'SELECT prerequisite_task_id, prerequisite_task_count, prerequisite_task_ids FROM tasks WHERE id = $1',
    [taskId]
  );
  
  if (taskResult.rows.length === 0) {
    return false;
  }
  
  const task = taskResult.rows[0];
  const prerequisiteTaskId = task.prerequisite_task_id;
  const prerequisiteTaskCount = task.prerequisite_task_count;
  const prerequisiteTaskIds = task.prerequisite_task_ids;
  
  // If no prerequisites, task is available
  if (!prerequisiteTaskId && !prerequisiteTaskIds) {
    return true;
  }
  
  // Check Type 1: prerequisite_task_id
  if (prerequisiteTaskId) {
    const type1Check = await db.query(
      'SELECT 1 FROM user_tasks WHERE user_id = $1 AND task_id = $2',
      [userId, prerequisiteTaskId]
    );
    if (type1Check.rows.length === 0) {
      return false;
    }
  }
  
  // Check Type 2: prerequisite_task_count from prerequisite_task_ids
  if (prerequisiteTaskIds && Array.isArray(prerequisiteTaskIds) && prerequisiteTaskIds.length > 0) {
    const requiredCount = prerequisiteTaskCount || prerequisiteTaskIds.length;
    const placeholders = prerequisiteTaskIds.map((_, i) => `$${i + 2}`).join(', ');
    const type2Check = await db.query(
      `SELECT COUNT(*) as completed_count 
       FROM user_tasks 
       WHERE user_id = $1 AND task_id IN (${placeholders})`,
      [userId, ...prerequisiteTaskIds]
    );
    
    const completedCount = parseInt(type2Check.rows[0].completed_count, 10);
    if (completedCount < requiredCount) {
      return false;
    }
  }
  
  // All prerequisites met
  return true;
}
