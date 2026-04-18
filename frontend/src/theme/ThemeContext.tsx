import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  UI_THEME_STORAGE_KEY,
  type UiTheme,
  applyThemeToDocument,
  readStoredTheme,
} from './uiTheme';

type ThemeContextValue = {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>(() => readStoredTheme());

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
    applyThemeToDocument(next);
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'atlas' ? 'classic' : 'atlas';
      applyThemeToDocument(next);
      try {
        localStorage.setItem(UI_THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Optional: außerhalb des Providers (z. B. Storybook) — nur lesen. */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
