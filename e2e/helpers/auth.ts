import { Page, expect } from '@playwright/test';
import { TestUser } from './test-users';

export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard/home
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
  
  // Verify we're logged in by checking for user name or navigation
  await expect(page.locator('body')).not.toContainText('Sign In');
}

export async function register(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  
  // Switch to register mode
  const registerButton = page.locator('button.link-button:has-text("Register")').first();
  if (await registerButton.isVisible()) {
    await registerButton.click();
  } else {
    // Try clicking text directly
    await page.click('text=Register', { timeout: 2000 }).catch(() => {
      // If register link not found, might already be in register mode
    });
  }
  
  // Wait a bit for mode switch
  await page.waitForTimeout(500);
  
  // Fill registration form
  await page.fill('input[id="name"]', user.name);
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);
  await page.click('button[type="submit"]');
  
  // Wait for success message or redirect
  await page.waitForTimeout(2000);
  
  // Check for success or error
  const successMessage = page.locator('.login-success');
  const errorMessage = page.locator('.login-error');
  
  // If there's an error about existing user, that's okay for tests
  const errorText = await errorMessage.textContent().catch(() => null);
  if (errorText && errorText.includes('already exists')) {
    // User already exists, try to login instead
    await login(page, user);
    return;
  }
  
  // Wait for redirect or success
  await page.waitForTimeout(2000);
}

export async function logout(page: Page): Promise<void> {
  // Look for logout button in navigation or user menu
  const logoutButton = page.locator('text=Logout').or(page.locator('button:has-text("Logout")'));
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
  }
}

export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto('/login');
  // If already on login page, we're good
  if (page.url().includes('/login')) {
    return;
  }
  // Otherwise try to logout
  await logout(page);
}
