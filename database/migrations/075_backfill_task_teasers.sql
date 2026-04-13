-- Backfill teaser and teaser_i18n for existing tasks.
-- Ziel: kurze, kachelgeeignete Vorschau-Texte (~58 Zeichen) pro Sprache.

CREATE OR REPLACE FUNCTION make_task_teaser(input_text TEXT, max_len INTEGER DEFAULT 58)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
  clipped TEXT;
BEGIN
  cleaned := COALESCE(input_text, '');
  -- HTML-Tags entfernen, Whitespace normalisieren
  cleaned := regexp_replace(cleaned, '<[^>]*>', ' ', 'g');
  cleaned := replace(cleaned, '&nbsp;', ' ');
  cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');
  cleaned := btrim(cleaned);

  IF cleaned = '' THEN
    RETURN '';
  END IF;

  IF length(cleaned) <= max_len THEN
    RETURN cleaned;
  END IF;

  -- Wortbasiertes Clipping am Zeilenende
  clipped := btrim(regexp_replace(left(cleaned, max_len + 1), '\s+\S*$', '', ''));

  -- Fallback falls keine sinnvolle Wortgrenze gefunden wurde
  IF clipped = '' OR length(clipped) < floor(max_len * 0.55) THEN
    clipped := btrim(left(cleaned, max_len));
  END IF;

  RETURN clipped || '…';
END;
$$;

WITH source_texts AS (
  SELECT
    t.id,
    COALESCE(
      NULLIF(t.description_i18n->>'de', ''),
      NULLIF(t.description, ''),
      NULLIF(t.title_i18n->>'de', ''),
      NULLIF(t.title, ''),
      ''
    ) AS src_de,
    COALESCE(
      NULLIF(t.description_i18n->>'en', ''),
      NULLIF(t.description, ''),
      NULLIF(t.title_i18n->>'en', ''),
      NULLIF(t.title, ''),
      ''
    ) AS src_en
  FROM tasks t
),
generated AS (
  SELECT
    id,
    make_task_teaser(src_de, 58) AS teaser_de,
    make_task_teaser(src_en, 58) AS teaser_en
  FROM source_texts
)
UPDATE tasks t
SET
  teaser = g.teaser_de,
  teaser_i18n = jsonb_build_object(
    'de', g.teaser_de,
    'en', g.teaser_en
  ),
  updated_at = CURRENT_TIMESTAMP
FROM generated g
WHERE t.id = g.id;

DROP FUNCTION IF EXISTS make_task_teaser(TEXT, INTEGER);

-- Backfill teaser/teaser_i18n for existing tasks.
-- Target length is optimized for task tiles (~60 chars incl. ellipsis).

CREATE OR REPLACE FUNCTION compress_task_teaser(input_text TEXT, max_len INT DEFAULT 60)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
  sliced TEXT;
  cut_pos INT;
BEGIN
  cleaned := trim(regexp_replace(coalesce(input_text, ''), '\s+', ' ', 'g'));
  IF cleaned = '' THEN
    RETURN '';
  END IF;

  IF char_length(cleaned) <= max_len THEN
    RETURN cleaned;
  END IF;

  sliced := left(cleaned, max_len);
  cut_pos := length(sliced) - strpos(reverse(sliced), ' ') + 1;

  IF cut_pos > floor(max_len * 0.55) THEN
    sliced := rtrim(left(sliced, cut_pos - 1));
  ELSE
    sliced := rtrim(sliced);
  END IF;

  RETURN sliced || '…';
END;
$$;

UPDATE tasks
SET
  teaser_i18n = jsonb_build_object(
    'de', compress_task_teaser(
      coalesce(
        nullif(teaser_i18n->>'de', ''),
        nullif(description_i18n->>'de', ''),
        nullif(description, ''),
        nullif(title_i18n->>'de', ''),
        nullif(title, '')
      ),
      60
    ),
    'en', compress_task_teaser(
      coalesce(
        nullif(teaser_i18n->>'en', ''),
        nullif(description_i18n->>'en', ''),
        nullif(description, ''),
        nullif(title_i18n->>'en', ''),
        nullif(title, '')
      ),
      60
    )
  ),
  teaser = compress_task_teaser(
    coalesce(
      nullif(teaser_i18n->>'de', ''),
      nullif(description_i18n->>'de', ''),
      nullif(description, ''),
      nullif(title, '')
    ),
    60
  )
WHERE
  coalesce(nullif(teaser, ''), '') = ''
  OR teaser_i18n IS NULL
  OR coalesce(nullif(teaser_i18n->>'de', ''), '') = ''
  OR coalesce(nullif(teaser_i18n->>'en', ''), '') = '';

DROP FUNCTION IF EXISTS compress_task_teaser(TEXT, INT);

