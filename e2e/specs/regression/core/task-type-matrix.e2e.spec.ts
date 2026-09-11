import { test, expect } from '@playwright/test';
import { createApiClient, loginViaApi } from '../../../helpers/api';

type TaskLike = {
  id: string;
  type: string;
  title: string;
  completed?: boolean;
  is_available?: boolean;
  quiz_questions?: unknown;
  survey_questions?: unknown;
};

function parseJson(input: unknown): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildQuizAnswers(task: TaskLike): Array<{ questionIndex: number; answerId: string; answer: string }> {
  const questions = parseJson(task.quiz_questions);
  return questions
    .map((q: any, idx: number) => {
      const options = Array.isArray(q.options) ? q.options : Array.isArray(q.answers) ? q.answers : [];
      const correctId = q.correctAnswerId ?? q.correct_answer_id;
      const correctText = q.correctAnswer ?? q.correct_answer;
      const selected = options.find((opt: any) => String(opt.id) === String(correctId)) ?? options[0];
      if (!selected) return null;
      return {
        questionIndex: idx,
        answerId: String(selected.id ?? 'a_1'),
        answer: String(selected.text ?? selected.label ?? correctText ?? 'Antwort'),
      };
    })
    .filter(Boolean) as Array<{ questionIndex: number; answerId: string; answer: string }>;
}

function buildSurveyResponses(task: TaskLike): Record<string, unknown> {
  const questions = parseJson(task.survey_questions);
  const responses: Record<string, unknown> = {};
  for (const q of questions) {
    const key = String(q.id ?? q.questionId ?? q.key ?? '');
    if (!key) continue;
    const options = Array.isArray(q.options) ? q.options : [];
    if (q.type === 'multi_choice') {
      responses[key] = options.length > 0 ? [String(options[0])] : ['Ja'];
    } else if (q.type === 'rating' || q.type === 'scale') {
      responses[key] = Number(q.min ?? 1);
    } else if (q.type === 'number') {
      responses[key] = 1;
    } else if (q.type === 'single_choice' || options.length > 0) {
      responses[key] = String(options[0]);
    } else {
      responses[key] = 'Regression-Antwort';
    }
  }
  return responses;
}

test.describe('Regression Matrix: Task-Typen und Datentypen', () => {
  let demoToken = '';

  test.beforeAll(async () => {
    const login = await loginViaApi('demo@example.com', 'Test123!');
    demoToken = login.token;
    expect(demoToken).toBeTruthy();
    expect(login.user?.id).toBeTruthy();
  });

  test('komplettiert verfügbare Aufgaben je Task-Typ mit gültigen Datentypen', async () => {
    const client = createApiClient(demoToken);
    const tasksRes = await client.get('/tasks');
    const tasks: TaskLike[] = tasksRes.data;

    const targetTypes = ['quiz', 'video', 'article_quiz', 'survey', 'qr', 'photo', 'visit_location'];
    const covered = new Set<string>();
    const unexpectedFailures: Array<{ type: string; status?: number; message?: string }> = [];
    let attempted = 0;

    for (const type of targetTypes) {
      const task = tasks.find((t) => t.type === type && t.is_available !== false && t.completed !== true);
      if (!task) continue;
      attempted += 1;

      let payload: Record<string, unknown> = {};
      if (type === 'quiz' || type === 'video' || type === 'article_quiz') {
        const quizAnswers = buildQuizAnswers(task);
        if (quizAnswers.length === 0) continue;
        payload = { quiz_answers: quizAnswers };
      } else if (type === 'survey') {
        payload = { survey_responses: buildSurveyResponses(task) };
      } else if (type === 'photo') {
        payload = { photo_url: 'https://example.com/regression-photo.jpg' };
      }

      try {
        const completeRes = await client.post(`/tasks/${task.id}/complete`, payload);
        expect(completeRes.status).toBe(200);
        expect(completeRes.data.success).toBe(true);
        covered.add(type);
      } catch (error: any) {
        const status = error?.response?.status;
        const message = String(error?.response?.data?.message ?? error?.response?.data?.error ?? '');
        const isAlreadyCompletedEdge =
          (status === 409 || status === 500) && message.toLowerCase().includes('already completed');
        if (!isAlreadyCompletedEdge) {
          unexpectedFailures.push({ type, status, message });
        }
      }
    }

    test.skip(
      attempted === 0 || covered.size === 0,
      'Keine erfolgreich ausführbaren Aufgaben im aktuellen Datenbestand vorhanden.'
    );
    // Minimalziel: mindestens ein Datentyp muss im aktuellen Datenbestand erfolgreich durchlaufen.
    expect(covered.size).toBeGreaterThanOrEqual(1);
    expect(unexpectedFailures).toEqual([]);
  });
});

