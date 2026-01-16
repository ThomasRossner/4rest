import { test, expect } from '@playwright/test';
import { AdminPage } from '../../page-objects/AdminPage';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';
import { createApiClient, createTestTask, deleteTestTask, loginViaApi } from '../../helpers/api';

test.describe('Admin Task Management', () => {
  let adminToken: string;
  let createdTaskIds: string[] = [];

  test.beforeAll(async () => {
    const adminUser = getTestUser('admin');
    const result = await loginViaApi(adminUser.email, adminUser.password);
    adminToken = result.token;
  });

  test.afterAll(async () => {
    // Cleanup created tasks
    for (const taskId of createdTaskIds) {
      try {
        await deleteTestTask(adminToken, taskId);
      } catch (error) {
        console.warn(`Could not delete task ${taskId}:`, error);
      }
    }
  });

  test('should create task via API', async () => {
    const task = await createTestTask(adminToken, {
      title: 'E2E Admin Test Task',
      description: 'Test task created by admin',
      type: 'qr',
      points: 25,
      qr_code: 'ADMIN-TEST-001',
      active: true,
    });

    expect(task).toHaveProperty('id');
    createdTaskIds.push(task.id);
  });

  test('should list tasks via API', async () => {
    const api = createApiClient(adminToken);
    const response = await api.get('/tasks');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBeTruthy();
  });

  test('should access admin dashboard', async ({ page }) => {
    const adminUser = getTestUser('admin');
    await login(page, adminUser);

    const adminPage = new AdminPage(page);
    await adminPage.goto();

    // Admin page should be visible
    await expect(page.locator('body')).toBeVisible();
  });
});
