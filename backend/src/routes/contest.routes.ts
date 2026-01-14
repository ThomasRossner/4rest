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
} from '../controllers/contest.controller.js';

const router = Router();

router.post('/create', authenticate, createContestController);
router.post('/join', authenticate, joinContestController);
router.get('/', authenticate, getUserContestsController);
router.get('/all', authenticate, getAllUserContestsController);
router.get('/employee', authenticate, getEmployeeContestsController);
router.get('/:id', authenticate, getContestDetailsController);
router.get('/:id/ranking', authenticate, getContestRankingController);
router.delete('/:id', authenticate, dissolveContestController);
router.post('/:id/leave', authenticate, leaveContestController);
router.get('/:id/qr-code', authenticate, getContestQrCodeController);

// Admin routes
router.get('/admin/all', authenticate, requireRole('administrator'), getAllContestsAdminController);
router.put('/:id', authenticate, requireRole('administrator'), updateContestController);
router.post('/:id/registration/enable', authenticate, requireRole('administrator'), enableContestRegistrationController);
router.get('/:id/registration-qr-code', authenticate, requireRole('administrator'), getContestRegistrationQrCodeController);

export default router;

