import { test, expect } from '@playwright/test';
import { createApiClient, loginViaApi } from '../../../helpers/api';

type TaskResponse = {
  id: string;
  title: string;
  type: string;
  is_available?: boolean;
  completed?: boolean;
  quiz_locked_until?: string | null;
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

async function loginDemoUi(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#email', 'demo@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

async function openTaskByTitle(page: import('@playwright/test').Page, title: string) {
  await page.goto('/tasks');
  await page.waitForLoadState('networkidle');

  const categories = page.locator('.tasks-category-tile');
  const total = await categories.count();
  for (let i = 0; i < total; i += 1) {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    await categories.nth(i).click();
    await page.waitForLoadState('networkidle');

    const card = page
      .locator('.task-card--list-tile:not(.task-card-locked)')
      .filter({ has: page.locator('.task-title--tile-middle', { hasText: title }) })
      .first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await page.waitForLoadState('networkidle');
      const start = page.getByRole('button', { name: /aufgabe starten|start/i }).first();
      if (await start.isVisible().catch(() => false)) {
        await start.click();
        await page.waitForLoadState('networkidle');
      }
      return;
    }
  }

  throw new Error(`Quiz-Aufgabe "${title}" wurde in der UI nicht gefunden.`);
}

test.describe('Feature: Quiz-Abschluss', () => {
  test('Given letzte Frage, When Nutzer auf "Antwort prüfen" klickt, Then /quiz/answer und /complete werden im selben Flow ausgeführt', async ({
    page,
  }) => {
    const login = await loginViaApi('demo@example.com', 'Test123!');
    const api = createApiClient(login.token);
    const tasks = (await api.get('/tasks')).data as TaskResponse[];
    const candidates = tasks.filter(
      (t) =>
        (t.type === 'quiz' || t.type === 'video' || t.type === 'article_quiz') &&
        t.is_available !== false &&
        t.completed !== true &&
        !t.quiz_locked_until
    );
    test.skip(candidates.length === 0, 'Keine verfügbare quizartige Aufgabe im aktuellen Datenstand.');

    await loginDemoUi(page);
    let success = false;
    for (const target of candidates) {
      const questions = parseQuestions(target.quiz_questions);
      if (questions.length === 0) continue;
      const q0 = questions[0];
      const options = Array.isArray(q0?.options) ? q0.options : Array.isArray(q0?.answers) ? q0.answers : [];
      const correctId = q0?.correctAnswerId ?? q0?.correct_answer_id;
      const correctOpt = options.find((o: any) => String(o?.id) === String(correctId)) ?? options[0];
      const optionText = String(
        correctOpt?.text ?? correctOpt?.label ?? q0?.correctAnswer ?? q0?.correct_answer ?? ''
      );
      if (!optionText) continue;

      const seen: string[] = [];
      page.removeAllListeners('response');
      page.on('response', (response) => {
        const url = response.url();
        if (url.includes(`/api/tasks/${target.id}/quiz/answer`)) seen.push('answer');
        if (url.includes(`/api/tasks/${target.id}/complete`)) seen.push('complete');
      });

      try {
        await openTaskByTitle(page, target.title);
        const optionBtn = page.locator('.answer-button').filter({ hasText: optionText }).first();
        if (!(await optionBtn.isVisible().catch(() => false))) continue;
        await optionBtn.click({ force: true });

        const submitBtn = page.locator('.submit-button').first();
        if (!(await submitBtn.isVisible().catch(() => false))) continue;
        await submitBtn.click({ force: true });

        await expect.poll(() => seen.join(','), { timeout: 8000 }).toContain('answer');
        await expect.poll(() => seen.join(','), { timeout: 8000 }).toContain('complete');
        success = true;
        break;
      } catch {
        // try next candidate
      }
    }

    expect(success).toBeTruthy();
  });
});

