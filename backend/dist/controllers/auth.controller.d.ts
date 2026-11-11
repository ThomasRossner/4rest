import { Request, Response, RequestHandler } from 'express';
/** POST /api/auth/merge-guest-session — explizit nach OAuth/Token-Login (Cookie + JWT). */
export declare const mergeGuestSession: RequestHandler;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function refreshToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function githubAuth(req: Request, res: Response, next: any): void;
export declare const githubCallback: (req: Request, res: Response, next: any) => Promise<void>;
export declare function googleAuth(req: Request, res: Response, next: any): void;
export declare const googleCallback: (req: Request, res: Response, next: any) => Promise<void>;
export declare function facebookAuth(req: Request, res: Response, next: any): void;
export declare const facebookCallback: (req: Request, res: Response, next: any) => Promise<void>;
export declare function appleAuth(req: Request, res: Response, next: any): void;
export declare const appleCallback: (req: Request, res: Response, next: any) => Promise<void>;
export declare function forgotPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function resetPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function verifyEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function resendVerificationEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Öffentlicher Endpoint für "Aktivierungsmail erneut senden" aus dem Login.
 * Antwort bleibt absichtlich generisch (kein User-Enumeration-Leak).
 */
export declare function requestResendVerificationEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Provider-Webhooks (Bounce/Complaint/Delivery), geschützt per shared secret.
 */
export declare function emailDeliveryEvent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function requestLoginCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function loginWithCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map