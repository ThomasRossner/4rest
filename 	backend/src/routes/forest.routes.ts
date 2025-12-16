import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getForest,
  getUserForest,
  visitForest,
  getForestStats,
  validateAndFixForest,
  getValidationJobStatus,
} from '../controllers/forest.controller.js';

const router = Router();

router.get('/', authenticate, getForest);
router.get('/users/:userId', authenticate, getUserForest);
router.post('/visit', authenticate, visitForest);
router.get('/stats', authenticate, getForestStats);
router.post('/validate-fix', authenticate, validateAndFixForest);
router.get('/validate-fix/:jobId', authenticate, getValidationJobStatus);

export default router;
