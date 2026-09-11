# TICKET-065: Profil – Contest verlassen: roher i18n-Key `contests.leave.button`

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: Im Root-Namespace `contests` fehlten in `de/translation.json` die Keys `leave.*` (nur unter `profile.contests` vorhanden). `contests.leave.*` ergänzt; `en` um `ranking.*` am Top-Level `contests` ergänzt (abgelaufener Contest-QR).

**PDF-Bug:** 010

**Abgleich:** [TICKET-054-wettbewerb-loeschen-dialog-i18n-key.md](TICKET-054-wettbewerb-loeschen-dialog-i18n-key.md) – gleiches Muster (**Key statt Text**), anderer Kontext (Löschen-Dialog vs. Leave-Button).

**Priorität (laut PDF):** Hoch

**Beschreibung:**
Button zeigt `contests.leave.button` statt z. B. „Contest verlassen“. DE/EN Keys hinterlegen; weitere Contest-Keys stichprobenartig prüfen.

**Quelle:** PDF Bug-tracker, Bug 010.
