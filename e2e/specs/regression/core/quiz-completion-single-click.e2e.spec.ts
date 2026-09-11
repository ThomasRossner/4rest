import { test, expect } from '@playwright/test';
import { createApiClient, loginViaApi } from '../../../helpers/api';

type PreparedTask = {
  id: string;
  title: string;
  type: string;
  quiz_questions?: unknown;
};

function parseQuestions(raw: unknown): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function loginAsGuest(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#email', 'demo@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

async function openFirstQuizLikeTask(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/tasks');
  await page.waitForLoadState('networkidle');

  const categories = page.locator('.tasks-category-tile');
  const count = await categories.count();

  for (let i = 0; i < count; i += 1) {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await categories.nth(i).click();
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.task-card--list-tile:not(.task-card-locked)');
    const cardCount = await cards.count();
    for (let c = 0; c < cardCount; c += 1) {
      const card = cards.nth(c);
      if (!(await card.isVisible().catch(() => false))) continue;
      await card.click();
      await page.waitForLoadState('networkidle');

      const startButton = page.getByRole('button', { name: /aufgabe starten|start/i }).first();
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click();
        await page.waitForLoadState('networkidle');
      }

      if ((await page.locator('.answer-button').count()) > 0) {
        const title = (await page.locator('.tasks-execution-title').first().textContent().catch(() => ''))?.trim();
        return title || null;
      }

      const back = page.locator('.tasks-back-from-task, .tasks-icon-back').first();
      if (await back.isVisible().catch(() => false)) {
        await back.click();
      } else {
        await page.goBack();
      }
      await page.waitForLoadState('networkidle');
    }
  }

  return null;
}

test.describe('Regression: One-Click Completion für Quiz-Varianten', () => {
  test('erster Klick auf Antwort prüfen sendet answer + complete bei letzter Frage', async ({ page }) => {
    const login = await loginViaApi('demo@example.com', 'Test123!');
    const demoToken = login.token;
    const tasks = (await createApiClient(demoToken).get('/tasks')).data as PreparedTask[];

    await loginAsGuest(page);
    const taskTitle = await openFirstQuizLikeTask(page);
    test.skip(!taskTitle, 'Keine quizartige Aufgabe in der aktuellen UI sichtbar.');

    const task = tasks.find((t) => t.title === taskTitle);
    test.skip(!task, `Aufgabe "${taskTitle}" nicht in API-Liste gefunden.`);

    const questions = parseQuestions(task!.quiz_questions);
    test.skip(questions.length === 0, `Aufgabe "${taskTitle}" hat keine Quizfragen.`);
    const q0 = questions[0];
    const options = Array.isArray(q0?.options) ? q0.options : Array.isArray(q0?.answers) ? q0.answers : [];
    const correctId = q0?.correctAnswerId ?? q0?.correct_answer_id;
    const correctOpt = options.find((o: any) => String(o?.id) === String(correctId)) ?? options[0];
    const optionText = String(correctOpt?.text ?? correctOpt?.label ?? q0?.correctAnswer ?? q0?.correct_answer ?? '');
    test.skip(!optionText, `Konnte für "${taskTitle}" keine korrekte Option ableiten.`);

    const observed: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes(`/api/tasks/${task!.id}/quiz/answer`)) observed.push('answer');
      if (url.includes(`/api/tasks/${task!.id}/complete`)) observed.push('complete');
    });

    const correctOption = page.locator('.answer-button').filter({ hasText: optionText }).first();
    await expect(correctOption).toBeVisible();
    await correctOption.click({ force: true });

    const checkButton = page.locator('.submit-button').first();
    await expect(checkButton).toBeVisible();
    await checkButton.click({ force: true });

    await expect.poll(() => observed.join(',')).toContain('answer');
    await expect.poll(() => observed.join(',')).toContain('complete');
  });
});

