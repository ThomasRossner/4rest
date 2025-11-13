import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables before initializing the service
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isMockMode: boolean;
  private mockOutputDir: string;

  constructor() {
    this.isMockMode = process.env.EMAIL_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
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
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      smtpConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
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
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@roots-of-impact.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Roots of Impact';
    const from = `"${fromName}" <${fromEmail}>`;

    if (this.isMockMode) {
      try {
        await this.saveMockEmail(options, from);
        console.log(`[MOCK EMAIL] Email saved successfully for: ${options.to}`);
      } catch (error: any) {
        console.error(`[MOCK EMAIL] Failed to save email:`, error);
        throw error;
      }
      return;
    }

    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.warn('Email service is disabled or not configured. Email would have been sent to:', options.to);
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });
      console.log(`Email sent successfully to: ${options.to}`);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
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
}

export const emailService = new EmailService();

