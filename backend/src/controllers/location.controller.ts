import { RequestHandler } from 'express';
import {
  bulkDeleteLocations,
  createLocation,
  deleteLocation,
  getLocations,
  setLocationsActiveState,
  updateLocation,
} from '../services/location.service.js';

export const listLocations: RequestHandler = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const locations = await getLocations(includeInactive);
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLocationController: RequestHandler = async (req, res) => {
  try {
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
    });
    res.status(201).json(location);
  } catch (error: any) {
    const message = error?.message || 'Failed to create location.';
    const status = message.includes('required') || message.includes('must') ? 400 : 500;
    res.status(status).json({ error: message });
  }
};

export const updateLocationController: RequestHandler = async (req, res) => {
  try {
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
    });
    res.json(location);
  } catch (error: any) {
    const message = error?.message || 'Failed to update location.';
    const status =
      message === 'Location not found.'
        ? 404
        : message.includes('required') || message.includes('must')
        ? 400
        : 500;
    res.status(status).json({ error: message });
  }
};

export const deleteLocationController: RequestHandler = async (req, res) => {
  try {
    await deleteLocation(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    const message = error?.message || 'Failed to delete location.';
    const status =
      message === 'Location not found.' ? 404 : message.includes('tasks or rewards') ? 400 : 500;
    res.status(status).json({ error: message });
  }
};

export const bulkUpdateLocationStatus: RequestHandler = async (req, res) => {
  try {
    const { ids, active } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of location ids.' });
    }
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }

    await setLocationsActiveState(ids, active);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteLocationController: RequestHandler = async (req, res) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of location ids.' });
    }

    await bulkDeleteLocations(ids);
    res.status(204).send();
  } catch (error: any) {
    const message = error?.message || 'Failed to delete locations.';
    const status = message.includes('tasks or rewards') ? 400 : 500;
    res.status(status).json({ error: message });
  }
};

