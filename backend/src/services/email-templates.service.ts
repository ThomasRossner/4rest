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
    role?: string;
    appUrl?: string;
  }): string {
    const template = this.loadTemplate('welcome-email');
    const appUrl = variables.appUrl || process.env.APP_URL || process.env.FRONTEND_URL || '';
    
    // Remove role from variables to prevent it from being displayed in email
    const { role, ...emailVariables } = variables;
    
    return this.replaceVariables(template, {
      ...emailVariables,
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

  getAdminCreatedUserEmail(variables: {
    name: string;
    email: string;
    resetUrl: string;
    expiresIn?: string;
  }): string {
    const template = this.loadTemplate('admin-created-user-email');
    const expiresIn = variables.expiresIn || '1 hour';
    
    return this.replaceVariables(template, {
      ...variables,
      expiresIn,
    });
  }

  getPhotoRejectionEmail(variables: {
    name: string;
    email: string;
    taskTitle: string;
    rejectionReason?: string;
    appUrl?: string;
  }): string {
    const template = this.loadTemplate('photo-rejection-email');
    const appUrl = variables.appUrl || process.env.APP_URL || process.env.FRONTEND_URL || '';
    
    // Build rejection reason section if provided
    let rejectionReasonSection = '';
    if (variables.rejectionReason) {
      rejectionReasonSection = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px; color: #333333; font-size: 16px; line-height: 1.6;">
            <strong>Begründung:</strong>
          </p>
          <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
            ${variables.rejectionReason}
          </p>
        </div>
      `;
    }
    
    return this.replaceVariables(template, {
      ...variables,
      appUrl,
      rejectionReasonSection,
    });
  }
}

export const emailTemplates = new EmailTemplatesService();

