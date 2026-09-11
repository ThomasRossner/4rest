import { getPool } from '../database/connection.js';
import { randomBytes } from 'crypto';

/**
 * Generiert einen eindeutigen QR-Token
 */
export function generateQrToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Erstellt oder ruft den persönlichen QR-Code eines Benutzers ab
 */
export async function getOrCreateUserQrCode(userId: string): Promise<{ qrToken: string; createdAt: Date }> {
  const db = getPool();
  
  // Prüfe ob bereits ein QR-Code existiert
  const existing = await db.query(
    'SELECT qr_token, created_at FROM user_qr_codes WHERE user_id = $1',
    [userId]
  );
  
  if (existing.rows.length > 0) {
    return {
      qrToken: existing.rows[0].qr_token,
      createdAt: existing.rows[0].created_at,
    };
  }
  
  // Erstelle neuen QR-Code
  const qrToken = generateQrToken();
  await db.query(
    'INSERT INTO user_qr_codes (user_id, qr_token) VALUES ($1, $2)',
    [userId, qrToken]
  );
  
  const result = await db.query(
    'SELECT created_at FROM user_qr_codes WHERE user_id = $1',
    [userId]
  );
  
  return {
    qrToken,
    createdAt: result.rows[0].created_at,
  };
}

/**
 * Validiert einen User-QR-Token und gibt die User-ID zurück
 */
export async function validateUserQrToken(qrToken: string): Promise<string | null> {
  const db = getPool();
  
  const result = await db.query(
    'SELECT user_id FROM user_qr_codes WHERE qr_token = $1 AND (expires_at IS NULL OR expires_at > NOW())',
    [qrToken]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0].user_id;
}

