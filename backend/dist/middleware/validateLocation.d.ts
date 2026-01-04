import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to validate locationId in request body
 * Extracts location validation logic from controllers (SOLID - Single Responsibility)
 */
export declare function validateLocation(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=validateLocation.d.ts.map