import { UserRole } from '../constants/enums.js';
/**
 * Signs a JWT token for a user
 * Extracted from auth controller for reusability (DRY principle)
 */
export declare function signUserToken(payload: {
    id: string;
    email: string;
    role: UserRole;
}): string;
//# sourceMappingURL=jwt.d.ts.map