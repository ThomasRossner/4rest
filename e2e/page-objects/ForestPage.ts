import { Page, expect } from '@playwright/test';

export class ForestPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/forest');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForForestLoad(): Promise<void> {
    // Wait for 3D canvas or forest container
    await this.page.waitForSelector('canvas, [class*="forest"], [class*="three"]', { timeout: 15000 });
    await this.page.waitForTimeout(2000); // Additional wait for rendering
  }

  async getTreeCount(): Promise<number> {
    // Try to find tree count indicator
    const countElement = this.page.locator('[class*="tree-count"], [data-tree-count]');
    if (await countElement.isVisible({ timeout: 2000 })) {
      const text = await countElement.textContent();
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
  }

  async verifyForestVisible(): Promise<void> {
    // Check for canvas or forest container
    const canvas = this.page.locator('canvas');
    const forestContainer = this.page.locator('[class*="forest"]');
    
    const isVisible = await canvas.isVisible({ timeout: 5000 }).catch(() => false) ||
                     await forestContainer.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(isVisible).toBeTruthy();
  }

  async getStatistics(): Promise<{ trees?: number; points?: number; co2?: number }> {
    const stats: { trees?: number; points?: number; co2?: number } = {};
    
    // Try to find statistics elements
    const treesElement = this.page.locator('text=/\\d+.*tree/i');
    if (await treesElement.isVisible({ timeout: 2000 })) {
      const text = await treesElement.textContent();
      const match = text?.match(/(\d+)/);
      if (match) stats.trees = parseInt(match[1], 10);
    }
    
    return stats;
  }
}
