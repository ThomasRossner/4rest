import { RequestHandler } from 'express';
export declare const getMe: RequestHandler;
export declare const getUserProgress: RequestHandler;
export declare const getUserProfile: RequestHandler;
export declare const updateUserProfile: RequestHandler;
export declare const listUsers: RequestHandler;
export declare const getUserDetails: RequestHandler;
export declare const updateUserRole: RequestHandler;
export declare const updateUserPoints: RequestHandler;
export declare const toggleUserActive: RequestHandler;
export declare const resetUserPassword: RequestHandler;
export declare const setUserPassword: RequestHandler;
export declare const deleteUser: RequestHandler;
export declare const getUserStatistics: RequestHandler;
/**
 * GET /api/users/:id/timeline
 * Ruft den zeitlichen Verlauf von Punkten, Bäumen und CO2 für einen Benutzer ab
 */
export declare const getUserTimeline: RequestHandler;
export declare const createUserByAdmin: RequestHandler;
//# sourceMappingURL=user.controller.d.ts.map