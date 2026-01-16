import { UserType, HotelId, HOTEL_IDS } from '../constants/enums.js';

export interface TeamContestFilterOptions {
  userTeamIds?: string[] | null;
  userContestIds?: string[] | null;
  userType?: UserType | null;
  hotelId?: HotelId | null;
  applyFilters?: boolean;
}

/**
 * Builds SQL WHERE clauses for team/contest-based filtering
 * Tasks/Rewards without team/contest assignments are visible to all (if active)
 * Tasks/Rewards with team/contest assignments are only visible to members/participants
 * Used by both tasks and rewards services (DRY principle)
 */
export function buildTeamContestFilterClauses(
  options: TeamContestFilterOptions,
  params: any[],
  paramIndex: { current: number }
): string[] {
  const clauses: string[] = [];
  const { userTeamIds, userContestIds, userType, hotelId, applyFilters = true } = options;

  if (!applyFilters) {
    return clauses;
  }

  // Team and Contest filter (OR logic: user must be in team OR contest)
  // Tasks/Rewards without assignments (NULL or empty arrays) are visible to all
  const teamContestConditions: string[] = [];
  
  // If task/reward has no team/contest assignments, it's visible to all
  teamContestConditions.push(
    `(allowed_teams IS NULL OR COALESCE(array_length(allowed_teams, 1), 0) = 0) AND (allowed_contests IS NULL OR COALESCE(array_length(allowed_contests, 1), 0) = 0)`
  );
  
  // If user has team memberships, check if task/reward is assigned to any of those teams
  if (userTeamIds && userTeamIds.length > 0) {
    const teamPlaceholders = userTeamIds.map((_, i) => `$${paramIndex.current + i}`).join(', ');
    userTeamIds.forEach(id => params.push(id));
    teamContestConditions.push(
      `(allowed_teams IS NOT NULL AND COALESCE(array_length(allowed_teams, 1), 0) > 0 AND allowed_teams && ARRAY[${teamPlaceholders}]::UUID[])`
    );
    paramIndex.current += userTeamIds.length;
  }
  
  // If user has contest participations, check if task/reward is assigned to any of those contests
  if (userContestIds && userContestIds.length > 0) {
    const contestPlaceholders = userContestIds.map((_, i) => `$${paramIndex.current + i}`).join(', ');
    userContestIds.forEach(id => params.push(id));
    teamContestConditions.push(
      `(allowed_contests IS NOT NULL AND COALESCE(array_length(allowed_contests, 1), 0) > 0 AND allowed_contests && ARRAY[${contestPlaceholders}]::UUID[])`
    );
    paramIndex.current += userContestIds.length;
  }
  
  if (teamContestConditions.length > 0) {
    clauses.push(`(${teamContestConditions.join(' OR ')})`);
  }

  // User type filter (kept for backward compatibility, can be removed later)
  if (userType) {
    clauses.push(
      `(allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0 OR $${paramIndex.current} = ANY(allowed_user_types))`
    );
    params.push(userType);
    paramIndex.current++;
  } else {
    clauses.push('(allowed_user_types IS NULL OR COALESCE(array_length(allowed_user_types, 1), 0) = 0)');
  }

  // Hotel ID filter (kept for backward compatibility, can be removed later)
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
 * Legacy function for backward compatibility - now uses team/contest filtering
 * @deprecated Use buildTeamContestFilterClauses instead
 */
export interface AudienceFilterOptions {
  userRole?: string | null;
  userType?: UserType | null;
  hotelId?: HotelId | null;
  applyFilters?: boolean;
}

/**
 * @deprecated Use buildTeamContestFilterClauses instead
 */
export function buildAudienceFilterClauses(
  options: AudienceFilterOptions,
  params: any[],
  paramIndex: { current: number }
): string[] {
  // Legacy function - just return empty clauses as role filtering is removed
  // This is kept for backward compatibility during migration
  return [];
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

