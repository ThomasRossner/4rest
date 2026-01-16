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
router.get('/all', authenticate, requireRole('administrator'), getAllTeamsController);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateTeamsStatusController);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteTeamsController);

// Dynamic routes - must come after specific routes
// DELETE route must come BEFORE GET /:id to avoid route conflicts
router.delete('/:id', (req, res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'team.routes.ts:38',message:'DELETE /:id route matched',data:{method:req.method,path:req.path,params:req.params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  authenticate(req, res, next);
}, dissolveTeamController);
router.get('/:id', authenticate, getTeamDetailsController);
router.get('/:id/total-points', authenticate, getTeamTotalPointsController);
router.get('/:id/ranking', authenticate, getTeamRankingController);
router.post('/:id/contribute', authenticate, contributePointsController);
router.post('/:id/redeem', authenticate, redeemRewardController);
router.post('/:id/leave', authenticate, leaveTeamController);
router.get('/:id/qr-code', authenticate, getTeamQrCodeController);

// Admin routes for specific teams
router.put('/:id', authenticate, requireRole('administrator'), updateTeamController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator'), enableTeamRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator'), getTeamRegistrationQrCodeController);
router.get('/:id/members', authenticate, requireRole('administrator'), getTeamMembersAdminController);
router.post('/:id/members/add', authenticate, requireRole('administrator'), addTeamMembersController);
router.post('/:id/members/remove', authenticate, requireRole('administrator'), removeTeamMembersController);

export default router;

