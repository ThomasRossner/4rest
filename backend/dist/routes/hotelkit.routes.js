import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { hotelKit } from '../integrations/hotelkit.js';
const router = Router();
// Sync tasks from HotelKit (requires front office role)
router.post('/sync', authenticate, async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Only redaktion can trigger sync
        if (authReq.user.role !== 'redaktion' && authReq.user.role !== 'administrator') {
            return res.status(403).json({ error: 'Only redaktion and administrators can sync tasks' });
        }
        const result = await hotelKit.syncEmployeeTasks();
        res.json({
            success: true,
            ...result,
            message: `Synced ${result.synced} tasks from HotelKit`,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get HotelKit employee info
router.get('/employees/:employeeId', authenticate, async (req, res) => {
    try {
        const employee = await hotelKit.getEmployee(req.params.employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Webhook endpoint for HotelKit events
router.post('/webhook', async (req, res) => {
    try {
        const { event, data } = req.body;
        // Verify webhook signature if provided
        // const signature = req.headers['x-hotelkit-signature'];
        // if (!verifySignature(signature, req.body)) {
        //   return res.status(401).json({ error: 'Invalid signature' });
        // }
        switch (event) {
            case 'task.completed':
                // Handle task completion from HotelKit
                // This could trigger automatic completion in 4rest
                console.log('HotelKit task completed:', data);
                break;
            case 'task.created':
                // Sync new task from HotelKit
                await hotelKit.syncEmployeeTasks();
                break;
            case 'employee.updated':
                // Handle employee updates
                console.log('HotelKit employee updated:', data);
                break;
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=hotelkit.routes.js.map