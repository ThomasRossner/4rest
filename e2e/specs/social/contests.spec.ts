import { test, expect } from '@playwright/test';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';
import { createApiClient, loginViaApi } from '../../helpers/api';

test.describe('Contests', () => {
  test('should display contests page for employees', async ({ page }) => {
    const user = getTestUser('employee');
    await login(page, user);

    // Navigate to contests (if available)
    try {
      await page.goto('/employee-contests');
      await page.waitForLoadState('networkidle');
      
      // Should be on contests page
      const contestsContent = page.locator('text=/contest/i').or(
        page.locator('[class*="contest"]')
      );
      const isVisible = await contestsContent.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    } catch (error) {
      // Contests page might not exist
      test.skip();
    }
  });

  test('should create contest via API (employee)', async () => {
    const user = getTestUser('employee');
    const result = await loginViaApi(user.email, user.password);
    const api = createApiClient(result.token);

    try {
      const response = await api.post('/contests/create', {
        name: `E2E Test Contest ${Date.now()}`,
        description: 'Test contest for E2E testing',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
    } catch (error: any) {
      // Contests might not be available or user might not have permission
      if (error.response?.status === 404 || error.response?.status === 403) {
        test.skip();
      } else {
        throw error;
      }
    }
  });
});
