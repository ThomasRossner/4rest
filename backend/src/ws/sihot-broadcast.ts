import { broadcast } from './socketRegistry.js';
import { UserRole } from '../constants/enums.js';

interface SihotUpdatePayload {
  userId: string;
  payload: any | null;
  role?: UserRole;
}

export function broadcastSihotUpdate({ userId, payload, role }: SihotUpdatePayload): void {
  broadcast({
    type: 'sihot:update',
    userId,
    payload,
    role: role ?? null,
    timestamp: new Date().toISOString(),
  });
}

