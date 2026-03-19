# Quiz/Survey JSON i18n Schema

Dieses Dokument beschreibt das produktive JSON-Format fuer `tasks.quiz_questions` und `tasks.survey_questions`.

## Quiz JSON (`quiz_questions`)

```json
[
  {
    "id": "q_1",
    "question": "Legacy fallback text",
    "prompt": "Legacy fallback text",
    "prompt_i18n": { "de": "Fragetext", "en": "Question text" },
    "answers": [
      {
        "id": "a_1",
        "text": "Legacy fallback option",
        "text_i18n": { "de": "Antwort A", "en": "Answer A" }
      }
    ],
    "options": ["Legacy fallback option"],
    "correctAnswerId": "a_1",
    "correct_answer_id": "a_1",
    "correctAnswer": "Legacy fallback option",
    "correct_answer": "Legacy fallback option"
  }
]
```

## Survey JSON (`survey_questions`)

```json
[
  {
    "id": "s_1",
    "question": "Legacy fallback text",
    "question_i18n": { "de": "Fragetext", "en": "Question text" },
    "type": "single_choice",
    "required": true,
    "options": [
      {
        "id": "opt_1",
        "text": "Legacy fallback option",
        "option_i18n": { "de": "Option A", "en": "Option A" }
      }
    ]
  }
]
```

## Fallback-Regeln

- Runtime zeigt zuerst `*_i18n[preferredLanguage]`.
- Falls leer: fallback auf die jeweils andere Sprache.
- Falls weiterhin leer: fallback auf Legacy-Felder (`question`, `prompt`, `text`, `options`).

So bleiben Alt-Daten kompatibel, waehrend neue Inhalte sauber sprachgetrennt gepflegt werden koennen.
