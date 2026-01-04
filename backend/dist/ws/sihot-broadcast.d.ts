import { UserRole } from '../constants/enums.js';
interface SihotUpdatePayload {
    userId: string;
    payload: any | null;
    role?: UserRole;
}
export declare function broadcastSihotUpdate({ userId, payload, role }: SihotUpdatePayload): void;
export {};
//# sourceMappingURL=sihot-broadcast.d.ts.map