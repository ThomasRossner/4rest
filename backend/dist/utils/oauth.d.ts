import { Request, Response } from 'express';
/**
 * Gets the frontend URL from environment or defaults to localhost
 */
export declare function getFrontendUrl(): string;
/**
 * Creates a reusable OAuth callback handler
 * Eliminates code duplication across OAuth providers (DRY principle)
 */
export declare function createOAuthCallback(provider: string, envCheck: () => boolean): (req: Request, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=oauth.d.ts.map