import { UserRole, UserType, HotelId, RewardType } from '../constants/enums.js';
type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly';
/**
 * Validates and normalizes an array of user roles
 */
export declare function validateRoleArray(values?: string[] | null): UserRole[];
/**
 * Validates and normalizes an array of user types
 */
export declare function validateUserTypeArray(values?: string[] | null): UserType[];
/**
 * Validates and normalizes an array of hotel IDs
 */
export declare function validateHotelIdArray(values?: string[] | null): HotelId[];
/**
 * Validates a reward type
 */
export declare function validateRewardType(value?: string | null): RewardType;
/**
 * Validates and normalizes a recurrence value
 */
export declare function validateRecurrence(value?: string | null): Recurrence;
/**
 * Normalizes points cost to a number, ensuring it's non-negative
 */
export declare function normalizePointsCost(value: unknown): number;
/**
 * Validates a URL string
 */
export declare function validateUrl(url: string | null | undefined, fieldName?: string): string | null;
/**
 * Validates GPS coordinates (latitude and longitude)
 */
export declare function validateGpsCoordinates(latitude: number | string | null | undefined, longitude: number | string | null | undefined): {
    lat: number;
    lng: number;
} | null;
/**
 * Validates QR code format (basic validation - alphanumeric and common special chars)
 */
export declare function validateQrCode(qrCode: string | null | undefined): string | null;
export {};
//# sourceMappingURL=validation.d.ts.map