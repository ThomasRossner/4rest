import { Location } from './location.service.js';
export declare function getRewardsService(userId: string): Promise<{
    id: any;
    title: any;
    description: any;
    pointsCost: any;
    rewardType: any;
    icon: string;
    location: Location;
}[]>;
interface CreateCustomRewardInput {
    title?: string;
    description?: string | null;
    pointsCost?: number | string;
    rewardType?: string;
    voucherCode?: string | null;
    externalApiId?: string | null;
    zielgruppe?: ('Mitarbeitende' | 'Gäste' | 'Stakeholder')[] | null;
    location_id: string;
    active?: boolean;
    recurrence?: string | null;
    reward_art?: string;
    kategorie?: string;
    event_group?: string | null;
    moegliche_punkte?: number | null;
}
interface UpdateRewardInput {
    title?: string | null;
    description?: string | null;
    pointsCost?: number | string | null;
    rewardType?: string | null;
    voucherCode?: string | null;
    externalApiId?: string | null;
    zielgruppe?: ('Mitarbeitende' | 'Gäste' | 'Stakeholder')[] | null;
    location_id?: string | null;
    active?: boolean;
    recurrence?: string | null;
    reward_art?: string | null;
    kategorie?: string | null;
    event_group?: string | null;
    moegliche_punkte?: number | null;
}
export declare function createCustomReward(data: CreateCustomRewardInput): Promise<any>;
export declare function updateReward(id: string, data: UpdateRewardInput): Promise<any>;
export declare function setRewardsActiveState(ids: string[], active: boolean): Promise<void>;
export declare function bulkDeleteRewards(ids: string[]): Promise<void>;
export declare function getRewardById(id: string): Promise<any>;
export declare function listRewardsForAdmin(includeInactive?: boolean): Promise<any[]>;
export declare function redeemRewardService(rewardId: string, userId: string): Promise<{
    success: boolean;
    redemption: {
        id: any;
        qrToken: string;
        voucherCode: any;
        status: any;
    };
    remainingPoints: number;
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
export declare function getUserRedemptions(userId: string): Promise<any[]>;
export {};
//# sourceMappingURL=reward.service.d.ts.map