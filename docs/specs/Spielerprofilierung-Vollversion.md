# Roots of Impact – Spielerprofilierung (Vollversion)

Dieses Dokument ist die Übernahme der Word-Spezifikation „Roots_of_Impact_Vollversion_Spielerprofilierung.docx“. Es beschreibt die Story-Struktur, die Fragen, die Antwortlogik sowie die textlichen Ausgaben je nach Dyadenwert. Grundlage für die Implementierung.

---

## 1. Überblick & Ablauf

Beim ersten Login wird der Nutzer durch eine Mini-Geschichte geführt. Innerhalb dieser Geschichte beantworten die Nutzer **4 metaphorisch eingebettete Fragen**, die entlang von **vier psychologischen Dyaden** aufgebaut sind. Optional können die Fragen auch später im Profilbereich erneut beantwortet oder nachgeholt werden.

Wird das Intro übersprungen, wird der Nutzer automatisch als **„Undecided“** (Symbol: **Schnecke**) eingestuft. Der Spielertyp (Charakter-Tier) wird auf der **Wald-Ansicht** angezeigt, ebenso wie ein optional gewählter **Anzeigename**.

Das System speichert alle vier Skalenwerte (0–4) ab und bestimmt den **Haupttyp** über die **am höchsten ausgeprägte Dyade**. Die Auswertungstexte unter **„Mehr zu meinem Typ“** basieren auf allen vier Dyadenwerten.

---

## 2. Einstieg & Überspringen

Die Einstiegsstory beginnt mit folgender Slide:

**Text:**  
„Schön, dass du hier bist! In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf 5 kleine Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.“

- **Button 1:** „Los geht’s“ → startet die Story  
- **Button 2:** „Später entscheiden“ → wird als **Schnecke / Undecided** kategorisiert  

**Hinweistext** bei Auswahl von „Später entscheiden“:  
„Du kannst deinen Charakter jederzeit unter 'Profil' oder durch Klick auf deine Figur finden.“

---

## 3. Storystruktur

- Die Fragen erscheinen als **atmosphärische Slides**, in denen der Nutzer jeweils durch ein metaphorisches Szenario geleitet wird.
- Die Antwort erfolgt über eine **5-Punkte-Skala**, dargestellt durch Symbolkarten oder Icons (z. B. ein wachsendes Blatt bis zu einer vollen Blüte).
- **Zwischenslides** mit Mini-Storys verbinden die Fragen erzählerisch.
- Am Ende wird ein **frei wählbarer Name** abgefragt: „Wie dürfen wir dich fortan nennen?“ – und ebenfalls gespeichert.
- Es wird **keine explizite Geschlechtsabfrage** verwendet, um die Darstellung geschlechtsneutral zu halten.

---

## 4. Technische Anforderungen an Cursor

- Fragen erscheinen bei **erstem Login automatisch** mit **Skip-Option** (nur zu Beginn).
- **Nachträgliche Beantwortung** im Profilbereich jederzeit möglich.
- **Ergebnisse der vier Dyaden (0–4)** persistent speichern.
- **Dominante Dyade** bestimmt Typ-Zuordnung (für Charakterfigur & Label).
- **Optionaler Anzeigename** wird nach finaler Frage abgefragt und gespeichert.
- **Waldansicht:** Anzeige der Figur + Name + Button „Mehr zu meinem Typ“.
- Bei Klick auf **„Mehr zu meinem Typ“**: die **vier passenden Textbausteine** auslesen (je nach Dyadenwert 0–4).

---

## 5. Textbausteine – Dyaden & Skalenwerte

(Jeweils ein Text pro Dyade pro Skalenwert 0–4; siehe unten. Diese Texte werden unter „Mehr zu meinem Typ“ angezeigt.)

### Dyade 1: Zielorientierung (Achievement vs. Experience)

| Skalenwert | Label | Text |
|------------|--------|-----|
| 0 | Zielorientiert (stark) | Du hast ein klares Ziel vor Augen – nicht, weil du musst, sondern weil du willst. Du liebst das Gefühl, auf etwas hinzuarbeiten, Pläne zu schmieden und Schritte abzuhaken. Andere mögen im Nebel wandeln – du hast längst einen Kompass in der Hand. Für dich ist das Leben eine Reise mit Meilensteinen. |
| 1 | Zielorientiert (moderat) | Ziele helfen dir, deinen Weg zu finden. Du magst Struktur und erkennst gern Fortschritte. Doch du bist flexibel genug, auch mal einen Umweg in Kauf zu nehmen, wenn es sich gut anfühlt. |
| 2 | Ausgeglichen | Du erkennst den Wert von Zielen, ohne dich von ihnen treiben zu lassen. Du bewegst dich zwischen Absicht und Intuition – offen für Ergebnisse, aber nicht darauf fixiert. |
| 3 | Erlebnisorientiert (moderat) | Du genießt, was auf dem Weg liegt – auch wenn ein Ziel dir Orientierung gibt. Das Erleben selbst bedeutet dir mehr als bloße Ergebnisse. |
| 4 | Erlebnisorientiert (stark) | Du bist jemand, der das Rascheln der Blätter hört, während andere nur auf die Karte starren. Du findest Bedeutung in Momenten – nicht in Medaillen. Für dich ist die Welt ein Ort zum Staunen, nicht zum Erobern. |

### Dyade 2: Struktur vs. Freiheit

| Skalenwert | Label | Text |
|------------|--------|-----|
| 0 | Strukturliebend (stark) | Du findest Ruhe in der Ordnung. Systeme geben dir Sicherheit. Du erkennst Muster, wo andere Chaos sehen – und gibst damit auch anderen Orientierung. |
| 1 | Strukturliebend (moderat) | Struktur hilft dir, dich zurechtzufinden. Du schätzt Regeln, solange sie dir helfen. Spontanität hat Platz – aber nur mit Rahmen. |
| 2 | Ausgeglichen | Du bewegst dich zwischen Klarheit und Offenheit. Mal suchst du Richtung, mal den Reiz des Zufalls. Beides hat seinen Platz auf deiner Reise. |
| 3 | Freiheitsliebend (moderat) | Du liebst es, deinen eigenen Rhythmus zu finden. Struktur akzeptierst du, solange sie dich nicht einschränkt. |
| 4 | Freiheitsliebend (stark) | Du bist der Wind zwischen den Bäumen – nicht aufzuhalten, nicht einzusperren. Du findest deinen Weg, indem du ihn gehst. Neue Wege, spontane Entscheidungen: Das ist dein Element. |

### Dyade 3: Kontrolle vs. Akzeptanz

| Skalenwert | Label | Text |
|------------|--------|-----|
| 0 | Kontrollierend (stark) | Du bist jemand, der Verantwortung nicht scheut. Du gibst Richtung, triffst Entscheidungen und strukturierst das Miteinander. Deine Stärke liegt darin, Ordnung zu schaffen. |
| 1 | Kontrollierend (moderat) | Du übernimmst gern Verantwortung, wenn es nötig ist. Du führst mit Überblick, nicht mit Druck – und weißt, wann es gut ist, abzugeben. |
| 2 | Ausgeglichen | Manchmal führst du, manchmal folgst du – du spürst, was gebraucht wird. Dein Gleichgewicht bringt Ruhe in Gruppen. |
| 3 | Akzeptierend (moderat) | Du fühlst dich wohl im Miteinander. Du hörst zu, orientierst dich an anderen und stärkst durch Gemeinschaft. |
| 4 | Akzeptierend (stark) | Du gehst mit Menschen in Resonanz. Für dich ist Miteinander keine Floskel, sondern Haltung. Du brauchst keine Bühne, sondern Verbindung. In deiner Nähe fühlt man sich gesehen. |

### Dyade 4: Eigeninteresse vs. Gemeinwohl

| Skalenwert | Label | Text |
|------------|--------|-----|
| 0 | Eigeninteressiert (stark) | Du kennst deinen Wert – und du weißt, dass du für dich selbst einstehen darfst. Du triffst Entscheidungen, die dir guttun. Dein Weg ist klar und unabhängig. |
| 1 | Eigeninteressiert (moderat) | Du weißt, was dir wichtig ist, ohne egoistisch zu sein. Du setzt Grenzen, aber mit Feingefühl. Dein Fokus bleibt bei dir – und du verlierst dabei andere nicht aus dem Blick. |
| 2 | Ausgeglichen | Du gibst gern – aber nicht um jeden Preis. Du balancierst gut zwischen Fürsorge für dich und andere. |
| 3 | Gemeinwohlorientiert (moderat) | Du denkst an andere, auch wenn du selbst nicht im Schatten stehen willst. Deine Hilfe ist leise, aber spürbar. Du stärkst das Ganze, ohne dich aufzugeben. |
| 4 | Gemeinwohlorientiert (stark) | Du denkst an andere, auch wenn es niemand merkt. Für dich sind Gemeinschaft, Zusammenhalt und das große Ganze mehr als Worte – sie sind deine Motivation. Du gibst, damit andere wachsen – und dabei wächst du selbst. |

---

*Quelle: Roots_of_Impact_Vollversion_Spielerprofilierung.docx*
