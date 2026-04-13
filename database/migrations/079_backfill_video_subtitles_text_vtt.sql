-- Fallback-Backfill für Video-Untertitel ohne externe STT-API:
-- Erzeugt für nicht-YouTube-Videoaufgaben echte, immer verfügbare VTT-Spuren
-- als data: URLs (de/en) aus Titel + Beschreibung.
--
-- Hinweis:
-- - Dies sind Text-Untertitel aus Aufgabeninhalten (keine Audio-Transkription).
-- - YouTube-Links werden ausgelassen (Tracks an iframe nicht nutzbar).

WITH source_rows AS (
  SELECT
    t.id,
    trim(
      regexp_replace(
        concat_ws(
          ' - ',
          coalesce(nullif(t.title_i18n->>'de', ''), nullif(t.title, ''), ''),
          coalesce(nullif(t.description_i18n->>'de', ''), nullif(t.description, ''), '')
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS text_de,
    trim(
      regexp_replace(
        concat_ws(
          ' - ',
          coalesce(nullif(t.title_i18n->>'en', ''), nullif(t.title_i18n->>'de', ''), nullif(t.title, ''), ''),
          coalesce(nullif(t.description_i18n->>'en', ''), nullif(t.description_i18n->>'de', ''), nullif(t.description, ''), '')
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS text_en
  FROM tasks t
  WHERE t.type = 'video'
    AND coalesce(t.video_url, '') !~* 'youtube\.com|youtu\.be'
),
vtt_rows AS (
  SELECT
    id,
    (
      'data:text/vtt;base64,' ||
      encode(
        convert_to(
          'WEBVTT' || E'\n\n' ||
          '00:00:00.000 --> 99:00:00.000' || E'\n' ||
          coalesce(nullif(text_de, ''), 'Untertitel') || E'\n',
          'UTF8'
        ),
        'base64'
      )
    ) AS de_vtt_url,
    (
      'data:text/vtt;base64,' ||
      encode(
        convert_to(
          'WEBVTT' || E'\n\n' ||
          '00:00:00.000 --> 99:00:00.000' || E'\n' ||
          coalesce(nullif(text_en, ''), 'Subtitles') || E'\n',
          'UTF8'
        ),
        'base64'
      )
    ) AS en_vtt_url
  FROM source_rows
),
next_values AS (
  SELECT
    id,
    jsonb_build_object(
      'de', de_vtt_url,
      'en', en_vtt_url
    ) AS subtitle_map
  FROM vtt_rows
)
UPDATE tasks t
SET
  video_subtitles_i18n = n.subtitle_map,
  updated_at = CURRENT_TIMESTAMP
FROM next_values n
WHERE t.id = n.id
  AND t.video_subtitles_i18n IS DISTINCT FROM n.subtitle_map;
