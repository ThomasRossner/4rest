# TICKET-054: Wettbewerb löschen – Bestätigungsdialog zeigt i18n-Key statt Namen

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, unverändert: Admin-Wettbewerbe/Lösch-Dialog mit Demo-Gast nicht erreichbar.

**Beschreibung:**
Der Lösch-Dialog zeigt einen Platzhalter wie **„1rezeption.contest.manage.contest“** statt des **echten Wettbewerbsnamens** (z. B. „Test“). Übersetzungs-/i18n-Key wird ausgegeben.

**Reproduktion (laut Testbericht):** Login als `test@example.com`, Wettbewerbe verwalten, Eintrag wählen, „Löschen“.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #12).
