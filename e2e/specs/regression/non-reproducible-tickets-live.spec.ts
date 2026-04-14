import { test, expect, Page } from '@playwright/test';
const demoUser = {
  email: 'demo@example.com',
  password: 'Test123!',
  name: 'Demo User',
  role: 'guest' as const,
};

const pagePaths = ['/', '/tasks', '/rewards', '/forest'];

async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[id="email"]', demoUser.email);
  await page.fill('input[id="password"]', demoUser.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText('Sign In');
  await expect(page.locator('body')).not.toContainText('Anmelden');
}

async function getHorizontalOverflowPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return Math.max(0, document.documentElement.scrollWidth - viewportWidth);
  });
}

test.describe('Live Regression: Nicht reproduzierbare Tickets', () => {
  test.use({ baseURL: 'https://luise.bio' });

  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('TICKET-041: Keine horizontalen Scrollbalken nach Login', async ({ page }) => {
    for (const path of pagePaths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect
        .poll(async () => getHorizontalOverflowPx(page), { message: `Horizontaler Overflow auf ${path}` })
        .toBeLessThanOrEqual(24);
    }
  });

  test('TICKET-044: Root-Navigation behält lesbaren Kontrast nach Seitenwechsel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navLink = page.locator('nav a').first();
    await expect(navLink).toBeVisible();

    const before = await navLink.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });

    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const after = await page.locator('nav a').first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });

    expect(after.color).toBe(before.color);
    expect(after.backgroundColor).toBe(before.backgroundColor);
  });

  test('TICKET-046: Quiz-Falschantwort zeigt klaren Hinweis (wenn Quiz vorhanden)', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    const quizCard = page
      .locator('[data-testid*="task"], .task-card, article')
      .filter({ hasText: /quiz/i })
      .first();

    if (!(await quizCard.isVisible().catch(() => false))) {
      test.skip(true, 'Keine Quiz-Aufgabe im Demo-Account sichtbar.');
    }

    await quizCard.click();
    await page.waitForLoadState('networkidle');

    const options = page.locator('input[type="radio"], button, [role="radio"]');
    if ((await options.count()) < 2) {
      test.skip(true, 'Quiz ohne auswählbare Antwortoptionen.');
    }

    await options.first().click();

    const submitButton = page.getByRole('button', { name: /abschlie|complete|fertig|submit/i }).first();
    if (!(await submitButton.isVisible().catch(() => false))) {
      test.skip(true, 'Kein Abschluss-Button im Quiz gefunden.');
    }

    await submitButton.click();
    await page.waitForTimeout(500);

    const feedback = page.locator('text=/falsch|incorrect|try again|erneut|nochmal/i').first();
    await expect(feedback).toBeVisible();
  });

  test('TICKET-049: Keine abgeschnittenen Layouts auf Kernseiten (mobile Breite)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/rewards', '/tasks']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect
        .poll(async () => getHorizontalOverflowPx(page), { message: `Mobiler Overflow auf ${path}` })
        .toBeLessThanOrEqual(24);
    }
  });

  test('TICKET-050: Reload bleibt auf derselben Unterseite', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/tasks/);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/tasks/);
  });

  test('TICKET-051: Rewards-Seite zeigt keine doppelten Haupttitel/Zurueck-Elemente', async ({ page }) => {
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');

    const h1Titles = await page.locator('h1:visible').allTextContents();
    const normalizedH1 = h1Titles.map((t) => t.trim().toLowerCase()).filter(Boolean);
    const duplicateH1 = normalizedH1.filter((t, i) => normalizedH1.indexOf(t) !== i);
    expect(duplicateH1).toEqual([]);

    const backButtons = page.getByRole('button', { name: /zurück|zurueck|back/i });
    const backCount = await backButtons.count();
    expect(backCount).toBeLessThanOrEqual(1);
  });

  test('TICKET-052: Kamerafehler zeigt keine englischen Fragmente (falls Dialog ausloesbar)', async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');

    const cameraTrigger = page
      .getByRole('button', { name: /kamera|camera|scan|qr|einlösen|einloesen|redeem/i })
      .first();

    if (!(await cameraTrigger.isVisible().catch(() => false))) {
      test.skip(true, 'Kein Kamera-/Scan-Trigger im aktuellen Rewards-UI gefunden.');
    }

    await cameraTrigger.click();
    await page.waitForTimeout(1000);

    const englishFragments = page.locator(
      'text=/permission denied|allow access|camera access|not allowed|cancelled/i'
    );
    await expect(englishFragments).toHaveCount(0);
  });

  test('TICKET-053: Keine rohe "Forbidden"-Meldung in Wettbewerbsverwaltung', async ({ page }) => {
    await page.goto('/contests');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText.includes('forbidden')).toBe(false);
  });

  test('TICKET-054: Kein i18n-Key im Wettbewerbs-Loechdialog', async ({ page }) => {
    await page.goto('/contests');
    await page.waitForLoadState('networkidle');

    const deleteButton = page.getByRole('button', { name: /lösch|loesch|delete/i }).first();
    if (!(await deleteButton.isVisible().catch(() => false))) {
      test.skip(true, 'Kein Lösch-Button sichtbar (Rolle/Feature nicht verfügbar).');
    }

    await deleteButton.click();

    const keyLeak = page.locator('text=/[0-9]+rezeption\\.contest\\.manage\\.contest/i').first();
    await expect(keyLeak).toHaveCount(0);
  });

  test('TICKET-055: Dekorative Nav-Icons sind fuer Screenreader verborgen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navImages = page.locator('nav img');
    const count = await navImages.count();
    for (let i = 0; i < count; i += 1) {
      const img = navImages.nth(i);
      const alt = (await img.getAttribute('alt')) ?? '';
      const ariaHidden = await img.getAttribute('aria-hidden');
      expect(alt.trim() === '' || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('TICKET-056: Wettbewerb-bearbeiten-Flow ohne kaputten Navigationszustand', async ({ page }) => {
    await page.goto('/contests');
    await page.waitForLoadState('networkidle');

    const editButton = page.getByRole('button', { name: /bearbeit|edit/i }).first();
    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip(true, 'Kein Bearbeiten-Button sichtbar (Rolle/Feature nicht verfügbar).');
    }

    await editButton.click();
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    expect(bodyText.toLowerCase().includes('error')).toBe(false);
  });

  test('TICKET-057: Rewards-Texte enthalten nicht "Strafen"', async ({ page }) => {
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText.includes('strafen')).toBe(false);
  });
});
