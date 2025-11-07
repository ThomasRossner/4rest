import { broadcast } from './socketRegistry.js';

interface SihotUpdatePayload {
  userId: string;
  payload: any | null;
}

export function broadcastSihotUpdate({ userId, payload }: SihotUpdatePayload): void {
  broadcast({
    type: 'sihot:update',
    userId,
    payload,
    timestamp: new Date().toISOString(),
  });
}

