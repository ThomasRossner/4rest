import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTask, getTaskById } from '../services/task.service.js';
import { getPool } from '../database/connection.js';

describe('Task Service', () => {
  let locationId: string;

  beforeAll(async () => {
    // Migration 015 legt den Ort "Online" an und macht tasks.location_id NOT NULL.
    const result = await getPool().query(
      `SELECT id FROM locations WHERE name = 'Online' LIMIT 1`
    );
    if (!result.rows[0]) {
      throw new Error('Default location "Online" is missing. Run migrations before the tests.');
    }
    locationId = result.rows[0].id;
  });

  afterAll(async () => {
    await getPool().end();
  });

  it('should create a task', async () => {
    const taskData = {
      title: `Test Video Task ${Date.now()}`,
      description: 'Watch and learn',
      type: 'video',
      points: 50,
      video_url: 'https://example.com/video.mp4',
      quiz_questions: [
        { question: 'Test question?', options: ['A', 'B', 'C'], correctAnswer: 'A' },
      ],
      co2_savings_kg: 1.5,
      location_id: locationId,
    };

    const task = await createTask(taskData);
    expect(task).toBeDefined();
    expect(task.title).toBe(taskData.title);
    expect(task.type).toBe(taskData.type);
    expect(task.location_id).toBe(locationId);
  });

  it('should retrieve a task by ID', async () => {
    const task = await createTask({
      title: `Test Task ${Date.now()}`,
      type: 'qr',
      points: 20,
      location_id: locationId,
    });

    const retrieved = await getTaskById(task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(task.id);
  });
});
