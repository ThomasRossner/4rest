import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getUserProgressService, getUserProfileService, updateUserProfileService, getMeService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await getMeService(authReq.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

export const getUserProgress: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const progress = await getUserProgressService(req.params.id);
  res.json(progress);
});

export const getUserProfile: RequestHandler = asyncHandler(async (req, res) => {
  const profile = await getUserProfileService(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(profile);
});

export const updateUserProfile: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const profile = await updateUserProfileService(req.params.id, req.body);
  res.json(profile);
});
