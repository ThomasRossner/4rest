# TICKET-045: iOS – Navigation horizontal scrollbar / wischbar

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: CSS-Anpassungen in `Navigation.css` (u. a. Bottom-Nav `max-width`/`overflow-x`, Flex `min-width: 0`, `justify-content: space-between`, Label `overflow-wrap`). Ursprünglicher Playwright-Befund `scrollWidth > clientWidth` (Mobile-Viewport); nach Fix erneut prüfen (idealerweise echtes iOS).

**Beschreibung:**
Auf der Startseite lässt sich die **Navigationsleiste horizontal** mit der Wischgeste bewegen; es erscheint ein **horizontaler Scrollbalken**. Erwartet wird eine **statische** Navigationsleiste ohne horizontales Scrollen.

**Reproduktion (laut Testbericht):** Login, in der Navigation mit dem Finger horizontal wischen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, iOS Finding #2).
