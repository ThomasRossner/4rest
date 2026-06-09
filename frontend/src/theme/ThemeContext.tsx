import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
  DEFAULT_UI_THEME,
  UI_THEME_STORAGE_KEY,
  type UiTheme,
  applyThemeToDocument,
} from './uiTheme';

type ThemeContextValue = {
  theme: UiTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyThemeToDocument(DEFAULT_UI_THEME);
    try {
      localStorage.setItem(UI_THEME_STORAGE_KEY, DEFAULT_UI_THEME);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ theme: DEFAULT_UI_THEME }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
