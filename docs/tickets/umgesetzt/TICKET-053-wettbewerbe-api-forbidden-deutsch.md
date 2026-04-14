# TICKET-053: Wettbewerbe verwalten – Fehlermeldung „Forbidden“ statt verständlichem Hinweis

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, `GET /api/contests` ohne Cookie: **401** `Unauthorized`. Szenario Rezeption + Bulk-Aktion → **„Forbidden“** mit Demo-Gast **nicht** nachgestellt.

**Beschreibung:**
Auf **„Wettbewerbe verwalten“** liefern Aktionen **Aktivieren**, **Deaktivieren**, **Löschen** (mit ausgewählter Checkbox) die rohe Meldung **„Forbidden“**. Erwartet: **verständlicher deutscher Hinweis**, z. B. dass nur **Administratoren** Wettbewerbe bearbeiten dürfen (wenn Rezeption keinen Zugriff hat), oder die Aktionen sind für die Rolle **nicht sichtbar/deaktiviert**.

**Reproduktion (laut Testbericht):** Login als `test@example.com`, Wettbewerbe verwalten, Zeile wählen, eine der genannten Buttons.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #11).
