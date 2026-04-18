export const UI_THEME_STORAGE_KEY = '4rest-ui-theme';

export type UiTheme = 'classic' | 'atlas';

export function isUiTheme(value: string | null | undefined): value is UiTheme {
  return value === 'classic' || value === 'atlas';
}

/** Synchron, vor erstem Paint (wird auch aus index.html inline aufgerufen). */
export function readStoredTheme(): UiTheme {
  try {
    const raw = localStorage.getItem(UI_THEME_STORAGE_KEY);
    if (isUiTheme(raw)) return raw;
  } catch {
    /* private mode */
  }
  return 'classic';
}

export function applyThemeToDocument(theme: UiTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}
