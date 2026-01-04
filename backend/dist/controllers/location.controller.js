import { bulkDeleteLocations, createLocation, deleteLocation, getLocations, setLocationsActiveState, updateLocation, } from '../services/location.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listLocations = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const locations = await getLocations(includeInactive);
    res.json(locations);
});
export const createLocationController = asyncHandler(async (req, res) => {
    const payload = req.body ?? {};
    // Determine is_online from mode
    let is_online;
    if (payload.mode === 'online') {
        is_online = true;
    }
    else if (payload.mode === 'physical') {
        is_online = false;
    }
    else if (payload.is_online !== undefined) {
        // Fallback to explicit is_online if mode is not provided
        is_online = Boolean(payload.is_online);
    }
    else {
        // Default to false if neither mode nor is_online is provided
        is_online = false;
    }
    const location = await createLocation({
        name: payload.name,
        description: payload.description,
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
export const updateLocationController = asyncHandler(async (req, res) => {
    const payload = req.body ?? {};
    // Determine is_online from mode if provided
    let is_online;
    if (payload.mode === 'online') {
        is_online = true;
    }
    else if (payload.mode === 'physical') {
        is_online = false;
    }
    else if (payload.is_online !== undefined) {
        is_online = Boolean(payload.is_online);
    }
    const updateData = {};
    if (payload.name !== undefined)
        updateData.name = payload.name;
    if (payload.description !== undefined)
        updateData.description = payload.description;
    if (is_online !== undefined)
        updateData.is_online = is_online;
    if (payload.address !== undefined)
        updateData.address = payload.address;
    if (payload.latitude !== undefined)
        updateData.latitude = payload.latitude;
    if (payload.longitude !== undefined)
        updateData.longitude = payload.longitude;
    if (payload.active !== undefined)
        updateData.active = payload.active;
    if (payload.category !== undefined)
        updateData.category = payload.category;
    if (payload.categoryDescription !== undefined)
        updateData.category_description = payload.categoryDescription;
    const location = await updateLocation(req.params.id, updateData);
    res.json(location);
});
export const deleteLocationController = asyncHandler(async (req, res) => {
    await deleteLocation(req.params.id);
    res.status(204).send();
});
export const bulkUpdateLocationStatus = asyncHandler(async (req, res) => {
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
export const bulkDeleteLocationController = asyncHandler(async (req, res) => {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of location ids.' });
    }
    await bulkDeleteLocations(ids);
    res.status(204).send();
});
//# sourceMappingURL=location.controller.js.map