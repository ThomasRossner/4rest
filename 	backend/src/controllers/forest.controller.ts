import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getForestService, getUserForestService } from '../services/forest.service.js';

export async function getForest(req: AuthRequest, res: Response) {
  try {
    const forest = await getForestService();
    res.json(forest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserForest(req: AuthRequest, res: Response) {
  try {
    const forest = await getUserForestService(req.params.userId);
    res.json(forest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
