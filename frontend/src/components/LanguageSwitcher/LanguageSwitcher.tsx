import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'de', labelKey: 'language.de' },
];

export function LanguageSwitcher({ className = '', compact = false }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  return (
    <div
      className={`language-switcher ${compact ? 'language-switcher-compact' : ''} ${className}`.trim()}
      role="group"
      aria-label={t('language.label')}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`language-button ${i18n.resolvedLanguage?.startsWith(lang.code) ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(lang.code)}
          title={t('language.switch')}
        >
          <span aria-hidden="true">{lang.code.toUpperCase()}</span>
          {!compact && <span className="language-label">{t(lang.labelKey)}</span>}
        </button>
      ))}
    </div>
  );
}

