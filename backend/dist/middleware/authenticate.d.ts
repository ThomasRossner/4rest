import { Request, RequestHandler } from 'express';
import { UserRole } from '../constants/enums.js';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}
export declare const authenticate: RequestHandler;
//# sourceMappingURL=authenticate.d.ts.map