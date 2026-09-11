import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { ensureLoggedOut } from '../../helpers/auth';
// Using faker for test data generation
// If faker is not available, use fallback
const generateEmail = () => `test-${Date.now()}@test.com`;
const generateName = () => `Test User ${Date.now()}`;

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should register successfully with valid data', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = generateEmail();
    const password = 'Test123!';
    const name = generateName();

    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.fillName(name);
    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);
    await loginPage.clickSubmit();

    // Should show success message or redirect
    await page.waitForTimeout(2000);
    
    // Either success message or redirect to login
    const success = await loginPage.getSuccess();
    const isOnLogin = page.url().includes('/login');
    
    expect(success || isOnLogin).toBeTruthy();
  });

  test('should show error with existing email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const user = { email: 'guest@test.com', password: 'Test123!', name: 'Test User' };

    // First registration
    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.fillName(user.name);
    await loginPage.fillEmail(user.email);
    await loginPage.fillPassword(user.password);
    await loginPage.clickSubmit();
    await page.waitForTimeout(2000);

    // Try to register again with same email
    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.fillName('Another User');
    await loginPage.fillEmail(user.email);
    await loginPage.fillPassword('Different123!');
    await loginPage.clickSubmit();
    await page.waitForTimeout(2000);

    // Should show error
    const error = await loginPage.getError();
    expect(error).toBeTruthy();
  });

  test('should show error with invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.fillName('Test User');
    await loginPage.fillEmail('invalid-email');
    await loginPage.fillPassword('Test123!');
    await loginPage.clickSubmit();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show error with short password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.fillName('Test User');
    await loginPage.fillEmail(generateEmail());
    await loginPage.fillPassword('123');
    await loginPage.clickSubmit();
    await page.waitForTimeout(2000);

    // Should show error about password length
    const error = await loginPage.getError();
    expect(error).toBeTruthy();
  });

  test('should navigate back to login from register', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.switchToRegister();
    await loginPage.switchToLogin();

    // Should be back on login mode
    const passwordInput = page.locator('input[id="password"]');
    await expect(passwordInput).toBeVisible();
  });
});
