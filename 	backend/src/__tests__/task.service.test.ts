import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTask, getTaskById, completeTask } from '../services/task.service.js';
import { getPool } from '../database/connection.js';

describe('Task Service', () => {
  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Cleanup
    await getPool().end();
  });

  it('should create a task', async () => {
    const taskData = {
      title: 'Test Video Task',
      description: 'Watch and learn',
      type: 'video',
      points: 50,
      video_url: 'https://example.com/video.mp4',
      quiz_questions: [
        { question: 'Test question?', options: ['A', 'B', 'C'], correctAnswer: 'A' },
      ],
      co2_savings_kg: 1.5,
    };

    const task = await createTask(taskData);
    expect(task).toBeDefined();
    expect(task.title).toBe(taskData.title);
    expect(task.type).toBe(taskData.type);
  });

  it('should retrieve a task by ID', async () => {
    // Create test task first
    const task = await createTask({
      title: 'Test Task',
      type: 'qr',
      points: 20,
    });

    const retrieved = await getTaskById(task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(task.id);
  });
});
