import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
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
  getTeamTotalPointsController,
  getUserActiveTeamController,
  getTeamRankingController,
  getAllTeamsController,
  updateTeamController,
  enableTeamRegistrationController,
  getTeamRegistrationQrCodeController,
} from '../controllers/team.controller.js';

const router = Router();

router.post('/create', authenticate, createTeamController);
router.post('/join', authenticate, joinTeamController);
router.get('/', authenticate, getUserTeamsController);
router.get('/active', authenticate, getUserActiveTeamController);
router.get('/:id', authenticate, getTeamDetailsController);
router.get('/:id/total-points', authenticate, getTeamTotalPointsController);
router.get('/:id/ranking', authenticate, getTeamRankingController);
router.post('/:id/contribute', authenticate, contributePointsController);
router.post('/:id/redeem', authenticate, redeemRewardController);
router.post('/:id/leave', authenticate, leaveTeamController);
router.delete('/:id', authenticate, dissolveTeamController);
router.get('/:id/qr-code', authenticate, getTeamQrCodeController);

// Admin routes
router.get('/all', authenticate, requireRole('administrator'), getAllTeamsController);
router.put('/:id', authenticate, requireRole('administrator'), updateTeamController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator'), enableTeamRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator'), getTeamRegistrationQrCodeController);

export default router;

