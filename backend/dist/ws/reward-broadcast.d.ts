interface RewardRedemptionUpdatePayload {
    userId: string;
    redemptionId: string;
    status: 'pending' | 'used' | 'expired';
    points?: number;
}
export declare function broadcastRedemptionUpdate({ userId, redemptionId, status, points }: RewardRedemptionUpdatePayload): void;
export declare function broadcastRewardUpdate(): void;
export {};
//# sourceMappingURL=reward-broadcast.d.ts.map