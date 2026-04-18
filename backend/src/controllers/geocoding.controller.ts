import { RequestHandler } from 'express';
import { geocodeAddress, reverseGeocode } from '../services/geocoding.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const geocodeAddressController: RequestHandler = asyncHandler(async (req, res) => {
  const raw = req.body?.address;
  const address =
    typeof raw === 'string' ? raw.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim() : '';

  if (!address) {
    return res.status(400).json({ error: 'Address is required.' });
  }

  try {
    const result = await geocodeAddress(address);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Geocoding failed.' });
  }
});

export const reverseGeocodeController: RequestHandler = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  const lat = Number.parseFloat(String(latitude));
  const lon = Number.parseFloat(String(longitude));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
  }

  try {
    const result = await reverseGeocode(lat, lon);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Reverse geocoding failed.' });
  }
});
