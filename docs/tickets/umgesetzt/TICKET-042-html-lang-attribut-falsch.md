# TICKET-042: HTML-Element `lang` passt nicht zur angezeigten Sprache

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12: `frontend/index.html` nutzt `lang="de"` (Default); `App.tsx` (`DocumentLangSync`) setzt `document.documentElement.lang` auf `de`/`en` passend zu i18n und bei `languageChanged`. Nach Deploy: `<html lang>` sollte zur UI-Sprache passen.

**Beschreibung:**
Im Quelltext ist das `lang`-Attribut (z. B. auf `en`) gesetzt, während die Seite **auf Deutsch** angezeigt wird (oder umgekehrt laut Test: `lang="de"` obwohl andere Sprache). Das `lang`-Attribut soll die **tatsächliche Hauptsprache** der Seite widerspiegeln (Barrierefreiheit, SEO).

**Reproduktion (laut Testbericht):** Login, Entwicklertools (F12) / „Untersuchen“, `<html>` prüfen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Web Finding #2).
