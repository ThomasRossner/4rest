import { UserRole, UserType, HotelId } from '../constants/enums.js';
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
export declare function buildAudienceFilterClauses(options: AudienceFilterOptions, params: any[], paramIndex: {
    current: number;
}): string[];
/**
 * Gets the configured hotel ID from environment
 */
export declare function getConfiguredHotelId(): HotelId | null;
//# sourceMappingURL=queryBuilder.d.ts.map