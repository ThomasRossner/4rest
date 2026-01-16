import { test, expect } from '@playwright/test';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';

test.describe('Performance', () => {
  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load dashboard quickly after login', async ({ page }) => {
    const user = getTestUser('guest');
    
    const startTime = Date.now();
    await login(page, user);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load tasks page quickly', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const startTime = Date.now();
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have reasonable API response times', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    // Monitor network requests
    const responseTimes: number[] = [];
    
    page.on('response', (response) => {
      const timing = response.timing();
      if (timing) {
        const responseTime = timing.responseEnd - timing.requestStart;
        responseTimes.push(responseTime);
      }
    });

    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Check average response time
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      // Average should be less than 500ms
      expect(avgResponseTime).toBeLessThan(500);
    }
  });
});
