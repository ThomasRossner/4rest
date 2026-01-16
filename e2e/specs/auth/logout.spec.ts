import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { getTestUser } from '../../helpers/test-users';
import { login, logout } from '../../helpers/auth';

test.describe('Logout', () => {
  test('should logout successfully', async ({ page }) => {
    const user = getTestUser('guest');
    
    // Login first
    await login(page, user);
    
    // Verify we're logged in
    await expect(page).toHaveURL(/\/(dashboard|$)/);
    
    // Logout
    await logout(page);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show login form
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('should not access protected routes after logout', async ({ page }) => {
    const user = getTestUser('guest');
    
    // Login
    await login(page, user);
    
    // Logout
    await logout(page);
    
    // Try to access protected route
    await page.goto('/tasks');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
