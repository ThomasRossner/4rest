import { getPool } from '../database/connection.js';

export interface Location {
  id: string;
  name: string;
  description: string | null;
  is_online: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
  updated_at?: string;
}

interface LocationInput {
  name: string;
  description?: string | null;
  is_online: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationUpdateInput {
  name?: string;
  description?: string | null;
  is_online?: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const SELECT_FIELDS =
  'id, name, description, is_online, address, latitude, longitude, created_at, updated_at';

function mapLocation(row: any): Location {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    is_online: row.is_online,
    address: row.address,
    latitude: row.latitude !== null ? Number(row.latitude) : row.latitude,
    longitude: row.longitude !== null ? Number(row.longitude) : row.longitude,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseCoordinate(value: unknown, field: string): number {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${field} is required for physical locations.`);
  }
  const numeric =
    typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : NaN;
  if (!Number.isFinite(numeric)) {
    throw new Error(`${field} must be a valid number.`);
  }
  if (field === 'latitude' && (numeric < -90 || numeric > 90)) {
    throw new Error('Latitude must be between -90 and 90.');
  }
  if (field === 'longitude' && (numeric < -180 || numeric > 180)) {
    throw new Error('Longitude must be between -180 and 180.');
  }
  return Number(numeric.toFixed(6));
}

function normalizeLocationInput(
  data: LocationInput | LocationUpdateInput,
  { partial = false }: { partial?: boolean } = {}
) {
  const normalized: any = {};

  if (!partial || data.name !== undefined) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name) {
      throw new Error('Location name is required.');
    }
    normalized.name = name;
  }

  if (!partial || data.description !== undefined) {
    const desc =
      data.description === null || data.description === undefined
        ? ''
        : data.description.toString().trim();
    if (!desc) {
      throw new Error('Location description is required.');
    }
    normalized.description = desc;
  }

  if (!partial || data.is_online !== undefined) {
    if (typeof data.is_online !== 'boolean') {
      throw new Error('is_online must be a boolean value.');
    }
    normalized.is_online = data.is_online;
  }

  const isOnline = normalized.is_online ?? data.is_online;

  if (isOnline === true) {
    if (!partial || data.address !== undefined) {
      normalized.address = null;
    }
    if (!partial || data.latitude !== undefined) {
      normalized.latitude = null;
    }
    if (!partial || data.longitude !== undefined) {
      normalized.longitude = null;
    }
  } else if (isOnline === false) {
    if (!partial || data.address !== undefined) {
      const address = typeof data.address === 'string' ? data.address.trim() : '';
      if (!address) {
        throw new Error('Address is required for physical locations.');
      }
      normalized.address = address;
    }
    if (!partial || data.latitude !== undefined) {
      normalized.latitude = parseCoordinate(
        data.latitude ?? normalized.latitude,
        'latitude'
      );
    }
    if (!partial || data.longitude !== undefined) {
      normalized.longitude = parseCoordinate(
        data.longitude ?? normalized.longitude,
        'longitude'
      );
    }
  }

  return normalized;
}

export async function getLocations(): Promise<Location[]> {
  const db = getPool();
  const result = await db.query(`SELECT ${SELECT_FIELDS} FROM locations ORDER BY name ASC`);
  return result.rows.map(mapLocation);
}

export async function getLocationById(id: string): Promise<Location | null> {
  const db = getPool();
  const result = await db.query(`SELECT ${SELECT_FIELDS} FROM locations WHERE id = $1`, [id]);
  return mapLocation(result.rows[0]) || null;
}

export async function createLocation(data: LocationInput): Promise<Location> {
  const db = getPool();
  const payload = normalizeLocationInput(data);

  const result = await db.query(
    `INSERT INTO locations (name, description, is_online, address, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SELECT_FIELDS}`,
    [
      payload.name,
      payload.description ?? null,
      payload.is_online,
      payload.address ?? null,
      payload.latitude ?? null,
      payload.longitude ?? null,
    ]
  );

  return mapLocation(result.rows[0]);
}

export async function updateLocation(id: string, data: LocationUpdateInput): Promise<Location> {
  const db = getPool();
  const existing = await getLocationById(id);
  if (!existing) {
    throw new Error('Location not found.');
  }

  const mergedInput: LocationInput = {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    is_online: data.is_online !== undefined ? data.is_online : existing.is_online,
    address: data.address !== undefined ? data.address : existing.address,
    latitude: data.latitude !== undefined ? data.latitude : existing.latitude,
    longitude: data.longitude !== undefined ? data.longitude : existing.longitude,
  };

  const payload = normalizeLocationInput(mergedInput);

  const result = await db.query(
    `UPDATE locations
     SET name = $1,
         description = $2,
         is_online = $3,
         address = $4,
         latitude = $5,
         longitude = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING ${SELECT_FIELDS}`,
    [
      payload.name,
      payload.description ?? null,
      payload.is_online,
      payload.address ?? null,
      payload.latitude ?? null,
      payload.longitude ?? null,
      id,
    ]
  );

  return mapLocation(result.rows[0]);
}

export async function deleteLocation(id: string): Promise<void> {
  const db = getPool();
  try {
    const result = await db.query('DELETE FROM locations WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('Location not found.');
    }
  } catch (error: any) {
    if (error.code === '23503') {
      throw new Error('Cannot delete location because it is used by tasks or rewards.');
    }
    throw error;
  }
}

