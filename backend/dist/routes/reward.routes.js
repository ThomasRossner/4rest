import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getRewards, redeemReward, verifyQrCode, getRewardInfoFromQr, redeemRewardQrCode, createReward, getRewardTemplates, updateReward, bulkUpdateRewardStatus, bulkDeleteRewardsController, generatePointsBonusQrCode, redeemPointsBonusQrCode, getRedemptionStatusController, uploadThumbnail, } from '../controllers/reward.controller.js';
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'reward.routes.ts:uploadDir', message: 'Upload directory check', data: { uploadDir, exists: fs.existsSync(uploadDir), cwd: process.cwd(), envUploadDir: process.env.UPLOAD_DIR }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
}
catch (e) {
    console.warn('Could not ensure upload directory exists:', e);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'reward.routes.ts:uploadDir', message: 'Upload directory creation failed', data: { uploadDir, error: String(e) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
}
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // #region agent log
        console.log('[DEBUG] reward.routes.ts:thumbnailStorage.destination - Reward thumbnail storage destination', JSON.stringify({ uploadDir, exists: fs.existsSync(uploadDir) }));
        // #endregion
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = 'reward-thumbnail-' + uniqueSuffix + path.extname(file.originalname);
        // #region agent log
        console.log('[DEBUG] reward.routes.ts:thumbnailStorage.filename - Reward thumbnail filename generated', JSON.stringify({ filename, uploadDir, fullPath: path.join(uploadDir, filename) }));
        // #endregion
        cb(null, filename);
    },
});
const uploadThumbnailMiddleware = multer({
    storage: thumbnailStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PNG and JPG images are allowed'));
        }
    },
});
const router = Router();
router.get('/', authenticate, getRewards);
router.get('/templates', authenticate, requireRole('redaktion', 'administrator'), getRewardTemplates);
router.post('/', authenticate, requireRole('redaktion', 'administrator'), createReward);
router.post('/bulk/status', authenticate, requireRole('redaktion', 'administrator'), bulkUpdateRewardStatus);
router.post('/bulk/delete', authenticate, requireRole('redaktion', 'administrator'), bulkDeleteRewardsController);
router.post('/verify-qr', authenticate, requireRole('rezeption', 'administrator'), verifyQrCode);
router.post('/get-reward-info', authenticate, requireRole('rezeption', 'administrator'), getRewardInfoFromQr);
router.post('/redeem-qr', authenticate, requireRole('rezeption'), redeemRewardQrCode);
router.get('/redemption-status', authenticate, getRedemptionStatusController);
// Points bonus routes must come before /:id routes to avoid route conflicts
router.post('/points-bonus/generate', authenticate, requireRole('rezeption', 'administrator'), generatePointsBonusQrCode);
router.post('/points-bonus/redeem', authenticate, redeemPointsBonusQrCode);
// Parametrized routes must come last
router.put('/:id', authenticate, requireRole('redaktion', 'administrator'), updateReward);
router.post('/:id/redeem', authenticate, redeemReward);
router.post('/upload/thumbnail', authenticate, requireRole('redaktion', 'administrator'), uploadThumbnailMiddleware.single('thumbnail'), uploadThumbnail);
export default router;
//# sourceMappingURL=reward.routes.js.map