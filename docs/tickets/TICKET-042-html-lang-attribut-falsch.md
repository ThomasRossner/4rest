# TICKET-042: HTML-Element `lang` passt nicht zur angezeigten Sprache

**Typ:** Bug

**Status:** verifiziert

**Verifikation:** 2026-04-12, Playwright `https://luise.bio/login` (erneut mit Test-Account verfügbar): `<html lang="en">`, Body-Text-Heuristik widerspricht `lang`. **Verifiziert.**

**Beschreibung:**
Im Quelltext ist das `lang`-Attribut (z. B. auf `en`) gesetzt, während die Seite **auf Deutsch** angezeigt wird (oder umgekehrt laut Test: `lang="de"` obwohl andere Sprache). Das `lang`-Attribut soll die **tatsächliche Hauptsprache** der Seite widerspiegeln (Barrierefreiheit, SEO).

**Reproduktion (laut Testbericht):** Login, Entwicklertools (F12) / „Untersuchen“, `<html>` prüfen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Web Finding #2).
