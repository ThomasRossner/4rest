import { Page, expect } from '@playwright/test';
import { TestUser } from '../helpers/test-users';

export class LoginPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.fill('input[id="email"]', email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill('input[id="password"]', password);
  }

  async fillName(name: string): Promise<void> {
    await this.page.fill('input[id="name"]', name);
  }

  async clickSubmit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async switchToRegister(): Promise<void> {
    const registerButton = this.page.locator('button.link-button:has-text("Register")').first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    } else {
      await this.page.click('text=Register', { timeout: 2000 }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  async switchToLogin(): Promise<void> {
    const loginButton = this.page.locator('button.link-button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    await this.page.waitForTimeout(500);
  }

  async switchToForgotPassword(): Promise<void> {
    const forgotButton = this.page.locator('button.link-button:has-text("Forgot")').first();
    if (await forgotButton.isVisible()) {
      await forgotButton.click();
    }
    await this.page.waitForTimeout(500);
  }

  async login(user: TestUser): Promise<void> {
    await this.goto();
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.clickSubmit();
    await this.page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
  }

  async register(user: TestUser): Promise<void> {
    await this.goto();
    await this.switchToRegister();
    await this.fillName(user.name);
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.clickSubmit();
    await this.page.waitForTimeout(2000);
  }

  async getError(): Promise<string | null> {
    const errorElement = this.page.locator('.login-error');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  async getSuccess(): Promise<string | null> {
    const successElement = this.page.locator('.login-success');
    if (await successElement.isVisible()) {
      return await successElement.textContent();
    }
    return null;
  }

  async expectError(message?: string): Promise<void> {
    const errorElement = this.page.locator('.login-error');
    await expect(errorElement).toBeVisible();
    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }

  async expectSuccess(message?: string): Promise<void> {
    const successElement = this.page.locator('.login-success');
    await expect(successElement).toBeVisible();
    if (message) {
      await expect(successElement).toContainText(message);
    }
  }
}
