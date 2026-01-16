import { Page, expect } from '@playwright/test';
import { QuizAnswer } from '../helpers/tasks';

export class TasksPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/tasks');
    await this.page.waitForLoadState('networkidle');
  }

  async getTasks(): Promise<any[]> {
    // Wait for tasks to load
    await this.page.waitForSelector('[class*="task"], [data-testid*="task"]', { timeout: 10000 });
    
    // Try to get task elements
    const taskElements = await this.page.locator('[class*="task-card"], [class*="task-item"]').all();
    return taskElements;
  }

  async selectTask(taskTitle: string): Promise<void> {
    const taskCard = this.page.locator(`text=${taskTitle}`).first();
    if (await taskCard.isVisible({ timeout: 5000 })) {
      await taskCard.click();
      await this.page.waitForTimeout(1000);
      return;
    }
    
    // Fallback: click first available task
    const firstTask = this.page.locator('[class*="task-card"], [class*="task-item"]').first();
    if (await firstTask.isVisible()) {
      await firstTask.click();
      await this.page.waitForTimeout(1000);
      return;
    }
    
    throw new Error(`Task "${taskTitle}" not found`);
  }

  async selectTaskById(taskId: string): Promise<void> {
    // Try to find task by data attribute or ID
    const taskCard = this.page.locator(`[data-task-id="${taskId}"]`).or(
      this.page.locator(`[id*="${taskId}"]`)
    ).first();
    
    if (await taskCard.isVisible({ timeout: 5000 })) {
      await taskCard.click();
      await this.page.waitForTimeout(1000);
    } else {
      throw new Error(`Task with ID "${taskId}" not found`);
    }
  }

  async completeVideoTask(answers: QuizAnswer[]): Promise<void> {
    await this.page.waitForTimeout(2000);
    
    for (const answer of answers) {
      const answerButton = this.page.locator(`button:has-text("${answer.answer}")`).or(
        this.page.locator(`input[value="${answer.answer}"]`)
      );
      
      if (await answerButton.isVisible({ timeout: 2000 })) {
        await answerButton.click();
        await this.page.waitForTimeout(500);
      }
      
      const nextButton = this.page.locator('button:has-text("Next")').or(
        this.page.locator('button:has-text("Weiter")')
      );
      if (await nextButton.isVisible({ timeout: 1000 })) {
        await nextButton.click();
        await this.page.waitForTimeout(500);
      }
    }
    
    const completeButton = this.page.locator('button:has-text("Complete")').or(
      this.page.locator('button:has-text("Abschließen")')
    );
    if (await completeButton.isVisible()) {
      await completeButton.click();
    }
    
    await this.page.waitForTimeout(2000);
  }

  async completeQRTask(qrCode: string): Promise<void> {
    const qrInput = this.page.locator('input[type="text"]').or(
      this.page.locator('input[placeholder*="QR"]')
    ).first();
    
    if (await qrInput.isVisible()) {
      await qrInput.fill(qrCode);
    }
    
    const verifyButton = this.page.locator('button:has-text("Verify")').or(
      this.page.locator('button:has-text("Prüfen")')
    ).or(this.page.locator('button[type="submit"]'));
    
    await verifyButton.click();
    await this.page.waitForTimeout(2000);
  }

  async completePhotoTask(imagePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(imagePath);
    await this.page.waitForTimeout(1000);
    
    const submitButton = this.page.locator('button:has-text("Upload")').or(
      this.page.locator('button:has-text("Hochladen")')
    ).or(this.page.locator('button[type="submit"]'));
    
    await submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyTaskCompleted(): Promise<void> {
    const successIndicators = [
      'Task completed',
      'Aufgabe abgeschlossen',
      'successfully',
      'erfolgreich',
    ];
    
    for (const indicator of successIndicators) {
      const element = this.page.locator(`text=${indicator}`, { ignoreCase: true });
      if (await element.isVisible({ timeout: 2000 })) {
        return;
      }
    }
    
    if (this.page.url().includes('/tasks')) {
      return;
    }
  }

  async isTaskCompleted(taskTitle: string): Promise<boolean> {
    const taskCard = this.page.locator(`text=${taskTitle}`).first();
    if (await taskCard.isVisible()) {
      const card = taskCard.locator('..');
      const completedText = card.locator('text=completed, text=abgeschlossen', { ignoreCase: true });
      return await completedText.isVisible({ timeout: 1000 }).catch(() => false);
    }
    return false;
  }

  async filterByType(type: string): Promise<void> {
    const filterButton = this.page.locator(`button:has-text("${type}")`).or(
      this.page.locator(`[data-filter="${type}"]`)
    );
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await this.page.waitForTimeout(500);
    }
  }
}
