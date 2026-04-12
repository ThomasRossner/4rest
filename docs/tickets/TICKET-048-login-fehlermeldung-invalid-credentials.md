# TICKET-048: Login – Fehlermeldung „invalid credentials“ ohne Feldbezug

**Typ:** Bug

**Status:** verifiziert

**Verifikation:** 2026-04-12, Playwright: falsche E-Mail `test@example.co`, falsches Passwort → UI „Invalid credentials“; API `POST /api/auth/login` → `{"error":"Invalid credentials"}`. Kein feldbezogener Hinweis. (Demo-Login separat erfolgreich.)

**Beschreibung:**
Bei fehlerhafter Anmeldung erscheint eine **englische** Meldung **„invalid credentials“**. Es wird **nicht** angezeigt, welches Feld falsch ist (E-Mail vs. Passwort). Erwartet wird **feldspezifisches** Feedback (z. B. Hinweis unter dem E-Mail-Feld bei falscher E-Mail) und **deutsche**, verständliche Texte.

**Reproduktion (laut Testbericht):** Falsche E-Mail (`test@example.co`), korrektes Passwort, Anmelden.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #6).
