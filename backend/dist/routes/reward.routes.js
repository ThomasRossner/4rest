import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getRewards, redeemReward, verifyQrCode, getRewardInfoFromQr, redeemRewardQrCode, createReward, getRewardTemplates, updateReward, bulkUpdateRewardStatus, bulkDeleteRewardsController, generatePointsBonusQrCode, redeemPointsBonusQrCode, getRedemptionStatusController, uploadThumbnail, } from '../controllers/reward.controller.js';
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'reward-thumbnail-' + uniqueSuffix + path.extname(file.originalname));
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
router.get('/templates', authenticate, requireRole('administrator'), getRewardTemplates);
router.post('/', authenticate, requireRole('administrator'), createReward);
router.post('/bulk/status', authenticate, requireRole('administrator'), bulkUpdateRewardStatus);
router.post('/bulk/delete', authenticate, requireRole('administrator'), bulkDeleteRewardsController);
router.post('/verify-qr', authenticate, requireRole('employee', 'administrator'), verifyQrCode);
router.post('/get-reward-info', authenticate, requireRole('employee', 'administrator'), getRewardInfoFromQr);
router.post('/redeem-qr', authenticate, requireRole('employee'), redeemRewardQrCode);
router.get('/redemption-status', authenticate, getRedemptionStatusController);
// Points bonus routes must come before /:id routes to avoid route conflicts
router.post('/points-bonus/generate', authenticate, requireRole('employee', 'administrator'), generatePointsBonusQrCode);
router.post('/points-bonus/redeem', authenticate, redeemPointsBonusQrCode);
// Parametrized routes must come last
router.put('/:id', authenticate, requireRole('administrator'), updateReward);
router.post('/:id/redeem', authenticate, redeemReward);
router.post('/upload/thumbnail', authenticate, requireRole('administrator'), uploadThumbnailMiddleware.single('thumbnail'), uploadThumbnail);
export default router;
//# sourceMappingURL=reward.routes.js.map