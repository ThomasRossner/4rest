import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getUserProgressService, getUserProfileService, updateUserProfileService, getMeService } from '../services/user.service.js';

export const getMe: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getMeService(authReq.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProgress: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const progress = await getUserProgressService(req.params.id);
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const profile = await getUserProfileService(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || authReq.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await updateUserProfileService(req.params.id, req.body);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
