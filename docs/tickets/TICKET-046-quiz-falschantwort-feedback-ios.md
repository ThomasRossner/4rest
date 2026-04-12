# TICKET-046: Quiz – keine klare Rückmeldung bei falscher Auswahl vor Abschluss

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, nach Login `demo@example.com` auf `/tasks`: keine Quiz-Aufgabe in der Liste gefunden (Inhalt abhängig von Backend). Falschantwort-Feedback daher **nicht** nachgestellt.

**Beschreibung:**
Bei einer **Quiz-Aufgabe** mit falscher Auswahl und Betätigen von „Aufgabe abschließen“ aktualisiert sich der Button kurz, ist aber **nicht nachvollziehbar**, welcher Text sich ändert; der Button springt wieder auf „Aufgabe abschließen“. Es ist **nicht erkennbar**, dass die Auswahl falsch war. Erwartet wird eine **verständliche Meldung**, dass die Auswahl falsch war und ein erneuter Versuch nötig ist (im Testbericht sind die Felder „Erwartetes/Tatsächliches Ergebnis“ textlich widersprüchlich formuliert – inhaltlich geht es um **sichtbares Fehler-Feedback**).

**Reproduktion (laut Testbericht):** Login, Aufgaben, Filter „Quiz“, Aufgabe starten, falsche Antwort wählen, „Aufgabe abschließen“.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, iOS Finding #3).
