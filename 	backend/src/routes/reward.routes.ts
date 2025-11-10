import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getRewards,
  redeemReward,
  createReward,
  getRewardTemplates,
} from '../controllers/reward.controller.js';

const router = Router();

router.get('/', authenticate, getRewards);
router.get('/templates', authenticate, requireRole('administrator'), getRewardTemplates);
router.post('/', authenticate, requireRole('administrator'), createReward);
router.post('/:id/redeem', authenticate, redeemReward);

export default router;
