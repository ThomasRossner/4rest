import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { TasksPage } from '../../page-objects/TasksPage';
import { RewardsPage } from '../../page-objects/RewardsPage';
import { ForestPage } from '../../page-objects/ForestPage';
import { getTestUser } from '../../helpers/test-users';
import { ensureLoggedOut } from '../../helpers/auth';

test.describe('Guest User Journey', () => {
  test('complete guest journey: register -> browse tasks -> view forest -> check rewards', async ({ page }) => {
    // Start logged out
    await ensureLoggedOut(page);

    // Step 1: Register (or login if already exists)
    const loginPage = new LoginPage(page);
    const user = getTestUser('guest');
    
    try {
      await loginPage.goto();
      await loginPage.switchToRegister();
      await loginPage.fillName(user.name);
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickSubmit();
      await page.waitForTimeout(2000);
    } catch (error) {
      // User might already exist, try login
      await loginPage.goto();
      await loginPage.fillEmail(user.email);
      await loginPage.fillPassword(user.password);
      await loginPage.clickSubmit();
      await page.waitForTimeout(2000);
    }

    // Step 2: Navigate to tasks
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();
    await expect(page).toHaveURL(/\/tasks/);

    // Step 3: View forest
    const forestPage = new ForestPage(page);
    await forestPage.goto();
    await forestPage.waitForForestLoad();
    await expect(page).toHaveURL(/\/forest/);

    // Step 4: Check rewards
    const rewardsPage = new RewardsPage(page);
    await rewardsPage.goto();
    await expect(page).toHaveURL(/\/rewards/);

    // Step 5: Check profile/statistics
    await page.goto('/statistics');
    await expect(page).toHaveURL(/\/statistics/);
  });

  test('should navigate through all main sections', async ({ page }) => {
    const user = getTestUser('guest');
    const loginPage = new LoginPage(page);
    
    await loginPage.login(user);

    // Navigate through main sections
    const sections = ['/tasks', '/forest', '/rewards', '/statistics'];
    
    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(section));
    }
  });
});
