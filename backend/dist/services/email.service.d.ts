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
    /**
     * TICKET-010: E-Mail an Admins/Rezeption bei neuer Foto-Aufgabe zur Prüfung.
     * Fehler pro Adresse werden geloggt, werfen aber nicht (Aufrufer soll nicht abbrechen).
     */
    sendPhotoVerificationRequestEmails(params: {
        recipients: string[];
        taskTitle: string;
        guestName: string;
        userTaskId: string;
    }): Promise<void>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map