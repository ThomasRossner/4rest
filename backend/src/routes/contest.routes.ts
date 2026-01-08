import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  createContestController,
  joinContestController,
  getUserContestsController,
  getContestDetailsController,
  getContestRankingController,
  dissolveContestController,
  leaveContestController,
  getContestQrCodeController,
} from '../controllers/contest.controller.js';

const router = Router();

router.post('/create', authenticate, createContestController);
router.post('/join', authenticate, joinContestController);
router.get('/', authenticate, getUserContestsController);
router.get('/:id', authenticate, getContestDetailsController);
router.get('/:id/ranking', authenticate, getContestRankingController);
router.delete('/:id', authenticate, dissolveContestController);
router.post('/:id/leave', authenticate, leaveContestController);
router.get('/:id/qr-code', authenticate, getContestQrCodeController);

export default router;

