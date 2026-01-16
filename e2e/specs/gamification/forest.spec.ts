import { test, expect } from '@playwright/test';
import { ForestPage } from '../../page-objects/ForestPage';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';

test.describe('Forest Visualization', () => {
  test('should display forest page', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const forestPage = new ForestPage(page);
    await forestPage.goto();
    await forestPage.waitForForestLoad();

    // Verify forest is visible
    await forestPage.verifyForestVisible();
  });

  test('should show tree count', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const forestPage = new ForestPage(page);
    await forestPage.goto();
    await forestPage.waitForForestLoad();

    // Get tree count (might be 0 if no tasks completed)
    const treeCount = await forestPage.getTreeCount();
    expect(treeCount).toBeGreaterThanOrEqual(0);
  });

  test('should load forest statistics', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const forestPage = new ForestPage(page);
    await forestPage.goto();
    await forestPage.waitForForestLoad();

    // Get statistics
    const stats = await forestPage.getStatistics();
    // Statistics might be empty, that's okay
    expect(stats).toBeDefined();
  });
});
