# Roots of Impact – Roadmap zur App-Weiterentwicklung

**Kundenpräsentation | Releaseplan**

---

## Ausgangslage

Aus Ihrer Kundenmail und der Spezifikation „Spielerprofilierung“ haben wir **über 40 konkrete Themen** abgeleitet: Fehlerbehebungen, kleine Verbesserungen und größere inhaltliche Pakete.

Damit Sie schnell spürbare Verbesserungen sehen und wir die großen Features geordnet abarbeiten können, schlagen wir folgende **Phasen** vor:

1. **Zuerst:** Stabilität und schnelle Verbesserungen (Bugfix & Quick Wins)
2. **Danach:** Größere Pakete nacheinander – Aufgaben, Wald, Spielerprofilierung, Gamification, Design

---

## Die sechs Releases im Überblick

| Phase | Schwerpunkt | Ihr Nutzen in Kürze |
|-------|-------------|----------------------|
| **Release 1** | Bugfix & Quick Wins | App läuft stabil, QR-Codes funktionieren, Sprache & Navigation klar, Wald-Erlebnis verbessert |
| **Release 2** | Aufgaben & Nutzererlebnis | Bessere Aufgabenübersicht, Kategorien, Quiz-Fairness, Mehrsprachigkeit |
| **Release 3** | Wald | Schönerer Wald ohne grüne Plane, Licht/Blur, Wälder anderer ansehen, Team-Wälder |
| **Release 4** | Spielerprofilierung | Introslides mit Fragen, Charakter-Typ, „Mehr zu meinem Typ“, Tiere im Wald |
| **Release 5** | Gamification & Ranking | Badges, Levels, Tagespunkte, öffentliches Ranking (z. B. für Displays) |
| **Release 6** | Design & Wording | Einheitliches Design-System, klare Nomenklatur in der App |

---

## Release 1: Bugfix & Quick Wins

**Ziel:** Die App wird zuverlässiger und angenehmer zu bedienen – ohne große Umbauten.

**Was wir angehen:**

- **Stabilität:** Ursache für Datenbank-/Verbindungsprobleme klären und beheben.
- **Contest & Teams:** Störende Fehlermeldungen verschwinden nach erfolgreicher Aktion.
- **QR-Codes:** Anmelde- und Join-QR-Codes enthalten eine echte URL – Scannen funktioniert zuverlässig (z. B. für Contests).
- **Sprache:** Die Spracheinstellung ist für alle Nutzer gut auffindbar (z. B. in Navigation oder Profil).
- **Navigation:** Ein „Zurück zur Aufgabenliste“-Button fehlt nicht mehr.
- **Wald:** Steuerung am Handy verbessern (nur der Wald bewegt sich, nicht die ganze Seite); Fullscreen für den Wald; Kennzahlen unter dem Wald; Zoom so, dass der Wald hochwertiger wirkt.
- **Datenschutz:** Bei der Anmeldung muss „Privacy & Data Management“ aktiv akzeptiert werden.
- **Admin:** Sie erhalten eine E-Mail, wenn neue Foto-Verifizierungen anstehen.
- **Auftritt:** E-Mails und Texte mit klarem Absender / „Wir sind Luise“.
- **Bedienung:** Die vier Buttons unten (Navigation) werden einmalig überarbeitet.

**Ergebnis:** Weniger Frust, bessere erste Nutzererfahrung, Sie als Admin werden rechtzeitig informiert.

---

## Release 2: Aufgaben & Nutzererlebnis

**Ziel:** Aufgaben sind übersichtlicher, fairer und mehrsprachig nutzbar.

**Was wir umsetzen:**

- **Übersicht:** Kleinere Kacheln (z. B. zwei Spalten), mehr Aufgaben auf einen Blick; Filter wird sinnvoller.
- **Struktur:** Aufgaben nach Kategorien als eigene Unterseiten (ähnlich EarthHero) – nicht nur Filter.
- **Quiz:** Bei falscher Antwort: definierbare Pause („Probiere es in X Minuten noch einmal“) statt endlosem Durchklicken.
- **Spieldynamik:** Regel „Punkte verlieren“ (z. B. bei Falschantwort) definieren und einbauen.
- **Mehrsprachigkeit:** Englische Felder für Aufgaben und Belohnungen; Anzeige je nach Sprache.

**Ergebnis:** Nutzer finden Aufgaben schneller, Quiz wird fairer, die App wird konsequent mehrsprachig.

---

## Release 3: Wald

**Ziel:** Der Wald wirkt hochwertiger und wird sozial erlebbar.

**Was wir umsetzen:**

- **Darstellung:** Nur noch der Wald wird angezeigt – keine grüne Plane um das Grundstück (orientiert am ursprünglichen Plan).
- **Grafik:** Licht und Blur für ein besseres Bild.
- **Social:** Wälder anderer Nutzer ansehen (z. B. im Rahmen von Contest/Ranking).
- **Team/Contest:** Mehrere Wälder (bis zu einer definierten Anzahl) nebeneinander zu einem größeren Waldstück darstellen.

**Optional später:** Höhenvariation, hexagonale Waldstücke (größerer Aufwand).

**Ergebnis:** Der Wald wird zum zentralen, ansehnlichen und teilweise gemeinsamen Erlebnis.

---

## Release 4: Spielerprofilierung (Introslides & Charakter)

**Ziel:** Das von Ihnen spezifizierte Spielerprofil mit Introslides und Charakteren geht live.

**Was wir umsetzen:**

- **Introslides:** Beim ersten Login eine kurze Geschichte mit Fragen; Nutzer können „Später entscheiden“ (dann: Schnecke/Undecided).
- **4 Dyaden:** Vier psychologische Skalen (0–4), z. B. Zielorientierung, Struktur vs. Freiheit, Kontrolle vs. Akzeptanz, Eigeninteresse vs. Gemeinwohl – mit allen Textbausteinen aus Ihrer Spezifikation.
- **Charakter:** Spielertyp (Tier/Figur) und optionaler Anzeigename auf der Wald-Seite; Button „Mehr zu meinem Typ“ mit den vier passenden Texten.
- **Forest-Seite:** Zuerst der Wald, dann der Charakter (Kurztext, Klick = Langtext), darunter die Kennzahlen; Charaktere den Tieren/Wald zugeordnet.

**Ergebnis:** Persönlicher Einstieg, wiedererkennbarer Charakter im Wald, klare Zuordnung zu Ihrer Story.

---

## Release 5: Gamification & Ranking

**Ziel:** Mehr Motivation durch Badges, Levels und sichtbares Ranking.

**Was wir umsetzen:**

- **Badges & Levels:** Sticker/Auszeichnungen (ähnlich Fitness-Apps); Level-System; bestimmte Aufgaben erst ab einem Level.
- **Tagespunkte:** Z. B. 2 Punkte pro Tag beim ersten Besuch/Login.
- **Öffentliches Ranking:** Konfigurierbares Ranking (z. B. „Top Player Today“) – auch für Anzeige auf einem Display nutzbar.

**Ergebnis:** Stärkere Bindung, klare Fortschrittsanzeige, Einsatz bei Events oder an der Rezeption möglich.

---

## Release 6: Design & Nomenklatur

**Ziel:** Einheitliches Erscheinungsbild und klare Begriffe in der gesamten App.

**Was wir umsetzen:**

- **Design-System:** Zentrale Steuerung von Farben und Schriften; Admin-Bereich für wichtige Grafiken (Logos, App-Thumbs, Charaktere, Buttons).
- **Nomenklatur:** Begriffe und Bezeichnungen in der App überarbeiten (gemeinsam mit dem UIX).

**Ergebnis:** Sie können das Erscheinungsbild zentral pflegen; die App spricht eine einheitliche „Sprache“.

---

## Außerhalb der festen Reihenfolge

| Thema | Einordnung |
|-------|------------|
| **Sihot/Buchungssystem** | Eigenes Projekt; Variablen und Anbindung mit dem Entwicklungspartner abstimmen. |
| **Wald-Aspekte/Kategorien** | Punkte nach Kategorien (z. B. Netzwerk & Kommunikation); Kennzahlen differenziert – kann an Release 3 oder 4 angebunden werden. |
| **Gäste ohne Anmeldung** | Größeres Konzept (Aufgaben für Gäste, Punkte per Cookie, später Anmeldung); eigener Release oder nach Release 2. |
| **Event-Vorbereitung** | Konzeption und Abstimmung mit Ihnen – kein reines Entwicklungs-Release. |

---

## Nächste Schritte

- **Release 1** kann zeitnah geplant und umgesetzt werden; die genaue Priorität der einzelnen Punkte (z. B. DB-Problem vor QR-Code) legen wir gemeinsam fest.
- Die **Reihenfolge der späteren Releases** (R2–R6) bleibt wie gezeigt; die Aufnahme von „Wald-Aspekte“ oder „Gäste ohne Anmeldung“ kann nach Ihren Wünschen angepasst werden.

Bei Fragen oder Wünschen zur Priorisierung sprechen Sie uns gerne an.
