import { getSurveyAnalytics } from '../services/survey.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const getSurveyAnalyticsController = asyncHandler(async (req, res) => {
    const { taskId } = req.query;
    const taskIdString = taskId ? String(taskId) : undefined;
    const analytics = await getSurveyAnalytics(taskIdString);
    res.json(analytics);
});
//# sourceMappingURL=survey.controller.js.map