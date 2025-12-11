import { UserRole, UserType, HotelId, HOTEL_IDS } from '../constants/enums.js';

export interface AudienceFilterOptions {
  userRole?: UserRole | null;
  userType?: UserType | null;
  hotelId?: HotelId | null;
  applyFilters?: boolean;
}

/**
 * Builds SQL WHERE clauses for audience filtering (roles, user types, hotel IDs)
 * Used by both tasks and rewards services (DRY principle)
 */
export function buildAudienceFilterClauses(
  options: AudienceFilterOptions,
  params: any[],
  paramIndex: { current: number }
): string[] {
  const clauses: string[] = [];
  const { userRole, userType, hotelId, applyFilters = true } = options;

  if (!applyFilters) {
    return clauses;
  }

  // Role filter
  if (userRole) {
    clauses.push(
      `(allowed_roles IS NULL OR COALESCE(array_length(allowed_roles, 1), 0) = 0 OR $${paramIndex.current} = ANY(allowed_roles))`
    );
    params.push(userRole);
    paramIndex.current++;
  } else {
    clauses.push('(allowed_roles IS NULL OR COALESCE(array_length(allowed_roles, 1), 0) = 0)');
  }

  // User type filter
  if (userType) {
    clauses.push(
      `(allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0 OR $${paramIndex.current} = ANY(allowed_user_types))`
    );
    params.push(userType);
    paramIndex.current++;
  } else {
    clauses.push('(allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0)');
  }

  // Hotel ID filter
  if (hotelId) {
    clauses.push(
      `(allowed_hotel_ids IS NULL OR COALESCE(array_length(allowed_hotel_ids, 1), 0) = 0 OR $${paramIndex.current} = ANY(allowed_hotel_ids))`
    );
    params.push(hotelId);
    paramIndex.current++;
  } else {
    clauses.push('(allowed_hotel_ids IS NULL OR COALESCE(array_length(allowed_hotel_ids, 1), 0) = 0)');
  }

  return clauses;
}

/**
 * Gets the configured hotel ID from environment
 */
export function getConfiguredHotelId(): HotelId | null {
  const configuredHotelId = process.env.HOTEL_ID;
  return configuredHotelId && (HOTEL_IDS as readonly string[]).includes(configuredHotelId)
    ? (configuredHotelId as HotelId)
    : null;
}

