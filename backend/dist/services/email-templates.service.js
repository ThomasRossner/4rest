import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class EmailTemplatesService {
    templatesDir;
    constructor() {
        this.templatesDir = path.join(__dirname, '../templates');
    }
    loadTemplate(templateName) {
        const templatePath = path.join(this.templatesDir, `${templateName}.html`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateName}`);
        }
        return fs.readFileSync(templatePath, 'utf-8');
    }
    replaceVariables(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value || ''));
        }
        return result;
    }
    getWelcomeEmail(variables) {
        const template = this.loadTemplate('welcome-email');
        const appUrl = variables.appUrl || process.env.APP_URL || 'http://localhost:3000';
        return this.replaceVariables(template, {
            ...variables,
            appUrl,
        });
    }
    getPasswordResetEmail(variables) {
        const template = this.loadTemplate('password-reset-email');
        const expiresIn = variables.expiresIn || '1 hour';
        return this.replaceVariables(template, {
            ...variables,
            expiresIn,
        });
    }
    getEmailVerificationEmail(variables) {
        const template = this.loadTemplate('email-verification');
        const expiresIn = variables.expiresIn || '24 hours';
        return this.replaceVariables(template, {
            ...variables,
            expiresIn,
        });
    }
    getLoginCodeEmail(variables) {
        const template = this.loadTemplate('login-code-email');
        const expiresIn = variables.expiresIn || '10 minutes';
        return this.replaceVariables(template, {
            ...variables,
            expiresIn,
        });
    }
    getPasswordSetupEmail(variables) {
        const template = this.loadTemplate('password-setup-email');
        const expiresIn = variables.expiresIn || '1 hour';
        return this.replaceVariables(template, {
            ...variables,
            expiresIn,
        });
    }
}
export const emailTemplates = new EmailTemplatesService();
//# sourceMappingURL=email-templates.service.js.map