import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { PlayerProfilePayload, User } from '../../stores/authStore';
import type { OnboardingConfig, OnboardingStepConfig } from '../../types/onboarding';
import { resolveOnboardingBackgroundUrl } from '../../utils/onboardingBackgroundUrl';
import './PlayerProfileOnboarding.css';

function initialStepFor(
  variant: 'gate' | 'inline',
  initialProfile: PlayerProfilePayload | null | undefined,
  totalQuestions: number
): number {
  if (variant !== 'inline' || !initialProfile || totalQuestions <= 0) return 0;
  if (
    initialProfile.status === 'completed' &&
    initialProfile.dyadScales?.length &&
    initialProfile.dyadScales.every((x) => x != null)
  ) {
    return 1;
  }
  return 0;
}

function buildInitialAnswers(
  variant: 'gate' | 'inline',
  initialProfile: PlayerProfilePayload | null | undefined,
  config: OnboardingConfig
): (number | null)[] {
  const n = config.dyadCount * config.questionsPerDyad;
  const empty = () => Array.from({ length: n }, () => null as number | null);
  if (variant !== 'inline' || !initialProfile) return empty();
  const ans = initialProfile.dyadAnswers;
  if (ans && ans.length === n) {
    return ans.map((x) => (typeof x === 'number' ? x : null));
  }
  if (
    initialProfile.status === 'completed' &&
    initialProfile.dyadScales &&
    initialProfile.dyadScales.length === config.dyadCount &&
    config.questionsPerDyad === 1
  ) {
    return initialProfile.dyadScales.map((x) => x) as (number | null)[];
  }
  return empty();
}

function initialNameFor(
  variant: 'gate' | 'inline',
  initialProfile: PlayerProfilePayload | null | undefined
): string {
  if (variant === 'inline' && typeof initialProfile?.profileDisplayName === 'string') {
    return initialProfile.profileDisplayName;
  }
  return '';
}

export type PlayerProfileOnboardingProps = {
  variant?: 'gate' | 'inline';
  onDone?: () => void;
  initialProfile?: PlayerProfilePayload | null;
};

export default function PlayerProfileOnboarding({
  variant = 'gate',
  onDone,
  initialProfile,
}: PlayerProfileOnboardingProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de';
  const setUser = useAuthStore((s) => s.setUser);
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = (await api.getOnboardingConfig()) as OnboardingConfig;
        if (!cancelled) setConfig(c);
      } catch {
        if (!cancelled) setConfigError(t('playerProfile.error.loadProfile'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const totalQuestions = config ? config.dyadCount * config.questionsPerDyad : 0;
  const nameStepIndex = totalQuestions + 1;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    const n = config.dyadCount * config.questionsPerDyad;
    setAnswers(buildInitialAnswers(variant, initialProfile, config));
    setDisplayName(initialNameFor(variant, initialProfile));
    setStep(initialStepFor(variant, initialProfile, n));
  }, [config, variant, initialProfile]);

  const applyUser = (payload: { user?: User }) => {
    if (payload?.user) {
      setUser(payload.user);
    }
    if (variant === 'inline' && onDone) {
      onDone();
    }
  };

  const stepConfigAt = useCallback(
    (questionIndex: number): OnboardingStepConfig | null => {
      if (!config || questionIndex < 0 || questionIndex >= config.steps.length) return null;
      return config.steps[questionIndex] ?? null;
  },
    [config]
  );

  const textForStep = useCallback(
    (sc: OnboardingStepConfig) => {
      if (lang === 'en') {
        return {
          scenario: sc.scenarioEn || sc.scenarioDe,
          poleLow: sc.poleLowEn || sc.poleLowDe,
          poleHigh: sc.poleHighEn || sc.poleHighDe,
        };
      }
      return {
        scenario: sc.scenarioDe,
        poleLow: sc.poleLowDe,
        poleHigh: sc.poleHighDe,
      };
    },
    [lang]
  );

  const introTitle = config ? (lang === 'en' ? config.introTitleEn : config.introTitleDe) : '';
  const introBody = config ? (lang === 'en' ? config.introBodyEn : config.introBodyDe) : '';

  const handleSkipIntro = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.updateMyPlayerProfile({ status: 'skipped' });
      applyUser(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || t('playerProfile.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipHintAck = () => {
    void handleSkipIntro();
  };

  const setAnswer = (index: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const goNextFromQuestion = (qIdx: number) => {
    if (answers[qIdx] === null) return;
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    if (!config || answers.length !== totalQuestions) return;
    if (answers.some((a) => a === null)) return;
    const raw = answers.map((a) => a ?? 0);
    setError(null);
    setLoading(true);
    try {
      const trimmed = displayName.trim();
      const data = await api.updateMyPlayerProfile({
        status: 'completed',
        dyadAnswers: raw,
        profileDisplayName: trimmed === '' ? null : trimmed.slice(0, 128),
      });
      applyUser(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || t('playerProfile.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const rootClass = useMemo(
    () =>
      variant === 'inline'
        ? 'player-profile-onboarding player-profile-onboarding--inline'
        : 'player-profile-onboarding',
    [variant]
  );

  if (configError) {
    return (
      <div className={rootClass}>
        <div className="player-profile-onboarding__boot-error">{configError}</div>
      </div>
    );
  }

  if (!config || totalQuestions === 0) {
    return (
      <div className={rootClass}>
        <div className="player-profile-boot">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const renderQuestionFullscreen = (qIdx: number) => {
    const sc = stepConfigAt(qIdx);
    if (!sc) return null;
    const txt = textForStep(sc);
    const bgUrl = resolveOnboardingBackgroundUrl(sc.backgroundImageUrl);
    const dyadNum = Math.floor(qIdx / config.questionsPerDyad) + 1;
    const qInDyad = (qIdx % config.questionsPerDyad) + 1;
    const label =
      config.questionsPerDyad > 1
        ? t('playerProfile.progressDyad', {
            current: qIdx + 1,
            total: totalQuestions,
            dyad: dyadNum,
            qInDyad,
          })
        : t('playerProfile.progress', { current: qIdx + 1, total: totalQuestions });

    return (
      <div className="ppo-fullscreen">
        <div
          className="ppo-fullscreen__bg"
          style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
          aria-hidden
        />
        <div className="ppo-fullscreen__scrim" />
        <div className="ppo-fullscreen__inner">
          <div className="ppo-fullscreen__panel">
            <p className="player-profile-onboarding__step-label">{label}</p>
            <p className="player-profile-onboarding__text">{txt.scenario}</p>
            <div className="player-profile-onboarding__scale-labels">
              <span>{txt.poleLow}</span>
              <span>{txt.poleHigh}</span>
            </div>
            <div
              className="player-profile-onboarding__scale"
              role="group"
              aria-label={t('playerProfile.scaleAria')}
            >
              {[0, 1, 2, 3, 4].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={
                    answers[qIdx] === v
                      ? 'player-profile-onboarding__scale-btn player-profile-onboarding__scale-btn--active'
                      : 'player-profile-onboarding__scale-btn'
                  }
                  onClick={() => setAnswer(qIdx, v)}
                  aria-pressed={answers[qIdx] === v}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="player-profile-onboarding__row">
              <button
                type="button"
                className="player-profile-onboarding__btn player-profile-onboarding__btn--ghost"
                disabled={loading}
                onClick={goBack}
              >
                {t('common.actions.back')}
              </button>
              <button
                type="button"
                className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
                disabled={loading || answers[qIdx] === null}
                onClick={() => goNextFromQuestion(qIdx)}
              >
                {t('playerProfile.continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={rootClass}>
      {variant === 'inline' && onDone && (
        <div className="player-profile-onboarding__topbar">
          <button
            type="button"
            className="player-profile-onboarding__cancel"
            disabled={loading}
            onClick={onDone}
          >
            {t('playerProfile.inline.cancel')}
          </button>
        </div>
      )}

      {step === 0 && (
        <div className="ppo-fullscreen">
          <div className="ppo-fullscreen__bg ppo-fullscreen__bg--gradient" aria-hidden />
          <div className="ppo-fullscreen__scrim ppo-fullscreen__scrim--light" />
          <div className="ppo-fullscreen__inner">
            <div className="ppo-fullscreen__panel ppo-fullscreen__panel--intro">
              <h1 className="player-profile-onboarding__title">{introTitle}</h1>
              <p className="player-profile-onboarding__text">{introBody}</p>
              <div className="player-profile-onboarding__actions">
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
                  disabled={loading}
                  onClick={() => setStep(1)}
                >
                  {t('playerProfile.intro.start')}
                </button>
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--ghost"
                  disabled={loading}
                  onClick={() => setStep(-1)}
                >
                  {t('playerProfile.intro.skipLater')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === -1 && (
        <div className="ppo-fullscreen">
          <div className="ppo-fullscreen__bg ppo-fullscreen__bg--gradient" aria-hidden />
          <div className="ppo-fullscreen__scrim ppo-fullscreen__scrim--light" />
          <div className="ppo-fullscreen__inner">
            <div className="ppo-fullscreen__panel ppo-fullscreen__panel--intro">
              <p className="player-profile-onboarding__text">{t('playerProfile.skipHint')}</p>
              {error && (
                <p className="player-profile-onboarding__error" role="alert">
                  {error}
                </p>
              )}
              <div className="player-profile-onboarding__actions">
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
                  disabled={loading}
                  onClick={handleSkipHintAck}
                >
                  {t('common.actions.ok')}
                </button>
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--ghost"
                  disabled={loading}
                  onClick={() => {
                    setError(null);
                    setStep(0);
                  }}
                >
                  {t('common.actions.back')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step >= 1 && step <= totalQuestions && renderQuestionFullscreen(step - 1)}

      {step === nameStepIndex && (
        <div className="ppo-fullscreen">
          <div className="ppo-fullscreen__bg ppo-fullscreen__bg--gradient" aria-hidden />
          <div className="ppo-fullscreen__scrim ppo-fullscreen__scrim--light" />
          <div className="ppo-fullscreen__inner">
            <div className="ppo-fullscreen__panel ppo-fullscreen__panel--intro">
              <h2 className="player-profile-onboarding__title player-profile-onboarding__title--sm">
                {t('playerProfile.name.title')}
              </h2>
              <p className="player-profile-onboarding__text">{t('playerProfile.name.hint')}</p>
              <label className="player-profile-onboarding__label" htmlFor="pp-display-name">
                {t('playerProfile.name.label')}
              </label>
              <input
                id="pp-display-name"
                className="player-profile-onboarding__input"
                type="text"
                maxLength={128}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('playerProfile.name.placeholder')}
                autoComplete="nickname"
              />
              {error && (
                <p className="player-profile-onboarding__error" role="alert">
                  {error}
                </p>
              )}
              <div className="player-profile-onboarding__row">
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--ghost"
                  disabled={loading}
                  onClick={() => setStep(totalQuestions)}
                >
                  {t('common.actions.back')}
                </button>
                <button
                  type="button"
                  className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
                  disabled={loading}
                  onClick={handleComplete}
                >
                  {t('playerProfile.finish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
