import {
  USER_ROLES,
  USER_TYPES,
  HOTEL_IDS,
  REWARD_TYPES,
  UserRole,
  UserType,
  HotelId,
  RewardType,
} from '../constants/enums.js';

type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';

/**
 * Validates and normalizes an array of user roles
 */
export function validateRoleArray(values?: string[] | null): UserRole[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(USER_ROLES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid roles: ${invalid.join(', ')}`);
  }
  return values as UserRole[];
}

/**
 * Validates and normalizes an array of user types
 */
export function validateUserTypeArray(values?: string[] | null): UserType[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(USER_TYPES as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid user types: ${invalid.join(', ')}`);
  }
  return values as UserType[];
}

/**
 * Validates and normalizes an array of hotel IDs
 */
export function validateHotelIdArray(values?: string[] | null): HotelId[] {
  if (!values) return [];
  const invalid = values.filter((value) => !(HOTEL_IDS as readonly string[]).includes(value));
  if (invalid.length) {
    throw new Error(`Invalid hotel IDs: ${invalid.join(', ')}`);
  }
  return values as HotelId[];
}

/**
 * Validates a reward type
 */
export function validateRewardType(value?: string | null): RewardType {
  if (!value) {
    throw new Error('Reward type is required.');
  }
  if (!(REWARD_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Invalid reward type: ${value}`);
  }
  return value as RewardType;
}

/**
 * Validates and normalizes a recurrence value
 */
export function validateRecurrence(value?: string | null): Recurrence {
  if (!value) return 'once';
  const validValues: Recurrence[] = ['once', 'daily', 'weekly', 'monthly'];
  if (!validValues.includes(value as Recurrence)) {
    throw new Error(`Invalid recurrence: ${value}. Must be one of: ${validValues.join(', ')}`);
  }
  return value as Recurrence;
}

/**
 * Normalizes points cost to a number, ensuring it's non-negative
 */
export function normalizePointsCost(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    throw new Error('pointsCost must be zero or greater.');
  }
  const parsed =
    typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('pointsCost must be zero or greater.');
  }
  return parsed;
}

/**
 * Validates a URL string
 */
export function validateUrl(url: string | null | undefined, fieldName = 'URL'): string | null {
  if (!url || url.trim() === '') {
    return null;
  }
  try {
    const urlObj = new URL(url.trim());
    // Ensure it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error(`${fieldName} must use http or https protocol`);
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid ${fieldName}: ${error instanceof Error ? error.message : 'Invalid URL format'}`);
  }
}

/**
 * Validates GPS coordinates (latitude and longitude)
 */
export function validateGpsCoordinates(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined
): { lat: number; lng: number } | null {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  
  const lat = typeof latitude === 'string' ? Number.parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? Number.parseFloat(longitude) : longitude;
  
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('GPS coordinates must be valid numbers');
  }
  
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  
  return { lat, lng };
}

/**
 * Validates QR code format (basic validation - alphanumeric and common special chars)
 */
export function validateQrCode(qrCode: string | null | undefined): string | null {
  if (!qrCode || qrCode.trim() === '') {
    return null;
  }
  const trimmed = qrCode.trim();
  // QR codes can contain alphanumeric and common special characters
  // Basic validation: at least 1 character, max 255 characters (database limit)
  if (trimmed.length === 0) {
    throw new Error('QR code cannot be empty');
  }
  if (trimmed.length > 255) {
    throw new Error('QR code must be 255 characters or less');
  }
  return trimmed;
}

