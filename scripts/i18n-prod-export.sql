-- Single-row JSON for i18n translation pipeline (read-only)
SELECT json_build_object(
  'tasks', (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT id::text, title_i18n, description_i18n, article_content_i18n, quiz_questions, survey_questions FROM tasks
  ) t),
  'rewards', (SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) FROM (
    SELECT id::text, title_i18n, description_i18n FROM rewards
  ) r),
  'locations', (SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json) FROM (
    SELECT id::text, name_i18n, description_i18n, address_i18n, category_description_i18n FROM locations
  ) l),
  'contests', (SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM (
    SELECT id::text, name_i18n FROM contests
  ) c),
  'teams', (SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json) FROM (
    SELECT id::text, name_i18n FROM teams
  ) m)
) AS payload;
