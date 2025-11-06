import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getUserProgressService, getUserProfileService, updateUserProfileService, getMeService } from '../services/user.service.js';

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getMeService(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserProgress(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const progress = await getUserProgressService(req.params.id);
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await getUserProfileService(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUserProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await updateUserProfileService(req.params.id, req.body);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
