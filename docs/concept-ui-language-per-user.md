# Konzept: UI-Sprache pro Benutzer

Die Oberfläche läuft in der vom Benutzer gewählten Sprache. Die Sprachwahl wird im Profil gespeichert; ein Wechsel der Sprache ist nur noch auf dem Login-Bildschirm und im Profil möglich.

---

## 1. Regeln

1. **Profilsprache:** Jeder Benutzer hat im Profil eine Einstellung **Sprache** (z. B. Deutsch / Englisch). Die gesamte UI (nach dem Login) läuft in dieser Sprache.
2. **Keine Sprach-Umschalt-Buttons in der App:** In allen Bereichen (Navigation, Admin, Redaktion, Rezeption, Profil, Aufgaben, Belohnungen, …) entfallen die Sprach-Umschalt-Buttons. Die Sprache wird ausschließlich über das Profil geändert.
3. **Login-Bildschirm:** Rechts oben bleibt ein **Sprach-Umschalt-Button** (DE/EN). Er gilt nur für die Login-Maske (Anmelden, Registrieren, Passwort vergessen, etc.).
4. **Registrierung:** Beim Anlegen eines neuen Kontos (Registrierung) wird die **am Login-Bildschirm aktuell eingestellte Sprache** als Standard-Sprache des neuen Benutzers gespeichert.

---

## 2. Technische Umsetzung (Überblick)

### Backend

- **users-Tabelle:** Neue Spalte `preferred_language` (z. B. `VARCHAR(5)` oder `VARCHAR(10)`, Werte `'de'`, `'en'`). Default z. B. `'de'`.
- **GET /users/me:** Feld `preferred_language` im Response mit ausliefern.
- **PUT /users/:id/profile** (bzw. PATCH): Akzeptiert `preferred_language` und speichert es.
- **POST /auth/register:** Optionales Feld `preferred_language` im Request Body; wenn mitgesendet, wird es beim Anlegen des Users gesetzt. Fehlt es, Backend-Default (z. B. `'de'`) verwenden.

### Frontend

- **Login-Seite:** Sprach-Umschalter rechts oben beibehalten (wie bisher). Keine Speicherung in `localStorage` für „dauerhafte“ Sprache – nur für die Anzeige der Login-Maske.
- **Registrierung:** Beim Aufruf von `POST /auth/register` die aktuell am Login-Bildschirm gewählte Sprache (`i18n.language`) als `preferred_language` mitsenden.
- **Nach dem Login:** Sobald `/users/me` geladen ist, `i18n.changeLanguage(user.preferred_language)` ausführen (mit Fallback auf `'de'`, wenn nicht gesetzt). Damit läuft die App durchgängig in der Profilsprache.
- **Profil-Seite:** Statt eines globalen Sprach-Umschalters eine Einstellung **Sprache** (Dropdown oder zwei Buttons DE/EN). Beim Ändern: API `PUT /users/:id/profile` mit `preferred_language` aufrufen und danach `i18n.changeLanguage(newLang)` ausführen, damit die UI sofort umschaltet.
- **Überall sonst:** Alle bisherigen `<LanguageSwitcher />`-Vorkommen außer auf der Login-Seite entfernen (Admin, Redaktion, Rezeption; ggf. ungenutzte Imports in Navigation, ProfilePage bereinigen).

### i18n-Initialisierung

- Beim App-Start (vor Login) kann weiterhin z. B. Browser-Sprache oder `localStorage` für die Login-Maske genutzt werden.
- Nach Login: Sprache aus `user.preferred_language` setzen und nicht mehr aus `localStorage` überschreiben (oder: `localStorage` nur noch beim Login-Seiten-Kontext setzen, nicht für die eingeloggte App).

---

## 3. Betroffene Dateien (Stichpunkte)

| Bereich | Änderung |
|--------|----------|
| **DB** | Migration: `users.preferred_language` hinzufügen, Default `'de'`. |
| **Backend: user.service** | `getMeService` / User-Mapping: `preferred_language` lesen; `createUser` und `updateUserProfileService`: `preferred_language` schreiben. |
| **Backend: auth.controller** | `register`: `preferred_language` aus `req.body` übernehmen und an `createUser` übergeben. |
| **Backend: auth (createUser)** | `CreateUserData` um `preferred_language?` erweitern; INSERT/UPDATE anpassen. |
| **Frontend: LoginPage** | Sprach-Umschalter beibehalten. Bei Registrierung `preferred_language: i18n.language` mitsenden. |
| **Frontend: Nach Login** | Nach `getMe()` / `refreshMe()` Sprache aus `user.preferred_language` setzen (`i18n.changeLanguage`). |
| **Frontend: ProfilePage** | Sprachauswahl (DE/EN) als Profil-Einstellung einbauen; speichern über Profile-API und `i18n.changeLanguage`. |
| **Frontend: AdminPage, RedaktionPage, RezeptionPage** | `<LanguageSwitcher />` (und ggf. umgebendes Markup) entfernen. |
| **Frontend: Navigation, ProfilePage** | Ungenutzten Import `LanguageSwitcher` entfernen, falls nicht mehr verwendet. |

---

## 4. Variable Inhalte (aus der Datenbank)

Beim **Anzeigen** von variablen Inhalten (Tasks, Rewards, Locations, etc.) wird immer die Sprachvariante genutzt, die zur **Profilsprache** des Benutzers passt (`preferred_language`). Die Redaktion pflegt die Inhalte pro Sprache über einen eigenen „Inhaltssprache“-Umschalter in den Bearbeitungsmasken; siehe [concept-bilingual-user-content.md](./concept-bilingual-user-content.md).

---

## 5. Zusammenfassung

- **Eine** Sprache pro User, gespeichert in `users.preferred_language`.
- UI nach Login immer in dieser Sprache; Umschaltung nur über Profil.
- Login-Bildschirm: Sprach-Umschalter bleibt; bei Registrierung wird diese Sprache als `preferred_language` für den neuen User übernommen.
- **Variable Inhalte** (aus der DB): Anzeige immer in der Profilsprache des Nutzers.
