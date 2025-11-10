import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getRewardsService, redeemRewardService } from '../services/reward.service.js';

export const getRewards: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const rewards = await getRewardsService(authReq.user.id);
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const redeemReward: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await redeemRewardService(req.params.id, authReq.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
