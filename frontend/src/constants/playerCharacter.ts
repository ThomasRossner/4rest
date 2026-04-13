import type { PlayerProfilePayload } from '../stores/authStore';

/** Dominante Dyade → Emoji (Platzhalter bis Grafiken aus TICKET-006); Dyaden >4 nutzen Fallback */
const DOMINANT_EMOJI: Record<number, string> = {
  1: '🦌',
  2: '🦉',
  3: '🐺',
  4: '🐝',
  5: '🦋',
  6: '🦊',
  7: '🐻',
  8: '🦔',
};

export function getPlayerCharacterEmoji(profile: PlayerProfilePayload | undefined): string {
  if (!profile) return '❓';
  if (profile.status === 'pending') return '❓';
  if (profile.status === 'skipped' || profile.dominantDyad == null) return '🐌';
  const d = profile.dominantDyad;
  return DOMINANT_EMOJI[d] ?? '🐾';
}

export function getPlayerCharacterIconUrl(
  profile: PlayerProfilePayload | undefined,
  icons?: Record<string, string | null>
): string | null {
  if (!icons) return null;
  if (!profile || profile.status === 'pending') {
    return icons.pending ?? null;
  }
  if (profile.status === 'skipped' || profile.dominantDyad == null) {
    return icons.skipped ?? icons.fallback ?? null;
  }
  const dyadKey = `dyad_${profile.dominantDyad}`;
  return icons[dyadKey] ?? icons.fallback ?? null;
}

export function getDominantDyadNumber(
  profile: PlayerProfilePayload | undefined
): number | null {
  if (!profile || profile.status !== 'completed') return null;
  return profile.dominantDyad;
}

export function getForestDisplayName(
  userName: string,
  profile: PlayerProfilePayload | undefined
): string {
  const d = profile?.profileDisplayName?.trim();
  if (d) return d;
  return userName;
}
