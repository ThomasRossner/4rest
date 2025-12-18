import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getSurveyAnalyticsController } from '../controllers/survey.controller.js';

const router = Router();

// Get survey analytics (admin only)
router.get(
  '/analytics',
  authenticate,
  requireRole('administrator'),
  getSurveyAnalyticsController
);

export default router;

