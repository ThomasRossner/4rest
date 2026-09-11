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
 * 
 * NOTE: This function assumes that allowed_teams and allowed_contests columns exist.
 * If they don't exist (migration 051 not run), this function should not be called.
 * The caller is responsible for checking if columns exist before calling this function.
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

  // IMPORTANT: This function generates SQL that references allowed_teams and allowed_contests columns.
  // If these columns don't exist, the SQL will fail.
  // The caller MUST check if columns exist before calling this function.
  
  // Team and Contest filter (OR logic: user must be in team OR contest)
  // Tasks/Rewards without assignments (NULL or empty arrays) are visible to all
  // Tasks/Rewards with assignments are only visible to members/participants
  const teamContestConditions: string[] = [];
  
  // If task/reward has no team/contest assignments, it's visible to all
  teamContestConditions.push(
    `(allowed_teams IS NULL OR COALESCE(array_length(allowed_teams, 1), 0) = 0) AND (allowed_contests IS NULL OR COALESCE(array_length(allowed_contests, 1), 0) = 0)`
  );
  
  // Build conditions for team and contest matches
  const teamMatchConditions: string[] = [];
  const contestMatchConditions: string[] = [];
  
  // If user has team memberships, check if task/reward is assigned to any of those teams
  if (userTeamIds && userTeamIds.length > 0) {
    const teamPlaceholders = userTeamIds.map((_, i) => `$${paramIndex.current + i}`).join(', ');
    userTeamIds.forEach(id => params.push(id));
    teamMatchConditions.push(
      `(allowed_teams IS NOT NULL AND COALESCE(array_length(allowed_teams, 1), 0) > 0 AND allowed_teams && ARRAY[${teamPlaceholders}]::UUID[])`
    );
    paramIndex.current += userTeamIds.length;
  }
  
  // If user has contest participations, check if task/reward is assigned to any of those contests
  if (userContestIds && userContestIds.length > 0) {
    const contestPlaceholders = userContestIds.map((_, i) => `$${paramIndex.current + i}`).join(', ');
    userContestIds.forEach(id => params.push(id));
    contestMatchConditions.push(
      `(allowed_contests IS NOT NULL AND COALESCE(array_length(allowed_contests, 1), 0) > 0 AND allowed_contests && ARRAY[${contestPlaceholders}]::UUID[])`
    );
    paramIndex.current += userContestIds.length;
  }
  
  // If task/reward has team assignments, user must be in one of those teams (or task has no team assignments)
  // If task/reward has contest assignments, user must be in one of those contests (or task has no contest assignments)
  // Task is visible if: (no team assignments OR user matches team) AND (no contest assignments OR user matches contest)
  const matchConditions: string[] = [];
  
  // Team condition: task has no team assignments OR user matches
  if (teamMatchConditions.length > 0) {
    matchConditions.push(`((allowed_teams IS NULL OR COALESCE(array_length(allowed_teams, 1), 0) = 0) OR ${teamMatchConditions[0]})`);
  } else {
    // If user has no team memberships, task must not have team assignments
    matchConditions.push(`(allowed_teams IS NULL OR COALESCE(array_length(allowed_teams, 1), 0) = 0)`);
  }
  
  // Contest condition: task has no contest assignments OR user matches
  if (contestMatchConditions.length > 0) {
    matchConditions.push(`((allowed_contests IS NULL OR COALESCE(array_length(allowed_contests, 1), 0) = 0) OR ${contestMatchConditions[0]})`);
  } else {
    // If user has no contest participations, task must not have contest assignments
    matchConditions.push(`(allowed_contests IS NULL OR COALESCE(array_length(allowed_contests, 1), 0) = 0)`);
  }
  
  // Task is visible if it has no assignments OR user matches at least one team OR one contest
  if (matchConditions.length > 0) {
    teamContestConditions.push(`(${matchConditions.join(' AND ')})`);
  }
  
  if (teamContestConditions.length > 0) {
    clauses.push(`(${teamContestConditions.join(' OR ')})`);
  }

  // User type filter removed - column was dropped in migration 038
  // These filters are no longer used as they were replaced by zielgruppe and team/contest filtering
  
  // Hotel ID filter removed - column was dropped in migration 038
  // These filters are no longer used as they were replaced by team/contest filtering

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

