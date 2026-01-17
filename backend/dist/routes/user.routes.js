import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getMe, getUserProgress, getUserProfile, updateUserProfile, listUsers, getUserDetails, updateUserRole, updateUserPoints, toggleUserActive, resetUserPassword, setUserPassword, deleteUser, getUserStatistics, getUserTimeline, createUserByAdmin, } from '../controllers/user.controller.js';
const router = Router();
// Public routes (authenticated users)
router.get('/me', authenticate, getMe);
router.get('/:id/progress', authenticate, getUserProgress);
router.get('/:id/timeline', authenticate, getUserTimeline);
router.get('/:id/profile', authenticate, getUserProfile);
router.put('/:id/profile', authenticate, updateUserProfile);
// Admin-only routes
router.get('/', authenticate, requireRole('administrator', 'redaktion'), listUsers);
router.post('/', authenticate, requireRole('administrator'), createUserByAdmin);
router.get('/:id', authenticate, requireRole('administrator'), getUserDetails);
router.put('/:id/role', authenticate, requireRole('administrator'), updateUserRole);
router.put('/:id/points', authenticate, requireRole('administrator'), updateUserPoints);
router.post('/:id/toggle-active', authenticate, requireRole('administrator'), toggleUserActive);
router.post('/:id/reset-password', authenticate, requireRole('administrator'), resetUserPassword);
router.post('/:id/set-password', authenticate, requireRole('administrator'), setUserPassword);
router.delete('/:id', authenticate, requireRole('administrator'), deleteUser);
router.get('/:id/statistics', authenticate, requireRole('administrator'), getUserStatistics);
export default router;
//# sourceMappingURL=user.routes.js.map