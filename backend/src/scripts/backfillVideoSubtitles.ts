import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getPool } from '../database/connection.js';
import { generateAndStoreVideoSubtitles } from '../services/video-subtitle.service.js';

function extractUploadFilename(videoUrl: string): string | null {
  const match = videoUrl.match(/\/uploads\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

async function run(): Promise<void> {
  const db = getPool();
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';

  const rows = await db.query<{
    id: string;
    title: string;
    video_url: string | null;
  }>(
    `SELECT id, title, video_url
     FROM tasks
     WHERE type = 'video'
       AND video_url IS NOT NULL
       AND btrim(video_url) <> ''`
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows.rows) {
    const videoUrl = String(row.video_url || '').trim();
    if (!videoUrl || /youtube\.com|youtu\.be/i.test(videoUrl)) {
      skipped += 1;
      continue;
    }

    const filename = extractUploadFilename(videoUrl);
    if (!filename) {
      skipped += 1;
      continue;
    }

    const fullPath = path.join(uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn('[SUBTITLE BACKFILL] Video file not found, skip:', fullPath);
      skipped += 1;
      continue;
    }

    try {
      const subtitles = await generateAndStoreVideoSubtitles({
        videoFilePath: fullPath,
        videoFilename: filename,
      });
      if (!subtitles || (!subtitles.de && !subtitles.en)) {
        skipped += 1;
        continue;
      }
      await db.query(
        `UPDATE tasks
         SET video_subtitles_i18n = $2::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [row.id, JSON.stringify(subtitles)]
      );
      updated += 1;
      console.log('[SUBTITLE BACKFILL] Updated:', row.title);
    } catch (error) {
      failed += 1;
      console.error('[SUBTITLE BACKFILL] Failed:', row.title, error);
    }
  }

  console.log('[SUBTITLE BACKFILL] Done', { total: rows.rows.length, updated, skipped, failed });
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => getPool().end());
