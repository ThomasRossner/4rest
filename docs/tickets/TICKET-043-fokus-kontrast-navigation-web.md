# TICKET-043: Web – Fokuskontrast Navigation zu gering (WCAG)

**Typ:** Bug

**Status:** verifiziert

**Verifikation:** 2026-04-12, Playwright Chromium, nach Login (`demo@example.com`) auf `/`: nach TAB-Fokus zeigt das fokussierte Element **`outlineWidth: 0px`** (kein sichtbarer Fokusrahmen) – schlechte Tastatur-Fokussichtbarkeit, im Einklang mit WCAG-/Kontrast-Bedenken aus dem Bericht. (Erster Lauf nur `/login` mit 2px-Outline war irreführend.)

**Beschreibung:**
Beim Navigationsmenü ist der **Fokuskontrast** zu gering (im Test gemessen ca. **1,37:1** und **1,17:1**). Erwartet wird u. a. ein kontraststarker Fokusrahmen (mind. **3:1** zum Hintergrund) oder eine ausreichende Farbänderung zwischen fokussiertem und nicht fokussiertem Zustand (TAB-Navigation).

**Reproduktion (laut Testbericht):** Login, mit TAB durch das Navigationsmenü, Kontrast z. B. mit WebAIM Contrast Checker prüfen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Web Finding #3).
