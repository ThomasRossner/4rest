export const UI_THEME_STORAGE_KEY = '4rest-ui-theme';

/** Einziges UI-Theme (Glas / Wald-Atlas). */
export type UiTheme = 'atlas';

export const DEFAULT_UI_THEME: UiTheme = 'atlas';

/** Synchron, vor erstem Paint (wird auch aus index.html inline aufgerufen). */
export function readStoredTheme(): UiTheme {
  return DEFAULT_UI_THEME;
}

export function applyThemeToDocument(theme: UiTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}
