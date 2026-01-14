import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getAllTasks,
  getTaskById,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  completeTask as completeTaskService,
  uploadPhoto as uploadPhotoService,
  uploadVideo as uploadVideoService,
  uploadThumbnail as uploadThumbnailService,
  setTasksActiveState,
  bulkDeleteTasks as bulkDeleteTasksService,
} from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRoleArray, validateUserTypeArray, validateHotelIdArray } from '../utils/validation.js';

export const getTasks: RequestHandler = asyncHandler(async (req, res) => {
  const { limit, offset, type, includeAll, includeInactive } = req.query;
  const authReq = req as AuthRequest;
  const isAdmin = authReq.user?.role === 'administrator';
  const includeInactiveFlag = isAdmin && includeInactive === 'true';
  const tasks = await getAllTasks(
    {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      type: type as string,
    },
    authReq.user?.id,
    { includeAll: isAdmin && includeAll === 'true', includeInactive: includeInactiveFlag }
  );
  res.json(tasks);
});

export const getTask: RequestHandler = asyncHandler(async (req, res) => {
  const task = await getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

export const createTask: RequestHandler = asyncHandler(async (req, res) => {
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
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const task = await createTaskService(payload);
    return res.status(201).json(task);
});

export const updateTask: RequestHandler = asyncHandler(async (req, res) => {
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
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

export const deleteTask: RequestHandler = asyncHandler(async (req, res) => {
  await deleteTaskService(req.params.id);
  res.status(204).send();
});

export const bulkUpdateTaskStatus: RequestHandler = asyncHandler(async (req, res) => {
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

export const bulkDeleteTasks: RequestHandler = asyncHandler(async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide an array of task ids.' });
  }
  await bulkDeleteTasksService(ids);
  res.status(204).send();
});

export const completeTask: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const result = await completeTaskService(req.params.id, authReq.user.id, req.body);
  res.json(result);
});

export const uploadPhoto: RequestHandler = asyncHandler(async (req, res) => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const photoUrl = await uploadPhotoService(file);
  res.json({ photo_url: photoUrl });
});

export const uploadVideo: RequestHandler = asyncHandler(async (req, res) => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const videoUrl = await uploadVideoService(file);
  res.json({ video_url: videoUrl });
});

export const uploadThumbnail: RequestHandler = asyncHandler(async (req, res) => {
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const thumbnailUrl = await uploadThumbnailService(file);
  res.json({ thumbnail_url: thumbnailUrl });
});
