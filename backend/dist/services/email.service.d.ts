interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    private isMockMode;
    private mockOutputDir;
    constructor();
    private initializeTransporter;
    private saveMockEmail;
    sendEmail(options: EmailOptions): Promise<void>;
    private htmlToText;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map