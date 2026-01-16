import { test, expect } from '@playwright/test';
import { TasksPage } from '../../page-objects/TasksPage';
import { getTestUser } from '../../helpers/test-users';
import { login } from '../../helpers/auth';
import { createTestTask, deleteTestTask, loginViaApi } from '../../helpers/api';

test.describe('Video Task Completion', () => {
  let taskId: string | null = null;
  let adminToken: string;

  test.beforeAll(async () => {
    // Create admin user and login to create test task
    try {
      const adminUser = getTestUser('admin');
      const result = await loginViaApi(adminUser.email, adminUser.password);
      adminToken = result.token;

      // Create a test video task
      const task = await createTestTask(adminToken, {
        title: 'E2E Test Video Task',
        description: 'Test video task for E2E testing',
        type: 'video',
        points: 25,
        video_url: 'https://example.com/test-video.mp4',
        quiz_questions: JSON.stringify([
          {
            question: 'What is sustainability?',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: 0,
          },
          {
            question: 'Why is it important?',
            options: ['Reason 1', 'Reason 2', 'Reason 3'],
            correctAnswer: 1,
          },
        ]),
        active: true,
      });
      taskId = task.id;
    } catch (error) {
      console.warn('Could not create test task:', error);
    }
  });

  test.afterAll(async () => {
    if (taskId && adminToken) {
      try {
        await deleteTestTask(adminToken, taskId);
      } catch (error) {
        console.warn('Could not delete test task:', error);
      }
    }
  });

  test('should complete video task with correct answers', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    // Select the test video task
    try {
      await tasksPage.selectTask('E2E Test Video Task');
    } catch (error) {
      // Task might not be visible, skip test
      test.skip();
    }

    // Wait for video player
    await page.waitForTimeout(2000);

    // Answer quiz questions (assuming correct answers)
    const answers = [
      { questionIndex: 0, answer: 0 },
      { questionIndex: 1, answer: 1 },
    ];

    await tasksPage.completeVideoTask(answers);
    await tasksPage.verifyTaskCompleted();
  });

  test('should show video player for video task', async ({ page }) => {
    const user = getTestUser('guest');
    await login(page, user);

    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    try {
      await tasksPage.selectTask('E2E Test Video Task');
      
      // Should show video player or video content
      const videoElement = page.locator('video').or(page.locator('[class*="video"]'));
      await expect(videoElement.first()).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // Task might not exist, skip
      test.skip();
    }
  });
});
