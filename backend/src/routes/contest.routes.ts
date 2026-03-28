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
router.get('/employee', authenticate, getEmployeeContestsController); // Accessible to rezeption and administrator

// Admin routes - MUST come before /:id routes
router.get('/admin/all', authenticate, requireRole('administrator', 'rezeption'), getAllContestsAdminController);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateContestsStatusController);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteContestsController);

// Dynamic routes - must come after specific routes
// DELETE route must come BEFORE GET /:id to avoid route conflicts
// Ersteller (z. B. Gäste) dürfen auflösen; Berechtigung prüft dissolveContest() im Controller/Service
router.delete('/:id', authenticate, dissolveContestController);
router.get('/:id', authenticate, getContestDetailsController);
router.get('/:id/ranking', authenticate, getContestRankingController);
router.post('/:id/leave', authenticate, leaveContestController);
// Teilnehmer prüft getContestQrCodeController (Gäste dürfen den Join-QR ihres Contests laden)
router.get('/:id/qr-code', authenticate, getContestQrCodeController);

// Admin routes for specific contests
router.put('/:id', authenticate, requireRole('administrator', 'rezeption'), updateContestController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator', 'rezeption'), enableContestRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator', 'rezeption'), getContestRegistrationQrCodeController);
router.get('/:id/participants', authenticate, requireRole('administrator', 'rezeption'), getContestParticipantsAdminController);
router.post('/:id/participants/add', authenticate, requireRole('administrator', 'rezeption'), addContestParticipantsController);
router.post('/:id/participants/remove', authenticate, requireRole('administrator', 'rezeption'), removeContestParticipantsController);

export default router;

