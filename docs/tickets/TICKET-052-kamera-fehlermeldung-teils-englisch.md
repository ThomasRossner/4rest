# TICKET-052: Belohnungen einlösen – Kamera-Fehlermeldung teils auf Englisch

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, unverändert: Kamera/Abbruch-Meldung im Headless nicht simuliert (auch mit Demo-Login).

**Beschreibung:**
Wenn die App den **Kamera-Zugriff** anfragt (`luise.bio` möchte auf die Kamera zugreifen) und Nutzende **Abbrechen** wählen, erscheint eine Folge-Fehlermeldung, die **teilweise auf Englisch** ist. Erwartet wird eine **vollständig deutsche**, verständliche Meldung.

**Reproduktion (laut Testbericht):** Login, „Belohnungen einlösen“, beim Kamera-Dialog „Abbrechen“.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #10).
