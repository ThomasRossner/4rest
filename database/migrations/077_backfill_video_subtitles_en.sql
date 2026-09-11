-- Backfill für bestehende Video-Aufgaben:
-- - Stellt sicher, dass video_subtitles_i18n als Objekt vorliegt
-- - Ergänzt fehlende EN-Spur aus vorhandener Spur (de/en) mittels URL-Ableitung
-- - Ergänzt fehlende DE-Spur aus bestehender EN-Spur oder video_url
--
-- Konvention:
--   /uploads/task-video-123.mp4      -> /uploads/task-video-123.en.vtt
--   /uploads/task-video-123.mp4      -> /uploads/task-video-123.de.vtt
--   .../name.de.vtt                  -> .../name.en.vtt
--   .../name.en.vtt                  -> .../name.de.vtt

WITH normalized AS (
  SELECT
    id,
    video_url,
    CASE
      WHEN jsonb_typeof(video_subtitles_i18n) = 'object' THEN video_subtitles_i18n
      ELSE '{}'::jsonb
    END AS subs
  FROM tasks
  WHERE type = 'video'
),
computed AS (
  SELECT
    id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'de',
        COALESCE(
          NULLIF(subs->>'de', ''),
          CASE
            WHEN NULLIF(subs->>'en', '') IS NOT NULL THEN
              regexp_replace(subs->>'en', '\.en\.vtt($|\?)', '.de.vtt\1')
            WHEN video_url IS NOT NULL THEN
              regexp_replace(video_url, '(\.[A-Za-z0-9]+)($|\?)', '.de.vtt\2')
            ELSE NULL
          END
        ),
        'en',
        COALESCE(
          NULLIF(subs->>'en', ''),
          CASE
            WHEN NULLIF(subs->>'de', '') IS NOT NULL THEN
              regexp_replace(subs->>'de', '\.de\.vtt($|\?)', '.en.vtt\1')
            WHEN video_url IS NOT NULL THEN
              regexp_replace(video_url, '(\.[A-Za-z0-9]+)($|\?)', '.en.vtt\2')
            ELSE NULL
          END
        )
      )
    ) AS merged_subs
  FROM normalized
)
UPDATE tasks t
SET
  video_subtitles_i18n = c.merged_subs,
  updated_at = CURRENT_TIMESTAMP
FROM computed c
WHERE t.id = c.id
  AND t.video_subtitles_i18n IS DISTINCT FROM c.merged_subs;
