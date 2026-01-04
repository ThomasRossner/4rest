import { RequestHandler } from 'express';
/**
 * Wraps async route handlers to automatically catch errors and pass them to error middleware
 * Eliminates repetitive try/catch blocks in controllers (DRY principle)
 */
export declare function asyncHandler(fn: RequestHandler): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map