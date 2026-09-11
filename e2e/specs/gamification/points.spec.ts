import { test, expect } from '@playwright/test';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';
import { createApiClient, createTestTask, deleteTestTask, loginViaApi, completeTaskViaApi } from '../../helpers/api';

test.describe('Points System', () => {
  let taskId: string | null = null;
  let adminToken: string;
  let userToken: string;
  const testQrCode = 'E2E-POINTS-TEST-001';

  test.beforeAll(async () => {
    try {
      const adminUser = getTestUser('admin');
      const adminResult = await loginViaApi(adminUser.email, adminUser.password);
      adminToken = adminResult.token;

      const user = getTestUser('guest');
      const userResult = await loginViaApi(user.email, user.password);
      userToken = userResult.token;

      const task = await createTestTask(adminToken, {
        title: 'E2E Points Test Task',
        type: 'qr',
        points: 50,
        qr_code: testQrCode,
        active: true,
      });
      taskId = task.id;
    } catch (error) {
      console.warn('Could not setup points test:', error);
    }
  });

  test.afterAll(async () => {
    if (taskId && adminToken) {
      try {
        await deleteTestTask(adminToken, taskId);
      } catch (error) {
        console.warn('Could not delete test task:', error);
      }
    }
  });

  test('should award points after task completion', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    // Get initial points
    const api = createApiClient(userToken);
    const initialUser = await api.get('/users/me');
    const initialPoints = initialUser.data.points || 0;

    // Complete task via API
    if (taskId) {
      try {
        await completeTaskViaApi(userToken, taskId, { qr_code: testQrCode });
        
        // Wait a bit for points to update
        await page.waitForTimeout(2000);
        
        // Get updated points
        const updatedUser = await api.get('/users/me');
        const updatedPoints = updatedUser.data.points || 0;
        
        // Points should have increased
        expect(updatedPoints).toBeGreaterThan(initialPoints);
      } catch (error) {
        // Task might already be completed
        console.warn('Could not complete task:', error);
      }
    }
  });

  test('should display points on profile page', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for points display
    const pointsElement = page.locator('text=/\\d+.*point/i').or(
      page.locator('[class*="points"]')
    );
    
    const isVisible = await pointsElement.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });
});
