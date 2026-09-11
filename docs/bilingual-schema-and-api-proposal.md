# Vorschlag: Schema-Migrationen und API-Anpassungen für Tasks, Rewards, Locations (DE/EN)

Dieses Dokument ergänzt [concept-bilingual-user-content.md](./concept-bilingual-user-content.md) um konkrete Datenbank- und API-Änderungen.

---

## 1. Gewähltes Modell: JSONB `*_i18n`

**Empfehlung:** Mehrsprachige Texte als JSONB mit Schlüsseln `de` und `en`, z. B. `title_i18n = { "de": "...", "en": "..." }`.

- Einheitliches Muster für alle Entitäten und für verschachtelte Inhalte (Quiz, Umfrage).
- Erweiterbar für weitere Sprachen ohne Schema-Änderung.
- Bestehende Spalten `title`/`description`/`name` bleiben vorerst erhalten und werden aus `*_i18n` befüllt (Rückwärtskompatibilität und Fallback).

**Sprachauswahl:**  
- **API:** Liefert immer die vollen `*_i18n`-Felder; aufgelöste Felder `title`, `description` etc. können optional mitgeführt werden (z. B. aus `title_i18n.de` mit Fallback auf `en`).  
- **Bearbeitung (Admin/Redaktion):** In jeder Bearbeitungsansicht (Task, Reward, Location, …) ein **Umschaltbutton für die Inhaltssprache** („Deutsche Inhalte“ / „Englische Inhalte“, Labels per i18n). Die Formulare zeigen und speichern jeweils nur die gewählte Variante (DE oder EN).  
- **Anzeige (Endnutzer):** Es wird die Variante verwendet, die der Benutzer in seinem **Profil** (`preferred_language`) eingestellt hat. Siehe [concept-bilingual-user-content.md](./concept-bilingual-user-content.md) und [concept-ui-language-per-user.md](./concept-ui-language-per-user.md).

---

## 2. Tasks

### 2.1 Betroffene Felder (inhaltlich mehrsprachig)

| DB-Spalte (aktuell)   | Neu (JSONB)       | Inhalt |
|----------------------|-------------------|--------|
| `title`              | `title_i18n`      | Titel der Aufgabe |
| `description`        | `description_i18n` | Beschreibung |
| `article_content`    | `article_content_i18n` | Artikeltext (article_quiz) |
| `quiz_questions`     | bleibt JSONB, Struktur erweitert | Pro Frage: `prompt_i18n`, pro Antwort: `text_i18n` (siehe unten) |
| `survey_questions`   | bleibt JSONB, Struktur erweitert | Pro Frage: `question_i18n`, pro Option: `option_i18n` oder Option als String durch Objekt `{ "de": "...", "en": "..." }` ersetzt (siehe unten) |

`target_latitude` / `target_longitude` bleiben wie sie sind (keine Mehrsprachigkeit). Ein reines Anzeige-„Adress“-Feld existiert aktuell nicht in der DB; falls die Admin-UI nur eine Adresszeile für visit_location pflegt, kann diese später als `target_address_i18n` ergänzt werden.

### 2.2 Migration (Tasks)

```sql
-- Migration: 055_tasks_i18n.sql

-- Titel und Beschreibung
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title_i18n     JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS article_content_i18n JSONB DEFAULT '{}';

-- Bestehende Daten: bestehende Spalten in _i18n übernehmen (de als Primärsprache)
UPDATE tasks
SET
  title_i18n = jsonb_build_object('de', COALESCE(title, ''), 'en', COALESCE(title, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, '')),
  article_content_i18n = CASE
    WHEN article_content IS NOT NULL AND article_content != '' THEN jsonb_build_object('de', article_content, 'en', article_content)
    ELSE '{}'
  END
WHERE title_i18n = '{}' OR title_i18n IS NULL;

-- Optionale Constraint: title_i18n und description_i18n sollen Objekte mit optionalen Keys "de"/"en" sein
-- (kann weggelassen werden, wenn ihr keine strenge Validierung wollt)
```

**Quiz/Survey:** Die Struktur von `quiz_questions` und `survey_questions` bleibt JSONB; nur die darin enthaltenen Texte werden mehrsprachig. Das bedeutet keine neuen Spalten, sondern eine **Strukturkonvention** für die JSON-Inhalte:

- **quiz_questions:** Array von Objekten mit z. B. `prompt_i18n: { "de": "...", "en": "..." }`, `answers: [ { "text_i18n": { "de": "...", "en": "..." } } ]`. Alte Struktur `prompt`/`text` kann per Migration in `prompt_i18n`/`text_i18n` überführt werden (einmalig).
- **survey_questions:** Analog `question_i18n`, Optionen als Array von `{ "de": "...", "en": "..." }` oder einheitlich `option_i18n` pro Option.

Eine separate Migration (z. B. `058_tasks_quiz_survey_i18n.sql`) könnte bestehende `quiz_questions`/`survey_questions` lesen und in die neue Struktur schreiben; danach erwartet die API nur noch die neue Struktur. (Konkrete JSON-Transformation in SQL oder im Backend ausführbar.)

### 2.3 API Tasks

- **Request (POST/PUT Task):**
  - Akzeptiert weiterhin `title`, `description`, `article_content` (legacy); wenn gesetzt, werden sie in `title_i18n.de` / `description_i18n.de` / `article_content_i18n.de` geschrieben (und ggf. auch `en` kopiert, falls kein `*_i18n` mitgeliefert wird).
  - Neu: `title_i18n`, `description_i18n`, `article_content_i18n` als Objekte `{ "de": "...", "en": "..." }`. Wenn vorhanden, haben sie Vorrang vor den Legacy-Feldern.
  - `quiz_questions` / `survey_questions`: Struktur wie oben (mit `*_i18n` pro Frage/Antwort/Option).

- **Response (GET Task / GET Tasks):**
  - Immer ausliefern: `title_i18n`, `description_i18n`, `article_content_i18n` (und ggf. die aufgelösten Felder `title`, `description`, `article_content` aus z. B. `title_i18n.de` mit Fallback auf `en`, damit bestehende Frontends weiterlaufen).
  - `quiz_questions` / `survey_questions` in der neuen Struktur mit `*_i18n`.

- **Sprachauflösung (optional):** Query-Parameter `lang=de|en` oder Header `Accept-Language`; Backend füllt dann `title`, `description` etc. mit dem Wert aus der gewählten Sprache (Fallback: de → en).

---

## 3. Rewards

### 3.1 Betroffene Felder

| DB-Spalte (aktuell) | Neu (JSONB)          |
|---------------------|----------------------|
| `title`             | `title_i18n`         |
| `description`       | `description_i18n`   |

### 3.2 Migration (Rewards)

```sql
-- Migration: 056_rewards_i18n.sql

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS title_i18n       JSONB DEFAULT '{}';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description_i18n JSONB DEFAULT '{}';

UPDATE rewards
SET
  title_i18n = jsonb_build_object('de', COALESCE(title, ''), 'en', COALESCE(title, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, ''))
WHERE title_i18n = '{}' OR title_i18n IS NULL;
```

### 3.3 API Rewards

- **Request:** Analog Tasks: Legacy `title`/`description` und/oder `title_i18n`/`description_i18n` mit `{ "de", "en" }`.
- **Response:** Immer `title_i18n`, `description_i18n`; optional aufgelöste `title`/`description` für Abwärtskompatibilität.

---

## 4. Locations

### 4.1 Betroffene Felder

| DB-Spalte (aktuell)     | Neu (JSONB)              |
|-------------------------|--------------------------|
| `name`                  | `name_i18n`              |
| `description`          | `description_i18n`       |
| `address`              | `address_i18n`           |
| `category_description` | `category_description_i18n` |

Hinweis: `locations.name` hat aktuell UNIQUE. Bei Mehrsprachigkeit kann die Eindeutigkeit z. B. auf `name_i18n->>'de'` (oder einen anderen Primärschlüssel) gelegt werden, oder ihr behaltet `name` als generierten Wert (z. B. `name = COALESCE(name_i18n->>'de', name_i18n->>'en')`) und behaltet UNIQUE auf `name`.

### 4.2 Migration (Locations)

```sql
-- Migration: 057_locations_i18n.sql

ALTER TABLE locations ADD COLUMN IF NOT EXISTS name_i18n                  JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS description_i18n          JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_i18n               JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS category_description_i18n   JSONB DEFAULT '{}';

UPDATE locations
SET
  name_i18n = jsonb_build_object('de', COALESCE(name, ''), 'en', COALESCE(name, '')),
  description_i18n = jsonb_build_object('de', COALESCE(description, ''), 'en', COALESCE(description, '')),
  address_i18n = CASE
    WHEN address IS NOT NULL AND address != '' THEN jsonb_build_object('de', address, 'en', address)
    ELSE '{}'
  END,
  category_description_i18n = CASE
    WHEN category_description IS NOT NULL AND category_description != '' THEN jsonb_build_object('de', category_description, 'en', category_description)
    ELSE '{}'
  END
WHERE name_i18n = '{}' OR name_i18n IS NULL;
```

Falls ihr die bestehende UNIQUE-Constraint auf `name` beibehalten wollt: Nach der Migration weiterhin `name` aus `name_i18n->>'de'` (oder Fallback) setzen – entweder per Trigger oder im Backend bei jedem Schreibzugriff. Dann müsst ihr ggf. `name` in dieser Migration einmalig setzen:

```sql
UPDATE locations
SET name = COALESCE(name_i18n->>'de', name_i18n->>'en', name)
WHERE name_i18n != '{}';
```

### 4.3 API Locations

- **Request:** `name`, `description`, `address`, `category_description` (legacy) und/oder `name_i18n`, `description_i18n`, `address_i18n`, `category_description_i18n`.
- **Response:** Immer die `*_i18n`-Felder; optional aufgelöste `name`/`description`/`address`/`category_description` für Kompatibilität.

---

## 5. Reihenfolge und Abhängigkeiten

1. **055_tasks_i18n.sql** – Tasks: `title_i18n`, `description_i18n`, `article_content_i18n` + Datenmigration.
2. **056_rewards_i18n.sql** – Rewards: `title_i18n`, `description_i18n` + Datenmigration.
3. **057_locations_i18n.sql** – Locations: `name_i18n`, `description_i18n`, `address_i18n`, `category_description_i18n` + Datenmigration.
4. Optional: **058_tasks_quiz_survey_i18n.sql** (oder im Backend): Bestehende `quiz_questions`/`survey_questions` in die neue Struktur mit `*_i18n` überführen.

Backend-Anpassungen (Services, Controller, OpenAPI) sollten nach den Migrationen umgesetzt werden: Lesen/Schreiben der neuen Spalten, Akzeptanz von `*_i18n` im Request, Auslieferung von `*_i18n` (und optional aufgelösten Feldern) im Response. Frontend: Admin-UI um DE/EN-Eingaben pro Feld erweitern; App-Seiten nutzen `title_i18n[i18n.language]` (mit Fallback auf die andere Sprache).

---

## 6. OpenAPI (Stichpunkte)

- **Task:** Schema um optional `title_i18n`, `description_i18n`, `article_content_i18n` (Typ `object` mit optionalen Properties `de`, `en`) ergänzen; `title`, `description`, `article_content` optional beibehalten. Gleiches für Substrukturen von `quiz_questions`/`survey_questions`.
- **Reward:** `title_i18n`, `description_i18n` ergänzen; `title`/`description` optional.
- **Location:** `name_i18n`, `description_i18n`, `address_i18n`, `category_description_i18n` ergänzen; bestehende Felder optional.

Damit ist der konkrete Vorschlag für Schema (Migrationen) und API (Request/Response, optional Sprachauflösung) für Tasks, Rewards und Locations festgelegt und umsetzbar.
