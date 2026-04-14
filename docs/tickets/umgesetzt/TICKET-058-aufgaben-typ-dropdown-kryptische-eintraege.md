# TICKET-058: Aufgaben – Filter „Alle Typen“ enthält kryptische/ungültige Kategorien

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: `TasksPage` filtert API- und Task-abgeleitete Typen auf eine Whitelist (`video`, `quiz`, `article_quiz`, `survey`, `qr`, `photo`, `visit_location`); ungültiger `typeFilter` wird auf `all` zurückgesetzt.

**PDF-Bug:** 003

**Abgleich:** [TICKET-047-aufgaben-dropdown-overlay-responsive.md](TICKET-047-aufgaben-dropdown-overlay-responsive.md) betrifft **Overlay/Responsive** des Dropdowns, **nicht** fehlerhafte Listeneinträge (Datenqualität).

**Priorität (laut PDF):** Hoch

**Beschreibung:**
Im Dropdown „Alle Typen“ erscheinen neben gültigen Typen offenbar **Test-/Platzhalter-Strings** (z. B. „Ucicicucj“, „56;;()::“). In Produktion sollen nur **definierte, freigegebene** Aufgabentypen erscheinen; Datenquelle bereinigen oder serverseitig filtern.

**Quelle:** PDF Bug-tracker, Bug 003.
