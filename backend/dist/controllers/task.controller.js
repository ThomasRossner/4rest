import { getAllTasks, getTaskById, createTask as createTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService, completeTask as completeTaskService, submitQuizAnswer as submitQuizAnswerService, getActiveQuizQuestionLocks as getActiveQuizQuestionLocksService, uploadPhoto as uploadPhotoService, uploadVideo as uploadVideoService, uploadThumbnail as uploadThumbnailService, setTasksActiveState, bulkDeleteTasks as bulkDeleteTasksService, approvePhotoTask as approvePhotoTaskService, rejectPhotoTask as rejectPhotoTaskService, getPendingPhotoTasks as getPendingPhotoTasksService, getGalleryImages as getGalleryImagesService, generateOrGetTaskQrCode, getPublicTaskForGuest, completePublicGuestTask, listPublicGuestTasks as listPublicGuestTasksService, addTaskToCollection as addTaskToCollectionService, removeTaskFromCollection as removeTaskFromCollectionService, } from '../services/task.service.js';
import { getPreferredLanguage } from '../services/user.service.js';
import { ensureGuestSession } from '../utils/guestSession.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateUserTypeArray, validateHotelIdArray } from '../utils/validation.js';
import { broadcastTaskUpdate } from '../ws/task-broadcast.js';
/** GET /api/tasks/public — Aufgaben mit „ohne Login“, ohne JWT (Cookie Gast-Session). */
export const listPublicGuestTasks = asyncHandler(async (req, res) => {
    ensureGuestSession(req, res);
    const langParam = req.query.lang;
    const lang = langParam === 'en' ? 'en' : 'de';
    const tasks = await listPublicGuestTasksService(lang);
    res.json(tasks);
});
/** GET /api/tasks/public/:id — ohne JWT (Cookie Gast-Session). */
export const getPublicTask = asyncHandler(async (req, res) => {
    ensureGuestSession(req, res);
    const langParam = req.query.lang;
    const preferredLanguage = langParam === 'en' ? 'en' : langParam === 'de' ? 'de' : undefined;
    const task = await getPublicTaskForGuest(req.params.id, preferredLanguage);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});
/** POST /api/tasks/public/:id/complete */
export const completePublicTask = asyncHandler(async (req, res) => {
    const sessionId = ensureGuestSession(req, res);
    try {
        const result = await completePublicGuestTask(req.params.id, sessionId, req.body);
        res.json(result);
    }
    catch (e) {
        const msg = String(e?.message || '');
        if (msg.includes('not available') || msg.includes('not supported')) {
            return res.status(404).json({ error: msg });
        }
        if (msg.includes('already completed')) {
            return res.status(409).json({ error: msg });
        }
        if (msg.includes('required') ||
            msg.includes('Need at least') ||
            msg.includes('invalid')) {
            return res.status(400).json({ error: msg });
        }
        throw e;
    }
});
export const getTasks = asyncHandler(async (req, res) => {
    const { limit, offset, type, includeAll, includeInactive } = req.query;
    const authReq = req;
    const isAdminOrRedaktion = authReq.user?.role === 'administrator' || authReq.user?.role === 'redaktion';
    const includeInactiveFlag = isAdminOrRedaktion && includeInactive === 'true';
    const includeAllValue = isAdminOrRedaktion && includeAll === 'true';
    const preferredLanguage = authReq.user?.id ? await getPreferredLanguage(authReq.user.id) : undefined;
    const tasks = await getAllTasks({
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        type: type,
    }, authReq.user?.id, { includeAll: includeAllValue, includeInactive: includeInactiveFlag, preferredLanguage: preferredLanguage ?? undefined });
    res.json(tasks);
});
export const getTask = asyncHandler(async (req, res) => {
    const authReq = req;
    // Admin/Redaktion: volle *_i18n für Editoren; Anzeigesprache steuern die Umschalt-Buttons
    const isAdminOrRedaktion = authReq.user?.role === 'administrator' || authReq.user?.role === 'redaktion';
    const preferredLanguage = isAdminOrRedaktion
        ? undefined
        : (authReq.user?.id ? await getPreferredLanguage(authReq.user.id) : undefined);
    const task = await getTaskById(req.params.id, preferredLanguage ?? undefined, authReq.user?.id ?? null);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});
export const createTask = asyncHandler(async (req, res) => {
    const { templateId, ...payload } = req.body;
    if (templateId) {
        return res.status(400).json({ error: 'Task templates are no longer supported.' });
    }
    if (!payload?.type) {
        return res.status(400).json({ error: 'Task type is required' });
    }
    if (!payload?.title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (payload.active !== undefined && typeof payload.active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value' });
    }
    // allowed_roles is deprecated, use allowed_teams and allowed_contests instead
    // DISABLED: Migration 051 not run, columns don't exist
    // if (payload.allowed_teams && !Array.isArray(payload.allowed_teams)) {
    //   return res.status(400).json({ error: 'allowed_teams must be an array of UUIDs' });
    // }
    // if (payload.allowed_contests && !Array.isArray(payload.allowed_contests)) {
    //   return res.status(400).json({ error: 'allowed_contests must be an array of UUIDs' });
    // }
    if (payload.allowed_user_types && !Array.isArray(payload.allowed_user_types)) {
        return res.status(400).json({ error: 'allowed_user_types must be an array of strings' });
    }
    if (payload.allowed_hotel_ids && !Array.isArray(payload.allowed_hotel_ids)) {
        return res.status(400).json({ error: 'allowed_hotel_ids must be an array of strings' });
    }
    const locationId = payload.locationId ?? payload.location_id;
    if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ error: 'locationId is required.' });
    }
    const { getLocationById } = await import('../services/location.service.js');
    const location = await getLocationById(locationId);
    if (!location) {
        return res.status(400).json({ error: 'Invalid locationId.' });
    }
    payload.location_id = location.id;
    // Validate arrays using shared validation functions
    // allowed_roles is deprecated, validation removed
    try {
        validateUserTypeArray(payload.allowed_user_types);
        validateHotelIdArray(payload.allowed_hotel_ids);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
    const task = await createTaskService(payload);
    // Broadcast update to all clients
    broadcastTaskUpdate();
    return res.status(201).json(task);
});
export const updateTask = asyncHandler(async (req, res) => {
    const locationId = req.body.locationId ?? req.body.location_id;
    if (locationId !== undefined) {
        if (!locationId || typeof locationId !== 'string') {
            return res.status(400).json({ error: 'locationId must be a valid string.' });
        }
        const { getLocationById } = await import('../services/location.service.js');
        const location = await getLocationById(locationId);
        if (!location) {
            return res.status(400).json({ error: 'Invalid locationId.' });
        }
        req.body.location_id = location.id;
    }
    // Leerer String / null würde Postgres (UUID NOT NULL) mit 22P02/23502 brechen — Feld weglassen = Stand in DB behalten
    if (req.body.location_id === '' || req.body.location_id === null) {
        delete req.body.location_id;
    }
    const task = await updateTaskService(req.params.id, req.body);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    // Broadcast update to all clients
    broadcastTaskUpdate();
    res.json(task);
});
export const deleteTask = asyncHandler(async (req, res) => {
    await deleteTaskService(req.params.id);
    // Broadcast update to all clients
    broadcastTaskUpdate();
    res.status(204).send();
});
export const bulkUpdateTaskStatus = asyncHandler(async (req, res) => {
    // Broadcast will be called after successful update
    const { ids, active } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }
    await setTasksActiveState(ids, active);
    // Broadcast update to all clients
    broadcastTaskUpdate();
    res.status(204).send();
});
export const bulkDeleteTasks = asyncHandler(async (req, res) => {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    await bulkDeleteTasksService(ids);
    // Broadcast update to all clients
    broadcastTaskUpdate();
    res.status(204).send();
});
export const getQuizQuestionLocks = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const locks = await getActiveQuizQuestionLocksService(req.params.id, authReq.user.id);
        res.json({ locks });
    }
    catch (e) {
        const msg = e?.message || 'Error';
        if (String(msg).includes('not found')) {
            return res.status(404).json({ error: msg });
        }
        throw e;
    }
});
export const submitQuizAnswer = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { questionIndex, answerId } = req.body ?? {};
    if (typeof questionIndex !== 'number' ||
        questionIndex < 0 ||
        typeof answerId !== 'string' ||
        !answerId.trim()) {
        return res.status(400).json({ error: 'questionIndex (non-negative number) and answerId (string) are required' });
    }
    try {
        const result = await submitQuizAnswerService(req.params.id, authReq.user.id, questionIndex, answerId);
        res.json(result);
    }
    catch (e) {
        const msg = e?.message || 'Error';
        if (String(msg).includes('already completed')) {
            return res.status(409).json({ error: msg });
        }
        if (String(msg).includes('Not a quiz') ||
            String(msg).includes('Invalid question') ||
            String(msg).includes('invalid')) {
            return res.status(400).json({ error: msg });
        }
        throw e;
    }
});
export const completeTask = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await completeTaskService(req.params.id, authReq.user.id, req.body);
    res.json(result);
});
/** POST /api/tasks/:id/collection — Aufgabe zur persönlichen Sammlung hinzufügen. */
export const addTaskToCollection = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        await addTaskToCollectionService(authReq.user.id, req.params.id);
        res.json({ in_collection: true });
    }
    catch (e) {
        if (String(e?.message || '').includes('not found')) {
            return res.status(404).json({ error: 'Task not found' });
        }
        throw e;
    }
});
/** DELETE /api/tasks/:id/collection — Aufgabe aus der persönlichen Sammlung entfernen. */
export const removeTaskFromCollection = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    await removeTaskFromCollectionService(authReq.user.id, req.params.id);
    res.json({ in_collection: false });
});
export const uploadPhoto = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const photoUrl = await uploadPhotoService(file);
    res.json({ photo_url: photoUrl });
});
export const uploadVideo = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadVideoService(file);
    res.json({
        video_url: result.videoUrl,
        video_subtitles_i18n: result.videoSubtitlesI18n,
    });
});
export const uploadThumbnail = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const thumbnailUrl = await uploadThumbnailService(file);
    res.json({ thumbnail_url: thumbnailUrl });
});
export const approvePhotoTask = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { userTaskId } = req.body;
    if (!userTaskId) {
        return res.status(400).json({ error: 'userTaskId is required' });
    }
    const result = await approvePhotoTaskService(userTaskId, authReq.user.id);
    res.json(result);
});
export const rejectPhotoTask = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { userTaskId, rejectionReason } = req.body;
    if (!userTaskId) {
        return res.status(400).json({ error: 'userTaskId is required' });
    }
    const result = await rejectPhotoTaskService(userTaskId, authReq.user.id, rejectionReason);
    res.json({ success: result.success, message: result.message });
});
export const getPendingPhotoTasks = asyncHandler(async (req, res) => {
    try {
        const tasks = await getPendingPhotoTasksService();
        console.log('[CONTROLLER] getPendingPhotoTasks - Returning', tasks?.length || 0, 'tasks');
        if (tasks && tasks.length > 0) {
            console.log('[CONTROLLER] getPendingPhotoTasks - Sample task:', {
                user_task_id: tasks[0].user_task_id,
                task_title: tasks[0].task_title,
            });
        }
        res.json(tasks);
    }
    catch (error) {
        console.error('[CONTROLLER] getPendingPhotoTasks - Error:', error);
        console.error('[CONTROLLER] getPendingPhotoTasks - Error stack:', error.stack);
        throw error;
    }
});
export const getGallery = asyncHandler(async (req, res) => {
    const { userId, taskId, limit, offset } = req.query;
    const filters = {};
    if (userId)
        filters.userId = userId;
    if (taskId)
        filters.taskId = taskId;
    if (limit)
        filters.limit = parseInt(limit, 10);
    if (offset)
        filters.offset = parseInt(offset, 10);
    const images = await getGalleryImagesService(filters);
    res.json(images);
});
/**
 * GET /api/tasks/:id/qr-code
 * Ruft den QR-Code einer Aufgabe ab (nur für Administratoren und Redaktion)
 * Generiert automatisch einen QR-Code, falls noch keiner existiert
 */
export const getTaskQrCode = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (authReq.user.role !== 'administrator' && authReq.user.role !== 'redaktion') {
        return res.status(403).json({ error: 'Forbidden: Administrator or Redaktion access required' });
    }
    const { id } = req.params;
    try {
        const qrCode = await generateOrGetTaskQrCode(id);
        res.json({ qrCode });
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Failed to get task QR code' });
    }
});
//# sourceMappingURL=task.controller.js.map