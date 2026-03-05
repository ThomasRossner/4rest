# Konzept: Zweisprachigkeit bei benutzerpflegbaren Inhalten

Übersicht aller Stellen, an denen Nutzer Text eingeben können, und Zuordnung für ein DE/EN-Konzept.

**UI-Sprache pro Benutzer:** Die Oberfläche läuft in der im Profil eingestellten Sprache; Sprach-Umschalter nur auf dem Login-Bildschirm (und Änderung im Profil). Bei Registrierung wird die am Login gewählte Sprache als Standard gespeichert. Siehe [concept-ui-language-per-user.md](./concept-ui-language-per-user.md).

---

## 1. Redaktionsinhalte (für Endnutzer sichtbar) → **Zweisprachigkeit nötig**

Diese Inhalte werden von Admin/Redaktion gepflegt und den Endnutzern angezeigt. Sie sollten in Deutsch und Englisch vorliegen.

| Bereich | Felder | Wo gepflegt | Wo angezeigt |
|--------|--------|-------------|--------------|
| **Aufgaben (Tasks)** | `title`, `description`, `article_content`, Quiz-Fragen/Antworten (`prompt`, `answer.text`), Umfrage-Fragen/Optionen (`question`, `option`), `target_address` | AdminPage (Task-Verwaltung) | TasksPage, Task-Details, Quiz/Article/Survey/Visit-Location |
| **Belohnungen (Rewards)** | `title`, `description` | AdminPage (Reward-Verwaltung) | Rewards-Bereich, Einlösung |
| **Orte (Locations)** | `name`, `description`, `address`, `category_description` (ggf. weitere Adresszeilen) | AdminPage (Location-Verwaltung), RedaktionPage | Karte, Aufgaben, Standortauswahl |
| **Contests** | `name` | ContestCreator, ContestManagement | Contest-Listen, Ranglisten |
| **Teams** | `name` | TeamCreator, TeamManagement | Team-Listen, Zuordnung |
| **Foto-Ablehnung** | Ablehnungsgrund (Freitext an Nutzer) | PhotoValidation (Admin) | Mailbox des Nutzers |

**Backend/Datenbank:** Aktuell einsprachig (z. B. `tasks.title`, `rewards.title`, `locations.name`). Für Zweisprachigkeit wären z. B. möglich:
- Option A: Zusätzliche Spalten `title_de`, `title_en` (bzw. `name_de`, `name_en`) und Auslieferung je nach `Accept-Language` oder Frontend-Sprache.
- Option B: JSONB-Felder z. B. `title_i18n = { "de": "...", "en": "..." }`; Backend liefert Objekt, Frontend wählt `title_i18n[i18n.language]` oder Fallback.

### Variable Inhalte: Bearbeiten vs. Anzeigen

**Variable Texte** = alle Inhalte, die aus der Datenbank stammen (Tasks, Rewards, Locations, Contests, Teams, etc.). Für jede Sprache existiert eine eigene Variante (z. B. `title_i18n.de` und `title_i18n.en`).

- **Bearbeiten (Admin/Redaktion):** In allen Oberflächen, in denen diese Datenobjekte bearbeitet werden (z. B. Task bearbeiten, Reward bearbeiten, Location bearbeiten), gibt es **oben einen Umschaltbutton für die Inhaltssprache** (z. B. „Deutsche Inhalte“ / „Englische Inhalte“).  
  - Steht der Button auf „Deutsche Inhalte“, werden und bearbeitet man die deutschen Texte (z. B. `title_i18n.de`, `description_i18n.de`).  
  - Steht er auf „Englische Inhalte“, die englischen (`title_i18n.en`, `description_i18n.en`).  
  - Die **Beschriftung des Buttons** ist selbst internationalisiert: In einer deutschen UI „Deutsche Inhalte“ / „Englische Inhalte“, in einer englischen UI z. B. „German content“ / „English content“.

- **Anzeige (Endnutzer):** Beim Anzeigen der variablen Inhalte (Aufgaben, Belohnungen, Orte, etc.) wird immer die **Sprachvariante verwendet, die der Benutzer in seinem Profil eingestellt hat** (`preferred_language`). Kein Umschalter für Inhalte – die Anzeigesprache ist die Profilsprache.

---

## 2. Persönliche / technische Eingaben → **keine Mehrsprachigkeit**

| Bereich | Felder | Anmerkung |
|--------|--------|-----------|
| **Login/Registrierung** | Name, E-Mail, Passwort, Login-Code, neues Passwort | Persönliche Daten des Nutzers |
| **User-Management** | E-Mail, Name, Passwort (neu/bestätigen) | Nutzerstammdaten |
| **Parameter/System** | Parameter-Wert (Admin) | Technische Konfiguration |
| **Rewards (technisch)** | `voucher_code`, `external_api_id` | Keine Anzeige als „Titel/Beschreibung“ |
| **Tasks (technisch)** | `qr_code`, URLs | Identifikatoren/URLs |
| **Debug-Tools** | E-Mails, IDs, Filter, Survey-Titel/Beschreibung (Test) | Nur für Tests/Support |

Diese Felder bleiben einsprachig; nur die **UI-Labels/Platzhalter** sind bereits über i18n (DE/EN) abgedeckt.

---

## 3. Nutzerantworten (von Endnutzern ausgefüllt) → **keine Redaktions-Zweisprachigkeit**

| Bereich | Felder | Anmerkung |
|--------|--------|-----------|
| **Umfrage (Survey)** | Freitext-Antwort in `SurveyTask` | Nutzer schreibt in seiner Sprache; Speicherung als Nutzerdaten, keine Redaktion. |
| **QR-Code-Task** | Gescannter Code | Kein anzeigbarer „Inhalt“. |
| **Foto-Kommentar** | ggf. Nutzertext | Falls vorhanden: Nutzerdaten. |

Hier geht es nicht um Redaktionsinhalte, sondern um Nutzerdaten. Ein Konzept für Zweisprachigkeit betrifft sie nur optional (z. B. Anzeige von Nutzertext in Admin-Ansichten).

---

## 4. Filter und Suche → **nur UI i18n**

Such- und Filterfelder (z. B. AdminPage: Suche nach Titel/Name, RedaktionPage: Filter nach Standortname, UserSelectionModal: Suche, ManagementTable: Filter) enthalten keine Inhalte, die Endnutzer sehen. Platzhalter und Labels sind über Übersetzungs-Keys (DE/EN) abgedeckt.

---

## Empfehlung für die Umsetzung

1. **Priorisierung:** Mit den für Endnutzer sichtbaren Inhalten starten: **Tasks** (title, description, Artikel, Quiz, Umfrage, Adresse), **Rewards** (title, description), **Locations** (name, description, address, category_description), **Contests/Teams** (name).
2. **Datenmodell:** Entweder getrennte Spalten (`*_de`, `*_en`) oder JSONB `*_i18n`; API liefert beide Sprachen oder ein Objekt.
3. **Admin-UI (Bearbeitung):** Pro Bearbeitungsansicht (Task, Reward, Location, …) **ein Umschaltbutton oben für die Inhaltssprache** („Deutsche Inhalte“ / „Englische Inhalte“, Beschriftung per i18n). Die sichtbaren Eingabefelder zeigen und speichern dann jeweils nur die gewählte Sprachvariante (DE oder EN). So werden keine doppelten Felder pro Sprache benötigt – man wechselt die „Ebene“ über den Button.
4. **Anzeige (Endnutzer):** Variable Inhalte werden mit der Sprachvariante angezeigt, die im **Benutzerprofil** (`preferred_language`) eingestellt ist. Siehe [concept-ui-language-per-user.md](./concept-ui-language-per-user.md).
5. **Rückwärtskompatibilität:** Bestehende einsprachige Felder (z. B. `title`) als Fallback nutzen (z. B. wenn `title_i18n` leer oder fehlend) oder einmalig migrieren.

**Konkrete Umsetzung:** Siehe [bilingual-schema-and-api-proposal.md](./bilingual-schema-and-api-proposal.md) für Schema-Migrationen und API-Anpassungen (Tasks, Rewards, Locations).
