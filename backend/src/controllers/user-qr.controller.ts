import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/authenticate.js';
import { getOrCreateUserQrCode, validateUserQrToken } from '../services/user-qr.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/user/qr-code
 * Ruft den persönlichen QR-Code des angemeldeten Benutzers ab
 */
export const getUserQrCode: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const qrCode = await getOrCreateUserQrCode(authReq.user.id);
  res.json(qrCode);
});

/**
 * POST /api/user/qr-code/scan
 * Validiert einen User-QR-Token und gibt die User-ID zurück
 * Body: { qrToken: string }
 */
export const scanUserQrCode: RequestHandler = asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { qrToken } = req.body;
  
  if (!qrToken || typeof qrToken !== 'string') {
    return res.status(400).json({ error: 'QR token is required' });
  }
  
  const userId = await validateUserQrToken(qrToken);
  
  if (!userId) {
    return res.status(404).json({ error: 'Invalid or expired QR code' });
  }
  
  res.json({ userId });
});

