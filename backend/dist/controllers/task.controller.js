import fs from 'fs';
import { getAllTasks, getTaskById, createTask as createTaskService, updateTask as updateTaskService, deleteTask as deleteTaskService, completeTask as completeTaskService, uploadPhoto as uploadPhotoService, uploadVideo as uploadVideoService, uploadThumbnail as uploadThumbnailService, setTasksActiveState, bulkDeleteTasks as bulkDeleteTasksService, } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRoleArray, validateUserTypeArray, validateHotelIdArray } from '../utils/validation.js';
export const getTasks = asyncHandler(async (req, res) => {
    const { limit, offset, type, includeAll, includeInactive } = req.query;
    const authReq = req;
    const isAdmin = authReq.user?.role === 'administrator';
    const includeInactiveFlag = isAdmin && includeInactive === 'true';
    const tasks = await getAllTasks({
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        type: type,
    }, authReq.user?.id, { includeAll: isAdmin && includeAll === 'true', includeInactive: includeInactiveFlag });
    res.json(tasks);
});
export const getTask = asyncHandler(async (req, res) => {
    const task = await getTaskById(req.params.id);
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
    if (payload.allowed_roles && !Array.isArray(payload.allowed_roles)) {
        return res.status(400).json({ error: 'allowed_roles must be an array of strings' });
    }
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
    try {
        validateRoleArray(payload.allowed_roles);
        validateUserTypeArray(payload.allowed_user_types);
        validateHotelIdArray(payload.allowed_hotel_ids);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
    const task = await createTaskService(payload);
    return res.status(201).json(task);
});
export const updateTask = asyncHandler(async (req, res) => {
    // #region agent log
    const logData = { location: 'task.controller.ts:98', message: 'updateTask controller entry', data: { id: req.params.id, bodyKeys: Object.keys(req.body), hasThumbnailUrl: 'thumbnail_url' in req.body, thumbnailUrl: req.body.thumbnail_url, thumbnailUrlType: typeof req.body.thumbnail_url, bodyString: JSON.stringify(req.body) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' };
    console.log('[DEBUG]', JSON.stringify(logData));
    try {
        const logDir = '/app/.cursor';
        if (!fs.existsSync(logDir))
            fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync('/app/.cursor/debug.log', JSON.stringify(logData) + '\n');
    }
    catch (e) {
        console.error('[DEBUG] Log error:', e);
    }
    // #endregion
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
    const task = await updateTaskService(req.params.id, req.body);
    // #region agent log
    const logDataResult = { location: 'task.controller.ts:112', message: 'updateTask service result', data: { task: task ? JSON.stringify(task) : null, thumbnailUrl: task?.thumbnail_url }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' };
    console.log('[DEBUG]', JSON.stringify(logDataResult));
    try {
        const logDir = '/app/.cursor';
        if (!fs.existsSync(logDir))
            fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync('/app/.cursor/debug.log', JSON.stringify(logDataResult) + '\n');
    }
    catch (e) {
        console.error('[DEBUG] Log error:', e);
    }
    // #endregion
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});
export const deleteTask = asyncHandler(async (req, res) => {
    await deleteTaskService(req.params.id);
    res.status(204).send();
});
export const bulkUpdateTaskStatus = asyncHandler(async (req, res) => {
    const { ids, active } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }
    await setTasksActiveState(ids, active);
    res.status(204).send();
});
export const bulkDeleteTasks = asyncHandler(async (req, res) => {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    await bulkDeleteTasksService(ids);
    res.status(204).send();
});
export const completeTask = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await completeTaskService(req.params.id, authReq.user.id, req.body);
    res.json(result);
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
    const videoUrl = await uploadVideoService(file);
    res.json({ video_url: videoUrl });
});
export const uploadThumbnail = asyncHandler(async (req, res) => {
    // #region agent log
    const logPath = '/Users/thomas/Development/4rest/.cursor/debug.log';
    try {
        fs.appendFileSync(logPath, JSON.stringify({ location: 'task.controller.ts:197', message: 'uploadThumbnail entry', data: { method: req.method, path: req.path, hasFile: !!req.file, fileSize: req.file?.size, fileName: req.file?.originalname, userId: req.user?.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n');
    }
    catch (e) { }
    // #endregion
    const file = req.file;
    if (!file) {
        // #region agent log
        try {
            fs.appendFileSync(logPath, JSON.stringify({ location: 'task.controller.ts:200', message: 'uploadThumbnail no file', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) + '\n');
        }
        catch (e) { }
        // #endregion
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // #region agent log
    try {
        fs.appendFileSync(logPath, JSON.stringify({ location: 'task.controller.ts:203', message: 'uploadThumbnail calling uploadThumbnailService', data: { fileName: file.filename, originalName: file.originalname, size: file.size, mimetype: file.mimetype }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) + '\n');
    }
    catch (e) { }
    // #endregion
    const thumbnailUrl = await uploadThumbnailService(file);
    // #region agent log
    try {
        fs.appendFileSync(logPath, JSON.stringify({ location: 'task.controller.ts:205', message: 'uploadThumbnail returning', data: { thumbnailUrl }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n');
    }
    catch (e) { }
    // #endregion
    res.json({ thumbnail_url: thumbnailUrl });
});
//# sourceMappingURL=task.controller.js.map