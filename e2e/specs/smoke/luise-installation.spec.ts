import { test, expect } from '@playwright/test';

/**
 * Sichere Smoke-Tests gegen die konfigurierte baseURL (Standard: https://luise.bio).
 * Kein Login mit echten Konten nötig.
 */
test.describe('Luise Installation (Smoke)', () => {
  test('Startseite lädt', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login-Seite lädt', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('input[id="email"]')).toBeVisible();
  });

  test('Ungültige Zugangsdaten zeigen eine Fehlermeldung', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'e2e-smoke-invalid@test.invalid');
    await page.fill('input[id="password"]', 'wrong-password-e2e-smoke');
    await page.click('button[type="submit"]');

    const error = page.locator('.login-error, .login-field-error').first();
    await expect(error).toBeVisible({ timeout: 20_000 });
    const text = (await error.textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
