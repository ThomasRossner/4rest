import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { exportUserData, deleteUserData, updateConsent } from '../middleware/gdpr.js';
import { AuthRequest } from '../middleware/authenticate.js';
import { Response } from 'express';

const router = Router();

// Export user data (GDPR right to access)
router.get('/export/:userId', authenticate, exportUserData);

// Delete user data (GDPR right to deletion)
// Call middleware directly so errors propagate to the global handler
router.delete('/delete/:userId', authenticate, deleteUserData);

// Update consent preferences
router.post('/consent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await updateConsent(req.user.id, req.body);
    res.json({ message: 'Consent preferences updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
