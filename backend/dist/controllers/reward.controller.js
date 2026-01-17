import { getRewardsService, redeemRewardService, verifyQrCodeService, getRewardInfoFromQrCode, redeemRewardQrCodeService, createCustomReward, listRewardsForAdmin, updateReward as updateRewardService, setRewardsActiveState, bulkDeleteRewards, getRedemptionStatus, uploadThumbnail as uploadThumbnailService, } from '../services/reward.service.js';
import { generatePointsBonusQr, redeemPointsBonusQr, } from '../services/points-bonus.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const getRewards = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const rewards = await getRewardsService(authReq.user.id);
    res.json(rewards);
});
export const createReward = asyncHandler(async (req, res) => {
    const payload = req.body ?? {};
    if (payload.active !== undefined && typeof payload.active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value' });
    }
    const locationId = payload.locationId ?? payload.location_id;
    if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ error: 'locationId is required.' });
    }
    const { getLocationById } = await import('../services/location.service.js');
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
        location_id: location.id,
        active: payload.active,
        recurrence: payload.recurrence ?? null,
        reward_art: payload.reward_art ?? payload.rewardArt ?? null,
        kategorie: payload.kategorie ?? payload.category ?? null,
        event_group: payload.event_group ?? payload.eventGroup ?? null,
        moegliche_punkte: payload.moegliche_punkte ?? payload.possible_points ?? null,
        thumbnail_url: payload.thumbnail_url ?? payload.thumbnailUrl ?? null,
    });
    res.status(201).json(reward);
});
export const updateReward = asyncHandler(async (req, res) => {
    const payload = req.body ?? {};
    if (payload.active !== undefined && typeof payload.active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value' });
    }
    const updatePayload = {};
    if (payload.title !== undefined)
        updatePayload.title = payload.title;
    if (payload.description !== undefined)
        updatePayload.description = payload.description;
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
    if (payload.reward_art !== undefined || payload.rewardArt !== undefined) {
        updatePayload.reward_art = payload.reward_art ?? payload.rewardArt ?? null;
    }
    if (payload.kategorie !== undefined || payload.category !== undefined) {
        updatePayload.kategorie = payload.kategorie ?? payload.category ?? null;
    }
    if (payload.event_group !== undefined || payload.eventGroup !== undefined) {
        updatePayload.event_group = payload.event_group ?? payload.eventGroup ?? null;
    }
    if (payload.moegliche_punkte !== undefined || payload.possible_points !== undefined) {
        updatePayload.moegliche_punkte = payload.moegliche_punkte ?? payload.possible_points ?? null;
    }
    if (payload.locationId !== undefined || payload.location_id !== undefined) {
        const locationId = payload.locationId ?? payload.location_id;
        if (locationId) {
            const { getLocationById } = await import('../services/location.service.js');
            const location = await getLocationById(locationId);
            if (!location) {
                return res.status(400).json({ error: 'Invalid locationId.' });
            }
            updatePayload.location_id = location.id;
        }
        else {
            return res.status(400).json({ error: 'locationId must be a valid string.' });
        }
    }
    if (payload.active !== undefined) {
        updatePayload.active = payload.active;
    }
    if (payload.recurrence !== undefined) {
        updatePayload.recurrence = payload.recurrence;
    }
    if (payload.thumbnail_url !== undefined || payload.thumbnailUrl !== undefined) {
        updatePayload.thumbnail_url = payload.thumbnail_url ?? payload.thumbnailUrl ?? null;
    }
    const reward = await updateRewardService(req.params.id, updatePayload);
    res.json(reward);
});
export const redeemReward = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const useTeamPoints = req.body?.useTeamPoints === true;
    const result = await redeemRewardService(req.params.id, authReq.user.id, useTeamPoints);
    res.json(result);
});
export const getRewardTemplates = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const rewards = await listRewardsForAdmin(includeInactive);
    res.json(rewards);
});
export const bulkUpdateRewardStatus = asyncHandler(async (req, res) => {
    const { ids, active } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of reward ids.' });
    }
    if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Active flag must be a boolean value.' });
    }
    await setRewardsActiveState(ids, active);
    res.status(204).send();
});
export const bulkDeleteRewardsController = asyncHandler(async (req, res) => {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Provide an array of reward ids.' });
    }
    await bulkDeleteRewards(ids);
    res.status(204).send();
});
export const verifyQrCode = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
        return res.status(400).json({ error: 'QR token is required' });
    }
    const result = await verifyQrCodeService(qrToken, authReq.user.id);
    res.json(result);
});
export const generatePointsBonusQrCode = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { pointsAmount } = req.body;
    if (!Number.isInteger(pointsAmount) || pointsAmount <= 0) {
        return res.status(400).json({ error: 'pointsAmount must be a positive integer' });
    }
    const qrToken = await generatePointsBonusQr(authReq.user.id, pointsAmount);
    res.json({
        qrToken: qrToken.qr_token,
        expiresAt: qrToken.expires_at.toISOString(),
        pointsAmount: qrToken.points_amount,
    });
});
export const redeemPointsBonusQrCode = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
        return res.status(400).json({ error: 'QR token is required' });
    }
    const result = await redeemPointsBonusQr(qrToken, authReq.user.id);
    res.json({
        success: true,
        pointsAwarded: result.pointsAwarded,
        newPointsBalance: result.newPointsBalance,
    });
});
export const getRewardInfoFromQr = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
        return res.status(400).json({ error: 'QR token is required' });
    }
    const result = await getRewardInfoFromQrCode(qrToken, authReq.user.id);
    res.json(result);
});
export const getRedemptionStatusController = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { qrToken } = req.query;
    if (!qrToken || typeof qrToken !== 'string') {
        return res.status(400).json({ error: 'QR token is required' });
    }
    const status = await getRedemptionStatus(qrToken, authReq.user.id);
    if (!status) {
        return res.status(404).json({ error: 'Redemption not found' });
    }
    res.json(status);
});
export const redeemRewardQrCode = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
        return res.status(400).json({ error: 'QR token is required' });
    }
    const result = await redeemRewardQrCodeService(qrToken, authReq.user.id);
    res.json(result);
});
export const uploadThumbnail = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // #region agent log
    console.log('[DEBUG] reward.controller.ts:uploadThumbnail - Reward thumbnail upload started', JSON.stringify({ filename: file.filename, path: file.path, size: file.size, uploadDir: process.env.UPLOAD_DIR, cwd: process.cwd() }));
    // #endregion
    const thumbnailUrl = await uploadThumbnailService(file);
    // #region agent log
    console.log('[DEBUG] reward.controller.ts:uploadThumbnail - Reward thumbnail upload completed', JSON.stringify({ thumbnailUrl, filePath: file.path }));
    // #endregion
    res.json({ thumbnail_url: thumbnailUrl });
});
//# sourceMappingURL=reward.controller.js.map