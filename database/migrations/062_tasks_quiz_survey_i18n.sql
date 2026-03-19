-- Tasks: migrate quiz_questions / survey_questions texts to i18n JSON structure
-- Idempotent conversion:
-- - keeps legacy keys (question/options/text) for compatibility
-- - adds prompt_i18n/text_i18n/question_i18n/option_i18n where missing

-- Quiz-like structures (quiz, video, article_quiz)
UPDATE tasks
SET quiz_questions = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(
          q,
          '{prompt_i18n}',
          CASE
            WHEN q ? 'prompt_i18n' AND jsonb_typeof(q->'prompt_i18n') = 'object'
              THEN q->'prompt_i18n'
            ELSE jsonb_build_object(
              'de', COALESCE(q->>'question', q->>'prompt', ''),
              'en', COALESCE(q->>'question', q->>'prompt', '')
            )
          END,
          true
        ),
        '{answers}',
        (
          SELECT COALESCE(
            jsonb_agg(
              CASE
                WHEN jsonb_typeof(a) = 'object' THEN
                  jsonb_set(
                    jsonb_set(
                      a,
                      '{id}',
                      to_jsonb(COALESCE(a->>'id', 'a_' || row_number() OVER ()::text)),
                      true
                    ),
                    '{text_i18n}',
                    CASE
                      WHEN a ? 'text_i18n' AND jsonb_typeof(a->'text_i18n') = 'object'
                        THEN a->'text_i18n'
                      WHEN a ? 'option_i18n' AND jsonb_typeof(a->'option_i18n') = 'object'
                        THEN a->'option_i18n'
                      ELSE jsonb_build_object(
                        'de', COALESCE(a->>'text', ''),
                        'en', COALESCE(a->>'text', '')
                      )
                    END,
                    true
                  )
                ELSE
                  jsonb_build_object(
                    'id', 'a_' || row_number() OVER ()::text,
                    'text', COALESCE(a #>> '{}', ''),
                    'text_i18n', jsonb_build_object('de', COALESCE(a #>> '{}', ''), 'en', COALESCE(a #>> '{}', ''))
                  )
              END
            ),
            '[]'::jsonb
          )
          FROM jsonb_array_elements(
            CASE
              WHEN q ? 'answers' AND jsonb_typeof(q->'answers') = 'array' THEN q->'answers'
              WHEN q ? 'options' AND jsonb_typeof(q->'options') = 'array' THEN q->'options'
              ELSE '[]'::jsonb
            END
          ) AS a
        ),
        true
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(tasks.quiz_questions) = 'array' THEN tasks.quiz_questions ELSE '[]'::jsonb END) AS q
)
WHERE quiz_questions IS NOT NULL
  AND jsonb_typeof(quiz_questions) = 'array';

-- Survey structures
UPDATE tasks
SET survey_questions = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_set(
        jsonb_set(
          s,
          '{question_i18n}',
          CASE
            WHEN s ? 'question_i18n' AND jsonb_typeof(s->'question_i18n') = 'object'
              THEN s->'question_i18n'
            ELSE jsonb_build_object(
              'de', COALESCE(s->>'question', ''),
              'en', COALESCE(s->>'question', '')
            )
          END,
          true
        ),
        '{options}',
        CASE
          WHEN s ? 'options' AND jsonb_typeof(s->'options') = 'array' THEN (
            SELECT COALESCE(
              jsonb_agg(
                CASE
                  WHEN jsonb_typeof(o) = 'object' THEN
                    jsonb_set(
                      o,
                      '{option_i18n}',
                      CASE
                        WHEN o ? 'option_i18n' AND jsonb_typeof(o->'option_i18n') = 'object'
                          THEN o->'option_i18n'
                        ELSE jsonb_build_object(
                          'de', COALESCE(o->>'text', o->>'value', ''),
                          'en', COALESCE(o->>'text', o->>'value', '')
                        )
                      END,
                      true
                    )
                  ELSE
                    jsonb_build_object(
                      'id', 'opt_' || row_number() OVER ()::text,
                      'text', COALESCE(o #>> '{}', ''),
                      'option_i18n', jsonb_build_object('de', COALESCE(o #>> '{}', ''), 'en', COALESCE(o #>> '{}', ''))
                    )
                END
              ),
              '[]'::jsonb
            )
            FROM jsonb_array_elements(s->'options') AS o
          )
          ELSE s->'options'
        END,
        true
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(tasks.survey_questions) = 'array' THEN tasks.survey_questions ELSE '[]'::jsonb END) AS s
)
WHERE survey_questions IS NOT NULL
  AND jsonb_typeof(survey_questions) = 'array';
