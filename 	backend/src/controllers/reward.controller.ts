import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getRewardsService,
  redeemRewardService,
  verifyQrCodeService,
  createCustomReward,
  listRewardsForAdmin,
  updateReward as updateRewardService,
  setRewardsActiveState,
  bulkDeleteRewards,
} from '../services/reward.service.js';
import { getLocationById } from '../services/location.service.js';

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

    if (payload.active !== undefined && typeof payload.active !== 'boolean') {
      return res.status(400).json({ error: 'Active flag must be a boolean value' });
    }

    const locationId = payload.locationId ?? payload.location_id;
    if (!locationId || typeof locationId !== 'string') {
      return res.status(400).json({ error: 'locationId is required.' });
    }
    const location = await getLocationById(locationId);
    if (!location) {
      return res.status(400).json({ error: 'Invalid locationId.' });
    }

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
      location_id: location.id,
      active: payload.active,
      recurrence: payload.recurrence ?? null,
    });

    res.status(201).json(reward);
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateReward: RequestHandler = async (req, res) => {
  try {
    const payload = req.body ?? {};
    if (payload.active !== undefined && typeof payload.active !== 'boolean') {
      return res.status(400).json({ error: 'Active flag must be a boolean value' });
    }

    const updatePayload: any = {};

    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.pointsCost !== undefined || payload.points_cost !== undefined) {
      updatePayload.pointsCost = payload.pointsCost ?? payload.points_cost;
    }
    if (payload.rewardType !== undefined || payload.reward_type !== undefined) {
      updatePayload.rewardType = payload.rewardType ?? payload.reward_type;
    }
    if (payload.voucherCode !== undefined || payload.voucher_code !== undefined) {
      updatePayload.voucherCode = payload.voucherCode ?? payload.voucher_code;
    }
    if (payload.externalApiId !== undefined || payload.external_api_id !== undefined) {
      updatePayload.externalApiId = payload.externalApiId ?? payload.external_api_id;
    }
    if (payload.allowed_roles !== undefined || payload.allowedRoles !== undefined) {
      updatePayload.allowed_roles = payload.allowed_roles ?? payload.allowedRoles ?? [];
    }
    if (payload.allowed_user_types !== undefined || payload.allowedUserTypes !== undefined) {
      updatePayload.allowed_user_types =
        payload.allowed_user_types ?? payload.allowedUserTypes ?? [];
    }
    if (payload.allowed_hotel_ids !== undefined || payload.allowedHotelIds !== undefined) {
      updatePayload.allowed_hotel_ids =
        payload.allowed_hotel_ids ?? payload.allowedHotelIds ?? [];
    }
    if (payload.locationId !== undefined || payload.location_id !== undefined) {
      const locationId = payload.locationId ?? payload.location_id;
      if (locationId) {
        const location = await getLocationById(locationId);
        if (!location) {
          return res.status(400).json({ error: 'Invalid locationId.' });
        }
        updatePayload.location_id = location.id;
      } else {
        return res.status(400).json({ error: 'locationId must be a valid string.' });
      }
    }

    if (payload.active !== undefined) {
      updatePayload.active = payload.active;
    }

    if (payload.recurrence !== undefined) {
      updatePayload.recurrence = payload.recurrence;
    }

    const reward = await updateRewardService(req.params.id, updatePayload);

    res.json(reward);
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

export const getRewardTemplates: RequestHandler = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const rewards = await listRewardsForAdmin(includeInactive);
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkUpdateRewardStatus: RequestHandler = async (req, res) => {
  try {
    const { ids, active } = req.body ?? {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of reward ids.' });
    }
    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }

    await setRewardsActiveState(ids, active);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteRewardsController: RequestHandler = async (req, res) => {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Provide an array of reward ids.' });
    }
    await bulkDeleteRewards(ids);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyQrCode: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({ error: 'QR token is required' });
    }

    const result = await verifyQrCodeService(qrToken, authReq.user.id);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};