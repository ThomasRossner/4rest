import { broadcast } from './socketRegistry.js';
export function broadcastRedemptionUpdate({ userId, redemptionId, status, points }) {
    broadcast({
        type: 'reward:redemption:update',
        userId,
        redemptionId,
        status,
        points,
        timestamp: new Date().toISOString(),
    });
}
export function broadcastRewardUpdate() {
    broadcast({
        type: 'reward:update',
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=reward-broadcast.js.map