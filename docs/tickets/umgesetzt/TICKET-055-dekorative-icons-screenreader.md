# TICKET-055: Dekorative Icons – von Screenreader/VoiceOver vorgelesen (Alternativtext)

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, nach Login auf `/`: bis zu 15 `nav`-`img` ohne nicht-leeren `alt`. VoiceOver weiterhin nicht getestet.

**Beschreibung:**
**Dekorative** Icons (z. B. in der Navigation zu „Root“, „Belohnungen“, „Wald“) werden von **Screenreader** bzw. **VoiceOver** vorgelesen. Erwartet: rein dekorative Grafiken **ohne** relevanten Alternativtext bzw. `aria-hidden` / leeres `alt`, sodass sie **nicht** vorgelesen werden.

**Reproduktion (laut Testbericht):** Login, App mit VoiceOver/Screenreader navigieren.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #13).
