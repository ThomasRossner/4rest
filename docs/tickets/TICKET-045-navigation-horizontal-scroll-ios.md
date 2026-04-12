# TICKET-045: iOS – Navigation horizontal scrollbar / wischbar

**Typ:** Bug

**Status:** verifiziert

**Verifikation:** 2026-04-12, Playwright Mobile Chrome (Pixel-5-Viewport), nach Login `demo@example.com` auf `/`: **`nav.scrollWidth > nav.clientWidth`** → horizontale Überbreite der Navigation (Scrollbar/Scroll möglich). Entspricht dem Befund „Navigation wird horizontal scrollbar/wischbar“ (Näherung; kein echtes iOS-Safari).

**Beschreibung:**
Auf der Startseite lässt sich die **Navigationsleiste horizontal** mit der Wischgeste bewegen; es erscheint ein **horizontaler Scrollbalken**. Erwartet wird eine **statische** Navigationsleiste ohne horizontales Scrollen.

**Reproduktion (laut Testbericht):** Login, in der Navigation mit dem Finger horizontal wischen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, iOS Finding #2).
