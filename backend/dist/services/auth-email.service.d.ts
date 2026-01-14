export declare function generateEmailVerificationToken(userId: string): Promise<string>;
export declare function generatePasswordResetToken(userId: string): Promise<string>;
export declare function generatePasswordSetupToken(userId: string): Promise<string>;
export declare function sendPasswordSetupEmail(userId: string, email: string, name: string): Promise<void>;
export declare function sendAdminCreatedUserEmail(userId: string, email: string, name: string): Promise<void>;
export declare function sendWelcomeEmail(userId: string, email: string, name: string, role: string): Promise<void>;
export declare function sendEmailVerificationEmail(userId: string, email: string, name: string, token?: string): Promise<void>;
export declare function sendPasswordResetEmail(userId: string, email: string, name: string): Promise<void>;
export declare function verifyEmailToken(token: string): Promise<{
    userId: string;
    email: string;
    wasJustVerified: boolean;
} | null>;
export declare function verifyPasswordResetToken(token: string): Promise<{
    userId: string;
    email: string;
} | null>;
export declare function clearPasswordResetToken(userId: string): Promise<void>;
export declare function generateLoginCode(userId: string): Promise<string>;
export declare function verifyLoginCode(email: string, code: string): Promise<{
    userId: string;
} | null>;
export declare function clearLoginCode(userId: string): Promise<void>;
export declare function sendLoginCodeEmail(userId: string, email: string, name: string, code: string): Promise<void>;
//# sourceMappingURL=auth-email.service.d.ts.map