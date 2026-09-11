# TICKET-043: Web – Fokuskontrast Navigation zu gering (WCAG)

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: In `Navigation.css` sind `:focus-visible`-Regeln für `a`/`button` in `.navigation` und `.navigation-bottom` ergänzt (sichtbares helles Outline, Offset). Gegenprobe nach Deploy: TAB durch die Navigation.

**Beschreibung:**
Beim Navigationsmenü ist der **Fokuskontrast** zu gering (im Test gemessen ca. **1,37:1** und **1,17:1**). Erwartet wird u. a. ein kontraststarker Fokusrahmen (mind. **3:1** zum Hintergrund) oder eine ausreichende Farbänderung zwischen fokussiertem und nicht fokussiertem Zustand (TAB-Navigation).

**Reproduktion (laut Testbericht):** Login, mit TAB durch das Navigationsmenü, Kontrast z. B. mit WebAIM Contrast Checker prüfen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Web Finding #3).
