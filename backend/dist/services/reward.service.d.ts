import { Location } from './location.service.js';
export declare function getRewardsService(userId: string): Promise<{
    id: any;
    title: any;
    description: any;
    pointsCost: any;
    rewardType: any;
    icon: string;
    thumbnail_url: any;
    location: Location;
}[]>;
interface CreateCustomRewardInput {
    title?: string;
    description?: string | null;
    pointsCost?: number | string;
    rewardType?: string;
    voucherCode?: string | null;
    externalApiId?: string | null;
    zielgruppe?: ('Front Office' | 'Gäste')[] | null;
    location_id: string;
    active?: boolean;
    recurrence?: string | null;
    reward_art?: string;
    kategorie?: string;
    event_group?: string | null;
    moegliche_punkte?: number | null;
    thumbnail_url?: string | null;
}
interface UpdateRewardInput {
    title?: string | null;
    description?: string | null;
    pointsCost?: number | string | null;
    rewardType?: string | null;
    voucherCode?: string | null;
    externalApiId?: string | null;
    zielgruppe?: ('Front Office' | 'Gäste')[] | null;
    location_id?: string | null;
    active?: boolean;
    recurrence?: string | null;
    reward_art?: string | null;
    kategorie?: string | null;
    event_group?: string | null;
    moegliche_punkte?: number | null;
    thumbnail_url?: string | null;
}
export declare function createCustomReward(data: CreateCustomRewardInput): Promise<any>;
export declare function updateReward(id: string, data: UpdateRewardInput): Promise<any>;
export declare function setRewardsActiveState(ids: string[], active: boolean): Promise<void>;
export declare function bulkDeleteRewards(ids: string[]): Promise<void>;
export declare function getRewardById(id: string): Promise<any>;
export declare function listRewardsForAdmin(includeInactive?: boolean): Promise<any[]>;
export declare function redeemRewardService(rewardId: string, userId: string, useTeamPoints?: boolean): Promise<{
    success: boolean;
    redemption: {
        id: any;
        qrToken: string;
        voucherCode: any;
        status: any;
    };
    remainingPoints: number;
    teamTotalPoints: number;
    exceedsPersonalPoints: boolean;
    message: string;
}>;
/**
 * Get redemption status by QR token (for polling)
 */
export declare function getRedemptionStatus(qrToken: string, userId: string): Promise<{
    id: any;
    status: any;
    points: number;
}>;
/**
 * Get reward information from QR code without redeeming it
 * Used by front office to preview the reward before redeeming
 */
export declare function getRewardInfoFromQrCode(qrToken: string, employeeUserId: string): Promise<{
    success: boolean;
    redemption: {
        id: any;
        rewardId: any;
        rewardTitle: any;
        rewardDescription: any;
        userId: any;
        userName: any;
        userEmail: any;
        pointsCost: any;
        status: any;
    };
    message: string;
}>;
export declare function verifyQrCodeService(qrToken: string, adminUserId: string): Promise<{
    success: boolean;
    redemption: {
        id: any;
        status: string;
    };
    user: {
        id: any;
        name: any;
        points: any;
    };
    reward: {
        title: any;
    };
    message: string;
}>;
/**
 * Redeem a reward QR code for a guest (front office action)
 * This marks the redemption as 'used' and deducts points from the guest
 */
export declare function redeemRewardQrCodeService(qrToken: string, employeeUserId: string): Promise<{
    success: boolean;
    redemption: {
        id: any;
        rewardId: any;
        rewardTitle: any;
        rewardDescription: any;
        userId: any;
        userName: any;
        userEmail: any;
        pointsCost: any;
        status: string;
    };
    guestPoints: any;
    message: string;
}>;
export declare function uploadThumbnail(file: Express.Multer.File): Promise<string>;
export declare function getUserRedemptions(userId: string): Promise<any[]>;
export {};
//# sourceMappingURL=reward.service.d.ts.map