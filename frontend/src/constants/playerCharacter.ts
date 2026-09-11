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

const EMOJI_ICON_CDN_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

function emojiToTwemojiUrl(emoji: string): string {
  const codepoint = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  return `${EMOJI_ICON_CDN_BASE}/${codepoint}.png`;
}

export function getDefaultPlayerCharacterIcons(dyadCount: number): Record<string, string> {
  const count = Number.isFinite(dyadCount) ? Math.max(1, Math.min(32, Math.round(dyadCount))) : 4;
  const defaults: Record<string, string> = {};
  for (let i = 1; i <= count; i++) {
    const emoji = DOMINANT_EMOJI[i] ?? '🐾';
    defaults[`dyad_${i}`] = emojiToTwemojiUrl(emoji);
  }
  defaults.pending = emojiToTwemojiUrl('❓');
  defaults.skipped = emojiToTwemojiUrl('🐌');
  defaults.fallback = emojiToTwemojiUrl('🐾');
  return defaults;
}

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
  const defaults = getDefaultPlayerCharacterIcons(profile?.dominantDyad ?? 4);
  const merged = { ...defaults, ...(icons ?? {}) };
  if (!profile || profile.status === 'pending') {
    return merged.pending ?? null;
  }
  if (profile.status === 'skipped' || profile.dominantDyad == null) {
    return merged.skipped ?? merged.fallback ?? null;
  }
  const dyadKey = `dyad_${profile.dominantDyad}`;
  return merged[dyadKey] ?? merged.fallback ?? null;
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
