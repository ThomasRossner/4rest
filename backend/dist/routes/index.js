import { Router } from 'express';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';
import forestRoutes from './forest.routes.js';
import rewardRoutes from './reward.routes.js';
import statisticsRoutes from './statistics.routes.js';
import gdprRoutes from './gdpr.routes.js';
import hotelkitRoutes from './hotelkit.routes.js';
import sihotRoutes from './sihot.routes.js';
import locationRoutes from './location.routes.js';
import surveyRoutes from './survey.routes.js';
import debugRoutes from './debug.routes.js';
import parameterRoutes from './parameter.routes.js';
import systemConfigRoutes from './system-config.routes.js';
export function setupRoutes() {
    const router = Router();
    router.use('/auth', authRoutes);
    router.use('/tasks', taskRoutes);
    router.use('/users', userRoutes);
    router.use('/forest', forestRoutes);
    router.use('/rewards', rewardRoutes);
    router.use('/statistics', statisticsRoutes);
    router.use('/gdpr', gdprRoutes);
    router.use('/hotelkit', hotelkitRoutes);
    router.use('/sihot', sihotRoutes);
    router.use('/locations', locationRoutes);
    router.use('/admin/surveys', surveyRoutes);
    router.use('/admin/debug', debugRoutes);
    router.use('/admin/parameters', parameterRoutes);
    router.use('/admin/system-config', systemConfigRoutes);
    return router;
}
//# sourceMappingURL=index.js.map