const LEGACY_UPLOAD_HOST =
  /^(https?:\/\/)(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|87\.106\.86\.203(:\d+)?)/i;

function rewriteLegacyUploadUrl(url: URL): string | null {
  if (!url.pathname.startsWith('/uploads/')) return null;
  if (typeof window === 'undefined') return null;
  return `${window.location.origin}${url.pathname}${url.search}`;
}

/**
 * Öffentliche Medien-URL für Video, Untertitel, Thumbnails usw.
 * Relative `/uploads/…`-Pfade und veraltete Dev-/Server-Hosts werden auf die aktuelle Origin gemappt.
 */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (LEGACY_UPLOAD_HOST.test(trimmed)) {
      try {
        const rewritten = rewriteLegacyUploadUrl(new URL(trimmed));
        if (rewritten) return rewritten;
      } catch {
        // Ungültige URL unverändert zurückgeben.
      }
    }
    return trimmed;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (typeof window === 'undefined') return normalized;
  return `${window.location.origin}${normalized}`;
}
