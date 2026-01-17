import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uploadPhoto,
  uploadVideo,
  uploadThumbnail,
  bulkUpdateTaskStatus,
  bulkDeleteTasks,
} from '../controllers/task.controller.js';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
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
    } else {
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
    } else {
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
    } else {
      cb(new Error('Only PNG and JPG images are allowed'));
    }
  },
});

const router = Router();

router.get('/', authenticate, getTasks);
router.post('/bulk/status', authenticate, requireRole('redaktion', 'administrator'), bulkUpdateTaskStatus);
router.post('/bulk/delete', authenticate, requireRole('redaktion', 'administrator'), bulkDeleteTasks);
router.get('/:id', getTask);
router.post('/', authenticate, requireRole('redaktion', 'administrator'), createTask);
router.put('/:id', authenticate, requireRole('redaktion', 'administrator'), updateTask);
router.delete('/:id', authenticate, requireRole('redaktion', 'administrator'), deleteTask);
router.post('/:id/complete', authenticate, completeTask);
router.post('/upload', authenticate, uploadPhotoMiddleware.single('photo'), uploadPhoto);
router.post(
  '/upload/video',
  authenticate,
  requireRole('redaktion', 'administrator'),
  uploadVideoMiddleware.single('video'),
  uploadVideo
);
router.post(
  '/upload/thumbnail',
  authenticate,
  requireRole('redaktion', 'administrator'),
  uploadThumbnailMiddleware.single('thumbnail'),
  uploadThumbnail
);

export default router;