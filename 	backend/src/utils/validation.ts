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

