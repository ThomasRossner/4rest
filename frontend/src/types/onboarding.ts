export interface OnboardingStepConfig {
  scenarioDe: string;
  scenarioEn: string;
  poleLowDe: string;
  poleLowEn: string;
  poleHighDe: string;
  poleHighEn: string;
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
