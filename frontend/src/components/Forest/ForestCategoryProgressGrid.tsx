import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FOREST_CATEGORY_KEYS } from '../../constants/forestCategories';
import type { User } from '../../stores/authStore';

type Props = {
  forestPoints?: User['forestPoints'];
  className?: string;
};

export default function ForestCategoryProgressGrid({ forestPoints, className }: Props) {
  const { t } = useTranslation();

  const forestCategoryStats = useMemo(() => {
    if (!forestPoints) {
      return FOREST_CATEGORY_KEYS.map((key) => ({ key, value: 0 }));
    }
    return FOREST_CATEGORY_KEYS.map((key) => ({
      key,
      value: forestPoints[key] ?? 0,
    }));
  }, [forestPoints]);

  const gridClass = ['glass-category-grid', className].filter(Boolean).join(' ');

  return (
    <div className={gridClass}>
      {forestCategoryStats.map(({ key, value }) => (
        <div key={key} className="glass-category-stat">
          <span className="glass-category-stat__value">{value}</span>
          <span className="glass-category-stat__label">
            {t(`rankings.timeline.forest.${key}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
