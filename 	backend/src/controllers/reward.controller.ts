import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getRewardsService, redeemRewardService } from '../services/reward.service.js';

export async function getRewards(req: Request, res: Response) {
  try {
    const rewards = await getRewardsService();
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function redeemReward(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await redeemRewardService(req.params.id, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
