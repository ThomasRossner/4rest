import type { PlayerProfilePayload } from '../stores/authStore';

/** Dominante Dyade → Emoji (Platzhalter bis Grafiken aus TICKET-006) */
const DOMINANT_EMOJI: Record<1 | 2 | 3 | 4, string> = {
  1: '🦌',
  2: '🦉',
  3: '🐺',
  4: '🐝',
};

export function getPlayerCharacterEmoji(profile: PlayerProfilePayload | undefined): string {
  if (!profile) return '❓';
  if (profile.status === 'pending') return '❓';
  if (profile.status === 'skipped' || profile.dominantDyad == null) return '🐌';
  return DOMINANT_EMOJI[profile.dominantDyad] ?? '🐾';
}

export function getDominantDyadNumber(
  profile: PlayerProfilePayload | undefined
): 1 | 2 | 3 | 4 | null {
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
