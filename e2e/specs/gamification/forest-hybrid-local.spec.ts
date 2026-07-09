import { test, expect } from '@playwright/test';

test.describe('Hybrid Forest local smoke', () => {
  test('demo user sees forest canvas without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/login');
    await page.fill('input[id="email"]', 'demo@example.com');
    await page.fill('input[id="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$|\/$/, { timeout: 15000 });

    const forestResponse = page.waitForResponse(
      (res) => res.url().includes('/api/forest') && res.status() === 200,
      { timeout: 20000 }
    );

    await page.goto('/forest');
    const response = await forestResponse;
    const forest = await response.json();

    await page.waitForSelector('canvas', { timeout: 20000 });
    await expect(page.locator('.forest-page')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);

    expect(forest.totalTrees).toBeGreaterThan(0);
    expect(Array.isArray(forest.trees)).toBeTruthy();
    expect(forest.trees.length).toBe(forest.totalTrees);

    const criticalErrors = consoleErrors.filter(
      (line) =>
        !line.includes('favicon') &&
        !line.includes('WebGL') &&
        !line.includes('THREE') &&
        !line.includes('WebSocket')
    );
    expect(criticalErrors).toEqual([]);
  });
});
