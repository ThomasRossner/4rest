import type { ForestCategoryKey } from '../../constants/forestCategories';
import { OTHER_FOREST_CATEGORY_KEY } from '../../constants/forestCategories';

type CategoryHubKey = ForestCategoryKey | typeof OTHER_FOREST_CATEGORY_KEY;

type Props = {
  categoryKey: CategoryHubKey;
  className?: string;
};

/** Grafische Icons für die vier Wald-Themen + „Weitere“ auf der Aufgaben-Kategorie-Übersicht */
export function CategoryHubIcon({ categoryKey, className }: Props) {
  const cn = className ?? '';
  switch (categoryKey) {
    case 'kommunikation':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="32" cy="20" r="8" fill="currentColor" opacity="0.9" />
          <circle cx="18" cy="40" r="7" fill="currentColor" opacity="0.75" />
          <circle cx="46" cy="40" r="7" fill="currentColor" opacity="0.75" />
          <path
            d="M28 26 L22 35 M36 26 L42 35 M32 28 L32 33"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      );
    case 'mensch':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="24" cy="22" r="9" fill="currentColor" opacity="0.85" />
          <circle cx="40" cy="22" r="9" fill="currentColor" opacity="0.85" />
          <path
            d="M16 44c2-8 8-12 16-12s14 4 16 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </svg>
      );
    case 'natur':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M32 48V28"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M32 28c-4-12 4-20 12-18-4 8-4 16 0 22-8-2-14-8-12-18z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M32 30c4-10 14-14 20-8-6 6-10 14-8 20-6-4-12-8-12-12z"
            fill="currentColor"
            opacity="0.65"
          />
        </svg>
      );
    case 'ressourcen':
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M44 20c-4-4-12-4-16 0l-8 8c-4 4-4 12 0 16l4 4c4 4 12 4 16 0l8-8c4-4 4-12 0-16l-4-4z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M28 36 L20 44 M36 28 L44 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <rect x="22" y="38" width="10" height="8" rx="1.5" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case 'sonstige':
    default:
      return (
        <svg className={cn} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="20" cy="24" r="6" fill="currentColor" opacity="0.7" />
          <circle cx="44" cy="24" r="6" fill="currentColor" opacity="0.7" />
          <circle cx="20" cy="42" r="6" fill="currentColor" opacity="0.5" />
          <circle cx="44" cy="42" r="6" fill="currentColor" opacity="0.5" />
        </svg>
      );
  }
}
