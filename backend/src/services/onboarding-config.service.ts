import { getSystemConfig, setSystemConfig } from './system-config.service.js';

export const ONBOARDING_CONFIG_KEY = 'onboarding_config';

function emojiToTwemojiUrl(emoji: string): string {
  const codepoint = Array.from(emoji)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codepoint}.png`;
}

export interface OnboardingStepConfig {
  scenarioDe: string;
  scenarioEn: string;
  poleLowDe: string;
  poleLowEn: string;
  poleHighDe: string;
  poleHighEn: string;
  /** Volle URL wie bei Aufgaben-Medien (z. B. https://…/uploads/onboarding-bg-….jpg) oder null */
  backgroundImageUrl: string | null;
}

export interface OnboardingIntroSlideConfig {
  titleDe: string;
  titleEn: string;
  bodyDe: string;
  bodyEn: string;
  /** Volle URL wie bei Aufgaben-Medien (z. B. https://…/uploads/onboarding-bg-….jpg) oder null */
  backgroundImageUrl: string | null;
}

export interface OnboardingTypeTextRow {
  labelDe: string;
  labelEn: string;
  bodyDe: string;
  bodyEn: string;
}

export interface OnboardingConfig {
  version: 1;
  dyadCount: number;
  questionsPerDyad: number;
  introSlides: OnboardingIntroSlideConfig[];
  /** @deprecated legacy fallback for old clients/configs */
  introTitleDe: string;
  /** @deprecated legacy fallback for old clients/configs */
  introTitleEn: string;
  /** @deprecated legacy fallback for old clients/configs */
  introBodyDe: string;
  /** @deprecated legacy fallback for old clients/configs */
  introBodyEn: string;
  /**
   * Texte für "Mehr zu meinem Typ".
   * Key-Format: dyad_1, dyad_2, ...
   * Pro Dyade 5 Einträge für Skalenwerte 0..4.
   */
  typeTexts?: Record<string, OnboardingTypeTextRow[]>;
  steps: OnboardingStepConfig[];
  /**
   * Spielercharakter-Icons: Keys wie `dyad_1`, `dyad_2`, … sowie optionale Fallbacks
   * `pending`, `skipped`, `fallback`.
   */
  characterIcons?: Record<string, string | null>;
}

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  version: 1,
  dyadCount: 4,
  questionsPerDyad: 1,
  introSlides: [
    {
      titleDe: 'Schön, dass du hier bist!',
      titleEn: 'Welcome!',
      bodyDe:
        'In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf ein paar kurze Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.',
      bodyEn:
        'There is more to this world than meets the eye. Answer a few short questions and we will tell you which creature slumbers within you.',
      backgroundImageUrl: null,
    },
  ],
  introTitleDe: 'Schön, dass du hier bist!',
  introTitleEn: 'Welcome!',
  introBodyDe:
    'In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf ein paar kurze Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.',
  introBodyEn:
    'There is more to this world than meets the eye. Answer a few short questions and we will tell you which creature slumbers within you.',
  typeTexts: {},
  characterIcons: {
    dyad_1: emojiToTwemojiUrl('🦌'),
    dyad_2: emojiToTwemojiUrl('🦉'),
    dyad_3: emojiToTwemojiUrl('🐺'),
    dyad_4: emojiToTwemojiUrl('🐝'),
    pending: emojiToTwemojiUrl('❓'),
    skipped: emojiToTwemojiUrl('🐌'),
    fallback: emojiToTwemojiUrl('🐾'),
  },
  steps: [
    {
      scenarioDe:
        'Stell dir deine nächsten Wochen vor: Was gibt dir mehr Halt – klare Ziele und Meilensteine oder der offene Weg und die Momente unterwegs?',
      scenarioEn:
        'What gives you more stability in the coming weeks—clear goals and milestones, or the open road and moments along the way?',
      poleLowDe: 'Eher zielorientiert',
      poleLowEn: 'More goal-oriented',
      poleHighDe: 'Eher erlebnisorientiert',
      poleHighEn: 'More experience-oriented',
      backgroundImageUrl: null,
    },
    {
      scenarioDe:
        'Wenn du einen freien Tag planst: Suchst du lieber feste Struktur und feste Zeiten – oder viel Freiraum für Spontanes?',
      scenarioEn:
        'When you plan a free day: do you prefer fixed structure and times—or a lot of room for spontaneity?',
      poleLowDe: 'Eher Struktur',
      poleLowEn: 'More structure',
      poleHighDe: 'Eher Freiheit',
      poleHighEn: 'More freedom',
      backgroundImageUrl: null,
    },
    {
      scenarioDe:
        'In einer Gruppe: Übernimmst du gern die Richtung – oder fließt du lieber mit und stärkst das Miteinander?',
      scenarioEn:
        'In a group: do you prefer to lead—or go with the flow and strengthen togetherness?',
      poleLowDe: 'Eher Führung / Kontrolle',
      poleLowEn: 'More lead / control',
      poleHighDe: 'Eher Annehmen / Mitgehen',
      poleHighEn: 'More accept / follow',
      backgroundImageUrl: null,
    },
    {
      scenarioDe:
        'Bei Entscheidungen: Was wiegt für dich schwerer – dein eigenes Wohlbefinden oder das Wohl für alle Beteiligten?',
      scenarioEn:
        'What weighs more for you—your own well-being or the interests of everyone involved?',
      poleLowDe: 'Eher Eigeninteresse',
      poleLowEn: 'More self-interest',
      poleHighDe: 'Eher Gemeinwohl',
      poleHighEn: 'More common good',
      backgroundImageUrl: null,
    },
  ],
};

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function validateOnboardingConfig(raw: unknown): OnboardingConfig {
  if (!raw || typeof raw !== 'object') {
    throw new Error('invalid onboarding config');
  }
  const o = raw as Record<string, unknown>;
  const dyadCount = Number(o.dyadCount);
  const questionsPerDyad = Number(o.questionsPerDyad);
  if (!Number.isInteger(dyadCount) || dyadCount < 1 || dyadCount > 32) {
    throw new Error('dyadCount must be 1–32');
  }
  if (!Number.isInteger(questionsPerDyad) || questionsPerDyad < 1 || questionsPerDyad > 16) {
    throw new Error('questionsPerDyad must be 1–16');
  }
  const steps = o.steps;
  if (!Array.isArray(steps)) {
    throw new Error('steps must be an array');
  }
  const expected = dyadCount * questionsPerDyad;
  if (steps.length !== expected) {
    throw new Error(`steps must have length ${expected} (dyadCount × questionsPerDyad)`);
  }
  const normalized: OnboardingStepConfig[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s || typeof s !== 'object') {
      throw new Error(`step ${i} invalid`);
    }
    const r = s as Record<string, unknown>;
    const scenarioDe = String(r.scenarioDe ?? '').slice(0, 8000);
    const scenarioEn = String(r.scenarioEn ?? '').slice(0, 8000);
    const poleLowDe = String(r.poleLowDe ?? '').slice(0, 2000);
    const poleLowEn = String(r.poleLowEn ?? '').slice(0, 2000);
    const poleHighDe = String(r.poleHighDe ?? '').slice(0, 2000);
    const poleHighEn = String(r.poleHighEn ?? '').slice(0, 2000);
    const bg = r.backgroundImageUrl;
    const backgroundImageUrl =
      bg === null || bg === undefined
        ? null
        : bg === ''
          ? null
          : String(bg).slice(0, 2000);
    normalized.push({
      scenarioDe,
      scenarioEn,
      poleLowDe,
      poleLowEn,
      poleHighDe,
      poleHighEn,
      backgroundImageUrl,
    });
  }

  const introSlidesRaw = o.introSlides;
  const introSlides: OnboardingIntroSlideConfig[] = [];
  if (Array.isArray(introSlidesRaw) && introSlidesRaw.length > 0) {
    for (let i = 0; i < introSlidesRaw.length; i++) {
      const s = introSlidesRaw[i];
      if (!s || typeof s !== 'object') {
        throw new Error(`introSlides[${i}] invalid`);
      }
      const r = s as Record<string, unknown>;
      const bg = r.backgroundImageUrl;
      const backgroundImageUrl =
        bg === null || bg === undefined
          ? null
          : bg === ''
            ? null
            : String(bg).slice(0, 2000);
      introSlides.push({
        titleDe: String(r.titleDe ?? '').slice(0, 2000),
        titleEn: String(r.titleEn ?? '').slice(0, 2000),
        bodyDe: String(r.bodyDe ?? '').slice(0, 8000),
        bodyEn: String(r.bodyEn ?? '').slice(0, 8000),
        backgroundImageUrl,
      });
    }
  } else {
    // Backward compatibility: create one intro slide from legacy fields.
    introSlides.push({
      titleDe: String(o.introTitleDe ?? DEFAULT_ONBOARDING_CONFIG.introTitleDe).slice(0, 2000),
      titleEn: String(o.introTitleEn ?? DEFAULT_ONBOARDING_CONFIG.introTitleEn).slice(0, 2000),
      bodyDe: String(o.introBodyDe ?? DEFAULT_ONBOARDING_CONFIG.introBodyDe).slice(0, 8000),
      bodyEn: String(o.introBodyEn ?? DEFAULT_ONBOARDING_CONFIG.introBodyEn).slice(0, 8000),
      backgroundImageUrl: null,
    });
  }

  const characterIconsRaw = o.characterIcons;
  const characterIcons: Record<string, string | null> = {};
  if (characterIconsRaw && typeof characterIconsRaw === 'object' && !Array.isArray(characterIconsRaw)) {
    for (const [k, v] of Object.entries(characterIconsRaw as Record<string, unknown>)) {
      const key = String(k || '').trim().slice(0, 120);
      if (!key) continue;
      if (v === null || v === undefined || v === '') {
        characterIcons[key] = null;
      } else {
        characterIcons[key] = String(v).slice(0, 2000);
      }
    }
  }

  const typeTextsRaw = o.typeTexts;
  const typeTexts: Record<string, OnboardingTypeTextRow[]> = {};
  if (typeTextsRaw && typeof typeTextsRaw === 'object' && !Array.isArray(typeTextsRaw)) {
    for (const [k, v] of Object.entries(typeTextsRaw as Record<string, unknown>)) {
      const key = String(k || '').trim().slice(0, 120);
      if (!key || !Array.isArray(v)) continue;
      const rows = v
        .slice(0, 5)
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const r = row as Record<string, unknown>;
          return {
            labelDe: String(r.labelDe ?? '').slice(0, 2000),
            labelEn: String(r.labelEn ?? '').slice(0, 2000),
            bodyDe: String(r.bodyDe ?? '').slice(0, 8000),
            bodyEn: String(r.bodyEn ?? '').slice(0, 8000),
          } satisfies OnboardingTypeTextRow;
        })
        .filter((row): row is OnboardingTypeTextRow => Boolean(row));
      if (rows.length > 0) {
        typeTexts[key] = rows;
      }
    }
  }

  return {
    version: 1,
    dyadCount,
    questionsPerDyad,
    introSlides,
    introTitleDe: introSlides[0]?.titleDe ?? DEFAULT_ONBOARDING_CONFIG.introTitleDe,
    introTitleEn: introSlides[0]?.titleEn ?? DEFAULT_ONBOARDING_CONFIG.introTitleEn,
    introBodyDe: introSlides[0]?.bodyDe ?? DEFAULT_ONBOARDING_CONFIG.introBodyDe,
    introBodyEn: introSlides[0]?.bodyEn ?? DEFAULT_ONBOARDING_CONFIG.introBodyEn,
    typeTexts,
    characterIcons,
    steps: normalized,
  };
}

export async function getOnboardingConfig(): Promise<OnboardingConfig> {
  const raw = await getSystemConfig(ONBOARDING_CONFIG_KEY);
  if (!raw) {
    return { ...DEFAULT_ONBOARDING_CONFIG, steps: [...DEFAULT_ONBOARDING_CONFIG.steps] };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return validateOnboardingConfig(parsed);
  } catch {
    return { ...DEFAULT_ONBOARDING_CONFIG, steps: [...DEFAULT_ONBOARDING_CONFIG.steps] };
  }
}

export async function setOnboardingConfig(config: OnboardingConfig): Promise<void> {
  const v = validateOnboardingConfig(config);
  await setSystemConfig(
    ONBOARDING_CONFIG_KEY,
    JSON.stringify(v),
    'Spieler-Onboarding: Dyaden, Fragen, Hintergrundbilder'
  );
}

/** Aggregiert Rohantworten (0–4) pro Dyade (Mittelwert gerundet) */
export function aggregateDyadAnswers(
  answers: number[],
  dyadCount: number,
  questionsPerDyad: number
): number[] {
  const expected = dyadCount * questionsPerDyad;
  if (answers.length !== expected) {
    throw new Error(`Expected ${expected} answers, got ${answers.length}`);
  }
  const out: number[] = [];
  for (let d = 0; d < dyadCount; d++) {
    let sum = 0;
    for (let q = 0; q < questionsPerDyad; q++) {
      sum += answers[d * questionsPerDyad + q]!;
    }
    const avg = sum / questionsPerDyad;
    out.push(clampInt(avg, 0, 4));
  }
  return out;
}

/** Höchster Skalenwert gewinnt; bei Gleichstand niedrigere Dyaden-Nummer */
/** Wenn sich dyadCount / questionsPerDyad ändert: Steps-Array auf Zielgröße bringen (Texte erhalten wo möglich). */
export function resizeStepsForCounts(
  config: OnboardingConfig,
  nextDyadCount: number,
  nextQuestionsPerDyad: number
): OnboardingConfig {
  const target = nextDyadCount * nextQuestionsPerDyad;
  const prev = [...config.steps];
  const next: OnboardingStepConfig[] = [];
  for (let i = 0; i < target; i++) {
    if (i < prev.length) {
      next.push({ ...prev[i]! });
    } else {
      next.push({
        scenarioDe: '',
        scenarioEn: '',
        poleLowDe: '',
        poleLowEn: '',
        poleHighDe: '',
        poleHighEn: '',
        backgroundImageUrl: null,
      });
    }
  }
  return {
    ...config,
    dyadCount: nextDyadCount,
    questionsPerDyad: nextQuestionsPerDyad,
    steps: next,
  };
}

export function computeDominantDyadFromScales(scales: number[]): number {
  if (scales.length === 0) return 1;
  let maxVal = -1;
  let idx = 0;
  for (let i = 0; i < scales.length; i++) {
    const v = scales[i]!;
    if (v > maxVal) {
      maxVal = v;
      idx = i;
    }
  }
  return idx + 1;
}
