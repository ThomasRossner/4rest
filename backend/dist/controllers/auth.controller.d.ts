import { Request, Response } from 'express';
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
export declare function requestLoginCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function loginWithCode(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map