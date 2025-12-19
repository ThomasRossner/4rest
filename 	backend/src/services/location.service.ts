import { getPool } from '../database/connection.js';

export interface Location {
  id: string;
  name: string;
  description: string | null;
  is_online: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  category?: string | null;
  category_description?: string | null;
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
  active?: boolean;
  category?: string | null;
  category_description?: string | null;
}

interface LocationUpdateInput {
  name?: string;
  description?: string | null;
  is_online?: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  category_description?: string | null;
}

const SELECT_FIELDS =
  'id, name, description, is_online, address, latitude, longitude, active, category, category_description, created_at, updated_at';

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
    active: row.active,
    category: row.category ?? null,
    category_description: row.category_description ?? null,
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

const VALID_CATEGORIES = ['online', 'hotel_reception', 'hotel_restaurant', 'external', 'physical'];

function validateCategory(category: string | null | undefined): string | null {
  if (category === null || category === undefined || category === '') {
    return null;
  }
  const trimmed = category.trim();
  if (trimmed && !VALID_CATEGORIES.includes(trimmed)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  return trimmed || null;
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

  if (!partial || data.category !== undefined) {
    normalized.category = validateCategory(data.category);
  }

  if (!partial || data.category_description !== undefined) {
    const catDesc =
      data.category_description === null || data.category_description === undefined
        ? null
        : typeof data.category_description === 'string'
        ? data.category_description.trim() || null
        : String(data.category_description).trim() || null;
    normalized.category_description = catDesc;
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

export async function getLocations(includeInactive = false): Promise<Location[]> {
  const db = getPool();
  const clauses: string[] = [];
  if (!includeInactive) {
    clauses.push('active = TRUE');
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await db.query(
    `SELECT ${SELECT_FIELDS} FROM locations ${where} ORDER BY name ASC`,
    []
  );
  return result.rows.map(mapLocation);
}

export async function getLocationById(id: string): Promise<Location | null> {
  const db = getPool();
  const result = await db.query(`SELECT ${SELECT_FIELDS} FROM locations WHERE id = $1`, [id]);
  return mapLocation(result.rows[0]) || null;
}

export async function createLocation(data: LocationInput & { active?: boolean }): Promise<Location> {
  const db = getPool();
  const payload = normalizeLocationInput(data);

  const result = await db.query(
    `INSERT INTO locations (name, description, is_online, address, latitude, longitude, active, category, category_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${SELECT_FIELDS}`,
    [
      payload.name,
      payload.description ?? null,
      payload.is_online,
      payload.address ?? null,
      payload.latitude ?? null,
      payload.longitude ?? null,
      data.active ?? true,
      payload.category ?? null,
      payload.category_description ?? null,
    ]
  );

  return mapLocation(result.rows[0]);
}

export async function updateLocation(
  id: string,
  data: LocationUpdateInput & { active?: boolean }
): Promise<Location> {
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
    category: data.category !== undefined ? data.category : existing.category ?? null,
    category_description: data.category_description !== undefined ? data.category_description : existing.category_description ?? null,
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
         active = $7,
         category = $8,
         category_description = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING ${SELECT_FIELDS}`,
    [
      payload.name,
      payload.description ?? null,
      payload.is_online,
      payload.address ?? null,
      payload.latitude ?? null,
      payload.longitude ?? null,
      data.active ?? existing.active,
      payload.category ?? null,
      payload.category_description ?? null,
      id,
    ]
  );

  return mapLocation(result.rows[0]);
}

export async function setLocationsActiveState(ids: string[], active: boolean): Promise<void> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  await db.query(
    'UPDATE locations SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::uuid[])',
    [active, ids]
  );
}

export async function bulkDeleteLocations(ids: string[]): Promise<void> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }
  const db = getPool();
  try {
    await db.query('DELETE FROM locations WHERE id = ANY($1::uuid[])', [ids]);
  } catch (error: any) {
    if (error.code === '23503') {
      throw new Error('Cannot delete locations because some are used by tasks or rewards.');
    }
    throw error;
  }
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

