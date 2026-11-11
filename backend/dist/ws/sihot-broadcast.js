import { broadcast } from './socketRegistry.js';
export function broadcastSihotUpdate({ userId, payload, role }) {
    broadcast({
        type: 'sihot:update',
        userId,
        payload,
        role: role ?? null,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=sihot-broadcast.js.map