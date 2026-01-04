import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  bulkDeleteLocationController,
  bulkUpdateLocationStatus,
  createLocationController,
  deleteLocationController,
  listLocations,
  updateLocationController,
} from '../controllers/location.controller.js';
import {
  geocodeAddressController,
  reverseGeocodeController,
} from '../controllers/geocoding.controller.js';

const router = Router();

router.use(authenticate, requireRole('administrator'));

router.get('/', listLocations);
router.post('/', createLocationController);
router.post('/bulk/status', bulkUpdateLocationStatus);
router.post('/bulk/delete', bulkDeleteLocationController);
router.put('/:id', updateLocationController);
router.delete('/:id', deleteLocationController);

// Geocoding endpoints
router.post('/geocode', geocodeAddressController);
router.post('/reverse-geocode', reverseGeocodeController);

export default router;

