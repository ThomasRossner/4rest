import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getRewards, redeemReward, verifyQrCode, createReward, getRewardTemplates, updateReward, bulkUpdateRewardStatus, bulkDeleteRewardsController, generatePointsBonusQrCode, redeemPointsBonusQrCode, } from '../controllers/reward.controller.js';
const router = Router();
router.get('/', authenticate, getRewards);
router.get('/templates', authenticate, requireRole('administrator'), getRewardTemplates);
router.post('/', authenticate, requireRole('administrator'), createReward);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateRewardStatus);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteRewardsController);
router.post('/verify-qr', authenticate, requireRole('administrator'), verifyQrCode);
// Points bonus routes must come before /:id routes to avoid route conflicts
router.post('/points-bonus/generate', authenticate, requireRole('employee', 'administrator'), generatePointsBonusQrCode);
router.post('/points-bonus/redeem', authenticate, redeemPointsBonusQrCode);
// Parametrized routes must come last
router.put('/:id', authenticate, requireRole('administrator'), updateReward);
router.post('/:id/redeem', authenticate, redeemReward);
export default router;
//# sourceMappingURL=reward.routes.js.map