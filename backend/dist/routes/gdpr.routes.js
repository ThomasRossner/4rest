import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { exportUserData, deleteUserData, updateConsent } from '../middleware/gdpr.js';
const router = Router();
// Export user data (GDPR right to access)
router.get('/export/:userId', authenticate, exportUserData);
// Delete user data (GDPR right to deletion)
// Call middleware directly so errors propagate to the global handler
router.delete('/delete/:userId', authenticate, deleteUserData);
// Update consent preferences
router.post('/consent', authenticate, async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await updateConsent(authReq.user.id, req.body);
        res.json({ message: 'Consent preferences updated' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=gdpr.routes.js.map