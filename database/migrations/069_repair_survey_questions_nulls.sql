-- Repariert kaputte survey_questions-Arrays mit JSON-null-Einträgen (z. B. Task „Anreise“).
-- Ursache: fehlerhafte Updates können [null, null, { … }] erzeugen; Admin und API erwarten Objekte.

UPDATE tasks
SET survey_questions = $anreise$[
  {"type": "text", "question": "Entfernung in KM", "required": true},
  {"type": "text", "question": "Ort", "required": true},
  {
    "type": "single_choice",
    "question": "Verkehrsmittel",
    "required": true,
    "question_i18n": {"de": "Verkehrsmittel", "en": "Verkehrsmittel"},
    "options": [
      {"id": "opt_1", "text": "Auto", "option_i18n": {"de": "Auto", "en": "Auto"}},
      {"id": "opt_2", "text": "Zug", "option_i18n": {"de": "Zug", "en": "Zug"}},
      {"id": "opt_3", "text": "Bus", "option_i18n": {"de": "Bus", "en": "Bus"}},
      {"id": "opt_4", "text": "Fahrrad", "option_i18n": {"de": "Fahrrad", "en": "Fahrrad"}},
      {"id": "opt_5", "text": "Zu Fuß", "option_i18n": {"de": "Zu Fuß", "en": "Zu Fuß"}},
      {"id": "opt_6", "text": "Anderes", "option_i18n": {"de": "Anderes", "en": "Anderes"}}
    ]
  }
]$anreise$::jsonb
WHERE title = 'Anreise'
  AND type = 'survey'
  AND survey_questions IS NOT NULL
  AND survey_questions::text LIKE '%null%';
