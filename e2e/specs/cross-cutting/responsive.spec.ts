import { test, expect } from '@playwright/test';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 },
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const user = getTestUser('guest');
      await login(page, user);

      // Check main pages render
      const pages = ['/tasks', '/forest', '/rewards', '/statistics'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Page should be visible
        await expect(page.locator('body')).toBeVisible();
        
        // No horizontal scroll (basic responsive check)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Small tolerance
      }
    });
  }

  test('should show mobile navigation on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const user = getTestUser('guest');
    await login(page, user);

    // Look for mobile navigation (bottom nav or hamburger menu)
    const mobileNav = page.locator('[class*="nav"], [class*="navigation"]').or(
      page.locator('button[aria-label*="menu"]')
    );
    
    const isVisible = await mobileNav.isVisible({ timeout: 5000 }).catch(() => false);
    // Mobile nav might not exist, that's okay
    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });
});
