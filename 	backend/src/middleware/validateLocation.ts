import { Request, Response, NextFunction } from 'express';
import { getLocationById } from '../services/location.service.js';

/**
 * Middleware to validate locationId in request body
 * Extracts location validation logic from controllers (SOLID - Single Responsibility)
 */
export async function validateLocation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const locationId = req.body.locationId ?? req.body.location_id;

  if (locationId === undefined) {
    // Location ID is optional for updates, so continue
    return next();
  }

  if (!locationId || typeof locationId !== 'string') {
    res.status(400).json({ error: 'locationId must be a valid string.' });
    return;
  }

  const location = await getLocationById(locationId);
  if (!location) {
    res.status(400).json({ error: 'Invalid locationId.' });
    return;
  }

  // Attach validated location ID to request body
  req.body.location_id = location.id;
  next();
}

