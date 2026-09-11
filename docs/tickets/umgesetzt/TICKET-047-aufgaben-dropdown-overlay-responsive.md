# TICKET-047: Aufgaben – Dropdown „Alle Typen“ / „Alle Aufgaben auf“ überlagert, Text abgeschnitten

**Typ:** Bug

**Status:** umgesetzt

**Verifikation:** 2026-04-12, nach Login `demo@example.com` auf `/tasks`: kein natives `<select>` / keine `[role=combobox]` mit Standard-Selektoren gefunden (UI evtl. anders aufgebaut). Overlay-Befund **nicht** automatisch geprüft.

**Beschreibung:**
Die Dropdowns **„Alle Typen“** und **„Alle Aufgaben auf“** auf der Seite **Aufgaben** verhalten sich fehlerhaft: nach Auswahl z. B. **Video-Quiz** oder **Quiz** / **Foto** überlagern sich Elemente, ein anderes Dropdown verdeckt das erste Listenelement, **Texte werden abgeschnitten**, Darstellung ist nicht **responsive**. Im selben Finding wird der Titel **„Belohnungsmarkt“** auf der Belohnungs-Seite als abgeschnitten erwähnt (evtl. Kontextwechsel im Bericht – Layout/Overflow gesamt prüfen).

**Reproduktion (laut Testbericht):** Login, Aufgaben, Dropdowns wie beschrieben öffnen und erneut öffnen.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, iOS Finding #4).
