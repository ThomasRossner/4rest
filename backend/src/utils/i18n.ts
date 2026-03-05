/**
 * Resolve a string from an i18n JSONB value by language.
 * @param i18n - Object with keys 'de', 'en' (e.g. from title_i18n)
 * @param lang - Preferred language: 'de' | 'en'
 * @param fallback - Fallback string if no value found
 */
export function resolveI18n(
  i18n: Record<string, string> | null | undefined,
  lang: 'de' | 'en',
  fallback?: string
): string {
  if (!i18n || typeof i18n !== 'object') return fallback ?? '';
  const primary = lang === 'en' ? 'en' : 'de';
  const secondary = lang === 'en' ? 'de' : 'en';
  const value = i18n[primary] ?? i18n[secondary];
  if (value != null && typeof value === 'string') return value;
  return fallback ?? '';
}

export function normalizeContentLang(lang: string | undefined | null): 'de' | 'en' {
  if (lang === 'en') return 'en';
  return 'de';
}
