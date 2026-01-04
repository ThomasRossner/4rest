import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getStatistics,
  getUserStats,
  getTaskCO2,
} from '../controllers/statistics.controller.js';

const router = Router();

router.get('/', authenticate, getStatistics);
router.get('/users/:userId', authenticate, getUserStats);
router.get('/tasks/:taskId/co2', authenticate, getTaskCO2);

export default router;
