import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { Response } from 'express';
import { hotelKit } from '../integrations/hotelkit.js';

const router = Router();

// Sync tasks from HotelKit (requires employee role)
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only employees can trigger sync
    if (req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Only employees can sync tasks' });
    }

    const result = await hotelKit.syncEmployeeTasks();
    res.json({
      success: true,
      ...result,
      message: `Synced ${result.synced} tasks from HotelKit`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get HotelKit employee info
router.get('/employees/:employeeId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const employee = await hotelKit.getEmployee(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for HotelKit events
router.post('/webhook', async (req: Request, res: Response) => {
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
        // This could trigger automatic completion in Roots of Impact
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
