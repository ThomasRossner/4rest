# TICKET-063: Wald – Anzahl gerenderter Bäume stimmt nicht mit Kennzahl/Wachstum überein

**Typ:** Bug

**Status:** offen

**PDF-Bug:** 008

**Abgleich:** [TICKET-032-punkte-verlieren.md](TICKET-032-punkte-verlieren.md) ist **Spieldynamik Punkte abziehen**, nicht Visualisierung. Laut PDF ist die **Baumlogik fachlich referenziert** – Rendering muss zu Kennzahlen passen (Testfälle 0, 1, 5, 10, 25).

**Priorität (laut PDF):** Kritisch

**Beschreibung:**
Beispiel: ein gepflanzter Baum / eine Aufgabe, im 3D-Rendering wirken deutlich mehr Bäume sichtbar als die angezeigten Kennzahlen erwarten lassen. Datenstand und Visualisierung angleichen; kein irreführender Demo-/Seed-Fallback in Produktion.

**Quelle:** PDF Bug-tracker, Bug 008.
