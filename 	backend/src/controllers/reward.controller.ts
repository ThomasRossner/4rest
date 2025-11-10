import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getRewardsService,
  redeemRewardService,
  createRewardFromTemplate,
  listRewardTemplates,
} from '../services/reward.service.js';

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

export const createReward: RequestHandler = async (req, res) => {
  try {
    const { templateId, overrides } = req.body;
    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ error: 'templateId is required' });
    }
    const reward = await createRewardFromTemplate(templateId, overrides || {});
    res.status(201).json(reward);
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
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

export const getRewardTemplates: RequestHandler = async (_req, res) => {
  try {
    const templates = await listRewardTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
