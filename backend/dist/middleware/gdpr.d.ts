import { Request, Response, NextFunction } from 'express';
export declare function exportUserData(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export declare function deleteUserData(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export interface ConsentPreferences {
    analytics: boolean;
    marketing: boolean;
    dataProcessing: boolean;
}
export declare function updateConsent(userId: string, consent: ConsentPreferences): Promise<void>;
//# sourceMappingURL=gdpr.d.ts.map