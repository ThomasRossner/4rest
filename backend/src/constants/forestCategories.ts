/** Keys aligned with DB columns users.forest_points_* */
export const FOREST_CATEGORY_KEYS = [
  'kommunikation',
  'mensch',
  'natur',
  'ressourcen',
] as const;

export type ForestCategoryKey = (typeof FOREST_CATEGORY_KEYS)[number];

/** Task.category values from admin (German labels) → forest column key */
const TASK_LABEL_TO_KEY: Record<string, ForestCategoryKey> = {
  'Kommunikation & Netzwerke': 'kommunikation',
  'Mensch & soziales Umfeld': 'mensch',
  'Natur & Umweltschutz': 'natur',
  'Ressourcen- und Materialeinsatz': 'ressourcen',
  'Ressourcenverbrauch & Materialeinsatz': 'ressourcen',
};

export function taskCategoryLabelToForestKey(
  label: string | null | undefined
): ForestCategoryKey | null {
  if (!label || typeof label !== 'string') return null;
  return TASK_LABEL_TO_KEY[label.trim()] ?? null;
}

export function isForestCategoryKey(s: string): s is ForestCategoryKey {
  return (FOREST_CATEGORY_KEYS as readonly string[]).includes(s);
}
