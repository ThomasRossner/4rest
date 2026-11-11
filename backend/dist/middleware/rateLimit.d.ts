import { Request, Response, NextFunction } from 'express';
/**
 * Rate limit middleware that enforces a cooldown period between requests
 * @param cooldownMs - Cooldown period in milliseconds (default: 5000ms = 5 seconds)
 */
export declare function rateLimit(cooldownMs?: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimit.d.ts.map