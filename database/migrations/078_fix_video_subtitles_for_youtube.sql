-- Korrekturmigration:
-- 077 hat für einige YouTube-Links Untertitel-URLs gesetzt, die keine VTT-Dateien sind.
-- Diese Migration entfernt solche Einträge und erzeugt Ableitungen nur für echte Datei-URLs.

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
        CASE
          WHEN COALESCE(subs->>'de', '') ~* 'youtube\.com|youtu\.be' THEN NULL
          WHEN NULLIF(subs->>'de', '') IS NOT NULL THEN NULLIF(subs->>'de', '')
          WHEN NULLIF(subs->>'en', '') IS NOT NULL
            AND NOT (subs->>'en' ~* 'youtube\.com|youtu\.be') THEN
            regexp_replace(subs->>'en', '\.en\.vtt($|\?)', '.de.vtt\1')
          WHEN COALESCE(video_url, '') ~* 'youtube\.com|youtu\.be' THEN NULL
          WHEN NULLIF(video_url, '') IS NOT NULL THEN
            regexp_replace(video_url, '(\.[A-Za-z0-9]+)($|\?)', '.de.vtt\2')
          ELSE NULL
        END,
        'en',
        CASE
          WHEN COALESCE(subs->>'en', '') ~* 'youtube\.com|youtu\.be' THEN NULL
          WHEN NULLIF(subs->>'en', '') IS NOT NULL THEN NULLIF(subs->>'en', '')
          WHEN NULLIF(subs->>'de', '') IS NOT NULL
            AND NOT (subs->>'de' ~* 'youtube\.com|youtu\.be') THEN
            regexp_replace(subs->>'de', '\.de\.vtt($|\?)', '.en.vtt\1')
          WHEN COALESCE(video_url, '') ~* 'youtube\.com|youtu\.be' THEN NULL
          WHEN NULLIF(video_url, '') IS NOT NULL THEN
            regexp_replace(video_url, '(\.[A-Za-z0-9]+)($|\?)', '.en.vtt\2')
          ELSE NULL
        END
      )
    ) AS cleaned_subs
  FROM normalized
)
UPDATE tasks t
SET
  video_subtitles_i18n = c.cleaned_subs,
  updated_at = CURRENT_TIMESTAMP
FROM computed c
WHERE t.id = c.id
  AND t.video_subtitles_i18n IS DISTINCT FROM c.cleaned_subs;
