import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getForestService, getUserForestService } from '../services/forest.service.js';
import { processDailyForestVisit, hasVisitedForestToday } from '../services/gamification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getForest: RequestHandler = asyncHandler(async (req, res) => {
  const forest = await getForestService();
  res.json(forest);
});

export const getUserForest: RequestHandler = asyncHandler(async (req, res) => {
  const forest = await getUserForestService(req.params.userId);
  res.json(forest);
});

export const visitForest: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const hasVisited = await hasVisitedForestToday(userId);
  const success = await processDailyForestVisit(userId);
  
  res.json({
    success,
    alreadyVisited: hasVisited && !success,
    message: success 
      ? 'Forest visited! All trees gained 1 growth point.' 
      : 'You have already visited the forest today.',
  });
});
