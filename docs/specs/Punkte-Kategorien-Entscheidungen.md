# Punkte: Kategorien vs. Gesamtpunktzahl – Produktentscheidungen

Stand: inkl. Präzisierung „Wald vs. Wirtschaft“.

## Leitidee (zwei getrennte Rollen)

| Größe | Rolle |
|-------|--------|
| **Gesamtpunktzahl** (`users.points`) | **Verfügbare Währung** für Belohnungen; kann in **Teams** als Pool-Logik genutzt werden (Summe der Mitglieder o. ä.). Wird durch **Einlösen von Belohnungen verringert** (und durch Aufgaben, Bonus-QR etc. erhöht). |
| **Kategoriepunkte** (vier Salden, je Aufgaben-Kategorie) | **Ausschließlich** für die **Steuerung des Waldwachstums** (eigener Wald). Sie **wachsen beständig** mit passenden Aktivitäten und werden **nicht** durch Belohnungseinlösung reduziert. |

Damit gilt: Beim Einlösen sinkt die **Gesamtpunktzahl**, die **Kategoriepunkte** bleiben davon unberührt und stellen ein **kumulatives Fortschritts-/Wald-Profil** dar.

Die frühere Annahme „Summe der vier Kategorien = Gesamtpunktzahl“ entfällt; die Größen sind **nicht** dieselbe Bilanz, sondern **zweckgetrennt**.

---

## Paket A – Kern-Daten (aktualisiert)

| ID | Entscheidung |
|----|----------------|
| **A1** | **Vier Kategorie-Salden** (zu den vier Aufgaben-Kategorien), nur für **Waldwachstum**. **`users.points`** = **Gesamtkonto** für Belohnungen/Team; **keine** Identität mit der Summe der Kategorien. |
| **A2** | Bei Aufgaben-Abschluss **parallel**: Gutschrift auf **`users.points`** (wirtschaftlich) **und** auf die passende **Kategorie** (Wald). |
| **A3** | **`user_tasks`**: Abschluss **aufschlüsseln** (Betrag, Kategorie), für Historie und Wald-/Statistik-Nachvollziehbarkeit. |

---

## Paket C – Belohnungen & Bonus-QR

| ID | Entscheidung |
|----|----------------|
| **C4** | Einlösung nur gegen **`users.points`** (Gesamt). **Kein** Abzug von Kategoriepunkten. |
| **C5** | **`rewards.kategorie`** bleibt **inhaltlich unabhängig** von den Punkte-Kategorien. |
| **C6** | **Bonus-QR:** Dropdown für **Kategorie**. Jede Einlösung erhöht **immer** **`users.points`** (Gesamt, spendbar) **und** die **gewählte Kategorie** (Wald) um den gleichen Betrag. |

---

## Paket D – Statistik, Timeline, Admin, API/Anzeige

| ID | Entscheidung |
|----|----------------|
| **D7** | Statistik: **beides** – Gesamt (Wirtschaft) **und** Kategorien (Wald-/Impact-Verlauf). |
| **D8** | Timeline: **gestapelt** nach Kategorien (sinnvoll für Wald-/Aktivitätsverlauf). |
| **D9** | Admin/Debug: Korrektur **pro Kategorie** (Wald) **und** Gesamtpunktzahl getrennt führen. |
| **D10** | `/me`, Navigation: **kompakt** – Gesamt für Belohnungen sichtbar; Kategorie-Kurzinfo optional für Wald-Kontext. |

---

## Paket E – Aufgaben-UI (Status: umgesetzt, Release R1)

Die **gleichen vier Aufgaben-Kategorien**, die für **Kategoriepunkte** und den **Wald** gelten, sollen in der App **für Nutzer sichtbar und wählbar** sein. Die drei zugehörigen Tickets **020, 021, 022** sind **umgesetzt**; die Prioritätsmarkierung `next` liegt auf [TICKET-009](../tickets/TICKET-009-multiple-choice-falschantwort-sperre.md) (nächste priorisierte R1-Aufgabe im Backlog).

Historisch waren diese drei Tickets **fester Bestandteil dieses Plans**:

| Ticket | Kurzinhalt | Rolle im Gesamtplan |
|--------|------------|---------------------|
| [TICKET-020](../tickets/TICKET-020-aufgaben-kategorien-kacheln.md) | Kacheln verkleinern (u. a. zwei Spalten), **Filter** verbessern, Kategorien in der Übersicht stärker nutzbar machen | **Liste:** Dichte, Filter, Orientierung vor Detailansicht |
| [TICKET-021](../tickets/TICKET-021-aufgaben-unterseiten-kategorien.md) | Pro Kategorie **Unterseiten** (EarthHero-Anlehnung), nicht nur Filter | **Struktur:** Kategorie → eigene Route/Ebene mit Aufgaben |
| [TICKET-022](../tickets/TICKET-022-zurueck-button.md) | **Zurück** zur Aufgabenliste wo er fehlt | **Navigation:** konsistente Rücksprünge aus Task-Views (besonders nach 021) |

**Abhängigkeiten / Reihenfolge (Empfehlung):**

1. **020** legt Raster und Filter-Grundlage auf der zentralen Aufgaben-Route.
2. **021** baut darauf (oder parallel): Routing `tasks` + Kategorie-Slug bzw. Unterpfad; Kategorieauswahl führt auf gefilterte **Unterseite**.
3. **022** schließt Lücken in **allen** Aufgaben-Task-Komponenten (Video, Quiz, …): sichtbarer Zurück zur Liste / zur Kategorie-Unterseite.

**Bezug zu A–D:** Paket E ist **Präsentationsschicht**; Backend liefert weiterhin `tasks.category` (bzw. Parameter). Sobald **Kategoriepunkte** (A) live sind, können Unterseiten und Kacheln dieselben **Labels** nutzen wie der Wald (D10, Statistik D7/D8) – ohne dass E die Punkte-Logik ersetzt.

---

## Team / Contest

- **Gesamtpunktzahl** / Pool-Logik für Teams unverändert auf **`users.points`**-Ebene; **Kategoriepunkte** sind **pro Nutzer** für den **eigenen Wald**, nicht als Team-„Pool“ vorgesehen (außer ihr definiert später etwas anderes).

---

## Entfall: Abgleich Kategorie ↔ Gesamt bei Einlösung

Der frühere offene Punkt („proportionale Reduktion der Kategorien beim Reward“) entfällt: **Belohnungen reduzieren nur `users.points`**, nicht die kategorisierten Wald-Punkte.

---

## Referenz

- Wald/Kategorien (Punkte): [TICKET-008](../tickets/TICKET-008-wald-aspekte-kategorien.md)
- Aufgaben-UI (Plan Paket E): [TICKET-020](../tickets/TICKET-020-aufgaben-kategorien-kacheln.md), [TICKET-021](../tickets/TICKET-021-aufgaben-unterseiten-kategorien.md), [TICKET-022](../tickets/TICKET-022-zurueck-button.md)
- Release-Zuordnung: [RELEASE_PLAN.md](../RELEASE_PLAN.md) (R1)
