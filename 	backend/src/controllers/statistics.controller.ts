import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import {
  getStatisticsService,
  getUserStatistics,
  getStatisticsByPeriod,
  calculateCO2Savings,
} from '../services/statistics.service.js';

export async function getStatistics(req: AuthRequest, res: Response) {
  try {
    const { startDate, endDate, useCache } = req.query;

    // Use cached statistics if requested and available
    if (useCache === 'true') {
      const { getCachedStatistics } = await import('../services/statistics-cache.service.js');
      const cached = await getCachedStatistics();
      return res.json(cached);
    }

    // Get statistics for specific period if dates provided
    if (startDate && endDate) {
      const statistics = await getStatisticsByPeriod(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      return res.json(statistics);
    }

    // Get full statistics
    const statistics = await getStatisticsService();
    res.json(statistics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserStats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.params.userId || req.user.id;
    const stats = await getUserStatistics(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTaskCO2(req: AuthRequest, res: Response) {
  try {
    const co2 = await calculateCO2Savings(req.params.taskId);
    res.json({ taskId: req.params.taskId, co2Saved: co2 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
