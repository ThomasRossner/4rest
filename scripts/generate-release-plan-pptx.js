#!/usr/bin/env node
/**
 * Erzeugt docs/RELEASE_PLAN_KUNDENPRASENTATION.pptx aus dem Inhalt der Kundenpräsentation.
 * Voraussetzung: npm install pptxgenjs (oder im Projekt bereits installiert)
 * Aufruf: node scripts/generate-release-plan-pptx.js
 */

const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pptx = new PptxGenJS();

// Titel-Präsentation
pptx.title = 'Roots of Impact – Roadmap';
pptx.author = '4rest';
pptx.subject = 'Releaseplan App-Weiterentwicklung';

// Optionen für Überschriften
const headingOpts = { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 24, bold: true, color: '2D5016' };
const subHeadingOpts = { x: 0.5, y: 1.0, w: 9, h: 0.5, fontSize: 14, color: '555555' };
const bodyOpts = { x: 0.5, y: 1.6, w: 9, h: 3.2, fontSize: 11, align: 'left' };
const bulletOpts = { bullet: true, breakLine: true };

// ---- Slide 1: Titelfolie ----
const s1 = pptx.addSlide();
s1.addText('Roots of Impact', { x: 0.5, y: 2.0, w: 9, fontSize: 32, bold: true, color: '2D5016' });
s1.addText('Roadmap zur App-Weiterentwicklung', { x: 0.5, y: 2.6, w: 9, fontSize: 20, color: '333333' });
s1.addText('Kundenpräsentation | Releaseplan', { x: 0.5, y: 3.2, w: 9, fontSize: 14, color: '666666' });

// ---- Slide 2: Ausgangslage ----
const s2 = pptx.addSlide();
s2.addText('Ausgangslage', headingOpts);
s2.addText(
  [
    { text: 'Aus Ihrer Kundenmail und der Spezifikation „Spielerprofilierung“ haben wir ', options: {} },
    { text: 'über 40 konkrete Themen ', options: { bold: true } },
    { text: 'abgeleitet: Fehlerbehebungen, kleine Verbesserungen und größere inhaltliche Pakete.', options: {} },
  ],
  { x: 0.5, y: 1.3, w: 9, h: 1.0, fontSize: 12 }
);
s2.addText('Damit Sie schnell spürbare Verbesserungen sehen, schlagen wir vor:', {
  x: 0.5, y: 2.5, w: 9, fontSize: 12, bold: true,
});
s2.addText(
  [
    { text: 'Zuerst: Stabilität und schnelle Verbesserungen (Bugfix & Quick Wins)', options: bulletOpts },
    { text: 'Danach: Größere Pakete nacheinander – Aufgaben, Wald, Spielerprofilierung, Gamification, Design', options: bulletOpts },
  ],
  { x: 0.5, y: 2.9, w: 9, h: 1.8, fontSize: 12 }
);

// ---- Slide 3: Die sechs Releases im Überblick (Tabelle) ----
const s3 = pptx.addSlide();
s3.addText('Die sechs Releases im Überblick', headingOpts);
const overviewRows = [
  [
    { text: 'Phase', options: { bold: true, fill: { color: 'E8F0E8' } } },
    { text: 'Schwerpunkt', options: { bold: true, fill: { color: 'E8F0E8' } } },
    { text: 'Ihr Nutzen in Kürze', options: { bold: true, fill: { color: 'E8F0E8' } } },
  ],
  [
    'Release 1',
    'Bugfix & Quick Wins',
    'App läuft stabil, QR-Codes funktionieren, Sprache & Navigation klar, Wald-Erlebnis verbessert',
  ],
  [
    'Release 2',
    'Aufgaben & Nutzererlebnis',
    'Bessere Aufgabenübersicht, Kategorien, Quiz-Fairness, Mehrsprachigkeit',
  ],
  [
    'Release 3',
    'Wald',
    'Schönerer Wald ohne grüne Plane, Licht/Blur, Wälder anderer ansehen, Team-Wälder',
  ],
  [
    'Release 4',
    'Spielerprofilierung',
    'Introslides mit Fragen, Charakter-Typ, „Mehr zu meinem Typ“, Tiere im Wald',
  ],
  [
    'Release 5',
    'Gamification & Ranking',
    'Badges, Levels, Tagespunkte, öffentliches Ranking (z. B. für Displays)',
  ],
  [
    'Release 6',
    'Design & Wording',
    'Einheitliches Design-System, klare Nomenklatur in der App',
  ],
];
s3.addTable(overviewRows, {
  x: 0.5, y: 1.35, w: 9, colW: [1.2, 2.2, 5.6], fontSize: 10, align: 'left', border: { pt: 0.5 },
});

// ---- Slide 4: Release 1 ----
const s4 = pptx.addSlide();
s4.addText('Release 1: Bugfix & Quick Wins', headingOpts);
s4.addText('Ziel: Die App wird zuverlässiger und angenehmer zu bedienen – ohne große Umbauten.', subHeadingOpts);
s4.addText(
  [
    { text: 'Stabilität: Ursache für DB-/Verbindungsprobleme klären und beheben', options: bulletOpts },
    { text: 'Contest & Teams: Fehlermeldungen verschwinden nach erfolgreicher Aktion', options: bulletOpts },
    { text: 'QR-Codes: Anmelde- und Join-QR mit echter URL – Scannen funktioniert zuverlässig', options: bulletOpts },
    { text: 'Sprache: Spracheinstellung für alle gut auffindbar', options: bulletOpts },
    { text: 'Navigation: „Zurück zur Aufgabenliste“-Button ergänzen', options: bulletOpts },
    { text: 'Wald: bessere Steuerung, Fullscreen, Kennzahlen unter dem Wald, Zoom', options: bulletOpts },
    { text: 'Datenschutz: Privacy bei Anmeldung aktiv akzeptieren', options: bulletOpts },
    { text: 'Admin: E-Mail bei neuen Foto-Verifizierungen', options: bulletOpts },
    { text: 'Auftritt: „Wir sind Luise“ in E-Mails und Copy', options: bulletOpts },
    { text: 'Bedienung: Vier Buttons unten überarbeiten', options: bulletOpts },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 3.4, fontSize: 11 }
);
s4.addText('Ergebnis: Weniger Frust, bessere erste Nutzererfahrung, Sie als Admin werden rechtzeitig informiert.', {
  x: 0.5, y: 5.0, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 5: Release 2 ----
const s5 = pptx.addSlide();
s5.addText('Release 2: Aufgaben & Nutzererlebnis', headingOpts);
s5.addText('Ziel: Aufgaben sind übersichtlicher, fairer und mehrsprachig nutzbar.', subHeadingOpts);
s5.addText(
  [
    { text: 'Übersicht: Kleinere Kacheln (z. B. zwei Spalten), mehr Aufgaben sichtbar; Filter verbessern', options: bulletOpts },
    { text: 'Struktur: Kategorien als eigene Unterseiten (ähnlich EarthHero)', options: bulletOpts },
    { text: 'Quiz: Pause bei Falschantwort („Probiere es in X Minuten noch einmal“)', options: bulletOpts },
    { text: 'Spieldynamik: „Punkte verlieren“ (z. B. bei Falschantwort) definieren und einbauen', options: bulletOpts },
    { text: 'Mehrsprachigkeit: EN-Felder für Aufgaben/Belohnungen; Anzeige je nach Sprache', options: bulletOpts },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 2.8, fontSize: 11 }
);
s5.addText('Ergebnis: Nutzer finden Aufgaben schneller, Quiz wird fairer, App wird konsequent mehrsprachig.', {
  x: 0.5, y: 4.6, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 6: Release 3 ----
const s6 = pptx.addSlide();
s6.addText('Release 3: Wald', headingOpts);
s6.addText('Ziel: Der Wald wirkt hochwertiger und wird sozial erlebbar.', subHeadingOpts);
s6.addText(
  [
    { text: 'Darstellung: Nur noch der Wald – keine grüne Plane (orientiert am ursprünglichen Plan)', options: bulletOpts },
    { text: 'Grafik: Licht und Blur für ein besseres Bild', options: bulletOpts },
    { text: 'Social: Wälder anderer Nutzer ansehen (z. B. bei Contest/Ranking)', options: bulletOpts },
    { text: 'Team/Contest: Mehrere Wälder nebeneinander zu einem größeren Waldstück', options: bulletOpts },
    { text: 'Optional später: Höhenvariation, hexagonale Waldstücke', options: { ...bulletOpts, italic: true } },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 2.6, fontSize: 11 }
);
s6.addText('Ergebnis: Der Wald wird zum zentralen, ansehnlichen und teilweise gemeinsamen Erlebnis.', {
  x: 0.5, y: 4.4, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 7: Release 4 ----
const s7 = pptx.addSlide();
s7.addText('Release 4: Spielerprofilierung', headingOpts);
s7.addText('Ziel: Das von Ihnen spezifizierte Spielerprofil mit Introslides und Charakteren geht live.', subHeadingOpts);
s7.addText(
  [
    { text: 'Introslides: Beim ersten Login kurze Geschichte mit Fragen; „Später entscheiden“ (Schnecke/Undecided)', options: bulletOpts },
    { text: '4 Dyaden: Vier psychologische Skalen mit allen Textbausteinen aus Ihrer Spezifikation', options: bulletOpts },
    { text: 'Charakter: Spielertyp (Tier/Figur) und Anzeigename auf der Wald-Seite; „Mehr zu meinem Typ“', options: bulletOpts },
    { text: 'Forest-Seite: Wald → Charakter (Kurztext, Klick = Langtext) → Kennzahlen; Tiere dem Wald zugeordnet', options: bulletOpts },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 2.6, fontSize: 11 }
);
s7.addText('Ergebnis: Persönlicher Einstieg, wiedererkennbarer Charakter im Wald, klare Zuordnung zu Ihrer Story.', {
  x: 0.5, y: 4.4, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 8: Release 5 ----
const s8 = pptx.addSlide();
s8.addText('Release 5: Gamification & Ranking', headingOpts);
s8.addText('Ziel: Mehr Motivation durch Badges, Levels und sichtbares Ranking.', subHeadingOpts);
s8.addText(
  [
    { text: 'Badges & Levels: Sticker/Auszeichnungen (ähnlich Fitness-Apps); Level-System; Aufgaben ab Level', options: bulletOpts },
    { text: 'Tagespunkte: Z. B. 2 Punkte pro Tag beim ersten Besuch/Login', options: bulletOpts },
    { text: 'Öffentliches Ranking: Konfigurierbar (z. B. „Top Player Today“) – auch für Display nutzbar', options: bulletOpts },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 2.0, fontSize: 11 }
);
s8.addText('Ergebnis: Stärkere Bindung, klare Fortschrittsanzeige, Einsatz bei Events oder an der Rezeption möglich.', {
  x: 0.5, y: 3.8, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 9: Release 6 ----
const s9 = pptx.addSlide();
s9.addText('Release 6: Design & Nomenklatur', headingOpts);
s9.addText('Ziel: Einheitliches Erscheinungsbild und klare Begriffe in der gesamten App.', subHeadingOpts);
s9.addText(
  [
    { text: 'Design-System: Zentrale Steuerung von Farben und Schriften; Admin für Grafiken (Logos, Thumbs, Charaktere, Buttons)', options: bulletOpts },
    { text: 'Nomenklatur: Begriffe und Bezeichnungen in der App überarbeiten (gemeinsam mit UIX)', options: bulletOpts },
  ],
  { x: 0.5, y: 1.6, w: 9, h: 1.4, fontSize: 11 }
);
s9.addText('Ergebnis: Sie können das Erscheinungsbild zentral pflegen; die App spricht eine einheitliche „Sprache“.', {
  x: 0.5, y: 3.2, w: 9, fontSize: 10, italic: true, color: '2D5016',
});

// ---- Slide 10: Außerhalb der Reihenfolge ----
const s10 = pptx.addSlide();
s10.addText('Außerhalb der festen Reihenfolge', headingOpts);
const ausserhalbRows = [
  [
    { text: 'Thema', options: { bold: true, fill: { color: 'E8F0E8' } } },
    { text: 'Einordnung', options: { bold: true, fill: { color: 'E8F0E8' } } },
  ],
  ['Sihot/Buchungssystem', 'Eigenes Projekt; Variablen und Anbindung mit Entwicklungspartner abstimmen.'],
  ['Wald-Aspekte/Kategorien', 'Punkte nach Kategorien; Kennzahlen differenziert – kann an Release 3 oder 4 angebunden werden.'],
  ['Gäste ohne Anmeldung', 'Größeres Konzept (Aufgaben für Gäste, Punkte per Cookie); eigener Release oder nach R2.'],
  ['Event-Vorbereitung', 'Konzeption und Abstimmung – kein reines Entwicklungs-Release.'],
];
s10.addTable(ausserhalbRows, {
  x: 0.5, y: 1.35, w: 9, colW: [2.5, 6.5], fontSize: 10, align: 'left', border: { pt: 0.5 },
});

// ---- Slide 11: Nächste Schritte ----
const s11 = pptx.addSlide();
s11.addText('Nächste Schritte', headingOpts);
s11.addText(
  [
    { text: 'Release 1 kann zeitnah geplant und umgesetzt werden.', options: bulletOpts },
    { text: 'Die genaue Priorität der einzelnen Punkte (z. B. DB-Problem vor QR-Code) legen wir gemeinsam fest.', options: bulletOpts },
    { text: 'Die Reihenfolge der späteren Releases (R2–R6) bleibt wie gezeigt.', options: bulletOpts },
    { text: 'Die Aufnahme von „Wald-Aspekte“ oder „Gäste ohne Anmeldung“ kann nach Ihren Wünschen angepasst werden.', options: bulletOpts },
  ],
  { x: 0.5, y: 1.5, w: 9, h: 2.2, fontSize: 12 }
);
s11.addText('Bei Fragen oder Wünschen zur Priorisierung sprechen Sie uns gerne an.', {
  x: 0.5, y: 4.0, w: 9, fontSize: 12, bold: true, color: '2D5016',
});

// Ausgabe
const outDir = path.join(__dirname, '..', 'docs');
const outPath = path.join(outDir, 'RELEASE_PLAN_KUNDENPRASENTATION.pptx');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

pptx.writeFile({ fileName: outPath })
  .then(() => console.log('Erstellt:', outPath))
  .catch((err) => {
    console.error('Fehler beim Erstellen der PowerPoint-Datei:', err);
    process.exit(1);
  });
