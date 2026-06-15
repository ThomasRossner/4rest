import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  bulkDeleteLocationController,
  bulkUpdateLocationStatus,
  createLocationController,
  deleteLocationController,
  listLocations,
  updateLocationController,
  uploadLocationImage,
} from '../controllers/location.controller.js';
import {
  geocodeAddressController,
  reverseGeocodeController,
} from '../controllers/geocoding.controller.js';

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not ensure upload directory exists:', e);
}

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'location-image-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadImageMiddleware = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG and WEBP images are allowed'));
    }
  },
});

const router = Router();

router.use(authenticate, requireRole('redaktion', 'administrator'));

router.get('/', listLocations);
router.post('/', createLocationController);
router.post('/upload/image', uploadImageMiddleware.single('image'), uploadLocationImage);
router.post('/bulk/status', bulkUpdateLocationStatus);
router.post('/bulk/delete', bulkDeleteLocationController);
router.put('/:id', updateLocationController);
router.delete('/:id', deleteLocationController);

// Geocoding endpoints
router.post('/geocode', geocodeAddressController);
router.post('/reverse-geocode', reverseGeocodeController);

export default router;

