import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  getOnboardingConfig,
  setOnboardingConfig,
  validateOnboardingConfig,
} from '../services/onboarding-config.service.js';
import { publicUploadFileUrl } from '../services/task.service.js';

/** Gleiches Verzeichnis wie Aufgaben-Medien (`UPLOAD_DIR` / `uploads/`). */
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not ensure upload directory exists:', e);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'onboarding-bg-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    if (!ok) {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'));
      return;
    }
    cb(null, true);
  },
});

/** Öffentlich: Konfiguration für Gäste (ohne Auth) */
export const onboardingPublicRouter = express.Router();

onboardingPublicRouter.get('/config', async (req, res) => {
  try {
    const config = await getOnboardingConfig();
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

/** Admin: Onboarding bearbeiten + Hintergrundbild-Upload */
export const onboardingAdminRouter = express.Router();
onboardingAdminRouter.use(authenticate, requireRole('administrator'));

onboardingAdminRouter.get('/config', async (_req, res) => {
  try {
    const config = await getOnboardingConfig();
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

onboardingAdminRouter.put('/config', async (req, res) => {
  try {
    const validated = validateOnboardingConfig(req.body);
    await setOnboardingConfig(validated);
    const config = await getOnboardingConfig();
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});

onboardingAdminRouter.post(
  '/upload-background',
  (req, res, next) => {
    upload.single('image')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file?.filename) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const url = publicUploadFileUrl(req.file.filename);
    res.json({ url });
  }
);
