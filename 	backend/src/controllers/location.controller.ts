import { RequestHandler } from 'express';
import {
  bulkDeleteLocations,
  createLocation,
  deleteLocation,
  getLocations,
  setLocationsActiveState,
  updateLocation,
} from '../services/location.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listLocations: RequestHandler = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const locations = await getLocations(includeInactive);
  res.json(locations);
});

export const createLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body ?? {};
  if (payload.mode === 'online') {
    payload.is_online = true;
  }
  if (payload.mode === 'physical') {
    payload.is_online = false;
  }

  const location = await createLocation({
    name: payload.name,
    description: payload.description,
    is_online: payload.is_online,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    active: payload.active !== undefined ? Boolean(payload.active) : true,
    category: payload.category || payload.categoryDescription ? payload.category : null,
    category_description: payload.categoryDescription || null,
  });
  res.status(201).json(location);
});

export const updateLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body ?? {};
  if (payload.mode === 'online') {
    payload.is_online = true;
  }
  if (payload.mode === 'physical') {
    payload.is_online = false;
  }

  const location = await updateLocation(req.params.id, {
    ...payload,
    active: payload.active,
    category: payload.category !== undefined ? payload.category : undefined,
    category_description: payload.categoryDescription !== undefined ? payload.categoryDescription : undefined,
  });
  res.json(location);
});

export const deleteLocationController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteLocation(req.params.id);
  res.status(204).send();
});

export const bulkUpdateLocationStatus: RequestHandler = asyncHandler(async (req, res) => {
  const { ids, active } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide an array of location ids.' });
  }
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Active flag must be a boolean value.' });
  }

  await setLocationsActiveState(ids, active);
  res.status(204).send();
});

export const bulkDeleteLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Provide an array of location ids.' });
  }

  await bulkDeleteLocations(ids);
  res.status(204).send();
});

