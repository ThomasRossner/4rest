import { test, expect } from '@playwright/test';

test.describe('Task Completion', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
  });

  test('user can complete a video task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Find and click a video task
    await page.click('text=Video Task');
    
    // Watch video (simulate)
    await page.waitForTimeout(2000);
    
    // Answer quiz questions
    await page.click('button:has-text("Correct Answer")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Correct Answer 2")');
    
    // Complete task
    await page.click('button:has-text("Complete Task")');
    
    // Should show success message
    await expect(page.locator('text=Task completed successfully')).toBeVisible();
  });

  test('user can scan QR code', async ({ page }) => {
    await page.goto('/tasks');
    
    // Find QR code task
    await page.click('text=QR Code Challenge');
    
    // Enter QR code manually (for testing)
    await page.fill('input[type="text"]', 'TEST-QR-CODE-123');
    await page.click('button:has-text("Verify")');
    
    // Should complete task
    await expect(page.locator('text=Task completed successfully')).toBeVisible();
  });

  test('user can upload photo for task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Find photo task
    await page.click('text=Photo Challenge');
    
    // Upload test image
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg');
    
    // Submit
    await page.click('button:has-text("Upload & Complete")');
    
    // Should show success
    await expect(page.locator('text=Photo uploaded')).toBeVisible();
  });
});
