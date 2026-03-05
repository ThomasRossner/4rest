import { RequestHandler } from 'express';
import {
  bulkDeleteLocations,
  createLocation,
  deleteLocation,
  getLocations,
  setLocationsActiveState,
  updateLocation,
} from '../services/location.service.js';
import { getPreferredLanguage } from '../services/user.service.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listLocations: RequestHandler = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const authReq = req as AuthRequest;
  const preferredLanguage = authReq.user?.id ? await getPreferredLanguage(authReq.user.id) : undefined;
  const locations = await getLocations(includeInactive, preferredLanguage ?? undefined);
  res.json(locations);
});

export const createLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body ?? {};
  
  // Determine is_online from mode
  let is_online: boolean;
  if (payload.mode === 'online') {
    is_online = true;
  } else if (payload.mode === 'physical') {
    is_online = false;
  } else if (payload.is_online !== undefined) {
    // Fallback to explicit is_online if mode is not provided
    is_online = Boolean(payload.is_online);
  } else {
    // Default to false if neither mode nor is_online is provided
    is_online = false;
  }

  const location = await createLocation({
    name: payload.name,
    description: payload.description,
    name_i18n: payload.name_i18n,
    description_i18n: payload.description_i18n,
    address_i18n: payload.address_i18n,
    category_description_i18n: payload.category_description_i18n,
    is_online: is_online,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    active: payload.active !== undefined ? Boolean(payload.active) : true,
    category: payload.category ? payload.category : null,
    category_description: payload.categoryDescription || null,
  });
  res.status(201).json(location);
});

export const updateLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const payload = req.body ?? {};
  
  // Determine is_online from mode if provided
  let is_online: boolean | undefined;
  if (payload.mode === 'online') {
    is_online = true;
  } else if (payload.mode === 'physical') {
    is_online = false;
  } else if (payload.is_online !== undefined) {
    is_online = Boolean(payload.is_online);
  }

  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.name_i18n !== undefined) updateData.name_i18n = payload.name_i18n;
  if (payload.description_i18n !== undefined) updateData.description_i18n = payload.description_i18n;
  if (payload.address_i18n !== undefined) updateData.address_i18n = payload.address_i18n;
  if (payload.category_description_i18n !== undefined) updateData.category_description_i18n = payload.category_description_i18n;
  if (is_online !== undefined) updateData.is_online = is_online;
  if (payload.address !== undefined) updateData.address = payload.address;
  if (payload.latitude !== undefined) updateData.latitude = payload.latitude;
  if (payload.longitude !== undefined) updateData.longitude = payload.longitude;
  if (payload.active !== undefined) updateData.active = payload.active;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.categoryDescription !== undefined) updateData.category_description = payload.categoryDescription;

  const location = await updateLocation(req.params.id, updateData);
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

