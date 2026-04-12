# TICKET-041: Web – doppelte horizontale Scrollbalken nach Login

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, Playwright Chromium, `https://luise.bio`, Test-Account `demo@example.com` / `Test123!`: weder auf `/login` noch nach Login auf `/`, `/tasks`, `/rewards` horizontaler Overflow (`scrollWidth` ≤ `clientWidth` + Toleranz). Scrollbalken-Befund von Jason **nicht** bestätigt.

**Beschreibung:**
Nach dem Login sind bei 100 % Zoom **zwei horizontale Scrollbalken** sichtbar (oben und unten auf der Seite). Erwartet wird, dass **keine** horizontalen Scrollbalken auf den Seiten erscheinen.

**Reproduktion (laut Testbericht):** Login, dann Scrollbalken auf allen Seiten prüfen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Web Finding #1).
