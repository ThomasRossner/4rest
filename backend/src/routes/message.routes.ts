import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteMessageHandler,
} from '../controllers/message.controller.js';

const router = Router();

router.get('/', authenticate, getMessages);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/:id/read', authenticate, markAsRead);
router.post('/mark-all-read', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteMessageHandler);

export default router;
