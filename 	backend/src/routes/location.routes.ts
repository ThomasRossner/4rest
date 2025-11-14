import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  createLocationController,
  deleteLocationController,
  listLocations,
  updateLocationController,
} from '../controllers/location.controller.js';

const router = Router();

router.use(authenticate, requireRole('administrator'));

router.get('/', listLocations);
router.post('/', createLocationController);
router.put('/:id', updateLocationController);
router.delete('/:id', deleteLocationController);

export default router;

