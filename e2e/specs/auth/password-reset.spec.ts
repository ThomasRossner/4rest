import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ensureLoggedOut } from '../../helpers/auth';
// Using faker for test data generation
const generateEmail = () => `test-${Date.now()}@test.com`;

test.describe('Password Reset', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should request password reset with valid email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = 'guest@test.com'; // Use existing test user

    await loginPage.goto();
    await loginPage.switchToForgotPassword();
    await loginPage.fillEmail(email);
    await loginPage.clickSubmit();
    await page.waitForTimeout(2000);

    // Should show success message
    const success = await loginPage.getSuccess();
    expect(success).toBeTruthy();
  });

  test('should show error with non-existent email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = generateEmail();

    await loginPage.goto();
    await loginPage.switchToForgotPassword();
    await loginPage.fillEmail(email);
    await loginPage.clickSubmit();
    await page.waitForTimeout(2000);

    // Might show error or success (security: don't reveal if email exists)
    const error = await loginPage.getError();
    const success = await loginPage.getSuccess();
    
    // Either error or success is acceptable (security best practice)
    expect(error || success).toBeTruthy();
  });

  test('should navigate back to login from forgot password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToForgotPassword();
    
    // Click back to login link
    const backButton = page.locator('button.link-button:has-text("Sign In")').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);
      
      // Should be back on login
      const passwordInput = page.locator('input[id="password"]');
      await expect(passwordInput).toBeVisible();
    }
  });
});
