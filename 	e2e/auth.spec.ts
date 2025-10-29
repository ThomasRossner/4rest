import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    await page.goto('/login');
    
    // Register new user
    await page.click('text=Register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('user can logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });
});
