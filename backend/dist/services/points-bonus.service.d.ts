export interface PointsBonusQrToken {
    id: string;
    qr_token: string;
    points_amount: number;
    generated_by: string;
    generated_at: Date;
    redeemed_by: string | null;
    redeemed_at: Date | null;
    status: 'pending' | 'redeemed' | 'expired';
    expires_at: Date;
}
/**
 * Generate a QR code token for points bonus
 * @param employeeUserId - ID of the employee/administrator generating the QR code
 * @param pointsAmount - Amount of points to award
 * @returns QR token data
 */
export declare function generatePointsBonusQr(employeeUserId: string, pointsAmount: number, forestCategory: string): Promise<PointsBonusQrToken>;
/**
 * Redeem a points bonus QR code token
 * @param qrToken - QR token to redeem
 * @param userId - ID of the user redeeming the QR code
 * @returns Redemption result with points awarded
 */
export declare function redeemPointsBonusQr(qrToken: string, userId: string): Promise<{
    pointsAwarded: number;
    newPointsBalance: number;
}>;
/**
 * Mark expired QR tokens as expired (cleanup function)
 * Can be called periodically by a background job
 */
export declare function markExpiredTokens(): Promise<number>;
//# sourceMappingURL=points-bonus.service.d.ts.map