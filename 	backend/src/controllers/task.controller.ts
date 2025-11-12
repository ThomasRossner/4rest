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
  setTasksActiveState,
  bulkDeleteTasks as bulkDeleteTasksService,
} from '../services/task.service.js';
import { USER_ROLES, USER_TYPES, HOTEL_IDS } from '../constants/enums.js';

export const getTasks: RequestHandler = async (req, res) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTask: RequestHandler = async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask: RequestHandler = async (req, res) => {
  try {
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

    const invalidRoles = (payload.allowed_roles || []).filter(
      (role: string) => !(USER_ROLES as readonly string[]).includes(role)
    );
    if (invalidRoles.length > 0) {
      return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
    }

    const invalidUserTypes = (payload.allowed_user_types || []).filter(
      (userType: string) => !(USER_TYPES as readonly string[]).includes(userType)
    );
    if (invalidUserTypes.length > 0) {
      return res.status(400).json({ error: `Invalid user types: ${invalidUserTypes.join(', ')}` });
    }

    const invalidHotelIds = (payload.allowed_hotel_ids || []).filter(
      (hotelId: string) => !(HOTEL_IDS as readonly string[]).includes(hotelId)
    );
    if (invalidHotelIds.length > 0) {
      return res.status(400).json({ error: `Invalid hotel IDs: ${invalidHotelIds.join(', ')}` });
    }

    const task = await createTaskService(payload);
    return res.status(201).json(task);
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateTask: RequestHandler = async (req, res) => {
  try {
    const task = await updateTaskService(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask: RequestHandler = async (req, res) => {
  try {
    await deleteTaskService(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkUpdateTaskStatus: RequestHandler = async (req, res) => {
  try {
    const { ids, active } = req.body ?? {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }

    await setTasksActiveState(ids, active);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteTasks: RequestHandler = async (req, res) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of task ids.' });
    }
    await bulkDeleteTasksService(ids);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const completeTask: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await completeTaskService(req.params.id, authReq.user.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadPhoto: RequestHandler = async (req, res) => {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const photoUrl = await uploadPhotoService(file);
    res.json({ photo_url: photoUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadVideo: RequestHandler = async (req, res) => {
  try {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const videoUrl = await uploadVideoService(file);
    res.json({ video_url: videoUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
