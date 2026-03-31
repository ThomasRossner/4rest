/** Textbausteine aus Spielerprofilierung-Vollversion (Dyaden × Skalen 0–4) */
export type DyadId = 'd1' | 'd2' | 'd3' | 'd4';
export type ScaleId = 0 | 1 | 2 | 3 | 4;
export interface TypeTextRow { label: string; body: string }

const DE: Record<DyadId, TypeTextRow[]> = {
  d1: [
    { label: "Zielorientiert (stark)", body: "Du hast ein klares Ziel vor Augen – nicht, weil du musst, sondern weil du willst. Du liebst das Gefühl, auf etwas hinzuarbeiten, Pläne zu schmieden und Schritte abzuhaken. Andere mögen im Nebel wandeln – du hast längst einen Kompass in der Hand. Für dich ist das Leben eine Reise mit Meilensteinen." },
    { label: "Zielorientiert (moderat)", body: "Ziele helfen dir, deinen Weg zu finden. Du magst Struktur und erkennst gern Fortschritte. Doch du bist flexibel genug, auch mal einen Umweg in Kauf zu nehmen, wenn es sich gut anfühlt." },
    { label: "Ausgeglichen", body: "Du erkennst den Wert von Zielen, ohne dich von ihnen treiben zu lassen. Du bewegst dich zwischen Absicht und Intuition – offen für Ergebnisse, aber nicht darauf fixiert." },
    { label: "Erlebnisorientiert (moderat)", body: "Du genießt, was auf dem Weg liegt – auch wenn ein Ziel dir Orientierung gibt. Das Erleben selbst bedeutet dir mehr als bloße Ergebnisse." },
    { label: "Erlebnisorientiert (stark)", body: "Du bist jemand, der das Rascheln der Blätter hört, während andere nur auf die Karte starren. Du findest Bedeutung in Momenten – nicht in Medaillen. Für dich ist die Welt ein Ort zum Staunen, nicht zum Erobern." },
  ],
  d2: [
    { label: "Strukturliebend (stark)", body: "Du findest Ruhe in der Ordnung. Systeme geben dir Sicherheit. Du erkennst Muster, wo andere Chaos sehen – und gibst damit auch anderen Orientierung." },
    { label: "Strukturliebend (moderat)", body: "Struktur hilft dir, dich zurechtzufinden. Du schätzt Regeln, solange sie dir helfen. Spontanität hat Platz – aber nur mit Rahmen." },
    { label: "Ausgeglichen", body: "Du bewegst dich zwischen Klarheit und Offenheit. Mal suchst du Richtung, mal den Reiz des Zufalls. Beides hat seinen Platz auf deiner Reise." },
    { label: "Freiheitsliebend (moderat)", body: "Du liebst es, deinen eigenen Rhythmus zu finden. Struktur akzeptierst du, solange sie dich nicht einschränkt." },
    { label: "Freiheitsliebend (stark)", body: "Du bist der Wind zwischen den Bäumen – nicht aufzuhalten, nicht einzusperren. Du findest deinen Weg, indem du ihn gehst. Neue Wege, spontane Entscheidungen: Das ist dein Element." },
  ],
  d3: [
    { label: "Kontrollierend (stark)", body: "Du bist jemand, der Verantwortung nicht scheut. Du gibst Richtung, triffst Entscheidungen und strukturierst das Miteinander. Deine Stärke liegt darin, Ordnung zu schaffen." },
    { label: "Kontrollierend (moderat)", body: "Du übernimmst gern Verantwortung, wenn es nötig ist. Du führst mit Überblick, nicht mit Druck – und weißt, wann es gut ist, abzugeben." },
    { label: "Ausgeglichen", body: "Manchmal führst du, manchmal folgst du – du spürst, was gebraucht wird. Dein Gleichgewicht bringt Ruhe in Gruppen." },
    { label: "Akzeptierend (moderat)", body: "Du fühlst dich wohl im Miteinander. Du hörst zu, orientierst dich an anderen und stärkst durch Gemeinschaft." },
    { label: "Akzeptierend (stark)", body: "Du gehst mit Menschen in Resonanz. Für dich ist Miteinander keine Floskel, sondern Haltung. Du brauchst keine Bühne, sondern Verbindung. In deiner Nähe fühlt man sich gesehen." },
  ],
  d4: [
    { label: "Eigeninteressiert (stark)", body: "Du kennst deinen Wert – und du weißt, dass du für dich selbst einstehen darfst. Du triffst Entscheidungen, die dir guttun. Dein Weg ist klar und unabhängig." },
    { label: "Eigeninteressiert (moderat)", body: "Du weißt, was dir wichtig ist, ohne egoistisch zu sein. Du setzt Grenzen, aber mit Feingefühl. Dein Fokus bleibt bei dir – und du verlierst dabei andere nicht aus dem Blick." },
    { label: "Ausgeglichen", body: "Du gibst gern – aber nicht um jeden Preis. Du balancierst gut zwischen Fürsorge für dich und andere." },
    { label: "Gemeinwohlorientiert (moderat)", body: "Du denkst an andere, auch wenn du selbst nicht im Schatten stehen willst. Deine Hilfe ist leise, aber spürbar. Du stärkst das Ganze, ohne dich aufzugeben." },
    { label: "Gemeinwohlorientiert (stark)", body: "Du denkst an andere, auch wenn es niemand merkt. Für dich sind Gemeinschaft, Zusammenhalt und das große Ganze mehr als Worte – sie sind deine Motivation. Du gibst, damit andere wachsen – und dabei wächst du selbst." },
  ],
};

const EN: Record<DyadId, TypeTextRow[]> = {
  d1: [
    { label: "Goal-oriented (strong)", body: "You have a clear goal in mind—not because you must, but because you want to. You love working toward something, making plans, and checking off steps. Others may wander in the fog—you already hold a compass. For you, life is a journey with milestones." },
    { label: "Goal-oriented (moderate)", body: "Goals help you find your way. You like structure and enjoy seeing progress. Yet you are flexible enough to take a detour when it feels right." },
    { label: "Balanced", body: "You see the value of goals without being driven by them. You move between intention and intuition—open to outcomes without fixating on them." },
    { label: "Experience-oriented (moderate)", body: "You enjoy what lies along the way—even when a goal gives you direction. The experience itself matters more than results alone." },
    { label: "Experience-oriented (strong)", body: "You hear the rustle of the leaves while others stare at the map. You find meaning in moments—not medals. For you, the world is a place to wonder, not to conquer." },
  ],
  d2: [
    { label: "Structure-loving (strong)", body: "You find calm in order. Systems give you security. You see patterns where others see chaos—and you help others find orientation too." },
    { label: "Structure-loving (moderate)", body: "Structure helps you find your footing. You appreciate rules when they help. Spontaneity has a place—but within a frame." },
    { label: "Balanced", body: "You move between clarity and openness. Sometimes you seek direction, sometimes the thrill of chance. Both have a place on your path." },
    { label: "Freedom-loving (moderate)", body: "You love finding your own rhythm. You accept structure as long as it does not constrain you." },
    { label: "Freedom-loving (strong)", body: "You are the wind between the trees—unstoppable, uncageable. You find your path by walking it. New paths and spontaneous choices: that is your element." },
  ],
  d3: [
    { label: "Controlling (strong)", body: "You do not shy away from responsibility. You give direction, make decisions, and structure how people work together. Your strength is creating order." },
    { label: "Controlling (moderate)", body: "You take responsibility when it is needed. You lead with overview, not pressure—and you know when to let go." },
    { label: "Balanced", body: "Sometimes you lead, sometimes you follow—you sense what is needed. Your balance brings calm to groups." },
    { label: "Accepting (moderate)", body: "You feel at ease with others. You listen, orient to others, and strengthen through community." },
    { label: "Accepting (strong)", body: "You resonate with people. For you, togetherness is not a slogan but an attitude. You need no stage—only connection. Near you, people feel seen." },
  ],
  d4: [
    { label: "Self-focused (strong)", body: "You know your worth—and you know you may stand up for yourself. You make decisions that do you good. Your path is clear and independent." },
    { label: "Self-focused (moderate)", body: "You know what matters to you without being selfish. You set boundaries with tact. Your focus stays with you—without losing sight of others." },
    { label: "Balanced", body: "You give gladly—but not at any price. You balance care for yourself and for others well." },
    { label: "Common-good oriented (moderate)", body: "You think of others even when you do not want to stay in the shadows. Your help is quiet but felt. You strengthen the whole without giving yourself up." },
    { label: "Common-good oriented (strong)", body: "You think of others even when no one notices. For you, community, cohesion, and the greater good are more than words—they motivate you. You give so others grow—and grow yourself in the process." },
  ],
};

export function getPlayerProfileTypeText(
  lang: string,
  dyad: 1 | 2 | 3 | 4,
  scale: ScaleId
): TypeTextRow {
  const key = ('d' + dyad) as DyadId;
  const table = lang.startsWith('en') ? EN : DE;
  return table[key][scale];
}
