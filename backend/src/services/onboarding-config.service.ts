import { getSystemConfig, setSystemConfig } from './system-config.service.js';

export const ONBOARDING_CONFIG_KEY = 'onboarding_config';

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

export interface OnboardingConfig {
  version: 1;
  dyadCount: number;
  questionsPerDyad: number;
  introTitleDe: string;
  introTitleEn: string;
  introBodyDe: string;
  introBodyEn: string;
  steps: OnboardingStepConfig[];
}

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  version: 1,
  dyadCount: 4,
  questionsPerDyad: 1,
  introTitleDe: 'Schön, dass du hier bist!',
  introTitleEn: 'Welcome!',
  introBodyDe:
    'In dieser Welt steckt mehr, als man auf den ersten Blick sieht. Antworte auf ein paar kurze Fragen – und wir verraten dir, welches Wesen tief in dir schlummert.',
  introBodyEn:
    'There is more to this world than meets the eye. Answer a few short questions and we will tell you which creature slumbers within you.',
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

  return {
    version: 1,
    dyadCount,
    questionsPerDyad,
    introTitleDe: String(o.introTitleDe ?? DEFAULT_ONBOARDING_CONFIG.introTitleDe).slice(0, 2000),
    introTitleEn: String(o.introTitleEn ?? DEFAULT_ONBOARDING_CONFIG.introTitleEn).slice(0, 2000),
    introBodyDe: String(o.introBodyDe ?? DEFAULT_ONBOARDING_CONFIG.introBodyDe).slice(0, 8000),
    introBodyEn: String(o.introBodyEn ?? DEFAULT_ONBOARDING_CONFIG.introBodyEn).slice(0, 8000),
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
