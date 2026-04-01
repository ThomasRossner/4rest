/**
 * Konfigurierte Hintergrund-URL für CSS background-image.
 * Gespeichert wird wie bei Aufgaben-Medien die volle Backend-URL; relative /uploads/…
 * funktionieren in Dev über den Vite-Proxy zu Port 5001.
 */
export function resolveOnboardingBackgroundUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window === 'undefined') return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}
