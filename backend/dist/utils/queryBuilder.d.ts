import { UserType, HotelId } from '../constants/enums.js';
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
export declare function buildTeamContestFilterClauses(options: TeamContestFilterOptions, params: any[], paramIndex: {
    current: number;
}): string[];
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
export declare function buildAudienceFilterClauses(options: AudienceFilterOptions, params: any[], paramIndex: {
    current: number;
}): string[];
/**
 * Gets the configured hotel ID from environment
 */
export declare function getConfiguredHotelId(): HotelId | null;
//# sourceMappingURL=queryBuilder.d.ts.map