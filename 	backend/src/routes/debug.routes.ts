import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  createBulkTasks,
  completeBulkTasks,
  deleteUserData,
  createSurveyWithRandomParticipants,
  simulateTimeActivity,
  simulateRewardRedemptionController,
  resetUserDataController,
  generateStatisticsDataController,
  simulateForestVisitsController,
  getDebugLogs,
  clearDebugLogs,
} from '../controllers/debug.controller.js';

const router = Router();

// All debug routes require authentication and administrator role
router.use(authenticate);
router.use(requireRole('administrator'));

// GET /admin/debug/logs - Get debug operation logs (excluded from rate limiting since it's read-only and auto-polled)
router.get('/logs', getDebugLogs);

// Apply 5 second cooldown rate limiting to write operations only
router.use(rateLimit(5000));

// POST /admin/debug/create-tasks
router.post('/create-tasks', createBulkTasks);

// POST /admin/debug/complete-tasks
router.post('/complete-tasks', completeBulkTasks);

// POST /admin/debug/delete-user-data
router.post('/delete-user-data', deleteUserData);

// POST /admin/debug/create-survey
router.post('/create-survey', createSurveyWithRandomParticipants);

// POST /admin/debug/simulate-time-activity
router.post('/simulate-time-activity', simulateTimeActivity);

// POST /admin/debug/simulate-reward-redemption
router.post('/simulate-reward-redemption', simulateRewardRedemptionController);

// POST /admin/debug/reset-user-data
router.post('/reset-user-data', resetUserDataController);

// POST /admin/debug/generate-statistics-data
router.post('/generate-statistics-data', generateStatisticsDataController);

// POST /admin/debug/simulate-forest-visits
router.post('/simulate-forest-visits', simulateForestVisitsController);

// DELETE /admin/debug/logs - Clear debug logs
router.delete('/logs', clearDebugLogs);

export default router;

