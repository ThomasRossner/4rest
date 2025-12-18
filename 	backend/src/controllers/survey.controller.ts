import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getSurveyAnalytics } from '../services/survey.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSurveyAnalyticsController: RequestHandler = asyncHandler(async (req, res) => {
  const { taskId } = req.query;
  const taskIdString = taskId ? String(taskId) : undefined;

  const analytics = await getSurveyAnalytics(taskIdString);

  res.json(analytics);
});

