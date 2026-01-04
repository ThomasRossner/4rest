import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getForestService, getUserForestService, getForestStatsService } from '../services/forest.service.js';
import { processDailyForestVisit, hasVisitedForestToday } from '../services/gamification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  runForestValidation,
  getValidationJobStatus as getJobStatus,
  cleanupOldJobs,
} from '../services/forestValidation.service.js';

export const getForest: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const forest = await getForestService(userId);
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

export const getForestStats: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admins should see global forest stats
  // In this app, the admin role is stored as "administrator"
  if (user.role !== 'administrator' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const stats = await getForestStatsService();
  res.json(stats);
});

export const validateAndFixForest: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admins should be able to run validation
  if (user.role !== 'administrator' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { dryRun = false, forceGeometry = false, userFilter } = req.body;

  // Clean up old jobs before starting a new one
  cleanupOldJobs();

  try {
    const jobId = await runForestValidation(
      Boolean(dryRun),
      Boolean(forceGeometry),
      userFilter || undefined
    );
    
    res.json({ jobId, status: 'pending' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start validation' });
  }
});

export const getValidationJobStatus: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (user.role !== 'administrator' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { jobId } = req.params;

  const status = getJobStatus(jobId);
  
  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(status);
});
