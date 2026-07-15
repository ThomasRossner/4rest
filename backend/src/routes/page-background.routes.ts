import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { publicUploadFileUrl } from '../services/task.service.js';
import {
  assertPageBackgroundKey,
  getPageBackgroundConfig,
  setPageBackgroundImage,
} from '../services/page-background.service.js';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not ensure upload directory exists:', error);
}

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      try {
        const pageKey = assertPageBackgroundKey(String(req.params.pageKey));
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `page-bg-${pageKey}-${uniqueSuffix}${ext}`);
      } catch (error: unknown) {
        cb(error instanceof Error ? error : new Error('Upload failed'), '');
      }
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    if (!ok) {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'));
      return;
    }
    cb(null, true);
  },
});

function handleUploadError(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  imageUpload.single('image')(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}

export const pageBackgroundPublicRouter = express.Router();

pageBackgroundPublicRouter.get('/', async (_req, res) => {
  try {
    const config = await getPageBackgroundConfig();
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

export const pageBackgroundAdminRouter = express.Router();
pageBackgroundAdminRouter.use(authenticate, requireRole('administrator'));

pageBackgroundAdminRouter.get('/', async (_req, res) => {
  try {
    const config = await getPageBackgroundConfig();
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ error: message });
  }
});

pageBackgroundAdminRouter.post(
  '/:pageKey/upload',
  (req, res, next) => {
    try {
      assertPageBackgroundKey(String(req.params.pageKey));
      next();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Bad request';
      res.status(400).json({ error: message });
    }
  },
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file?.filename) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const pageKey = assertPageBackgroundKey(String(req.params.pageKey));
      const imageUrl = publicUploadFileUrl(req.file.filename);
      const config = await setPageBackgroundImage(pageKey, imageUrl);
      res.json(config);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      res.status(400).json({ error: message });
    }
  }
);

pageBackgroundAdminRouter.delete('/:pageKey', async (req, res) => {
  try {
    const pageKey = assertPageBackgroundKey(String(req.params.pageKey));
    const config = await setPageBackgroundImage(pageKey, null);
    res.json(config);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bad request';
    res.status(400).json({ error: message });
  }
});
