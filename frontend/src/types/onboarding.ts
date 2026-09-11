export interface OnboardingStepConfig {
  scenarioDe: string;
  scenarioEn: string;
  poleLowDe: string;
  poleLowEn: string;
  poleHighDe: string;
  poleHighEn: string;
  backgroundImageUrl: string | null;
}

export interface OnboardingIntroSlideConfig {
  titleDe: string;
  titleEn: string;
  bodyDe: string;
  bodyEn: string;
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
  /** @deprecated legacy fallback */
  introTitleDe: string;
  /** @deprecated legacy fallback */
  introTitleEn: string;
  /** @deprecated legacy fallback */
  introBodyDe: string;
  /** @deprecated legacy fallback */
  introBodyEn: string;
  typeTexts?: Record<string, OnboardingTypeTextRow[]>;
  characterIcons?: Record<string, string | null>;
  steps: OnboardingStepConfig[];
}
