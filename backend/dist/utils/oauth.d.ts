import { Request, Response } from 'express';
/**
 * Gets the frontend URL from environment
 * Throws an error if not set to prevent invalid redirects
 */
export declare function getFrontendUrl(): string;
/**
 * Gets the frontend URL intelligently from environment, request headers, or fallback
 * Uses request headers to determine the correct URL when environment variables are not set
 */
export declare function getFrontendUrlFromRequest(req?: {
    protocol?: string;
    get?: (name: string) => string | undefined;
    headers?: {
        host?: string;
        'x-forwarded-host'?: string;
        'x-forwarded-proto'?: string;
    };
}): string;
/**
 * Creates a reusable OAuth callback handler
 * Eliminates code duplication across OAuth providers (DRY principle)
 */
export declare function createOAuthCallback(provider: string, envCheck: () => boolean, afterAuth?: (user: any) => Promise<void>): (req: Request, res: Response, next: any) => Promise<void>;
//# sourceMappingURL=oauth.d.ts.map