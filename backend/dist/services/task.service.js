import { getPool } from '../database/connection.js';
import { resolveI18n, normalizeContentLang } from '../utils/i18n.js';
import { getTaskParameters } from './parameter.service.js';
import { getPointsCalculationFactor } from './system-config.service.js';
import { addUserPoints, plantTree, addGrowthPointsToRandomTree } from './gamification.service.js';
import { taskCategoryLabelToForestKey } from '../constants/forestCategories.js';
import { addForestCategoryPoints } from './forest-category-points.service.js';
import { buildTeamContestFilterClauses, getConfiguredHotelId } from '../utils/queryBuilder.js';
import { validateRecurrence, validateUrl, validateGpsCoordinates, validateQrCode } from '../utils/validation.js';
import { updateContestPoints } from './contest.service.js';
import { getUserActiveTeam, getTeamMembers } from './team.service.js';
import fs from 'fs';
import { generateQrToken } from './user-qr.service.js';
import { emailService } from './email.service.js';
import { generateAndStoreVideoSubtitles } from './video-subtitle.service.js';
/** Für errorHandler: name === 'ValidationError' → HTTP 400 mit message */
function clientValidationError(message) {
    const err = new Error(message);
    err.name = 'ValidationError';
    return err;
}
/**
 * Generiert oder ruft den QR-Code einer Aufgabe ab
 */
export async function generateOrGetTaskQrCode(taskId) {
    const db = getPool();
    // Prüfe ob Aufgabe existiert und QR-Code-Typ ist
    const taskResult = await db.query('SELECT id, type, qr_code FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
        throw new Error('Task not found');
    }
    const task = taskResult.rows[0];
    if (task.type !== 'qr') {
        throw new Error('Task is not a QR code task');
    }
    // Wenn bereits ein QR-Code existiert, gib ihn zurück
    if (task.qr_code) {
        return task.qr_code;
    }
    // Generiere neuen QR-Code
    let qrCode;
    let attempts = 0;
    do {
        qrCode = generateQrToken();
        const existing = await db.query('SELECT id FROM tasks WHERE qr_code = $1 AND active = TRUE LIMIT 1', [qrCode]);
        if (existing.rows.length === 0) {
            break; // QR code is unique
        }
        attempts++;
        if (attempts > 10) {
            throw new Error('Failed to generate unique QR code after multiple attempts');
        }
    } while (true);
    // Speichere den QR-Code in der Aufgabe
    await db.query('UPDATE tasks SET qr_code = $1 WHERE id = $2', [qrCode, taskId]);
    return qrCode;
}
export async function getAllTasks(filters, userId, options) {
    const db = getPool();
    let userType = null;
    let userTeamIds = [];
    let userContestIds = [];
    const params = [];
    let paramIndex = { current: 1 };
    let applyAudienceFilters = !(options?.includeAll ?? false);
    const includeInactive = options?.includeInactive ?? false;
    // Check if allowed_teams and allowed_contests columns exist
    // IMPORTANT: We need BOTH columns to exist, not just one, because buildTeamContestFilterClauses
    // references both columns in the SQL it generates
    let columnsExist = false;
    let checkCount = 0;
    try {
        const checkResult = await db.query(`
      SELECT COUNT(*)::int as count
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tasks' 
      AND column_name IN ('allowed_teams', 'allowed_contests')
    `);
        // Both columns must exist (count = 2)
        checkCount = parseInt(checkResult.rows[0]?.count) || 0;
        columnsExist = checkCount === 2;
    }
    catch (error) {
        // If check fails, assume columns don't exist
        columnsExist = false;
    }
    if (userId) {
        // Get user info
        const userResult = await db.query('SELECT role, user_type FROM users WHERE id = $1', [userId]);
        if (userResult.rows[0]) {
            const userRole = userResult.rows[0].role;
            userType = userResult.rows[0].user_type;
            // Administrators and redaktion see all tasks when includeAll is true
            if (userRole === 'administrator' || userRole === 'redaktion') {
                applyAudienceFilters = false;
            }
            else {
                // Only get team/contest info if columns exist
                if (columnsExist) {
                    // Get user's team memberships
                    const teamResult = await db.query('SELECT team_id FROM team_members WHERE user_id = $1', [userId]);
                    userTeamIds = teamResult.rows.map((row) => row.team_id);
                    // Get user's contest participations
                    const contestResult = await db.query('SELECT contest_id FROM contest_participants WHERE user_id = $1', [userId]);
                    userContestIds = contestResult.rows.map((row) => row.contest_id);
                }
                else {
                    // If columns don't exist, disable filtering
                    applyAudienceFilters = false;
                }
            }
        }
    }
    // Use explicit column list to avoid selecting non-existent columns (allowed_user_types, allowed_hotel_ids, allowed_roles were removed in migration 038)
    let select = `DISTINCT ON (t.id) 
    t.id, t.title, t.description, t.teaser, t.title_i18n, t.description_i18n, t.teaser_i18n, t.article_content_i18n,
    t.type, t.points, t.video_url, t.video_subtitles_i18n, t.quiz_questions, t.qr_code, 
    t.photo_required, t.co2_savings_kg, t.external_id, t.location_id, t.active, t.recurrence, 
    t.target_latitude, t.target_longitude, t.article_url, t.article_content, t.survey_questions, 
    t.survey_type, t.prerequisite_task_id, t.prerequisite_task_count, t.prerequisite_task_ids, 
    t.category, t.difficulty, t.time_required, t.location_tool, t.thumbnail_url, 
    t.allow_public_completion, t.zielgruppe, t.created_at, t.updated_at`;
    // Add allowed_teams and allowed_contests if columns exist
    if (columnsExist) {
        select += `, t.allowed_teams, t.allowed_contests`;
    }
    select += `, row_to_json(l.*) AS location`;
    let from = ' FROM tasks t JOIN locations l ON l.id = t.location_id';
    if (userId) {
        // Add verification_status and completed status
        // A task is only completed if it has a user_task entry AND verification_status is not 'pending'
        select += `, ut.verification_status, (ut.user_id IS NOT NULL AND (ut.verification_status IS NULL OR ut.verification_status != 'pending')) AS completed, ql.max_locked_until AS quiz_locked_until`;
        from += ` LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $${paramIndex.current++}`;
        params.push(userId);
        from += ` LEFT JOIN (
      SELECT task_id, MAX(locked_until) AS max_locked_until
      FROM quiz_question_locks
      WHERE user_id = $${paramIndex.current++} AND locked_until > NOW()
      GROUP BY task_id
    ) ql ON ql.task_id = t.id`;
        params.push(userId);
    }
    const clauses = [];
    if (!includeInactive) {
        clauses.push('t.active = TRUE');
    }
    // Filter by team/contest assignments
    // DISABLED: Only enable if both allowed_teams AND allowed_contests columns exist
    // The buildTeamContestFilterClauses function requires BOTH columns to work correctly
    if (applyAudienceFilters && columnsExist) {
        console.log('[getAllTasks] Applying team/contest filter', {
            userId,
            userTeamIdsCount: userTeamIds.length,
            userContestIdsCount: userContestIds.length,
        });
        const hotelId = getConfiguredHotelId();
        const filterClauses = buildTeamContestFilterClauses({
            userTeamIds: userTeamIds.length > 0 ? userTeamIds : null,
            userContestIds: userContestIds.length > 0 ? userContestIds : null,
            userType,
            hotelId,
            applyFilters: true,
        }, params, paramIndex);
        // Add table prefix 't.' to column references (similar to reward.service.ts)
        // Note: allowed_user_types and allowed_hotel_ids were removed in migration 038
        const taskClauses = filterClauses.map(clause => clause.replace(/\ballowed_teams\b/g, 't.allowed_teams')
            .replace(/\ballowed_contests\b/g, 't.allowed_contests'));
        clauses.push(...taskClauses);
    }
    else {
        // Log why filtering is disabled for debugging
        if (applyAudienceFilters && !columnsExist) {
            console.log('[TASK SERVICE] Team/contest filtering disabled: columns do not exist');
        }
    }
    if (filters?.type) {
        clauses.push(`t.type = $${paramIndex.current++}`);
        params.push(filters.type);
    }
    let query = `SELECT ${select}${from}`;
    if (clauses.length > 0) {
        query += ` WHERE ${clauses.join(' AND ')}`;
    }
    query += ' ORDER BY t.id, t.created_at DESC';
    if (filters?.limit) {
        query += ` LIMIT $${paramIndex.current++}`;
        params.push(filters.limit);
    }
    if (filters?.offset) {
        query += ` OFFSET $${paramIndex.current++}`;
        params.push(filters.offset);
    }
    let result;
    try {
        result = await db.query(query, params);
    }
    catch (error) {
        throw error;
    }
    const unique = new Map();
    for (const row of result.rows) {
        unique.set(row.id, row);
    }
    let tasks = Array.from(unique.values());
    // Resolve title/description/article_content from *_i18n when preferredLanguage is set
    const preferredLanguage = options?.preferredLanguage != null ? normalizeContentLang(options.preferredLanguage) : null;
    if (preferredLanguage) {
        tasks = tasks.map((task) => resolveTaskI18n(task, preferredLanguage));
    }
    // Check availability for each task if userId is provided
    if (userId) {
        for (const task of tasks) {
            task.is_available = await checkPrerequisiteMet(task.id, userId);
        }
    }
    else {
        // If no userId, all tasks are considered available (for admin views)
        for (const task of tasks) {
            task.is_available = true;
        }
    }
    return tasks;
}
function resolveTaskI18n(task, lang) {
    const title = resolveI18n(task.title_i18n, lang, task.title);
    const description = resolveI18n(task.description_i18n, lang, task.description);
    const teaser = resolveI18n(task.teaser_i18n, lang, task.teaser);
    const article_content = resolveI18n(task.article_content_i18n, lang, task.article_content);
    const out = {
        ...task,
        title,
        description,
        teaser,
        article_content,
        quiz_questions: resolveQuizQuestionsI18n(task.quiz_questions, lang),
        survey_questions: resolveSurveyQuestionsI18n(task.survey_questions, lang),
    };
    if (out.location && typeof out.location === 'object') {
        out.location = {
            ...out.location,
            name: resolveI18n(out.location.name_i18n, lang, out.location.name),
            description: resolveI18n(out.location.description_i18n, lang, out.location.description),
            address: resolveI18n(out.location.address_i18n, lang, out.location.address),
            category_description: resolveI18n(out.location.category_description_i18n, lang, out.location.category_description),
        };
    }
    return out;
}
function parseJsonPayload(payload) {
    if (payload == null)
        return payload;
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload);
        }
        catch {
            return null;
        }
    }
    return payload;
}
export function isQuizAnswerCorrect(params) {
    const { questionAnswers, expectedAnswerId, expectedAnswerText, selectedAnswerId, selectedAnswerText, } = params;
    if (expectedAnswerId && selectedAnswerId && expectedAnswerId === selectedAnswerId) {
        return true;
    }
    if (expectedAnswerId && selectedAnswerText) {
        const resolved = questionAnswers.find((opt) => {
            if (typeof opt === 'string')
                return false;
            if (!opt || typeof opt !== 'object')
                return false;
            const id = opt.id ?? null;
            const text = opt.text ?? null;
            const textEn = opt.text_i18n?.en ?? null;
            const textDe = opt.text_i18n?.de ?? null;
            return (id === expectedAnswerId &&
                [text, textEn, textDe].some((candidate) => candidate === selectedAnswerText));
        });
        if (resolved)
            return true;
    }
    return Boolean(expectedAnswerText && selectedAnswerText && expectedAnswerText === selectedAnswerText);
}
function resolveNestedI18n(value, lang, fallback) {
    if (value && typeof value === 'object') {
        return resolveI18n(value, lang, fallback);
    }
    if (typeof value === 'string') {
        return value;
    }
    return fallback ?? '';
}
export function resolveQuizQuestionsI18n(payload, lang) {
    const parsed = parseJsonPayload(payload);
    if (!Array.isArray(parsed))
        return [];
    return parsed.map((question) => {
        // Leeres answers[] nicht verwenden — sonst werden legacy options[] ignoriert
        const hasAnswers = Array.isArray(question?.answers) && question.answers.length > 0;
        const answersRaw = hasAnswers
            ? question.answers
            : Array.isArray(question?.options)
                ? question.options
                : [];
        const answers = answersRaw.map((answer, idx) => {
            if (typeof answer === 'string') {
                return { id: `a_${idx + 1}`, text: answer };
            }
            const text = resolveNestedI18n(answer?.text_i18n ?? answer?.option_i18n, lang, answer?.text);
            return {
                ...answer,
                id: answer?.id ?? `a_${idx + 1}`,
                text,
            };
        });
        const questionText = resolveNestedI18n(question?.prompt_i18n, lang, question?.question ?? question?.prompt);
        const correctAnswerId = question?.correctAnswerId ??
            question?.correct_answer_id ??
            null;
        const correctAnswer = typeof question?.correctAnswer === 'string'
            ? question.correctAnswer
            : typeof question?.correct_answer === 'string'
                ? question.correct_answer
                : null;
        return {
            ...question,
            question: questionText,
            prompt: questionText,
            options: answers.map((a) => a.text),
            answers,
            correctAnswerId,
            correct_answer_id: correctAnswerId,
            correctAnswer,
            correct_answer: correctAnswer,
        };
    });
}
export function resolveSurveyQuestionsI18n(payload, lang) {
    const parsed = parseJsonPayload(payload);
    if (!Array.isArray(parsed))
        return [];
    return parsed
        .filter((question) => question != null && typeof question === 'object' && !Array.isArray(question))
        .map((question) => {
        const questionText = resolveNestedI18n(question?.question_i18n, lang, question?.question);
        const optionsRaw = Array.isArray(question?.options) ? question.options : undefined;
        const options = optionsRaw?.map((option) => {
            if (typeof option === 'string')
                return option;
            if (option && typeof option === 'object') {
                return resolveNestedI18n(option.option_i18n, lang, option.text ?? option.value);
            }
            return '';
        }).filter(Boolean);
        return {
            ...question,
            question: questionText,
            options,
        };
    });
}
export async function getTaskById(id, preferredLanguage, userId) {
    const db = getPool();
    // Check if allowed_teams and allowed_contests columns exist
    // IMPORTANT: We need BOTH columns to exist, not just one, because buildTeamContestFilterClauses
    // references both columns in the SQL it generates
    let columnsExist = false;
    try {
        const checkResult = await db.query(`
      SELECT COUNT(*)::int as count
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'tasks' 
      AND column_name IN ('allowed_teams', 'allowed_contests')
    `);
        // Both columns must exist (count = 2)
        const count = parseInt(checkResult.rows[0]?.count) || 0;
        columnsExist = count === 2;
    }
    catch (error) {
        // If check fails, assume columns don't exist
        columnsExist = false;
    }
    let select = `t.id, t.title, t.description, t.teaser, t.title_i18n, t.description_i18n, t.teaser_i18n, t.article_content_i18n,
    t.type, t.points, t.video_url, t.video_subtitles_i18n, t.quiz_questions, t.qr_code, 
    t.photo_required, t.co2_savings_kg, t.external_id, t.location_id, t.active, t.recurrence, 
    t.target_latitude, t.target_longitude, t.article_url, t.article_content, t.survey_questions, 
    t.survey_type, t.prerequisite_task_id, t.prerequisite_task_count, t.prerequisite_task_ids, 
    t.category, t.difficulty, t.time_required, t.location_tool, t.thumbnail_url, 
    t.allow_public_completion, t.zielgruppe, t.created_at, t.updated_at`;
    // Add allowed_teams and allowed_contests if columns exist
    if (columnsExist) {
        select += `, t.allowed_teams, t.allowed_contests`;
    }
    /** Fortschritt des eingeloggten Nutzers (Detailansicht: Abschlussdatum, Status) */
    if (userId) {
        select += `,
    ut.verification_status AS verification_status,
    ut.completed_at AS completed_at,
    (ut.user_id IS NOT NULL AND (ut.verification_status IS NULL OR ut.verification_status != 'pending')) AS completed`;
    }
    select += `, row_to_json(l.*) AS location`;
    const userJoin = userId
        ? `LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $2`
        : '';
    const result = await db.query(`SELECT ${select}
     FROM tasks t
     JOIN locations l ON l.id = t.location_id
     ${userJoin}
     WHERE t.id = $1`, userId ? [id, userId] : [id]);
    const row = result.rows[0] || null;
    if (row && preferredLanguage) {
        return resolveTaskI18n(row, normalizeContentLang(preferredLanguage));
    }
    return row;
}
/**
 * Calculate task points automatically based on difficulty and time_required weights
 * Formula: (difficulty_weight * time_required_weight) / factor
 * Returns the calculated points, or null if calculation is not possible
 */
export async function calculateTaskPoints(difficulty, time_required) {
    // If either difficulty or time_required is missing, return null (points must be set manually)
    if (!difficulty || !time_required) {
        return null;
    }
    try {
        // Get parameter weights
        const difficultyParams = await getTaskParameters('difficulty');
        const timeRequiredParams = await getTaskParameters('time_required');
        const difficultyParam = difficultyParams.find(p => p.value === difficulty);
        const timeRequiredParam = timeRequiredParams.find(p => p.value === time_required);
        if (!difficultyParam || !timeRequiredParam) {
            return null;
        }
        // Convert weights to numbers (they come from DB as strings for DECIMAL type)
        const difficultyWeight = Number(difficultyParam.weight ?? difficultyParam.display_order ?? 1);
        const timeRequiredWeight = Number(timeRequiredParam.weight ?? timeRequiredParam.display_order ?? 1);
        // Get calculation factor
        const factor = await getPointsCalculationFactor();
        if (factor <= 0) {
            throw new Error('Points calculation factor must be greater than 0');
        }
        // Calculate: (difficulty_weight * time_required_weight) * factor
        const calculatedPoints = Math.round((difficultyWeight * timeRequiredWeight) * factor);
        // Ensure minimum of 1 point
        return Math.max(1, calculatedPoints);
    }
    catch (error) {
        console.error('[TaskService] Error calculating task points:', error);
        return null;
    }
}
export async function createTask(data) {
    const db = getPool();
    // Check for duplicate task (same title and location_id)
    if (data.title && data.location_id) {
        const duplicateCheck = await db.query(`SELECT id, title FROM tasks WHERE title = $1 AND location_id = $2 AND active = TRUE LIMIT 1`, [data.title, data.location_id]);
        if (duplicateCheck.rows.length > 0) {
            throw new Error(`A task with the title "${data.title}" already exists at this location. Please use a different title or edit the existing task.`);
        }
    }
    // For QR code tasks, also check for duplicate QR codes (regardless of location)
    if (data.type === 'qr' && data.qr_code) {
        const qrDuplicateCheck = await db.query(`SELECT id, title, qr_code FROM tasks WHERE qr_code = $1 AND active = TRUE LIMIT 1`, [data.qr_code]);
        if (qrDuplicateCheck.rows.length > 0) {
            throw new Error(`A task with the QR code "${data.qr_code}" already exists (task: "${qrDuplicateCheck.rows[0].title}"). QR codes must be unique.`);
        }
    }
    const quizPayload = data.quiz_questions
        ? typeof data.quiz_questions === 'string'
            ? data.quiz_questions
            : JSON.stringify(data.quiz_questions)
        : null;
    const recurrence = validateRecurrence(data.recurrence);
    // Validate prerequisites
    await validatePrerequisites(data, null);
    // Validate task type-specific fields
    if (data.type === 'video' && data.video_url) {
        validateUrl(data.video_url, 'Video URL');
    }
    // For QR code tasks, generate QR code if not provided
    if (data.type === 'qr' && !data.qr_code) {
        // Generate a unique QR code for this task
        let qrCode;
        let attempts = 0;
        do {
            qrCode = generateQrToken();
            const existing = await db.query('SELECT id FROM tasks WHERE qr_code = $1 AND active = TRUE LIMIT 1', [qrCode]);
            if (existing.rows.length === 0) {
                break; // QR code is unique
            }
            attempts++;
            if (attempts > 10) {
                throw new Error('Failed to generate unique QR code after multiple attempts');
            }
        } while (true);
        data.qr_code = qrCode;
    }
    else if (data.type === 'qr' && data.qr_code) {
        validateQrCode(data.qr_code);
    }
    if (data.type === 'visit_location') {
        const coords = validateGpsCoordinates(data.target_latitude, data.target_longitude);
        if (!coords) {
            throw new Error('Target latitude and longitude are required for visit_location tasks');
        }
    }
    if (data.type === 'quiz' && !quizPayload) {
        throw new Error('Quiz questions are required for quiz tasks');
    }
    if (data.type === 'article_quiz') {
        if (!data.article_url && !data.article_content) {
            throw new Error('Article URL or article content is required for article_quiz tasks');
        }
        if (data.article_url) {
            validateUrl(data.article_url, 'Article URL');
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
    const prerequisiteTaskIdsArray = data.prerequisite_task_ids
        ? Array.isArray(data.prerequisite_task_ids)
            ? data.prerequisite_task_ids
            : JSON.parse(data.prerequisite_task_ids)
        : null;
    // Calculate points automatically if difficulty and time_required are provided
    // Always use calculated points if both values are present, regardless of manually set points
    let points = data.points ?? 0;
    if (data.difficulty && data.time_required) {
        const calculatedPoints = await calculateTaskPoints(data.difficulty, data.time_required);
        if (calculatedPoints !== null) {
            points = calculatedPoints; // Override manually set points with calculated value
        }
    }
    // Build *_i18n from request; fallback to legacy title/description/article_content
    const titleI18n = data.title_i18n && typeof data.title_i18n === 'object'
        ? data.title_i18n
        : { de: data.title ?? '', en: data.title ?? '' };
    const descriptionI18n = data.description_i18n && typeof data.description_i18n === 'object'
        ? data.description_i18n
        : { de: data.description ?? '', en: data.description ?? '' };
    const teaserI18n = data.teaser_i18n && typeof data.teaser_i18n === 'object'
        ? data.teaser_i18n
        : { de: data.teaser ?? descriptionI18n.de ?? '', en: data.teaser ?? descriptionI18n.en ?? '' };
    const articleContentI18n = data.article_content_i18n && typeof data.article_content_i18n === 'object'
        ? data.article_content_i18n
        : { de: data.article_content ?? '', en: data.article_content ?? '' };
    const legacyTitle = data.title ?? titleI18n.de ?? titleI18n.en ?? '';
    const legacyDescription = data.description ?? descriptionI18n.de ?? descriptionI18n.en ?? null;
    const legacyTeaser = data.teaser ?? teaserI18n.de ?? teaserI18n.en ?? null;
    const legacyArticleContent = data.article_content ?? articleContentI18n.de ?? articleContentI18n.en ?? null;
    const result = await db.query(`INSERT INTO tasks (
       title,
       description,
       teaser,
       title_i18n,
       description_i18n,
       teaser_i18n,
       article_content_i18n,
       type,
       points,
       video_url,
      video_subtitles_i18n,
       quiz_questions,
       qr_code,
       photo_required,
       co2_savings_kg,
       external_id,
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
       prerequisite_task_ids,
       category,
       difficulty,
       time_required,
       location_tool,
       thumbnail_url,
       allowed_teams,
       allowed_contests,
       allow_public_completion
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
     RETURNING *`, [
        legacyTitle,
        legacyDescription,
        legacyTeaser,
        JSON.stringify(titleI18n),
        JSON.stringify(descriptionI18n),
        JSON.stringify(teaserI18n),
        JSON.stringify(articleContentI18n),
        data.type,
        points,
        data.video_url ?? null,
        data.video_subtitles_i18n
            ? JSON.stringify(data.video_subtitles_i18n)
            : null,
        quizPayload,
        data.qr_code ?? null,
        data.photo_required ?? false,
        data.co2_savings_kg ?? 0,
        data.external_id ?? null,
        data.location_id,
        data.active ?? true,
        recurrence,
        data.target_latitude ?? null,
        data.target_longitude ?? null,
        data.article_url ?? null,
        legacyArticleContent,
        surveyPayload,
        data.survey_type ?? null,
        data.prerequisite_task_id ?? null,
        data.prerequisite_task_count ?? null,
        prerequisiteTaskIdsArray,
        data.category ?? null,
        data.difficulty ?? null,
        data.time_required ?? null,
        data.location_tool ?? null,
        data.thumbnail_url ?? null,
        data.allowed_teams ?? null,
        data.allowed_contests ?? null,
        Boolean(data.allow_public_completion),
    ]);
    return result.rows[0];
}
export async function updateTask(id, data) {
    const db = getPool();
    // Get existing task to validate type-specific fields
    const existingTask = await getTaskById(id);
    if (!existingTask) {
        return null;
    }
    // Validate prerequisites
    await validatePrerequisites(data, id);
    const taskType = data.type || existingTask.type;
    const typeChanged = data.type !== undefined && data.type !== existingTask.type;
    // Validate task type-specific fields for the new type (if type is being changed)
    if (taskType === 'video') {
        // For video tasks, validate video_url if provided
        if (data.video_url !== undefined) {
            if (data.video_url) {
                validateUrl(data.video_url, 'Video URL');
            }
        }
        else if (typeChanged && !existingTask.video_url) {
            // If type changed to video and no video_url provided, it's optional (can be added later)
            // Don't throw error, just allow it
        }
        // Quiz questions are optional for video tasks (can be added later)
    }
    if (taskType === 'qr') {
        // For qr tasks, validate qr_code if provided
        if (data.qr_code !== undefined) {
            if (data.qr_code) {
                validateQrCode(data.qr_code);
            }
        }
        else if (typeChanged && !existingTask.qr_code) {
            // If type changed to qr and no qr_code provided, it's optional (can be added later)
            // Don't throw error, just allow it
        }
    }
    if (taskType === 'visit_location') {
        // For visit_location tasks, validate coordinates if provided
        if (data.target_latitude !== undefined || data.target_longitude !== undefined) {
            const lat = data.target_latitude !== undefined ? data.target_latitude : existingTask.target_latitude;
            const lng = data.target_longitude !== undefined ? data.target_longitude : existingTask.target_longitude;
            const coords = validateGpsCoordinates(lat, lng);
            if (!coords) {
                throw new Error('Target latitude and longitude are required for visit_location tasks');
            }
        }
        else if (typeChanged && (!existingTask.target_latitude || !existingTask.target_longitude)) {
            // If type changed to visit_location and no coordinates provided, require them
            throw new Error('Target latitude and longitude are required when changing task type to visit_location');
        }
    }
    if (taskType === 'quiz') {
        // For quiz tasks, quiz_questions are required
        if (data.quiz_questions !== undefined && !data.quiz_questions) {
            throw new Error('Quiz questions are required for quiz tasks');
        }
        else if (typeChanged && !existingTask.quiz_questions) {
            // If type changed to quiz and no quiz_questions provided, require them
            throw new Error('Quiz questions are required when changing task type to quiz');
        }
    }
    if (taskType === 'article_quiz') {
        // For article_quiz tasks, article_url or article_content is required
        if (data.article_url !== undefined || data.article_content !== undefined) {
            const articleUrl = data.article_url !== undefined ? data.article_url : existingTask.article_url;
            const articleContent = data.article_content !== undefined ? data.article_content : existingTask.article_content;
            if (!articleUrl && !articleContent) {
                throw new Error('Article URL or article content is required for article_quiz tasks');
            }
            if (articleUrl) {
                validateUrl(articleUrl, 'Article URL');
            }
        }
        else if (typeChanged && !existingTask.article_url && !existingTask.article_content) {
            // If type changed to article_quiz and no article provided, require it
            throw new Error('Article URL or article content is required when changing task type to article_quiz');
        }
        // Quiz questions are required for article_quiz
        if (data.quiz_questions !== undefined && !data.quiz_questions) {
            throw new Error('Quiz questions are required for article_quiz tasks');
        }
        else if (typeChanged && !existingTask.quiz_questions) {
            throw new Error('Quiz questions are required when changing task type to article_quiz');
        }
    }
    if (taskType === 'survey') {
        // For survey tasks, survey_questions are required
        if (data.survey_questions !== undefined && !data.survey_questions) {
            throw new Error('Survey questions are required for survey tasks');
        }
        else if (typeChanged && !existingTask.survey_questions) {
            // If type changed to survey and no survey_questions provided, require them
            throw new Error('Survey questions are required when changing task type to survey');
        }
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    let pointsIndex = -1; // Track where points update is in the array
    // Whitelist of valid database columns to prevent SQL injection and invalid field errors
    const validColumns = new Set([
        'title', 'description', 'teaser', 'type', 'points', 'video_url', 'quiz_questions', 'qr_code',
        'photo_required', 'co2_savings_kg', 'location_id', 'active', 'recurrence',
        'target_latitude', 'target_longitude', 'article_url', 'article_content',
        'title_i18n', 'description_i18n', 'teaser_i18n', 'article_content_i18n',
        'survey_questions', 'survey_type', 'prerequisite_task_id', 'prerequisite_task_count',
        'prerequisite_task_ids', 'category', 'difficulty', 'time_required', 'location_tool',
        'thumbnail_url', 'allowed_teams', 'allowed_contests', 'allow_public_completion', 'video_subtitles_i18n',
    ]);
    // If type is being changed, reset type-specific fields of the old type
    if (typeChanged) {
        const oldType = existingTask.type;
        const newType = data.type;
        // Reset fields that are specific to the old type but not to the new type
        // Use parameters for NULL values to maintain proper parameter numbering
        if (oldType === 'video' && newType !== 'video') {
            // Reset video-specific fields if not provided in update
            if (data.video_url === undefined) {
                updates.push(`video_url = $${paramIndex++}`);
                values.push(null);
            }
            if (data.quiz_questions === undefined && (newType !== 'quiz' && newType !== 'article_quiz')) {
                updates.push(`quiz_questions = $${paramIndex++}`);
                values.push(null);
            }
        }
        if (oldType === 'qr' && newType !== 'qr') {
            if (data.qr_code === undefined) {
                updates.push(`qr_code = $${paramIndex++}`);
                values.push(null);
            }
        }
        if (oldType === 'photo' && newType !== 'photo') {
            if (data.photo_required === undefined) {
                updates.push(`photo_required = $${paramIndex++}`);
                values.push(false);
            }
        }
        if (oldType === 'visit_location' && newType !== 'visit_location') {
            if (data.target_latitude === undefined) {
                updates.push(`target_latitude = $${paramIndex++}`);
                values.push(null);
            }
            if (data.target_longitude === undefined) {
                updates.push(`target_longitude = $${paramIndex++}`);
                values.push(null);
            }
        }
        if (oldType === 'article_quiz' && newType !== 'article_quiz') {
            if (data.article_url === undefined) {
                updates.push(`article_url = $${paramIndex++}`);
                values.push(null);
            }
            if (data.article_content === undefined) {
                updates.push(`article_content = $${paramIndex++}`);
                values.push(null);
            }
            if (data.quiz_questions === undefined && newType !== 'quiz' && newType !== 'video') {
                updates.push(`quiz_questions = $${paramIndex++}`);
                values.push(null);
            }
        }
        if (oldType === 'survey' && newType !== 'survey') {
            if (data.survey_questions === undefined) {
                updates.push(`survey_questions = $${paramIndex++}`);
                values.push(null);
            }
            if (data.survey_type === undefined) {
                updates.push(`survey_type = $${paramIndex++}`);
                values.push(null);
            }
        }
        if (oldType === 'quiz' && newType !== 'quiz' && newType !== 'article_quiz' && newType !== 'video') {
            if (data.quiz_questions === undefined) {
                updates.push(`quiz_questions = $${paramIndex++}`);
                values.push(null);
            }
        }
    }
    // Explicitly handle thumbnail_url, allowed_teams, and allowed_contests before the loop
    // ALWAYS set these if they exist in data, even if null
    if ('thumbnail_url' in data) {
        updates.push(`thumbnail_url = $${paramIndex++}`);
        values.push(data.thumbnail_url ?? null);
    }
    if ('allowed_teams' in data) {
        updates.push(`allowed_teams = $${paramIndex++}`);
        values.push(data.allowed_teams ?? null);
    }
    if ('allowed_contests' in data) {
        updates.push(`allowed_contests = $${paramIndex++}`);
        values.push(data.allowed_contests ?? null);
    }
    Object.entries(data).forEach(([key, value]) => {
        // Skip invalid fields, id, and fields already handled above
        if (value === undefined || key === 'id' || key === 'thumbnail_url' || key === 'allowed_teams' || key === 'allowed_contests' || !validColumns.has(key)) {
            return;
        }
        // location_id NOT NULL + UUID: leerer String / null → Postgres 22P02 (z. B. Admin sendet "" wenn Ort nicht in Liste)
        if (key === 'location_id' && (value === '' || value === null)) {
            return;
        }
        // Admin sendet oft title + title_i18n; title_i18n setzt bereits die Spalte "title" → sonst Postgres 42601
        if (key === 'title') {
            const ti = data.title_i18n;
            if (ti != null && typeof ti === 'object') {
                const r = ti.de ?? ti.en;
                if (r != null) {
                    return;
                }
            }
        }
        if (key === 'description') {
            const di = data.description_i18n;
            if (di != null && typeof di === 'object') {
                const r = di.de ?? di.en;
                if (r != null) {
                    return;
                }
            }
        }
        if (key === 'teaser') {
            const ti = data.teaser_i18n;
            if (ti != null && typeof ti === 'object') {
                const r = ti.de ?? ti.en;
                if (r != null) {
                    return;
                }
            }
        }
        if (key === 'article_content') {
            const ai = data.article_content_i18n;
            if (ai != null && typeof ai === 'object') {
                const r = ai.de ?? ai.en;
                if (r != null) {
                    return;
                }
            }
        }
        if (key === 'title_i18n' && value !== null && typeof value === 'object') {
            updates.push(`title_i18n = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            const resolved = value.de ?? value.en;
            if (resolved != null) {
                updates.push(`title = $${paramIndex++}`);
                values.push(resolved);
            }
            return;
        }
        if (key === 'description_i18n' && value !== null && typeof value === 'object') {
            updates.push(`description_i18n = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            // Wie title_i18n: leeres {} darf die Legacy-Spalte description nicht auf NULL setzen (sonst 500 / Trigger)
            const resolved = value.de ?? value.en;
            if (resolved != null) {
                updates.push(`description = $${paramIndex++}`);
                values.push(resolved);
            }
            return;
        }
        if (key === 'teaser_i18n' && value !== null && typeof value === 'object') {
            updates.push(`teaser_i18n = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            const resolved = value.de ?? value.en;
            if (resolved != null) {
                updates.push(`teaser = $${paramIndex++}`);
                values.push(resolved);
            }
            return;
        }
        if (key === 'article_content_i18n' && value !== null && typeof value === 'object') {
            updates.push(`article_content_i18n = $${paramIndex++}`);
            values.push(JSON.stringify(value));
            const resolved = value.de ?? value.en;
            if (resolved != null) {
                updates.push(`article_content = $${paramIndex++}`);
                values.push(resolved);
            }
            return;
        }
        // typeof null === 'object' — sonst JSON.stringify(null) und kaputte JSONB-Werte
        if ((key === 'quiz_questions' || key === 'survey_questions' || key === 'video_subtitles_i18n') &&
            value !== null &&
            typeof value === 'object') {
            updates.push(`${key} = $${paramIndex++}`);
            values.push(JSON.stringify(value));
        }
        else if (key === 'recurrence') {
            updates.push(`${key} = $${paramIndex++}`);
            values.push(validateRecurrence(value));
        }
        else if (key === 'prerequisite_task_ids' && Array.isArray(value)) {
            updates.push(`${key} = $${paramIndex++}`);
            values.push(value);
        }
        else {
            if (key === 'points') {
                pointsIndex = updates.length; // Remember where points update is
            }
            updates.push(`${key} = $${paramIndex++}`);
            values.push(value);
        }
    });
    // Calculate points automatically if difficulty or time_required are being updated
    const difficultyValue = (data.difficulty !== undefined) ? data.difficulty : existingTask.difficulty;
    const timeRequiredValue = (data.time_required !== undefined) ? data.time_required : existingTask.time_required;
    // Check if difficulty or time_required changed
    const difficultyChanged = data.difficulty !== undefined && data.difficulty !== existingTask.difficulty;
    const timeRequiredChanged = data.time_required !== undefined && data.time_required !== existingTask.time_required;
    // Auto-calculate points if both values are present AND (difficulty or time_required changed, OR points not explicitly set)
    if (difficultyValue && timeRequiredValue && (difficultyChanged || timeRequiredChanged || data.points === undefined)) {
        const calculatedPoints = await calculateTaskPoints(difficultyValue, timeRequiredValue);
        if (calculatedPoints !== null) {
            // Remove existing points update if present
            if (pointsIndex >= 0) {
                updates.splice(pointsIndex, 1);
                values.splice(pointsIndex, 1);
                // Rebuild all parameter numbers since we removed one
                paramIndex = 1;
                updates.forEach((update, idx) => {
                    const match = update.match(/\$(\d+)/);
                    if (match) {
                        updates[idx] = update.replace(/\$\d+/, `$${paramIndex++}`);
                    }
                });
            }
            // Add calculated points
            updates.push(`points = $${paramIndex++}`);
            values.push(calculatedPoints);
        }
    }
    if (updates.length === 0) {
        return getTaskById(id);
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    // Add id as the last parameter - use the current paramIndex (which is already the next available index)
    const whereParamIndex = paramIndex;
    values.push(id);
    try {
        const result = await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${whereParamIndex} RETURNING *`, values);
        return result.rows[0] || null;
    }
    catch (err) {
        const pg = err;
        if (pg?.code === '42703') {
            console.error('[TaskService] updateTask: column missing (migration?):', pg.message, pg.detail);
            throw clientValidationError('Datenbankschema passt nicht (Spalte fehlt). Bitte Migrationen ausführen (z. B. allow_public_completion).');
        }
        if (pg?.code === '22P02') {
            console.error('[TaskService] updateTask: invalid input (UUID/JSON):', pg.message, pg.detail);
            throw clientValidationError('Ungültige Eingabe beim Speichern der Aufgabe (z. B. Ort-ID oder JSON).');
        }
        if (pg?.code === '23502') {
            console.error('[TaskService] updateTask: NOT NULL violation:', pg.message, pg.detail);
            throw clientValidationError('Pflichtfeld fehlt (Datenbank).');
        }
        throw err;
    }
}
export async function deleteTask(id) {
    const db = getPool();
    // Delete dependent records first
    await db.query('DELETE FROM forest_trees WHERE task_id = $1', [id]);
    await db.query('DELETE FROM user_tasks WHERE task_id = $1', [id]);
    await db.query('DELETE FROM gallery_images WHERE task_id = $1', [id]);
    // Now delete the task
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
}
export async function setTasksActiveState(ids, active) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return;
    }
    const db = getPool();
    await db.query('UPDATE tasks SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[])', [active, ids]);
}
export async function bulkDeleteTasks(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return;
    }
    const db = getPool();
    // Delete dependent records first (in correct order to respect foreign key constraints)
    await db.query('DELETE FROM forest_trees WHERE task_id = ANY($1::uuid[])', [ids]);
    await db.query('DELETE FROM user_tasks WHERE task_id = ANY($1::uuid[])', [ids]);
    await db.query('DELETE FROM gallery_images WHERE task_id = ANY($1::uuid[])', [ids]);
    // Now delete the tasks
    await db.query('DELETE FROM tasks WHERE id = ANY($1::uuid[])', [ids]);
}
const QUIZ_LOCK_MINUTES = () => Math.max(1, parseInt(process.env.QUIZ_WRONG_ANSWER_LOCK_MINUTES || '5', 10) || 5);
/**
 * TICKET-009: Einzelantwort prüfen; bei falscher Antwort Sperre für QUIZ_WRONG_ANSWER_LOCK_MINUTES.
 */
export async function submitQuizAnswer(taskId, userId, questionIndex, answerId) {
    const db = getPool();
    const done = await db.query('SELECT 1 FROM user_tasks WHERE user_id = $1 AND task_id = $2 LIMIT 1', [userId, taskId]);
    if (done.rows.length > 0) {
        throw new Error('Task already completed');
    }
    const tr = await db.query('SELECT quiz_questions, type FROM tasks WHERE id = $1', [taskId]);
    if (tr.rows.length === 0) {
        throw new Error('Task not found');
    }
    const row = tr.rows[0];
    const supportsQuizLock = row.type === 'quiz' || row.type === 'video' || row.type === 'article_quiz';
    if (!supportsQuizLock) {
        throw new Error('Quiz answer check is only available for quiz-capable tasks');
    }
    const questions = parseJsonPayload(row.quiz_questions);
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Task quiz questions are invalid');
    }
    if (questionIndex < 0 || questionIndex >= questions.length) {
        throw new Error('Invalid question index');
    }
    const lockRes = await db.query(`SELECT locked_until FROM quiz_question_locks
     WHERE user_id = $1 AND task_id = $2 AND question_index = $3`, [userId, taskId, questionIndex]);
    if (lockRes.rows[0]) {
        const until = new Date(lockRes.rows[0].locked_until);
        if (until.getTime() > Date.now()) {
            return { status: 'locked', lockedUntil: until.toISOString() };
        }
    }
    const question = questions[questionIndex];
    const questionAnswers = Array.isArray(question.answers)
        ? question.answers
        : Array.isArray(question.options)
            ? question.options
            : [];
    const expectedAnswerId = question.correctAnswerId ?? question.correct_answer_id ?? null;
    const expectedAnswerText = question.correctAnswer ?? question.correct_answer ?? null;
    const correct = isQuizAnswerCorrect({
        questionAnswers,
        expectedAnswerId,
        expectedAnswerText,
        selectedAnswerId: answerId,
        selectedAnswerText: null,
    });
    if (correct) {
        await db.query(`DELETE FROM quiz_question_locks WHERE user_id = $1 AND task_id = $2 AND question_index = $3`, [userId, taskId, questionIndex]);
        return { status: 'correct' };
    }
    const minutes = QUIZ_LOCK_MINUTES();
    const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await db.query(`INSERT INTO quiz_question_locks (user_id, task_id, question_index, locked_until)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, task_id, question_index)
     DO UPDATE SET locked_until = EXCLUDED.locked_until`, [userId, taskId, questionIndex, lockedUntil.toISOString()]);
    return { status: 'wrong', lockedUntil: lockedUntil.toISOString() };
}
/**
 * Aktive Quiz-Sperren für eine Aufgabe (locked_until > jetzt).
 * Damit bleibt die Sperre nach erneutem Öffnen der Aufgabe erhalten.
 */
export async function getActiveQuizQuestionLocks(taskId, userId) {
    const db = getPool();
    const tr = await db.query('SELECT type FROM tasks WHERE id = $1', [taskId]);
    if (tr.rows.length === 0) {
        throw new Error('Task not found');
    }
    const type = tr.rows[0].type;
    if (type !== 'quiz' && type !== 'video' && type !== 'article_quiz') {
        return [];
    }
    const res = await db.query(`SELECT question_index, locked_until FROM quiz_question_locks
     WHERE user_id = $1 AND task_id = $2 AND locked_until > NOW()`, [userId, taskId]);
    return res.rows.map((r) => ({
        questionIndex: r.question_index,
        lockedUntil: new Date(r.locked_until).toISOString(),
    }));
}
/** Gemeinsame Quiz-Validierung wie bei completeTask (article_quiz / quiz / Video-Quiz). */
function assertQuizAnswersMeetThreshold(task, data) {
    if (!data?.quiz_answers || !task.quiz_questions) {
        return;
    }
    const questions = parseJsonPayload(task.quiz_questions);
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Task quiz questions are invalid');
    }
    let correctAnswers = 0;
    data.quiz_answers.forEach((answer) => {
        const question = questions[answer.questionIndex];
        if (!question) {
            return;
        }
        const questionAnswers = Array.isArray(question.answers)
            ? question.answers
            : Array.isArray(question.options)
                ? question.options
                : [];
        const selectedAnswerId = answer.answerId ?? answer.answer_id ?? answer.optionId ?? null;
        const selectedAnswerText = answer.answer ?? answer.option ?? null;
        const expectedAnswerId = question.correctAnswerId ?? question.correct_answer_id ?? null;
        const expectedAnswerText = question.correctAnswer ?? question.correct_answer ?? null;
        if (isQuizAnswerCorrect({
            questionAnswers,
            expectedAnswerId,
            expectedAnswerText,
            selectedAnswerId,
            selectedAnswerText,
        })) {
            correctAnswers++;
        }
    });
    const requiredCorrect = task.type === 'quiz' ? questions.length : Math.ceil(questions.length * 0.7);
    if (correctAnswers < requiredCorrect) {
        throw new Error(`Need at least ${requiredCorrect} correct answers to complete this task`);
    }
}
export async function completeTask(taskId, userId, data) {
    const db = getPool();
    // Check if already completed
    const existing = await db.query('SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2', [userId, taskId]);
    if (existing.rows.length > 0) {
        throw new Error('Task already completed');
    }
    // Get task details
    const task = await getTaskById(taskId);
    if (!task) {
        throw new Error('Task not found');
    }
    assertQuizAnswersMeetThreshold(task, data);
    // Insert completion record
    const surveyResponsesPayload = data?.survey_responses
        ? JSON.stringify(data.survey_responses)
        : null;
    // For photo tasks, set verification_status to 'pending' and don't award points yet
    const isPhotoTask = task.type === 'photo' && data?.photo_url;
    const verificationStatus = isPhotoTask ? 'pending' : null;
    const pointsToAward = isPhotoTask ? 0 : task.points;
    console.log('[COMPLETE TASK] Photo task check:', {
        taskType: task.type,
        hasPhotoUrl: !!data?.photo_url,
        photoUrl: data?.photo_url,
        isPhotoTask,
        verificationStatus,
    });
    const taskForestKey = taskCategoryLabelToForestKey(task.category);
    const userTaskResult = await db.query(`INSERT INTO user_tasks (user_id, task_id, photo_url, quiz_answers, survey_responses, points_earned, verification_status, task_category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, verification_status`, [
        userId,
        taskId,
        data?.photo_url,
        data?.quiz_answers ? JSON.stringify(data.quiz_answers) : null,
        surveyResponsesPayload,
        pointsToAward,
        verificationStatus,
        taskForestKey,
    ]);
    const userTaskId = userTaskResult.rows[0].id;
    console.log('[COMPLETE TASK] Created user_task:', {
        id: userTaskId,
        verification_status: userTaskResult.rows[0].verification_status,
        photo_url: data?.photo_url ? 'present' : 'missing',
    });
    // For photo tasks, notify admins and rezeption
    if (isPhotoTask) {
        try {
            console.log('[PHOTO TASK] Notifying admins/rezeption about new photo task:', { taskId, userTaskId, userId });
            const { getUsersByRoles, createMessagesForUsers } = await import('./message.service.js');
            const { broadcastPhotoTaskUpdate } = await import('../ws/task-broadcast.js');
            const adminsAndRezeption = await getUsersByRoles(['administrator', 'rezeption']);
            console.log('[PHOTO TASK] Found admins/rezeption:', adminsAndRezeption.length);
            const adminIds = adminsAndRezeption.map(u => u.id);
            if (adminIds.length > 0) {
                const messages = await createMessagesForUsers(adminIds, {
                    type: 'photo_pending_review',
                    title: `Neue Foto-Aufgabe zur Prüfung: ${task.title}`,
                    content: `Ein Gast hat ein Foto für die Aufgabe "${task.title}" hochgeladen und wartet auf Ihre Prüfung.`,
                    metadata: {
                        task_id: taskId,
                        user_task_id: userTaskId,
                        user_id: userId,
                    },
                });
                console.log('[PHOTO TASK] Created messages:', messages.length);
            }
            else {
                console.log('[PHOTO TASK] No admins/rezeption found to notify');
            }
            const emailRecipients = new Set();
            for (const u of adminsAndRezeption) {
                if (u.email && String(u.email).includes('@')) {
                    emailRecipients.add(String(u.email).trim());
                }
            }
            const extraNotify = process.env.PHOTO_VERIFICATION_NOTIFY_EMAILS;
            if (extraNotify) {
                for (const part of extraNotify.split(',')) {
                    const e = part.trim();
                    if (e.includes('@'))
                        emailRecipients.add(e);
                }
            }
            const guestRow = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);
            const guestName = guestRow.rows[0]?.name?.trim() || 'Gast';
            await emailService.sendPhotoVerificationRequestEmails({
                recipients: [...emailRecipients],
                taskTitle: task.title,
                guestName,
                userTaskId: String(userTaskId),
            });
            // Broadcast photo task update to notify admins/rezeption
            broadcastPhotoTaskUpdate();
        }
        catch (error) {
            console.error('[PHOTO TASK] Failed to notify admins about photo task:', error);
            // Don't fail the task completion if notification fails
        }
    }
    // Only award points and plant trees if this is NOT a photo task (photo tasks need verification first)
    if (!isPhotoTask) {
        // Check if user is in a team
        const userTeam = await getUserActiveTeam(userId);
        const teamMembers = userTeam ? await getTeamMembers(userTeam.id) : [userId];
        // Award points and plant tree for all team members
        for (const memberId of teamMembers) {
            await addUserPoints(memberId, task.points);
            await addForestCategoryPoints(memberId, task.points, taskForestKey);
            const newTreeId = await plantTree(memberId, taskId);
            // Distribute task points to growth of a random existing tree (not the newly planted one)
            await addGrowthPointsToRandomTree(memberId, task.points, newTreeId);
            // Update contest points for all active contests this member participates in
            const activeContests = await db.query(`SELECT c.id FROM contests c
         INNER JOIN contest_participants cp ON cp.contest_id = c.id
         WHERE cp.user_id = $1 AND c.active = TRUE AND c.end_date > NOW()`, [memberId]);
            // Update points for each active contest
            for (const contest of activeContests.rows) {
                await updateContestPoints(memberId, contest.id, task.points);
            }
        }
    }
    if (task.type === 'quiz') {
        await db.query(`DELETE FROM quiz_question_locks WHERE user_id = $1 AND task_id = $2`, [userId, taskId]);
    }
    return {
        success: true,
        pointsEarned: isPhotoTask ? 0 : task.points,
        message: isPhotoTask ? 'Photo uploaded, waiting for verification' : 'Task completed successfully',
        requiresVerification: isPhotoTask,
    };
}
/** Öffentliche Task-Detailansicht (ohne Login); nur wenn Flag gesetzt. */
export async function getPublicTaskForGuest(taskId, preferredLanguage) {
    const task = await getTaskById(taskId, preferredLanguage);
    if (!task)
        return null;
    if (!task.active)
        return null;
    if (!task.allow_public_completion)
        return null;
    return task;
}
export async function listPublicGuestTasks(lang) {
    const db = getPool();
    const result = await db.query(`SELECT t.id, t.title, t.title_i18n, t.teaser, t.teaser_i18n, t.description, t.description_i18n, t.type, t.points, t.thumbnail_url
     FROM tasks t
     INNER JOIN locations l ON l.id = t.location_id
     WHERE t.allow_public_completion = TRUE AND t.active = TRUE
     ORDER BY t.title ASC`);
    return result.rows.map((row) => {
        const title = resolveI18n(row.title_i18n, lang, row.title);
        const teaserRaw = resolveI18n(row.teaser_i18n, lang, row.teaser);
        const descriptionRaw = resolveI18n(row.description_i18n, lang, row.description);
        return {
            id: row.id,
            title,
            teaser: teaserRaw && String(teaserRaw).trim() !== '' ? teaserRaw : null,
            description: descriptionRaw && String(descriptionRaw).trim() !== '' ? descriptionRaw : null,
            type: row.type,
            points: row.points ?? 0,
            thumbnail_url: row.thumbnail_url ?? null,
        };
    });
}
/** Validiert Request-Body für Gast-Abschluss (analog zu completeTask). */
function assertPublicGuestCompletionPayload(task, data) {
    const t = task.type;
    if (t === 'survey') {
        if (!data?.survey_responses || typeof data.survey_responses !== 'object') {
            throw new Error('Survey responses required');
        }
        return;
    }
    if (t === 'photo') {
        if (!data?.photo_url || typeof data.photo_url !== 'string') {
            throw new Error('Photo URL required');
        }
        return;
    }
    if (t === 'quiz' || t === 'video' || t === 'article_quiz') {
        const qs = parseJsonPayload(task.quiz_questions);
        const hasQuiz = Array.isArray(qs) && qs.length > 0;
        if (hasQuiz) {
            if (!data?.quiz_answers) {
                throw new Error('Quiz answers required');
            }
            assertQuizAnswersMeetThreshold(task, data);
        }
        return;
    }
    // qr, visit_location: kein zusätzlicher Body nötig
}
function buildGuestCompletionPayload(task, data) {
    const t = task.type;
    if (t === 'survey') {
        return { survey_responses: data.survey_responses };
    }
    if (t === 'photo') {
        return { photo_url: data.photo_url };
    }
    if (t === 'quiz' || t === 'video' || t === 'article_quiz') {
        const qs = parseJsonPayload(task.quiz_questions);
        const hasQuiz = Array.isArray(qs) && qs.length > 0;
        if (hasQuiz && data?.quiz_answers) {
            return { quiz_answers: data.quiz_answers };
        }
        return {};
    }
    return data && typeof data === 'object' ? { ...data } : {};
}
/** Speichert Abschluss für Gast-Session; Punkte folgen nach merge mit User-Account. */
export async function completePublicGuestTask(taskId, guestSessionId, data) {
    const db = getPool();
    const task = await getTaskById(taskId);
    if (!task || !task.active) {
        throw new Error('Task not available for public completion');
    }
    if (!task.allow_public_completion) {
        throw new Error('Task not available for public completion');
    }
    const dup = await db.query(`SELECT id FROM guest_task_completions WHERE guest_session_id = $1 AND task_id = $2`, [guestSessionId, taskId]);
    if (dup.rows.length > 0) {
        throw new Error('Task already completed in this session');
    }
    assertPublicGuestCompletionPayload(task, data);
    const completionData = buildGuestCompletionPayload(task, data);
    await db.query(`INSERT INTO guest_task_completions (guest_session_id, task_id, completion_data)
     VALUES ($1, $2, $3::jsonb)`, [guestSessionId, taskId, JSON.stringify(completionData)]);
    return { success: true };
}
/** Überträgt ausstehende Gast-Abschlüsse auf einen eingeloggten Nutzer (nach Login/Registrierung). */
export async function mergeGuestTaskCompletions(userId, guestSessionId) {
    if (!guestSessionId)
        return { merged: 0, alreadyHad: 0 };
    const db = getPool();
    const pending = await db.query(`SELECT id, task_id, completion_data FROM guest_task_completions
     WHERE guest_session_id = $1 AND merged_at IS NULL`, [guestSessionId]);
    let merged = 0;
    let alreadyHad = 0;
    for (const row of pending.rows) {
        const raw = row.completion_data;
        const completionData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        try {
            await completeTask(row.task_id, userId, completionData);
            await db.query(`UPDATE guest_task_completions SET merged_user_id = $1, merged_at = CURRENT_TIMESTAMP WHERE id = $2`, [userId, row.id]);
            merged++;
        }
        catch (e) {
            const msg = String(e?.message || '');
            if (msg.includes('already completed')) {
                await db.query(`UPDATE guest_task_completions SET merged_user_id = $1, merged_at = CURRENT_TIMESTAMP WHERE id = $2`, [userId, row.id]);
                alreadyHad++;
            }
            else {
                console.error(`[GUEST MERGE] task ${row.task_id}:`, msg);
            }
        }
    }
    return { merged, alreadyHad };
}
/** Öffentliche URL für eine Datei im gemeinsamen Upload-Verzeichnis (gleiche Logik wie Aufgaben-Fotos/Videos). */
export function publicUploadFileUrl(filename) {
    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5001';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}/uploads/${filename}`;
}
export async function uploadPhoto(file) {
    return publicUploadFileUrl(file.filename);
}
export async function uploadVideo(file) {
    const videoUrl = publicUploadFileUrl(file.filename);
    try {
        const subtitles = await generateAndStoreVideoSubtitles({
            videoFilePath: file.path,
            videoFilename: file.filename,
        });
        return { videoUrl, videoSubtitlesI18n: subtitles };
    }
    catch (error) {
        console.error('[VIDEO SUBTITLES] Auto-generation failed for upload:', file.filename, error);
        return { videoUrl, videoSubtitlesI18n: null };
    }
}
export async function uploadThumbnail(file) {
    return publicUploadFileUrl(file.filename);
}
/**
 * Approve a photo task - awards points and adds photo to gallery
 */
export async function approvePhotoTask(userTaskId, verifiedByUserId) {
    const db = getPool();
    // Get user_task with task details
    const userTaskResult = await db.query(`SELECT ut.*, t.points, t.type, t.category as task_category_label, u.email, u.name as user_name, t.title as task_title
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     INNER JOIN users u ON u.id = ut.user_id
     WHERE ut.id = $1`, [userTaskId]);
    if (userTaskResult.rows.length === 0) {
        throw new Error('User task not found');
    }
    const userTask = userTaskResult.rows[0];
    if (userTask.verification_status !== 'pending') {
        throw new Error(`Task is not pending verification (current status: ${userTask.verification_status})`);
    }
    if (!userTask.photo_url) {
        throw new Error('No photo URL found for this task');
    }
    if (userTask.type !== 'photo') {
        throw new Error('This is not a photo task');
    }
    const approvedForestKey = taskCategoryLabelToForestKey(userTask.task_category_label) ??
        taskCategoryLabelToForestKey(userTask.task_category);
    // Update user_tasks with approved status
    await db.query(`UPDATE user_tasks 
     SET verification_status = 'approved', 
         verified_at = CURRENT_TIMESTAMP,
         verified_by = $1,
         points_earned = $2,
         task_category = COALESCE(task_category, $4)
     WHERE id = $3`, [verifiedByUserId, userTask.points, userTaskId, approvedForestKey]);
    // Add photo to gallery
    await db.query(`INSERT INTO gallery_images (user_task_id, user_id, task_id, photo_url, uploaded_at, approved_at, approved_by)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`, [
        userTaskId,
        userTask.user_id,
        userTask.task_id,
        userTask.photo_url,
        userTask.completed_at,
        verifiedByUserId,
    ]);
    // Award points and plant tree for all team members
    const userTeam = await getUserActiveTeam(userTask.user_id);
    const teamMembers = userTeam ? await getTeamMembers(userTeam.id) : [userTask.user_id];
    for (const memberId of teamMembers) {
        await addUserPoints(memberId, userTask.points);
        await addForestCategoryPoints(memberId, userTask.points, approvedForestKey);
        const newTreeId = await plantTree(memberId, userTask.task_id);
        // Distribute task points to growth of a random existing tree
        await addGrowthPointsToRandomTree(memberId, userTask.points, newTreeId);
        // Update contest points for all active contests
        const activeContests = await db.query(`SELECT c.id FROM contests c
       INNER JOIN contest_participants cp ON cp.contest_id = c.id
       WHERE cp.user_id = $1 AND c.active = TRUE AND c.end_date > NOW()`, [memberId]);
        for (const contest of activeContests.rows) {
            await updateContestPoints(memberId, contest.id, userTask.points);
        }
    }
    // Send mailbox notification to user
    try {
        const { createMessage } = await import('./message.service.js');
        await createMessage({
            user_id: userTask.user_id,
            type: 'photo_approval',
            title: `Foto-Aufgabe freigegeben: ${userTask.task_title}`,
            content: `Ihr Foto für die Aufgabe "${userTask.task_title}" wurde freigegeben! Sie haben ${userTask.points} Punkte erhalten.`,
            metadata: {
                task_id: userTask.task_id,
                user_task_id: userTaskId,
                points_earned: userTask.points,
            },
        });
    }
    catch (error) {
        console.error('Failed to create approval message:', error);
        // Don't fail the approval if message creation fails
    }
    // Broadcast task update to notify user's frontend
    try {
        const { broadcastTaskUpdate } = await import('../ws/task-broadcast.js');
        broadcastTaskUpdate();
    }
    catch (error) {
        console.error('Failed to broadcast task update:', error);
        // Don't fail the approval if broadcast fails
    }
    return {
        success: true,
        pointsEarned: userTask.points,
        message: 'Photo task approved and points awarded',
    };
}
/**
 * Reject a photo task - deletes photo and notifies user via mailbox
 */
export async function rejectPhotoTask(userTaskId, verifiedByUserId, rejectionReason) {
    const db = getPool();
    // Get user_task with task details
    const userTaskResult = await db.query(`SELECT ut.*, t.title as task_title, u.email, u.name as user_name, u.id as user_id
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     INNER JOIN users u ON u.id = ut.user_id
     WHERE ut.id = $1`, [userTaskId]);
    if (userTaskResult.rows.length === 0) {
        throw new Error('User task not found');
    }
    const userTask = userTaskResult.rows[0];
    if (userTask.verification_status !== 'pending') {
        throw new Error(`Task is not pending verification (current status: ${userTask.verification_status})`);
    }
    // Delete photo file from volume
    if (userTask.photo_url) {
        try {
            const photoPath = userTask.photo_url.replace(/^.*\/uploads\//, '');
            const uploadDir = process.env.UPLOAD_DIR || 'uploads';
            const fullPath = photoPath.startsWith(uploadDir) ? photoPath : `${uploadDir}/${photoPath}`;
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        catch (error) {
            console.error('Error deleting photo file:', error);
            // Continue even if file deletion fails
        }
    }
    // Delete the user_tasks entry so the task appears as "not completed" again
    // This allows the user to retry the photo task
    await db.query(`DELETE FROM user_tasks WHERE id = $1`, [userTaskId]);
    // Send mailbox notification to user
    try {
        const { createMessage } = await import('./message.service.js');
        const systemText = `Ihr Foto für die Aufgabe "${userTask.task_title}" wurde abgelehnt. Bitte versuchen Sie es erneut mit einem neuen Foto.`;
        // Only include rejection reason in content if it's not provided (fallback)
        // Otherwise, it will be displayed in the highlighted section from metadata
        const content = systemText;
        const metadata = {
            task_id: userTask.task_id,
            user_task_id: userTaskId,
        };
        if (rejectionReason) {
            metadata.rejection_reason = rejectionReason;
        }
        await createMessage({
            user_id: userTask.user_id,
            type: 'photo_rejection',
            title: `Foto-Aufgabe abgelehnt: ${userTask.task_title}`,
            content: content,
            metadata: metadata,
        });
    }
    catch (error) {
        console.error('Failed to create rejection message:', error);
        // Don't fail the rejection if message creation fails
    }
    // Broadcast task update to notify user's frontend
    try {
        const { broadcastTaskUpdate } = await import('../ws/task-broadcast.js');
        broadcastTaskUpdate();
    }
    catch (error) {
        console.error('Failed to broadcast task update:', error);
        // Don't fail the rejection if broadcast fails
    }
    return {
        success: true,
        message: 'Photo task rejected',
    };
}
/**
 * Get all pending photo tasks for verification
 */
export async function getPendingPhotoTasks() {
    try {
        const db = getPool();
        // First, check all user_tasks with photos to debug
        const debugResult = await db.query(`SELECT 
       ut.id,
       ut.verification_status,
       ut.photo_url IS NOT NULL as has_photo,
       t.type as task_type
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.photo_url IS NOT NULL
     LIMIT 10`);
        console.log('[GET PENDING PHOTOS] Debug - All user_tasks with photos:', debugResult.rows);
        // First, check for any pending tasks with photos (regardless of task type)
        const allPendingWithPhotos = await db.query(`SELECT 
       ut.id,
       ut.verification_status,
       t.type as task_type,
       t.title
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.verification_status = 'pending'
       AND ut.photo_url IS NOT NULL`);
        console.log('[GET PENDING PHOTOS] All pending tasks with photos (any type):', allPendingWithPhotos.rows.length, allPendingWithPhotos.rows);
        const result = await db.query(`SELECT 
       ut.id as user_task_id,
       ut.user_id,
       ut.task_id,
       ut.photo_url,
       ut.completed_at,
       ut.verification_status,
       u.name as user_name,
       u.email as user_email,
       t.title as task_title,
       t.points,
       t.description as task_description,
       t.type as task_type
     FROM user_tasks ut
     INNER JOIN users u ON u.id = ut.user_id
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.verification_status = 'pending'
       AND ut.photo_url IS NOT NULL
     ORDER BY ut.completed_at DESC`);
        console.log('[GET PENDING PHOTOS] Found', result.rows.length, 'pending photo tasks');
        if (result.rows.length > 0) {
            console.log('[GET PENDING PHOTOS] Sample task:', {
                user_task_id: result.rows[0].user_task_id,
                verification_status: result.rows[0].verification_status,
                task_type: result.rows[0].task_type,
                has_photo_url: !!result.rows[0].photo_url,
            });
        }
        else {
            // Check if there are any photo tasks at all
            const allPhotoTasks = await db.query(`SELECT COUNT(*) as count FROM user_tasks ut
       INNER JOIN tasks t ON t.id = ut.task_id
       WHERE t.type = 'photo' AND ut.photo_url IS NOT NULL`);
            console.log('[GET PENDING PHOTOS] Total photo tasks with photos:', allPhotoTasks.rows[0].count);
            const pendingCount = await db.query(`SELECT COUNT(*) as count FROM user_tasks ut
       INNER JOIN tasks t ON t.id = ut.task_id
       WHERE t.type = 'photo' AND ut.photo_url IS NOT NULL AND ut.verification_status = 'pending'`);
            console.log('[GET PENDING PHOTOS] Photo tasks with pending status:', pendingCount.rows[0].count);
        }
        return result.rows;
    }
    catch (error) {
        console.error('[GET PENDING PHOTOS] Error:', error);
        console.error('[GET PENDING PHOTOS] Error stack:', error.stack);
        throw error;
    }
}
/**
 * Get gallery images (approved photos)
 */
export async function getGalleryImages(filters) {
    const db = getPool();
    let query = `
    SELECT 
      gi.id,
      gi.user_task_id,
      gi.user_id,
      gi.task_id,
      gi.photo_url,
      gi.uploaded_at,
      gi.approved_at,
      gi.approved_by,
      u.name as user_name,
      t.title as task_title
    FROM gallery_images gi
    INNER JOIN users u ON u.id = gi.user_id
    INNER JOIN tasks t ON t.id = gi.task_id
    WHERE 1=1
  `;
    const params = [];
    let paramIndex = 1;
    if (filters?.userId) {
        query += ` AND gi.user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
    }
    if (filters?.taskId) {
        query += ` AND gi.task_id = $${paramIndex}`;
        params.push(filters.taskId);
        paramIndex++;
    }
    query += ` ORDER BY gi.approved_at DESC`;
    if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
    }
    if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
        paramIndex++;
    }
    const result = await db.query(query, params);
    return result.rows;
}
/**
 * Validates prerequisite fields for a task
 * @param data Task data with prerequisite fields
 * @param taskId Current task ID (null for new tasks, set for updates)
 */
async function validatePrerequisites(data, taskId) {
    const db = getPool();
    const prerequisiteTaskId = data.prerequisite_task_id;
    const prerequisiteTaskCount = data.prerequisite_task_count;
    let rawPrereqIds = data.prerequisite_task_ids;
    if (typeof rawPrereqIds === 'string') {
        try {
            rawPrereqIds = JSON.parse(rawPrereqIds);
        }
        catch {
            throw clientValidationError('prerequisite_task_ids must be a valid JSON array');
        }
    }
    // Leeres Array = „keine Voraussetzungen“ (wie undefined); [] ist in JS truthy und würde sonst fälschlich Fehler werfen → 500
    const prerequisiteTaskIds = Array.isArray(rawPrereqIds) && rawPrereqIds.length === 0 ? undefined : rawPrereqIds;
    // Keine Voraussetzungen (weder Einzel-ID noch ID-Liste)
    if (!prerequisiteTaskId && !prerequisiteTaskIds) {
        if (prerequisiteTaskCount !== undefined && prerequisiteTaskCount !== null) {
            throw new Error('prerequisite_task_count requires prerequisite_task_ids to be set');
        }
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
        const taskCheck = await db.query(`SELECT id FROM tasks WHERE id IN (${placeholders})`, taskIdsArray);
        if (taskCheck.rows.length !== taskIdsArray.length) {
            const foundIds = new Set(taskCheck.rows.map((r) => r.id));
            const missingIds = taskIdsArray.filter((id) => !foundIds.has(id));
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
        }
        else {
            // If prerequisite_task_ids is set but count is not, default to requiring all
            throw new Error('prerequisite_task_count is required when prerequisite_task_ids is set');
        }
    }
    else if (prerequisiteTaskCount !== undefined && prerequisiteTaskCount !== null) {
        throw new Error('prerequisite_task_count requires prerequisite_task_ids to be set');
    }
}
/**
 * Checks if all prerequisites for a task are met by a user
 * @param taskId Task ID to check prerequisites for
 * @param userId User ID to check completion for
 * @returns true if all prerequisites are met, false otherwise
 */
export async function checkPrerequisiteMet(taskId, userId) {
    const db = getPool();
    // Get task with prerequisites
    const taskResult = await db.query('SELECT prerequisite_task_id, prerequisite_task_count, prerequisite_task_ids FROM tasks WHERE id = $1', [taskId]);
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
        const type1Check = await db.query('SELECT 1 FROM user_tasks WHERE user_id = $1 AND task_id = $2', [userId, prerequisiteTaskId]);
        if (type1Check.rows.length === 0) {
            return false;
        }
    }
    // Check Type 2: prerequisite_task_count from prerequisite_task_ids
    if (prerequisiteTaskIds && Array.isArray(prerequisiteTaskIds) && prerequisiteTaskIds.length > 0) {
        const requiredCount = prerequisiteTaskCount || prerequisiteTaskIds.length;
        const placeholders = prerequisiteTaskIds.map((_, i) => `$${i + 2}`).join(', ');
        const type2Check = await db.query(`SELECT COUNT(*) as completed_count 
       FROM user_tasks 
       WHERE user_id = $1 AND task_id IN (${placeholders})`, [userId, ...prerequisiteTaskIds]);
        const completedCount = parseInt(type2Check.rows[0].completed_count, 10);
        if (completedCount < requiredCount) {
            return false;
        }
    }
    // All prerequisites met
    return true;
}
//# sourceMappingURL=task.service.js.map