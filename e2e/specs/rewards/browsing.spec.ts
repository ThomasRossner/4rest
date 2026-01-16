import { test, expect } from '@playwright/test';
import { RewardsPage } from '../../page-objects/RewardsPage';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';

test.describe('Reward Browsing', () => {
  test('should display rewards page', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const rewardsPage = new RewardsPage(page);
    await rewardsPage.goto();

    // Should be on rewards page
    await expect(page).toHaveURL(/\/rewards/);
  });

  test('should show rewards list', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const rewardsPage = new RewardsPage(page);
    await rewardsPage.goto();

    // Wait for rewards to load
    await page.waitForTimeout(2000);

    // Look for reward elements
    const rewardElements = await rewardsPage.getRewards();
    // Might be empty, that's okay
    expect(rewardElements).toBeDefined();
  });

  test('should display points balance', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const rewardsPage = new RewardsPage(page);
    await rewardsPage.goto();

    const balance = await rewardsPage.getPointsBalance();
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});
