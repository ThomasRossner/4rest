import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  addEmailSuppression,
  createDeliveryLog,
  isEmailSuppressed,
  updateDeliveryLog,
} from './email-delivery.service.js';

// Load environment variables before initializing the service
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateKey?: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isMockMode: boolean;
  private mockOutputDir: string;

  constructor() {
    // If EMAIL_MOCK_MODE is explicitly set to 'false', disable mock mode even in development
    // Otherwise, use mock mode if EMAIL_MOCK_MODE is 'true' or if NODE_ENV is 'development'
    if (process.env.EMAIL_MOCK_MODE === 'false') {
      this.isMockMode = false;
    } else {
      this.isMockMode = process.env.EMAIL_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
    }
    this.mockOutputDir = path.join(__dirname, '../../email-output');

    console.log(`[EMAIL SERVICE] Initializing...`);
    console.log(`[EMAIL SERVICE] EMAIL_MOCK_MODE: ${process.env.EMAIL_MOCK_MODE}`);
    console.log(`[EMAIL SERVICE] NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[EMAIL SERVICE] isMockMode: ${this.isMockMode}`);
    console.log(`[EMAIL SERVICE] mockOutputDir: ${this.mockOutputDir}`);

    if (this.isMockMode) {
      // Ensure mock output directory exists
      if (!fs.existsSync(this.mockOutputDir)) {
        fs.mkdirSync(this.mockOutputDir, { recursive: true });
        console.log(`[EMAIL SERVICE] Created mock output directory: ${this.mockOutputDir}`);
      } else {
        console.log(`[EMAIL SERVICE] Mock output directory already exists: ${this.mockOutputDir}`);
      }
      console.log(`[EMAIL SERVICE] Running in MOCK mode. Emails will be saved to: ${this.mockOutputDir}`);
    } else if (process.env.EMAIL_ENABLED === 'true') {
      this.initializeTransporter();
      console.log(`[EMAIL SERVICE] Running in PRODUCTION mode with SMTP`);
    } else {
      console.log(`[EMAIL SERVICE] Email service is DISABLED`);
    }
  }

  private initializeTransporter() {
    const smtpConfig: any = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      // Disable certificate validation for local/internal SMTP servers
      tls: {
        rejectUnauthorized: false,
      },
      // Add connection timeout to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      smtpConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  private isTransientError(error: any): boolean {
    const code = String(error?.code || '').toUpperCase();
    const responseCode = Number(error?.responseCode || 0);
    if (['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'EAI_AGAIN', 'ESOCKET'].includes(code)) return true;
    if (responseCode >= 400 && responseCode < 500) return true;
    return false;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveMockEmail(options: EmailOptions, from: string): Promise<void> {
    // Ensure directory exists before writing
    if (!fs.existsSync(this.mockOutputDir)) {
      fs.mkdirSync(this.mockOutputDir, { recursive: true });
      console.log(`[MOCK EMAIL] Created directory: ${this.mockOutputDir}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTo = options.to.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}_${sanitizedTo}_${options.subject.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    const filepath = path.join(this.mockOutputDir, filename);

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .email-header {
      border-bottom: 2px solid #667eea;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .email-meta {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 12px;
      color: #666;
    }
    .email-meta p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${options.subject}</h1>
    </div>
    <div class="email-meta">
      <p><strong>From:</strong> ${from}</p>
      <p><strong>To:</strong> ${options.to}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Mode:</strong> MOCK (Development)</p>
    </div>
    <div class="email-content">
      ${options.html}
    </div>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(filepath, fullHtml, 'utf-8');
    console.log(`[MOCK EMAIL] Saved to: ${filepath}`);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@4rest.com';
    const fromName = process.env.EMAIL_FROM_NAME || '4rest';
    const from = `"${fromName}" <${fromEmail}>`;

    const messageType = options.messageType || options.templateKey || 'generic';
    const templateKey = options.templateKey || null;

    if (await isEmailSuppressed(options.to)) {
      await createDeliveryLog({
        recipientEmail: options.to,
        messageType,
        templateKey: templateKey ?? undefined,
        subject: options.subject,
        status: 'suppressed',
        errorMessage: 'recipient suppressed',
        metadata: options.metadata,
      });
      console.warn(`[EMAIL SERVICE] Suppressed recipient skipped: ${options.to}`);
      return;
    }

    const deliveryLogId = await createDeliveryLog({
      recipientEmail: options.to,
      messageType,
      templateKey: templateKey ?? undefined,
      subject: options.subject,
      status: 'pending',
      metadata: options.metadata,
    });

    if (this.isMockMode) {
      try {
        await this.saveMockEmail(options, from);
        await updateDeliveryLog(deliveryLogId, {
          status: 'sent',
          smtpResponse: 'mock-mode',
          attemptCount: 1,
        });
        console.log(`[MOCK EMAIL] Email saved successfully for: ${options.to}`);
      } catch (error: any) {
        await updateDeliveryLog(deliveryLogId, {
          status: 'failed',
          errorCode: error?.code || 'MOCK_WRITE_ERROR',
          errorMessage: error?.message || 'Mock email write failed',
        });
        console.error(`[MOCK EMAIL] Failed to save email:`, error);
        throw error;
      }
      return;
    }

    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      await updateDeliveryLog(deliveryLogId, {
        status: 'failed',
        errorCode: 'EMAIL_DISABLED',
        errorMessage: 'Email service is disabled or not configured',
      });
      console.warn('Email service is disabled or not configured. Email would have been sent to:', options.to);
      return;
    }

    const maxRetries = Math.max(1, Number(process.env.EMAIL_MAX_RETRIES || 3));
    const retryBaseMs = Math.max(200, Number(process.env.EMAIL_RETRY_BASE_MS || 800));

    let lastError: any = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
        });

        await updateDeliveryLog(deliveryLogId, {
          status: 'sent',
          attemptCount: attempt,
          smtpResponse: String(info?.response || ''),
          metadata: {
            ...(options.metadata || {}),
            messageId: info?.messageId || null,
          },
        });
        console.log(`Email sent successfully to: ${options.to}`);
        return;
      } catch (error: any) {
        lastError = error;
        await updateDeliveryLog(deliveryLogId, {
          status: attempt < maxRetries && this.isTransientError(error) ? 'deferred' : 'failed',
          attemptCount: attempt,
          errorCode: error?.code || (error?.responseCode ? `SMTP_${error.responseCode}` : 'SMTP_ERROR'),
          errorMessage: error?.message || 'sendMail failed',
          smtpResponse: String(error?.response || ''),
        });

        const permanent = !this.isTransientError(error) || attempt >= maxRetries;
        if (permanent) break;
        await this.delay(retryBaseMs * attempt);
      }
    }

    if (lastError?.responseCode === 550 || lastError?.responseCode === 551 || lastError?.responseCode === 553) {
      await addEmailSuppression({
        email: options.to,
        reason: 'hard_bounce',
        source: 'smtp',
        details: {
          code: lastError?.code || null,
          responseCode: lastError?.responseCode || null,
          response: lastError?.response || null,
        },
      });
    }

    console.error('Failed to send email:', lastError);
    throw new Error(`Failed to send email: ${lastError?.message || 'unknown error'}`);
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * TICKET-010: E-Mail an Admins/Rezeption bei neuer Foto-Aufgabe zur Prüfung.
   * Fehler pro Adresse werden geloggt, werfen aber nicht (Aufrufer soll nicht abbrechen).
   */
  async sendPhotoVerificationRequestEmails(params: {
    recipients: string[];
    taskTitle: string;
    guestName: string;
    userTaskId: string;
  }): Promise<void> {
    const unique = [...new Set(params.recipients.map((e) => e.trim()).filter((e) => e.includes('@')))];
    if (unique.length === 0) {
      console.log('[EMAIL] Photo verification: no recipient addresses');
      return;
    }

    const base = process.env.APP_URL || process.env.FRONTEND_URL || '';
    const adminBase = base ? `${base.replace(/\/$/, '')}/admin` : '';
    const linkHtml = adminBase
      ? `<p><a href="${adminBase}">${adminBase}</a> — dort unter Foto-Verifizierung prüfen.</p>`
      : '<p>Bitte in der Admin-Oberfläche die ausstehenden Foto-Aufgaben prüfen.</p>';

    const subject = `Neue Foto-Aufgabe zur Prüfung: ${params.taskTitle}`;
    const html = `
      <p>Hallo,</p>
      <p><strong>${params.guestName}</strong> hat ein Foto für die Aufgabe „${params.taskTitle}“ hochgeladen (Vorgang <code>${params.userTaskId}</code>).</p>
      ${linkHtml}
      <p>Mit freundlichen Grüßen<br/>${process.env.EMAIL_FROM_NAME || 'Luise'}</p>
    `;

    for (const to of unique) {
      try {
        await this.sendEmail({ to, subject, html });
      } catch (err: any) {
        console.error(`[EMAIL] Photo verification failed for ${to}:`, err?.message || err);
      }
    }
  }
}

export const emailService = new EmailService();

