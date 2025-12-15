import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getForest, getUserForest, visitForest, getForestStats } from '../controllers/forest.controller.js';

const router = Router();

router.get('/', authenticate, getForest);
router.get('/users/:userId', authenticate, getUserForest);
router.post('/visit', authenticate, visitForest);
router.get('/stats', authenticate, getForestStats);

export default router;
