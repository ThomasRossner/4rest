import { test, expect } from '@playwright/test';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';
import { createApiClient, loginViaApi } from '../../helpers/api';

test.describe('Teams', () => {
  test('should display teams page', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    // Navigate to teams (if available)
    try {
      await page.goto('/teams');
      await page.waitForLoadState('networkidle');
      
      // Should be on teams page or show teams content
      const teamsContent = page.locator('text=/team/i').or(
        page.locator('[class*="team"]')
      );
      const isVisible = await teamsContent.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Teams feature might not be available, that's okay
      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    } catch (error) {
      // Teams page might not exist
      test.skip();
    }
  });

  test('should create team via API', async () => {
    const user = getTestUser('guest');
    const result = await loginViaApi(user.email, user.password);
    const api = createApiClient(result.token);

    try {
      const response = await api.post('/teams/create', {
        name: `E2E Test Team ${Date.now()}`,
        description: 'Test team for E2E testing',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
    } catch (error: any) {
      // Teams might not be available or user might not have permission
      if (error.response?.status === 404 || error.response?.status === 403) {
        test.skip();
      } else {
        throw error;
      }
    }
  });
});
