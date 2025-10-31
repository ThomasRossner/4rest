import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getUserProgress, getUserProfile, updateUserProfile } from '../controllers/user.controller.js';

const router = Router();

router.get('/:id/progress', authenticate, getUserProgress);
router.get('/:id/profile', authenticate, getUserProfile);
router.put('/:id/profile', authenticate, updateUserProfile);

export default router;
