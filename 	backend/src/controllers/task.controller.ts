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
} from '../services/task.service.js';

export const getTasks: RequestHandler = async (req, res) => {
  try {
    const { limit, offset, type } = req.query;
    const tasks = await getAllTasks({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      type: type as string,
    }, (req as AuthRequest).user?.id);
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
    const task = await createTaskService(req.body);
    res.status(201).json(task);
  } catch (error: any) {
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
