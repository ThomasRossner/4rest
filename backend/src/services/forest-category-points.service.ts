import { getPool } from '../database/connection.js';
import type { ForestCategoryKey } from '../constants/forestCategories.js';

const COLUMN: Record<ForestCategoryKey, string> = {
  kommunikation: 'forest_points_kommunikation',
  mensch: 'forest_points_mensch',
  natur: 'forest_points_natur',
  ressourcen: 'forest_points_ressourcen',
};

/**
 * Adds forest-only category points (never reduced by reward redemption).
 */
export async function addForestCategoryPoints(
  userId: string,
  amount: number,
  categoryKey: ForestCategoryKey | null
): Promise<void> {
  if (!categoryKey || amount <= 0 || !Number.isFinite(amount)) {
    return;
  }

  const col = COLUMN[categoryKey];
  if (!col) return;

  const db = getPool();
  await db.query(
    `UPDATE users SET ${col} = ${col} + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [Math.floor(amount), userId]
  );
}

export function forestPointsSelectFragment(): string {
  return `forest_points_kommunikation, forest_points_mensch, forest_points_natur, forest_points_ressourcen`;
}

export function mapForestPointRow(row: Record<string, unknown>): {
  kommunikation: number;
  mensch: number;
  natur: number;
  ressourcen: number;
} {
  return {
    kommunikation: parseInt(String(row.forest_points_kommunikation ?? 0), 10) || 0,
    mensch: parseInt(String(row.forest_points_mensch ?? 0), 10) || 0,
    natur: parseInt(String(row.forest_points_natur ?? 0), 10) || 0,
    ressourcen: parseInt(String(row.forest_points_ressourcen ?? 0), 10) || 0,
  };
}
