# TICKET-050: Reload führt zur Startseite statt aktueller Unterseite

**Typ:** Bug

**Status:** nicht reproduzierbar

**Verifikation:** 2026-04-12, nach Login `demo@example.com`: Reload auf `https://luise.bio/tasks` **behält** dieselbe URL. Befund „Reload → Startseite“ für **Bonuspunkte** (Rezeption) **nicht** geprüft.

**Beschreibung:**
Nach Navigation auf eine **Kachel** (z. B. „Bonuspunkte geben“) führt **Neuladen** der Seite (Pull-to-refresh oder Browser-Aktualisieren) zurück zur **Startseite**, nicht zur **aktuellen Unterseite**. Erwartet: Nutzer bleibt auf derselben Ansicht (z. B. Bonuspunkte).

**Reproduktion (laut Testbericht):** Login als `test@example.com`, Kachel „Bonuspunkte geben“, Seite neu laden.

**Quelle:** Jason, explorativer Testbericht 18.03.2026 (`findings_Jason_4Rest.docx`, Finding #8).
