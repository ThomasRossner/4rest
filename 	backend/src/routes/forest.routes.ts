import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getForest, getUserForest } from '../controllers/forest.controller.js';

const router = Router();

router.get('/', authenticate, getForest);
router.get('/users/:userId', authenticate, getUserForest);

export default router;
