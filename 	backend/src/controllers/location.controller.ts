import { RequestHandler } from 'express';
import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from '../services/location.service.js';

export const listLocations: RequestHandler = async (_req, res) => {
  try {
    const locations = await getLocations();
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

    const location = await updateLocation(req.params.id, payload);
    res.json(location);
  } catch (error: any) {
    const message = error?.message || 'Failed to update location.';
    const status =
      message === 'Location not found.' || message.includes('required') || message.includes('must')
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
      message === 'Location not found.' || message.includes('tasks or rewards') ? 400 : 500;
    res.status(status).json({ error: message });
  }
};

