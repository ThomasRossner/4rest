import { RequestHandler } from 'express';
import { getForestService, getUserForestService } from '../services/forest.service.js';

export const getForest: RequestHandler = async (req, res) => {
  try {
    const forest = await getForestService();
    res.json(forest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserForest: RequestHandler = async (req, res) => {
  try {
    const forest = await getUserForestService(req.params.userId);
    res.json(forest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
