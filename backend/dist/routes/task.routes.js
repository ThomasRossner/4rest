import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getTasks, getTask, listPublicGuestTasks, getPublicTask, completePublicTask, createTask, updateTask, deleteTask, completeTask, submitQuizAnswer, uploadPhoto, uploadVideo, uploadThumbnail, bulkUpdateTaskStatus, bulkDeleteTasks, approvePhotoTask, rejectPhotoTask, getPendingPhotoTasks, getGallery, getTaskQrCode, } from '../controllers/task.controller.js';
import { publicTaskRateLimit } from '../middleware/publicTaskRateLimit.js';
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}
catch (e) {
    console.warn('Could not ensure upload directory exists:', e);
}
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'task-photo-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const uploadPhotoMiddleware = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const parsedVideoSize = Number.parseInt(process.env.VIDEO_UPLOAD_MAX_MB || '200', 10);
const maxVideoSizeMb = Number.isNaN(parsedVideoSize) ? 200 : Math.max(1, parsedVideoSize);
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = 'task-video-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    },
});
const uploadVideoMiddleware = multer({
    storage: videoStorage,
    limits: { fileSize: maxVideoSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed'));
        }
    },
});
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = 'task-thumbnail-' + uniqueSuffix + path.extname(file.originalname);
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
router.get('/public', publicTaskRateLimit, listPublicGuestTasks);
router.get('/public/:id', publicTaskRateLimit, getPublicTask);
router.post('/public/:id/complete', publicTaskRateLimit, completePublicTask);
router.get('/', authenticate, getTasks);
router.post('/bulk/status', authenticate, requireRole('redaktion', 'administrator'), bulkUpdateTaskStatus);
router.post('/bulk/delete', authenticate, requireRole('redaktion', 'administrator'), bulkDeleteTasks);
// Specific routes must come BEFORE the generic /:id route
router.post('/approve-photo', authenticate, requireRole('administrator', 'rezeption'), approvePhotoTask);
router.post('/reject-photo', authenticate, requireRole('administrator', 'rezeption'), rejectPhotoTask);
router.get('/pending-photos', authenticate, requireRole('administrator', 'rezeption'), getPendingPhotoTasks);
router.get('/gallery', authenticate, getGallery);
router.post('/upload', authenticate, uploadPhotoMiddleware.single('photo'), uploadPhoto);
router.post('/upload/video', authenticate, requireRole('redaktion', 'administrator'), uploadVideoMiddleware.single('video'), uploadVideo);
router.post('/upload/thumbnail', authenticate, requireRole('redaktion', 'administrator'), uploadThumbnailMiddleware.single('thumbnail'), uploadThumbnail);
// Generic routes must come AFTER specific routes
// IMPORTANT: must be authenticated to resolve preferred language (i18n)
router.get('/:id', authenticate, getTask);
router.get('/:id/qr-code', authenticate, requireRole('redaktion', 'administrator'), getTaskQrCode);
router.post('/', authenticate, requireRole('redaktion', 'administrator'), createTask);
router.put('/:id', authenticate, requireRole('redaktion', 'administrator'), updateTask);
router.delete('/:id', authenticate, requireRole('redaktion', 'administrator'), deleteTask);
router.post('/:id/quiz/answer', authenticate, submitQuizAnswer);
router.post('/:id/complete', authenticate, completeTask);
export default router;
//# sourceMappingURL=task.routes.js.map