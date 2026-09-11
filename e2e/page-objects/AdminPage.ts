import { Page, expect } from '@playwright/test';

export class AdminPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async createTask(task: {
    title: string;
    description?: string;
    type: string;
    points: number;
    qr_code?: string;
    video_url?: string;
    active?: boolean;
  }): Promise<void> {
    // Navigate to task creation
    const createTaskButton = this.page.locator('button:has-text("Create Task")').or(
      this.page.locator('button:has-text("Aufgabe erstellen")')
    );
    
    if (await createTaskButton.isVisible()) {
      await createTaskButton.click();
      await this.page.waitForTimeout(1000);
    }
    
    // Fill form
    await this.page.fill('input[name="title"], input[placeholder*="title"]', task.title);
    
    if (task.description) {
      await this.page.fill('textarea[name="description"], textarea[placeholder*="description"]', task.description);
    }
    
    // Select task type
    const typeSelect = this.page.locator('select[name="type"]').or(
      this.page.locator('[name="type"]')
    );
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(task.type);
    }
    
    // Fill points
    await this.page.fill('input[name="points"], input[type="number"]', task.points.toString());
    
    // Fill type-specific fields
    if (task.qr_code) {
      await this.page.fill('input[name="qr_code"]', task.qr_code);
    }
    
    if (task.video_url) {
      await this.page.fill('input[name="video_url"]', task.video_url);
    }
    
    // Submit
    const submitButton = this.page.locator('button[type="submit"]').or(
      this.page.locator('button:has-text("Create")')
    );
    await submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async createReward(reward: {
    title: string;
    description?: string;
    cost: number;
    type: string;
    active?: boolean;
  }): Promise<void> {
    // Navigate to reward creation
    const createRewardButton = this.page.locator('button:has-text("Create Reward")').or(
      this.page.locator('button:has-text("Belohnung erstellen")')
    );
    
    if (await createRewardButton.isVisible()) {
      await createRewardButton.click();
      await this.page.waitForTimeout(1000);
    }
    
    // Fill form
    await this.page.fill('input[name="title"]', reward.title);
    
    if (reward.description) {
      await this.page.fill('textarea[name="description"]', reward.description);
    }
    
    await this.page.fill('input[name="cost"]', reward.cost.toString());
    
    // Select reward type
    const typeSelect = this.page.locator('select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(reward.type);
    }
    
    // Submit
    const submitButton = this.page.locator('button[type="submit"]');
    await submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async deleteTask(taskTitle: string): Promise<void> {
    // Find task in list
    const taskRow = this.page.locator(`text=${taskTitle}`).first();
    if (await taskRow.isVisible()) {
      // Find delete button
      const deleteButton = taskRow.locator('..').locator('button:has-text("Delete")').or(
        taskRow.locator('..').locator('button:has-text("Löschen")')
      );
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await this.page.waitForTimeout(1000);
        
        // Confirm deletion if needed
        const confirmButton = this.page.locator('button:has-text("Confirm")').or(
          this.page.locator('button:has-text("Bestätigen")')
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  }

  async navigateToUserManagement(): Promise<void> {
    const userMenu = this.page.locator('button:has-text("Users")').or(
      this.page.locator('a:has-text("Users")')
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await this.page.waitForTimeout(1000);
    }
  }
}
