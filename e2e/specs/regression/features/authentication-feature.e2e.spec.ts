import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

test.describe('Feature: Authentifizierung', () => {
  test('Given gültige Nutzerdaten, When Login ausgeführt, Then Benutzer landet im geschützten Bereich', async ({
    page,
  }) => {
    await login(page, 'demo@example.com', 'Test123!');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator('body')).toContainText(/aufgaben|wald|belohnungen|rankings/i);
  });

  test('Given ungültige Nutzerdaten, When Login ausgeführt, Then sichtbare Fehlermeldung erscheint', async ({
    page,
  }) => {
    await login(page, 'demo@example.com', 'falsches-passwort');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(
      /invalid|error|failed|konto|passwort|account|password|incorrect|nicht korrekt|ungültig/i
    );
  });
});

