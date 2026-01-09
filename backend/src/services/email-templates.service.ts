import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemplateVariables {
  [key: string]: string | number | undefined;
}

class EmailTemplatesService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
  }

  private loadTemplate(templateName: string): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return fs.readFileSync(templatePath, 'utf-8');
  }

  private replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }

    return result;
  }

  getWelcomeEmail(variables: {
    name: string;
    email: string;
    role: string;
    appUrl?: string;
  }): string {
    const template = this.loadTemplate('welcome-email');
    const appUrl = variables.appUrl || process.env.APP_URL || process.env.FRONTEND_URL || '';
    
    return this.replaceVariables(template, {
      ...variables,
      appUrl,
    });
  }

  getPasswordResetEmail(variables: {
    name: string;
    email: string;
    resetUrl: string;
    expiresIn?: string;
  }): string {
    const template = this.loadTemplate('password-reset-email');
    const expiresIn = variables.expiresIn || '1 hour';
    
    return this.replaceVariables(template, {
      ...variables,
      expiresIn,
    });
  }

  getEmailVerificationEmail(variables: {
    name: string;
    email: string;
    verificationUrl: string;
    expiresIn?: string;
  }): string {
    const template = this.loadTemplate('email-verification');
    const expiresIn = variables.expiresIn || '24 hours';
    
    return this.replaceVariables(template, {
      ...variables,
      expiresIn,
    });
  }

  getLoginCodeEmail(variables: {
    name: string;
    email: string;
    code: string;
    expiresIn?: string;
  }): string {
    const template = this.loadTemplate('login-code-email');
    const expiresIn = variables.expiresIn || '10 minutes';
    
    return this.replaceVariables(template, {
      ...variables,
      expiresIn,
    });
  }

  getPasswordSetupEmail(variables: {
    name: string;
    email: string;
    resetUrl: string;
    expiresIn?: string;
  }): string {
    const template = this.loadTemplate('password-setup-email');
    const expiresIn = variables.expiresIn || '1 hour';
    
    return this.replaceVariables(template, {
      ...variables,
      expiresIn,
    });
  }
}

export const emailTemplates = new EmailTemplatesService();

