import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getUserQrCode,
  scanUserQrCode,
} from '../controllers/user-qr.controller.js';

const router = Router();

router.get('/', authenticate, getUserQrCode);
router.post('/scan', authenticate, scanUserQrCode);

export default router;

