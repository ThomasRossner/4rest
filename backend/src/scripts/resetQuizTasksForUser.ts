/**
 * Setzt alle Quiz-bezogenen Aufgaben (Typ quiz, video, article_quiz) für einen Nutzer
 * auf „nicht durchgeführt“: user_tasks entfernen, Bäume & Quiz-Sperren bereinigen,
 * Punkte und Wald-Kategoriepunkte korrigieren.
 *
 * Hinweis: Contest-Punkte und auf andere Bäume verteilte Wachstumspunkte werden nicht
 * vollständig historisch zurückgerechnet; bei Bedarf validate-forest prüfen.
 *
 * Usage: npx tsx src/scripts/resetQuizTasksForUser.ts [email]
 * Default: demo@example.com
 */
import 'dotenv/config';
import { getPool } from '../database/connection.js';
import { taskCategoryLabelToForestKey } from '../constants/forestCategories.js';
import type { ForestCategoryKey } from '../constants/forestCategories.js';

const FOREST_COL: Record<ForestCategoryKey, string> = {
  kommunikation: 'forest_points_kommunikation',
  mensch: 'forest_points_mensch',
  natur: 'forest_points_natur',
  ressourcen: 'forest_points_ressourcen',
};

const QUIZ_TYPES = ['quiz', 'video', 'article_quiz'];

async function main() {
  const email = process.argv[2] || 'demo@example.com';
  const db = getPool();

  const userRes = await db.query('SELECT id, email, points FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (userRes.rows.length === 0) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  const user = userRes.rows[0] as { id: string; email: string; points: number };
  console.log(`User: ${user.email} (${user.id}), points before: ${user.points}`);

  const rowsRes = await db.query(
    `SELECT ut.id AS user_task_id, ut.task_id, ut.points_earned, ut.task_category,
            t.points AS task_points, t.type, t.category AS task_category_label
     FROM user_tasks ut
     INNER JOIN tasks t ON t.id = ut.task_id
     WHERE ut.user_id = $1 AND t.type = ANY($2::text[])`,
    [user.id, QUIZ_TYPES]
  );
  const rows = rowsRes.rows as Array<{
    user_task_id: string;
    task_id: string;
    points_earned: number | null;
    task_category: string | null;
    task_points: number;
    type: string;
    task_category_label: string | null;
  }>;

  if (rows.length === 0) {
    console.log('No completed quiz-related tasks for this user.');
    await db.end();
    return;
  }

  const taskIds = [...new Set(rows.map((r) => r.task_id))];
  let totalPoints = 0;
  const forestSubtract: Record<ForestCategoryKey, number> = {
    kommunikation: 0,
    mensch: 0,
    natur: 0,
    ressourcen: 0,
  };

  for (const r of rows) {
    const earned = Number(r.points_earned ?? 0);
    const fallback = Number(r.task_points ?? 0);
    const pts = earned > 0 ? earned : fallback;
    totalPoints += pts;

    const key =
      (r.task_category && r.task_category in FOREST_COL
        ? (r.task_category as ForestCategoryKey)
        : null) ?? taskCategoryLabelToForestKey(r.task_category_label ?? undefined);
    if (key && pts > 0) {
      forestSubtract[key] += pts;
    }
  }

  console.log(`Removing ${rows.length} completion(s) for task types: ${QUIZ_TYPES.join(', ')}`);
  console.log(`Subtract ${totalPoints} from users.points; forest deltas:`, forestSubtract);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM quiz_question_locks WHERE user_id = $1 AND task_id = ANY($2::uuid[])`, [
      user.id,
      taskIds,
    ]);

    await client.query(`DELETE FROM forest_trees WHERE user_id = $1 AND task_id = ANY($2::uuid[])`, [
      user.id,
      taskIds,
    ]);

    const del = await client.query(
      `DELETE FROM user_tasks ut
       USING tasks t
       WHERE ut.task_id = t.id AND ut.user_id = $1 AND t.type = ANY($2::text[])`,
      [user.id, QUIZ_TYPES]
    );
    console.log(`Deleted user_tasks rows: ${del.rowCount ?? 0}`);

    await client.query(
      `UPDATE users SET points = GREATEST(0, points - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [totalPoints, user.id]
    );

    for (const key of Object.keys(FOREST_COL) as ForestCategoryKey[]) {
      const sub = forestSubtract[key];
      if (sub <= 0) continue;
      const col = FOREST_COL[key];
      await client.query(
        `UPDATE users SET ${col} = GREATEST(0, ${col} - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [sub, user.id]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const after = await db.query('SELECT points, forest_points_kommunikation, forest_points_mensch, forest_points_natur, forest_points_ressourcen FROM users WHERE id = $1', [
    user.id,
  ]);
  console.log('Done. User after:', after.rows[0]);
  console.warn(
    '[Hinweis] contest_participants.points und Wachstum auf anderen Bäumen wurden nicht angepasst; ggf. manuell prüfen.'
  );

  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
