import { getStatisticsService, getUserStatistics, getStatisticsByPeriod, calculateCO2Savings, } from '../services/statistics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const getStatistics = asyncHandler(async (req, res) => {
    const { startDate, endDate, useCache } = req.query;
    // Use cached statistics if requested and available
    if (typeof useCache === 'string' && useCache === 'true') {
        const { getCachedStatistics } = await import('../services/statistics-cache.service.js');
        const cached = await getCachedStatistics();
        return res.json(cached);
    }
    // Get statistics for specific period if dates provided
    if (startDate && endDate) {
        const statistics = await getStatisticsByPeriod(new Date(startDate), new Date(endDate));
        return res.json(statistics);
    }
    // Get full statistics
    const statistics = await getStatisticsService();
    res.json(statistics);
});
export const getUserStats = asyncHandler(async (req, res) => {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.params.userId || authReq.user.id;
    const stats = await getUserStatistics(userId);
    res.json(stats);
});
export const getTaskCO2 = asyncHandler(async (req, res) => {
    const co2 = await calculateCO2Savings(req.params.taskId);
    res.json({ taskId: req.params.taskId, co2Saved: co2 });
});
//# sourceMappingURL=statistics.controller.js.map