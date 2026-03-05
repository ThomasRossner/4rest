import { getPool } from '../database/connection.js';
import { resolveI18n } from '../utils/i18n.js';

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
  name_i18n?: Record<string, string>;
  description_i18n?: Record<string, string>;
  address_i18n?: Record<string, string>;
  category_description_i18n?: Record<string, string>;
}

interface LocationInput {
  name: string;
  description?: string | null;
  name_i18n?: Record<string, string>;
  description_i18n?: Record<string, string>;
  address_i18n?: Record<string, string>;
  category_description_i18n?: Record<string, string>;
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
  name_i18n?: Record<string, string> | null;
  description_i18n?: Record<string, string> | null;
  address_i18n?: Record<string, string> | null;
  category_description_i18n?: Record<string, string> | null;
  is_online?: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  category_description?: string | null;
}

const SELECT_FIELDS =
  'id, name, description, is_online, address, latitude, longitude, active, category, category_description, created_at, updated_at, name_i18n, description_i18n, address_i18n, category_description_i18n';

function mapLocation(row: any, lang?: 'de' | 'en'): Location {
  if (!row) return row;
  const name = lang ? resolveI18n(row.name_i18n, lang, row.name) : row.name;
  const description = lang ? resolveI18n(row.description_i18n, lang, row.description) : row.description;
  const address = lang ? resolveI18n(row.address_i18n, lang, row.address) : row.address;
  const category_description = lang ? resolveI18n(row.category_description_i18n, lang, row.category_description) : (row.category_description ?? null);
  return {
    id: row.id,
    name,
    description,
    is_online: row.is_online,
    address,
    latitude: row.latitude !== null ? Number(row.latitude) : row.latitude,
    longitude: row.longitude !== null ? Number(row.longitude) : row.longitude,
    active: row.active,
    category: row.category ?? null,
    category_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(lang ? {} : { name_i18n: row.name_i18n, description_i18n: row.description_i18n, address_i18n: row.address_i18n, category_description_i18n: row.category_description_i18n }),
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
    // For online locations, address, latitude, and longitude must be null
    if (!partial) {
      normalized.address = null;
      normalized.latitude = null;
      normalized.longitude = null;
    } else {
      if (data.address !== undefined) normalized.address = null;
      if (data.latitude !== undefined) normalized.latitude = null;
      if (data.longitude !== undefined) normalized.longitude = null;
    }
  } else if (isOnline === false) {
    // For physical locations, address, latitude, and longitude are required
    if (!partial) {
      // Always set these fields for create operations
      const address = typeof data.address === 'string' ? data.address.trim() : '';
      if (!address) {
        throw new Error('Address is required for physical locations.');
      }
      normalized.address = address;
      
      if (data.latitude === undefined && data.longitude === undefined) {
        throw new Error('Latitude and longitude are required for physical locations.');
      }
      normalized.latitude = parseCoordinate(data.latitude, 'latitude');
      normalized.longitude = parseCoordinate(data.longitude, 'longitude');
    } else {
      // For update operations, only set if provided
      if (data.address !== undefined) {
        const address = typeof data.address === 'string' ? data.address.trim() : '';
        if (!address) {
          throw new Error('Address is required for physical locations.');
        }
        normalized.address = address;
      }
      if (data.latitude !== undefined) {
        normalized.latitude = parseCoordinate(data.latitude, 'latitude');
      }
      if (data.longitude !== undefined) {
        normalized.longitude = parseCoordinate(data.longitude, 'longitude');
      }
    }
  }

  return normalized;
}

export async function getLocations(includeInactive = false, preferredLanguage?: string): Promise<Location[]> {
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
  const lang = preferredLanguage === 'en' ? 'en' : preferredLanguage === 'de' ? 'de' : undefined;
  return result.rows.map((row) => mapLocation(row, lang));
}

export async function getLocationById(id: string, preferredLanguage?: string): Promise<Location | null> {
  const db = getPool();
  const result = await db.query(`SELECT ${SELECT_FIELDS} FROM locations WHERE id = $1`, [id]);
  const lang = preferredLanguage === 'en' ? 'en' : preferredLanguage === 'de' ? 'de' : undefined;
  return mapLocation(result.rows[0], lang) || null;
}

export async function createLocation(data: LocationInput & { active?: boolean }): Promise<Location> {
  const db = getPool();
  const payload = normalizeLocationInput(data);
  const nameI18n = data.name_i18n && typeof data.name_i18n === 'object' ? data.name_i18n : { de: payload.name ?? '', en: payload.name ?? '' };
  const descI18n = data.description_i18n && typeof data.description_i18n === 'object' ? data.description_i18n : { de: payload.description ?? '', en: payload.description ?? '' };
  const addrI18n = data.address_i18n && typeof data.address_i18n === 'object' ? data.address_i18n : { de: payload.address ?? '', en: payload.address ?? '' };
  const catDescI18n = data.category_description_i18n && typeof data.category_description_i18n === 'object' ? data.category_description_i18n : { de: payload.category_description ?? '', en: payload.category_description ?? '' };

  const result = await db.query(
    `INSERT INTO locations (name, description, is_online, address, latitude, longitude, active, category, category_description, name_i18n, description_i18n, address_i18n, category_description_i18n)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      JSON.stringify(nameI18n),
      JSON.stringify(descI18n),
      JSON.stringify(addrI18n),
      JSON.stringify(catDescI18n),
    ]
  );

  return mapLocation(result.rows[0]);
}

export async function updateLocation(
  id: string,
  data: LocationUpdateInput & { active?: boolean }
): Promise<Location> {
  const db = getPool();
  const existing = await getLocationById(id, undefined);
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
  const updates: string[] = [
    'name = $1', 'description = $2', 'is_online = $3', 'address = $4', 'latitude = $5', 'longitude = $6',
    'active = $7', 'category = $8', 'category_description = $9', 'updated_at = CURRENT_TIMESTAMP',
  ];
  const values: any[] = [
    payload.name,
    payload.description ?? null,
    payload.is_online,
    payload.address ?? null,
    payload.latitude ?? null,
    payload.longitude ?? null,
    data.active ?? existing.active,
    payload.category ?? null,
    payload.category_description ?? null,
  ];
  let idx = 10;
  if (data.name_i18n !== undefined && data.name_i18n !== null && typeof data.name_i18n === 'object') {
    updates.push(`name_i18n = $${idx}`);
    values.push(JSON.stringify(data.name_i18n));
    idx++;
  }
  if (data.description_i18n !== undefined && data.description_i18n !== null && typeof data.description_i18n === 'object') {
    updates.push(`description_i18n = $${idx}`);
    values.push(JSON.stringify(data.description_i18n));
    idx++;
  }
  if (data.address_i18n !== undefined && data.address_i18n !== null && typeof data.address_i18n === 'object') {
    updates.push(`address_i18n = $${idx}`);
    values.push(JSON.stringify(data.address_i18n));
    idx++;
  }
  if (data.category_description_i18n !== undefined && data.category_description_i18n !== null && typeof data.category_description_i18n === 'object') {
    updates.push(`category_description_i18n = $${idx}`);
    values.push(JSON.stringify(data.category_description_i18n));
    idx++;
  }
  values.push(id);

  const result = await db.query(
    `UPDATE locations SET ${updates.join(', ')} WHERE id = $${idx} RETURNING ${SELECT_FIELDS}`,
    values
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

