import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { PlayerProfilePayload, User } from '../../stores/authStore';
import './PlayerProfileOnboarding.css';

const DYAD_KEYS = [1, 2, 3, 4] as const;

function initialStepFor(
  variant: 'gate' | 'inline',
  initialProfile: PlayerProfilePayload | null | undefined
): number {
  if (variant !== 'inline' || !initialProfile) return 0;
  if (initialProfile.status === 'completed' && initialProfile.dyadScales?.every((x) => x != null)) {
    return 1;
  }
  return 0;
}

function initialAnswersFor(
  variant: 'gate' | 'inline',
  initialProfile: PlayerProfilePayload | null | undefined
): (number | null)[] {
  if (
    variant === 'inline' &&
    initialProfile?.status === 'completed' &&
    initialProfile.dyadScales?.length === 4
  ) {
    return initialProfile.dyadScales.map((n) => n) as number[];
  }
  return [null, null, null, null];
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
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(() => initialStepFor(variant, initialProfile));
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    initialAnswersFor(variant, initialProfile)
  );
  const [displayName, setDisplayName] = useState(() => initialNameFor(variant, initialProfile));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyUser = (payload: { user?: User }) => {
    if (payload?.user) {
      setUser(payload.user);
    }
    if (variant === 'inline' && onDone) {
      onDone();
    }
  };

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

  const goNext = () => {
    if (step >= 1 && step <= 4) {
      const idx = step - 1;
      if (answers[idx] === null) return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    const scales = answers.map((a) => a ?? 0) as number[];
    if (scales.some((n) => n < 0 || n > 4)) return;
    setError(null);
    setLoading(true);
    try {
      const trimmed = displayName.trim();
      const data = await api.updateMyPlayerProfile({
        status: 'completed',
        dyadScales: scales,
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

  const rootClass =
    variant === 'inline'
      ? 'player-profile-onboarding player-profile-onboarding--inline'
      : 'player-profile-onboarding';

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
      <div className="player-profile-onboarding__panel">
        {step === 0 && (
          <>
            <h1 className="player-profile-onboarding__title">{t('playerProfile.intro.title')}</h1>
            <p className="player-profile-onboarding__text">{t('playerProfile.intro.body')}</p>
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
          </>
        )}

        {step === -1 && (
          <>
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
          </>
        )}

        {DYAD_KEYS.map((dyadNum, i) => {
          const s = i + 1;
          if (step !== s) return null;
          const poleLow = t(`playerProfile.dyads.${dyadNum}.poleLow`);
          const poleHigh = t(`playerProfile.dyads.${dyadNum}.poleHigh`);
          return (
            <div key={dyadNum} className="player-profile-onboarding__question">
              <p className="player-profile-onboarding__step-label">
                {t('playerProfile.progress', { current: s, total: 4 })}
              </p>
              <p className="player-profile-onboarding__text">{t(`playerProfile.dyads.${dyadNum}.scenario`)}</p>
              <div className="player-profile-onboarding__scale-labels">
                <span>{poleLow}</span>
                <span>{poleHigh}</span>
              </div>
              <div className="player-profile-onboarding__scale" role="group" aria-label={t('playerProfile.scaleAria')}>
                {[0, 1, 2, 3, 4].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={
                      answers[i] === v
                        ? 'player-profile-onboarding__scale-btn player-profile-onboarding__scale-btn--active'
                        : 'player-profile-onboarding__scale-btn'
                    }
                    onClick={() => setAnswer(i, v)}
                    aria-pressed={answers[i] === v}
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
                  disabled={loading || answers[i] === null}
                  onClick={goNext}
                >
                  {t('playerProfile.continue')}
                </button>
              </div>
            </div>
          );
        })}

        {step === 5 && (
          <>
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
                onClick={() => setStep(4)}
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
          </>
        )}
      </div>
    </div>
  );
}
