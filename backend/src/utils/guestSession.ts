import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const GUEST_SESSION_COOKIE = '4rest_guest_session';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  }
  return out;
}

export function setGuestSessionCookie(res: Response, sessionId: string): void {
  const maxAgeSec = 90 * 24 * 60 * 60; // 90 days
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append(
    'Set-Cookie',
    `${GUEST_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`
  );
}

/**
 * Liefert eine gültige Gast-Session-UUID und setzt bei Bedarf das Cookie.
 */
export function ensureGuestSession(req: Request, res: Response): string {
  const parsed = parseCookies(req.headers.cookie);
  const existing = parsed[GUEST_SESSION_COOKIE];
  if (existing && UUID_RE.test(existing)) {
    return existing;
  }
  const id = randomUUID();
  setGuestSessionCookie(res, id);
  return id;
}

export function getGuestSessionIdFromRequest(req: Request): string | null {
  const parsed = parseCookies(req.headers.cookie);
  const v = parsed[GUEST_SESSION_COOKIE];
  if (v && UUID_RE.test(v)) return v;
  return null;
}
