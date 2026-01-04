import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getSystemConfig, getSystemConfigNumber, setSystemConfig, getAllSystemConfigs, getPointsCalculationFactor, } from '../services/system-config.service.js';
import { recalculateTaskPoints } from '../scripts/recalculateTaskPoints.js';
const router = express.Router();
// Get all system configs (admin only)
router.get('/', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const configs = await getAllSystemConfigs();
        res.json(configs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get points calculation factor (convenience endpoint) - MUST be before /:key route
router.get('/points-calculation-factor', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const factor = await getPointsCalculationFactor();
        res.json({ factor });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a specific config value
router.get('/:key', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { key } = req.params;
        const value = await getSystemConfig(key);
        if (value === null) {
            return res.status(404).json({ error: 'Config not found' });
        }
        res.json({ key, value });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Set/update a config value
router.put('/:key', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        if (value === undefined || value === null) {
            return res.status(400).json({ error: 'value is required' });
        }
        // Validate points_calculation_factor
        if (key === 'points_calculation_factor') {
            const numValue = Number.parseFloat(value);
            if (Number.isNaN(numValue) || numValue <= 0) {
                return res.status(400).json({ error: 'points_calculation_factor must be a positive number' });
            }
            // Get old value to check if it changed
            const oldValue = await getSystemConfigNumber('points_calculation_factor', 1.0);
            const newValue = numValue;
            // Update the config
            const config = await setSystemConfig(key, String(value), description);
            // If factor changed, recalculate all task points
            if (oldValue !== newValue) {
                console.log(`[SystemConfig] Factor changed from ${oldValue} to ${newValue}, recalculating task points...`);
                try {
                    await recalculateTaskPoints();
                    console.log('[SystemConfig] Task points recalculated successfully');
                }
                catch (recalcError) {
                    console.error('[SystemConfig] Error recalculating task points:', recalcError);
                    // Don't fail the request, but log the error
                    // The config was updated successfully, recalculation can be done manually if needed
                }
            }
            return res.json(config);
        }
        const config = await setSystemConfig(key, String(value), description);
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=system-config.routes.js.map