import { Page, expect } from '@playwright/test';

export class RewardsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/rewards');
    await this.page.waitForLoadState('networkidle');
  }

  async getRewards(): Promise<any[]> {
    await this.page.waitForSelector('[class*="reward"], [data-testid*="reward"]', { timeout: 10000 });
    const rewardElements = await this.page.locator('[class*="reward-card"], [class*="reward-item"]').all();
    return rewardElements;
  }

  async selectReward(rewardTitle: string): Promise<void> {
    const rewardCard = this.page.locator(`text=${rewardTitle}`).first();
    if (await rewardCard.isVisible({ timeout: 5000 })) {
      await rewardCard.click();
      await this.page.waitForTimeout(1000);
      return;
    }
    throw new Error(`Reward "${rewardTitle}" not found`);
  }

  async redeemReward(rewardTitle: string): Promise<void> {
    await this.selectReward(rewardTitle);
    
    const redeemButton = this.page.locator('button:has-text("Redeem")').or(
      this.page.locator('button:has-text("Einlösen")')
    );
    
    if (await redeemButton.isVisible()) {
      await redeemButton.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async verifyRedemptionSuccess(): Promise<void> {
    const successIndicators = [
      'redeemed',
      'eingelöst',
      'success',
      'voucher',
    ];
    
    for (const indicator of successIndicators) {
      const element = this.page.locator(`text=${indicator}`, { ignoreCase: true });
      if (await element.isVisible({ timeout: 3000 })) {
        return;
      }
    }
  }

  async getPointsBalance(): Promise<number> {
    const pointsElement = this.page.locator('[class*="points"], [data-points]');
    if (await pointsElement.isVisible({ timeout: 2000 })) {
      const text = await pointsElement.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  }

  async canAffordReward(cost: number): Promise<boolean> {
    const balance = await this.getPointsBalance();
    return balance >= cost;
  }
}
