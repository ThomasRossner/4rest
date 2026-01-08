import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createTeamController,
  joinTeamController,
  getUserTeamsController,
  getTeamDetailsController,
  contributePointsController,
  redeemRewardController,
  dissolveTeamController,
  leaveTeamController,
  getTeamQrCodeController,
} from '../controllers/team.controller.js';

const router = Router();

router.post('/create', authenticate, createTeamController);
router.post('/join', authenticate, joinTeamController);
router.get('/', authenticate, getUserTeamsController);
router.get('/:id', authenticate, getTeamDetailsController);
router.post('/:id/contribute', authenticate, contributePointsController);
router.post('/:id/redeem', authenticate, redeemRewardController);
router.post('/:id/leave', authenticate, leaveTeamController);
router.delete('/:id', authenticate, dissolveTeamController);
router.get('/:id/qr-code', authenticate, getTeamQrCodeController);

export default router;

