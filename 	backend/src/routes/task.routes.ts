import { Router } from 'express';
import multer from 'multer';
import path from 'path';
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
} from '../controllers/task.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'task-photo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.get('/', authenticate, getTasks);
router.get('/:id', getTask);
router.post('/', authenticate, requireRole('administrator'), createTask);
router.put('/:id', authenticate, requireRole('administrator'), updateTask);
router.delete('/:id', authenticate, requireRole('administrator'), deleteTask);
router.post('/:id/complete', authenticate, completeTask);
router.post('/upload', authenticate, upload.single('photo'), uploadPhoto);

export default router;