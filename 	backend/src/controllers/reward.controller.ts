import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getRewardsService,
  redeemRewardService,
  createCustomReward,
  listRewardsForAdmin,
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
    const payload = req.body ?? {};

    const reward = await createCustomReward({
      title: payload.title,
      description: payload.description,
      pointsCost: payload.pointsCost ?? payload.points_cost,
      rewardType: payload.rewardType ?? payload.reward_type,
      voucherCode: payload.voucherCode ?? payload.voucher_code,
      externalApiId: payload.externalApiId ?? payload.external_api_id,
      allowed_roles: payload.allowed_roles ?? payload.allowedRoles ?? [],
      allowed_user_types: payload.allowed_user_types ?? payload.allowedUserTypes ?? [],
      allowed_hotel_ids: payload.allowed_hotel_ids ?? payload.allowedHotelIds ?? [],
    });

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
    const rewards = await listRewardsForAdmin();
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
