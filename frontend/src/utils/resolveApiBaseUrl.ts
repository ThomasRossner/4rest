/**
 * Axios baseURL für das Backend. Express mountet alle Routen unter `/api`.
 *
 * Häufiger Fehler in .env: `VITE_API_URL=http://localhost:5001` ohne `/api`
 * → Requests gehen nach `/auth/login` statt `/api/auth/login` → **404**.
 */
export function resolveApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return '/api';

  if (raw.startsWith('/')) {
    const s = raw.replace(/\/+$/, '') || '/api';
    return s;
  }

  if (/^https?:\/\//i.test(raw)) {
    const u = raw.replace(/\/+$/, '');
    if (u.endsWith('/api')) return u;
    return `${u}/api`;
  }

  return '/api';
}
