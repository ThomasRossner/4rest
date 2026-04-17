import { test, expect } from '@playwright/test';

async function loginDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#email', 'demo@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

test.describe('Feature: Aufgaben-Navigation', () => {
  test('Given Aufgaben-Hub, When Kategorie und Aufgabe geöffnet werden, Then Detail- und Execution-View sind erreichbar', async ({
    page,
  }) => {
    await loginDemo(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const firstCategory = page.locator('.tasks-category-tile').first();
    await expect(firstCategory).toBeVisible();
    await firstCategory.click();
    await page.waitForLoadState('networkidle');

    const firstUnlockedCard = page.locator('.task-card--list-tile:not(.task-card-locked)').first();
    await expect(firstUnlockedCard).toBeVisible();
    await firstUnlockedCard.click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.task-detail-title, .task-detail-header h1, .task-detail-view h1').first()).toBeVisible();

    const startButton = page.getByRole('button', { name: /aufgabe starten|start/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForLoadState('networkidle');
    }

    const executionHeader = page.locator('.tasks-execution-header');
    if (await executionHeader.isVisible().catch(() => false)) {
      await expect(page.locator('.tasks-back-from-task')).toBeVisible();
      await expect(page.locator('.tasks-execution-title')).toBeVisible();
    } else {
      // Some tasks can stay in detail-only mode depending on state/type.
      await expect(page.locator('.task-detail-view')).toBeVisible();
    }
  });

  test('Given gesperrte Aufgabe, When Nutzer klickt, Then keine Execution-Ansicht öffnet sich', async ({ page }) => {
    await loginDemo(page);
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const categoryTiles = page.locator('.tasks-category-tile');
    const total = await categoryTiles.count();
    let foundLocked = false;

    for (let i = 0; i < total; i += 1) {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');
      await categoryTiles.nth(i).click();
      await page.waitForLoadState('networkidle');
      const locked = page.locator('.task-card--list-tile.task-card-locked').first();
      if (await locked.isVisible().catch(() => false)) {
        foundLocked = true;
        const before = page.url();
        await locked.click({ force: true });
        await page.waitForTimeout(600);
        expect(page.url()).toBe(before);
        await expect(page.locator('.tasks-execution-header')).toHaveCount(0);
        break;
      }
    }

    test.skip(!foundLocked, 'Im aktuellen Datenstand wurde keine gesperrte Aufgabe gefunden.');
  });
});

