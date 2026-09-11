import { useTranslation } from 'react-i18next';
import { useThemeOptional } from '../../theme/ThemeContext';
import type { UiTheme } from '../../theme/uiTheme';
import './ThemeSwitcher.css';

type Props = {
  /** Kompakte Darstellung (z. B. Login-Leiste). */
  variant?: 'default' | 'compact';
};

export function ThemeSwitcher({ variant = 'default' }: Props) {
  const { t } = useTranslation();
  const ctx = useThemeOptional();

  if (!ctx) {
    return null;
  }

  const { theme, setTheme } = ctx;

  const select = (next: UiTheme) => {
    if (next !== theme) setTheme(next);
  };

  return (
    <div
      className={`theme-switcher theme-switcher--${variant}`}
      role="group"
      aria-label={t('theme.label')}
    >
      <button
        type="button"
        className={`theme-switcher__btn ${theme === 'classic' ? 'theme-switcher__btn--active' : ''}`}
        onClick={() => select('classic')}
      >
        {t('theme.classic')}
      </button>
      <button
        type="button"
        className={`theme-switcher__btn ${theme === 'atlas' ? 'theme-switcher__btn--active' : ''}`}
        onClick={() => select('atlas')}
      >
        {t('theme.atlas')}
      </button>
    </div>
  );
}
