# TICKET-048: Login – Fehlermeldung „invalid credentials“ ohne Feldbezug

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: Backend `auth.controller.ts` liefert bei unbekannter E-Mail `EMAIL_NOT_FOUND` / bei falschem Passwort `WRONG_PASSWORD` mit `field`; Frontend `LoginPage` zeigt Übersetzungen unter E-Mail bzw. Passwort (`login-field-error`). API/OpenAPI angepasst. Gegenprobe: falsche E-Mail vs. falsches Passwort.

**Beschreibung:**
Bei fehlerhafter Anmeldung erscheint eine **englische** Meldung **„invalid credentials“**. Es wird **nicht** angezeigt, welches Feld falsch ist (E-Mail vs. Passwort). Erwartet wird **feldspezifisches** Feedback (z. B. Hinweis unter dem E-Mail-Feld bei falscher E-Mail) und **deutsche**, verständliche Texte.

**Reproduktion (laut Testbericht):** Falsche E-Mail (`test@example.co`), korrektes Passwort, Anmelden.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #6).
