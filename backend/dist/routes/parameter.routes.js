import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getTaskParameters, getRewardParameters, createTaskParameter, createRewardParameter, updateTaskParameter, updateRewardParameter, deleteTaskParameter, deleteRewardParameter, } from '../services/parameter.service.js';
const router = express.Router();
// Task parameters - public read access for filtering
router.get('/tasks', authenticate, async (req, res) => {
    try {
        const { type } = req.query;
        const parameters = await getTaskParameters(type);
        res.json(parameters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/tasks', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { parameter_type, value, display_order, weight } = req.body;
        if (!parameter_type || !value) {
            return res.status(400).json({ error: 'parameter_type and value are required' });
        }
        const parameter = await createTaskParameter(parameter_type, value, display_order || 0, weight);
        res.status(201).json(parameter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/tasks/:id', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { value, display_order, weight, active } = req.body;
        const parameter = await updateTaskParameter(id, { value, display_order, weight, active });
        res.json(parameter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/tasks/:id', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { id } = req.params;
        await deleteTaskParameter(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Reward parameters - public read access for filtering
router.get('/rewards', authenticate, async (req, res) => {
    try {
        const { type } = req.query;
        const parameters = await getRewardParameters(type);
        res.json(parameters);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/rewards', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { parameter_type, value, display_order, weight } = req.body;
        if (!parameter_type || !value) {
            return res.status(400).json({ error: 'parameter_type and value are required' });
        }
        const parameter = await createRewardParameter(parameter_type, value, display_order || 0, weight);
        res.status(201).json(parameter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/rewards/:id', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { value, display_order, weight, active } = req.body;
        const parameter = await updateRewardParameter(id, { value, display_order, weight, active });
        res.json(parameter);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/rewards/:id', authenticate, requireRole('administrator'), async (req, res) => {
    try {
        const { id } = req.params;
        await deleteRewardParameter(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=parameter.routes.js.map