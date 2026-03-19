import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import fs from 'fs';
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
  approvePhotoTask as approvePhotoTaskService,
  rejectPhotoTask as rejectPhotoTaskService,
  getPendingPhotoTasks as getPendingPhotoTasksService,
  getGalleryImages as getGalleryImagesService,
  generateOrGetTaskQrCode,
} from '../services/task.service.js';
import { getPreferredLanguage } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRoleArray, validateUserTypeArray, validateHotelIdArray } from '../utils/validation.js';
import { broadcastTaskUpdate } from '../ws/task-broadcast.js';

export const getTasks: RequestHandler = asyncHandler(async (req, res) => {
  const { limit, offset, type, includeAll, includeInactive } = req.query;
  const authReq = req as AuthRequest;
  const isAdminOrRedaktion = authReq.user?.role === 'administrator' || authReq.user?.role === 'redaktion';
  const includeInactiveFlag = isAdminOrRedaktion && includeInactive === 'true';
  const includeAllValue = isAdminOrRedaktion && includeAll === 'true';
  const preferredLanguage = authReq.user?.id ? await getPreferredLanguage(authReq.user.id) : undefined;

  const tasks = await getAllTasks(
    {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      type: type as string,
    },
    authReq.user?.id,
    { includeAll: includeAllValue, includeInactive: includeInactiveFlag, preferredLanguage: preferredLanguage ?? undefined }
  );

  console.log('[GET /tasks]', {
    userId: authReq.user?.id ?? null,
    userEmail: authReq.user?.email ?? null,
    tasksCount: Array.isArray(tasks) ? tasks.length : 0,
  });

  res.json(tasks);
});

export const getTask: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  // Admin/Redaktion: volle *_i18n für Editoren; Anzeigesprache steuern die Umschalt-Buttons
  const isAdminOrRedaktion = authReq.user?.role === 'administrator' || authReq.user?.role === 'redaktion';
  const preferredLanguage =
    isAdminOrRedaktion
      ? undefined
      : (authReq.user?.id ? await getPreferredLanguage(authReq.user.id) : undefined);
  const task = await getTaskById(req.params.id, preferredLanguage ?? undefined);
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
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const task = await createTaskService(payload);
    // Broadcast update to all clients
    broadcastTaskUpdate();
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
  // Broadcast update to all clients
  broadcastTaskUpdate();
  res.json(task);
});

export const deleteTask: RequestHandler = asyncHandler(async (req, res) => {
  await deleteTaskService(req.params.id);
  // Broadcast update to all clients
  broadcastTaskUpdate();
  res.status(204).send();
});

export const bulkUpdateTaskStatus: RequestHandler = asyncHandler(async (req, res) => {
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

export const bulkDeleteTasks: RequestHandler = asyncHandler(async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide an array of task ids.' });
  }
  await bulkDeleteTasksService(ids);
  // Broadcast update to all clients
  broadcastTaskUpdate();
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

export const approvePhotoTask: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
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

export const rejectPhotoTask: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
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

export const getPendingPhotoTasks: RequestHandler = asyncHandler(async (req, res) => {
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
  } catch (error: any) {
    console.error('[CONTROLLER] getPendingPhotoTasks - Error:', error);
    console.error('[CONTROLLER] getPendingPhotoTasks - Error stack:', error.stack);
    throw error;
  }
});

export const getGallery: RequestHandler = asyncHandler(async (req, res) => {
  const { userId, taskId, limit, offset } = req.query;
  const filters: any = {};
  if (userId) filters.userId = userId as string;
  if (taskId) filters.taskId = taskId as string;
  if (limit) filters.limit = parseInt(limit as string, 10);
  if (offset) filters.offset = parseInt(offset as string, 10);
  const images = await getGalleryImagesService(filters);
  res.json(images);
});

/**
 * GET /api/tasks/:id/qr-code
 * Ruft den QR-Code einer Aufgabe ab (nur für Administratoren und Redaktion)
 * Generiert automatisch einen QR-Code, falls noch keiner existiert
 */
export const getTaskQrCode: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
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
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to get task QR code' });
  }
});
