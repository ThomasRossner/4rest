import { broadcast } from './socketRegistry.js';

interface RewardRedemptionUpdatePayload {
  userId: string;
  redemptionId: string;
  status: 'pending' | 'used' | 'expired';
  points?: number;
}

export function broadcastRedemptionUpdate({ userId, redemptionId, status, points }: RewardRedemptionUpdatePayload): void {
  broadcast({
    type: 'reward:redemption:update',
    userId,
    redemptionId,
    status,
    points,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastRewardUpdate(): void {
  broadcast({
    type: 'reward:update',
    timestamp: new Date().toISOString(),
  });
}