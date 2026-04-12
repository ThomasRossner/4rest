# TICKET-044: iOS – Kontrast Navigationsanzeige „Roots“ (Wechsel auf Grün)

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, Playwright nach Login (`demo@example.com`): Vergleich computed `color`/`backgroundColor` des ersten Nav-Links auf `/` vor und nach Besuch `/rewards` und Zurück – **keine Änderung** (jeweils weiße Schrift, halbtransparenter Hintergrund). Grüner Navigationszustand aus dem iOS-Bericht **nicht** in Chromium nachgestellt.

**Beschreibung:**
Wechseln Nutzende von der Seite „Roots“ über die Navigation zu einer anderen Seite und zurück zur „Roots“-Seite, wird die **Navigationsanzeige grün**; die Schrift ist dann **schlecht oder nicht mehr lesbar**. Erwartet wird eine **konsistente** Darstellung (z. B. heller Hintergrund), sodass die Schrift jederzeit gut lesbar bleibt.

**Reproduktion (laut Testbericht):** Login, Kachel z. B. „Bonuspunkte geben“, Seite nach unten ziehen oder neu laden, zurück zu Roots.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, iOS Finding #1).
