/**
 * Hilfsfunktionen für Team-/Contest-Einladungen.
 *
 * Ziel: Eine Einladung muss auch für Personen OHNE 4rest-Account funktionieren.
 * Daher kodieren QR-Codes und Links eine vollständige Registrierungs-URL
 * (`/login?team=<token>` bzw. `/login?contest=<token>`), die mit jeder normalen
 * Kamera geöffnet werden kann. Der eingeloggte In-App-Scanner muss aus einer
 * solchen URL weiterhin den rohen Token extrahieren können.
 */

export type InviteParam = 'team' | 'contest';

/**
 * Baut die vollständige Einladungs-URL für einen Beitritts-Token.
 * Beispiel: `https://luise.bio/login?team=<token>`
 */
export function buildInviteUrl(param: InviteParam, token: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';
  return `${origin}/login?${param}=${encodeURIComponent(token)}`;
}

/**
 * Extrahiert aus gescannten QR-Daten den Beitritts-Token.
 * - Ist der Inhalt eine URL mit `?team=`/`?contest=`, wird der Query-Wert genutzt.
 * - Andernfalls (alter roher Token) wird der Inhalt unverändert zurückgegeben.
 */
export function extractJoinToken(scanned: string, param: InviteParam): string {
  const raw = (scanned ?? '').trim();
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get(param);
    if (fromQuery) return fromQuery.trim();
  } catch {
    /* kein gültiger URL-String → roher Token */
  }
  return raw;
}

export type ShareInviteResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Teilt eine Einladungs-URL über die Web Share API; fällt auf das Kopieren in
 * die Zwischenablage zurück, wenn Teilen nicht verfügbar ist.
 */
export async function shareInvite(opts: {
  url: string;
  title?: string;
  text?: string;
}): Promise<ShareInviteResult> {
  const { url, title, text } = opts;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err: unknown) {
      // Bricht der Nutzer den Share-Dialog ab, nicht auf Kopieren ausweichen.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // sonst: weiter zum Clipboard-Fallback
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    /* weiter zum Legacy-Fallback */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
}
