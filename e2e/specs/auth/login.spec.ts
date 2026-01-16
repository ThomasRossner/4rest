import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { getTestUser } from '../../helpers/test-users';
import { ensureLoggedOut } from '../../helpers/auth';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const user = getTestUser('guest');

    await loginPage.goto();
    await loginPage.fillEmail(user.email);
    await loginPage.fillPassword(user.password);
    await loginPage.clickSubmit();

    // Should redirect to dashboard/home
    await expect(page).toHaveURL(/\/(dashboard|$)/);
    
    // Should not show login form
    await expect(page.locator('input[id="email"]')).not.toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillEmail('invalid@test.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickSubmit();

    // Should show error message
    const error = await loginPage.getError();
    expect(error).toBeTruthy();
    expect(error?.toLowerCase()).toContain('invalid').or.toContain('error').or.toContain('failed');
  });

  test('should show error with empty email', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillPassword('somepassword');
    await loginPage.clickSubmit();

    // HTML5 validation should prevent submission or show error
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should show error with empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.fillEmail('test@test.com');
    await loginPage.clickSubmit();

    // HTML5 validation should prevent submission or show error
    const passwordInput = page.locator('input[id="password"]');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should navigate to forgot password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToForgotPassword();

    // Should show forgot password form
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();
    
    // Should have submit button for forgot password
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});
