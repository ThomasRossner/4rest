import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getRewards, redeemReward } from '../controllers/reward.controller.js';

const router = Router();

router.get('/', authenticate, getRewards);
router.post('/:id/redeem', authenticate, redeemReward);

export default router;
