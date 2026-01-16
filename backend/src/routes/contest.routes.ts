import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  createContestController,
  joinContestController,
  getUserContestsController,
  getAllUserContestsController,
  getEmployeeContestsController,
  getContestDetailsController,
  getContestRankingController,
  dissolveContestController,
  leaveContestController,
  getContestQrCodeController,
  getAllContestsAdminController,
  updateContestController,
  enableContestRegistrationController,
  getContestRegistrationQrCodeController,
  bulkUpdateContestsStatusController,
  bulkDeleteContestsController,
  getContestParticipantsAdminController,
  addContestParticipantsController,
  removeContestParticipantsController,
} from '../controllers/contest.controller.js';

const router = Router();

router.post('/create', authenticate, createContestController);
router.post('/join', authenticate, joinContestController);
router.get('/', authenticate, getUserContestsController);
router.get('/all', authenticate, getAllUserContestsController);
router.get('/employee', authenticate, getEmployeeContestsController);

// Admin routes - MUST come before /:id routes
router.get('/admin/all', authenticate, requireRole('administrator'), getAllContestsAdminController);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateContestsStatusController);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteContestsController);

// Dynamic routes - must come after specific routes
// DELETE route must come BEFORE GET /:id to avoid route conflicts
router.delete('/:id', (req, res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contest.routes.ts:37',message:'DELETE /:id route matched',data:{method:req.method,path:req.path,params:req.params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  authenticate(req, res, next);
}, dissolveContestController);
router.get('/:id', authenticate, getContestDetailsController);
router.get('/:id/ranking', authenticate, getContestRankingController);
router.post('/:id/leave', authenticate, leaveContestController);
router.get('/:id/qr-code', authenticate, getContestQrCodeController);

// Admin routes for specific contests
router.put('/:id', authenticate, requireRole('administrator'), updateContestController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator'), enableContestRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator'), getContestRegistrationQrCodeController);
router.get('/:id/participants', authenticate, requireRole('administrator'), getContestParticipantsAdminController);
router.post('/:id/participants/add', authenticate, requireRole('administrator'), addContestParticipantsController);
router.post('/:id/participants/remove', authenticate, requireRole('administrator'), removeContestParticipantsController);

export default router;

