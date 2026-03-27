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
  bulkUpdateTeamsStatusController,
  bulkDeleteTeamsController,
  getTeamMembersAdminController,
  addTeamMembersController,
  removeTeamMembersController,
} from '../controllers/team.controller.js';

const router = Router();

router.post('/create', authenticate, createTeamController);
router.post('/join', authenticate, joinTeamController);
router.get('/', authenticate, getUserTeamsController);
router.get('/active', authenticate, getUserActiveTeamController);

// Admin routes - MUST come before /:id routes
router.get('/all', authenticate, requireRole('administrator', 'rezeption'), getAllTeamsController);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateTeamsStatusController);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteTeamsController);

// Dynamic routes - must come after specific routes
// DELETE route must come BEFORE GET /:id to avoid route conflicts
router.delete('/:id', authenticate, requireRole('administrator', 'rezeption'), dissolveTeamController);
router.get('/:id', authenticate, getTeamDetailsController);
router.get('/:id/total-points', authenticate, getTeamTotalPointsController);
router.get('/:id/ranking', authenticate, getTeamRankingController);
router.post('/:id/contribute', authenticate, contributePointsController);
router.post('/:id/redeem', authenticate, redeemRewardController);
router.post('/:id/leave', authenticate, leaveTeamController);
// Mitgliedschaft prüft getTeamQrCodeController (Gäste dürfen den Join-QR ihres Teams laden)
router.get('/:id/qr-code', authenticate, getTeamQrCodeController);

// Admin routes for specific teams
router.put('/:id', authenticate, requireRole('administrator', 'rezeption'), updateTeamController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator', 'rezeption'), enableTeamRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator', 'rezeption'), getTeamRegistrationQrCodeController);
router.get('/:id/members', authenticate, requireRole('administrator', 'rezeption'), getTeamMembersAdminController);
router.post('/:id/members/add', authenticate, requireRole('administrator', 'rezeption'), addTeamMembersController);
router.post('/:id/members/remove', authenticate, requireRole('administrator', 'rezeption'), removeTeamMembersController);

export default router;

