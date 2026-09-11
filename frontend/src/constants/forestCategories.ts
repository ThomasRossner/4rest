/** Keys aligned with backend users.forest_points_* and Bonus-QR */
export const FOREST_CATEGORY_KEYS = [
  'kommunikation',
  'mensch',
  'natur',
  'ressourcen',
] as const;

export type ForestCategoryKey = (typeof FOREST_CATEGORY_KEYS)[number];

/** Admin task.category labels (German) — must match backend taskCategoryLabelToForestKey */
export const FOREST_CATEGORY_LABEL_DE: Record<ForestCategoryKey, string> = {
  kommunikation: 'Kommunikation & Netzwerke',
  mensch: 'Mensch & soziales Umfeld',
  natur: 'Natur & Umweltschutz',
  ressourcen: 'Ressourcen- und Materialeinsatz',
};

export const OTHER_FOREST_CATEGORY_KEY = 'sonstige' as const;

export function forestKeyFromTaskCategory(
  category: string | null | undefined
): ForestCategoryKey | typeof OTHER_FOREST_CATEGORY_KEY {
  if (!category || typeof category !== 'string') return OTHER_FOREST_CATEGORY_KEY;
  const trimmed = category.trim();
  if (trimmed === 'Ressourcenverbrauch & Materialeinsatz') return 'ressourcen';
  const entry = (Object.entries(FOREST_CATEGORY_LABEL_DE) as [ForestCategoryKey, string][]).find(
    ([, label]) => label === trimmed
  );
  return entry ? entry[0] : OTHER_FOREST_CATEGORY_KEY;
}

export function isForestCategoryRouteKey(
  s: string
): s is ForestCategoryKey | typeof OTHER_FOREST_CATEGORY_KEY {
  return (
    (FOREST_CATEGORY_KEYS as readonly string[]).includes(s) || s === OTHER_FOREST_CATEGORY_KEY
  );
}
