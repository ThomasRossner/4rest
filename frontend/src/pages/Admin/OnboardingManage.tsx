import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type { OnboardingConfig, OnboardingStepConfig } from '../../types/onboarding';
import { resolveOnboardingBackgroundUrl } from '../../utils/onboardingBackgroundUrl';

function emptyStep(): OnboardingStepConfig {
  return {
    scenarioDe: '',
    scenarioEn: '',
    poleLowDe: '',
    poleLowEn: '',
    poleHighDe: '',
    poleHighEn: '',
    backgroundImageUrl: null,
  };
}

function resizeSteps(
  prev: OnboardingStepConfig[],
  target: number
): OnboardingStepConfig[] {
  const next = [...prev];
  while (next.length < target) {
    next.push(emptyStep());
  }
  while (next.length > target) {
    next.pop();
  }
  return next;
}

export default function OnboardingManage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dyadCount, setDyadCount] = useState(4);
  const [questionsPerDyad, setQuestionsPerDyad] = useState(1);
  const [introTitleDe, setIntroTitleDe] = useState('');
  const [introTitleEn, setIntroTitleEn] = useState('');
  const [introBodyDe, setIntroBodyDe] = useState('');
  const [introBodyEn, setIntroBodyEn] = useState('');
  const [steps, setSteps] = useState<OnboardingStepConfig[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = (await api.getOnboardingConfig()) as OnboardingConfig;
      setDyadCount(c.dyadCount);
      setQuestionsPerDyad(c.questionsPerDyad);
      setIntroTitleDe(c.introTitleDe);
      setIntroTitleEn(c.introTitleEn);
      setIntroBodyDe(c.introBodyDe);
      setIntroBodyEn(c.introBodyEn);
      setSteps(c.steps.length ? [...c.steps] : resizeSteps([], c.dyadCount * c.questionsPerDyad));
    } catch (e: unknown) {
      setError(t('admin.onboarding.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyStructure = () => {
    const target = dyadCount * questionsPerDyad;
    if (target < 1 || target > 512) {
      setError(t('admin.onboarding.invalidStructure'));
      return;
    }
    setError(null);
    setSteps((prev) => resizeSteps(prev, target));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: OnboardingConfig = {
        version: 1,
        dyadCount,
        questionsPerDyad,
        introTitleDe,
        introTitleEn,
        introBodyDe,
        introBodyEn,
        steps,
      };
      const saved = (await api.putAdminOnboardingConfig(payload)) as OnboardingConfig;
      setDyadCount(saved.dyadCount);
      setQuestionsPerDyad(saved.questionsPerDyad);
      setSteps([...saved.steps]);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || t('admin.onboarding.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const uploadBg = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingIndex(index);
    setError(null);
    try {
      const { url } = await api.uploadOnboardingBackground(file);
      setSteps((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index]!, backgroundImageUrl: url };
        }
        return next;
      });
    } catch {
      setError(t('admin.onboarding.uploadError'));
    } finally {
      setUploadingIndex(null);
    }
  };

  const updateStep = (index: number, field: keyof OnboardingStepConfig, value: string | null) => {
    setSteps((prev) => {
      const next = [...prev];
      const cur = next[index] ?? emptyStep();
      next[index] = { ...cur, [field]: value };
      return next;
    });
  };

  if (loading) {
    return <p className="admin-field-note">{t('common.loading')}</p>;
  }

  return (
    <div className="admin-form-card">
      <div className="admin-form-section-header">
        <div>
          <h3>{t('admin.onboarding.structureTitle')}</h3>
          <p className="admin-field-note">{t('admin.onboarding.structureHint')}</p>
        </div>
      </div>
      <div className="admin-form-row" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <label className="admin-field">
          <span>{t('admin.onboarding.dyadCount')}</span>
          <input
            type="number"
            min={1}
            max={32}
            value={dyadCount}
            onChange={(e) => setDyadCount(Math.min(32, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        </label>
        <label className="admin-field">
          <span>{t('admin.onboarding.questionsPerDyad')}</span>
          <input
            type="number"
            min={1}
            max={16}
            value={questionsPerDyad}
            onChange={(e) =>
              setQuestionsPerDyad(Math.min(16, Math.max(1, parseInt(e.target.value, 10) || 1)))
            }
          />
        </label>
        <button type="button" className="admin-button-secondary" onClick={applyStructure}>
          {t('admin.onboarding.applyStructure')}
        </button>
      </div>

      <div className="admin-form-section-header" style={{ marginTop: '1.5rem' }}>
        <h3>{t('admin.onboarding.introTitle')}</h3>
      </div>
      <label className="admin-field">
        <span>{t('admin.onboarding.introTitleDe')}</span>
        <input type="text" value={introTitleDe} onChange={(e) => setIntroTitleDe(e.target.value)} />
      </label>
      <label className="admin-field">
        <span>{t('admin.onboarding.introTitleEn')}</span>
        <input type="text" value={introTitleEn} onChange={(e) => setIntroTitleEn(e.target.value)} />
      </label>
      <label className="admin-field">
        <span>{t('admin.onboarding.introBodyDe')}</span>
        <textarea value={introBodyDe} onChange={(e) => setIntroBodyDe(e.target.value)} rows={3} />
      </label>
      <label className="admin-field">
        <span>{t('admin.onboarding.introBodyEn')}</span>
        <textarea value={introBodyEn} onChange={(e) => setIntroBodyEn(e.target.value)} rows={3} />
      </label>

      <div className="admin-form-section-header" style={{ marginTop: '1.5rem' }}>
        <h3>{t('admin.onboarding.stepsTitle')}</h3>
        <p className="admin-field-note">{t('admin.onboarding.stepsHint')}</p>
      </div>

      {steps.map((step, index) => {
        const dyadNum = Math.floor(index / questionsPerDyad) + 1;
        const qInDyad = (index % questionsPerDyad) + 1;
        const preview = resolveOnboardingBackgroundUrl(step.backgroundImageUrl);
        return (
          <div
            key={index}
            className="admin-form-card"
            style={{ marginTop: '1rem', border: '1px solid var(--color-border, #e2e8f0)' }}
          >
            <h4 className="admin-form-section-header">
              {t('admin.onboarding.stepHeading', { index: index + 1, dyad: dyadNum, q: qInDyad })}
            </h4>
            <div
              className="admin-form-row"
              style={{
                marginBottom: '0.75rem',
                minHeight: preview ? 120 : undefined,
                background: preview ? `center/cover no-repeat url(${preview})` : '#f1f5f9',
                borderRadius: 8,
                position: 'relative',
              }}
            >
              {preview && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15,23,42,0.35)',
                    borderRadius: 8,
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1, padding: '0.75rem' }}>
                <label className="admin-field" style={{ marginBottom: 0 }}>
                  <span style={{ color: preview ? '#fff' : undefined }}>
                    {t('admin.onboarding.backgroundImage')}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingIndex === index}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      void uploadBg(index, f ?? null);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            <label className="admin-field">
              <span>{t('admin.onboarding.scenarioDe')}</span>
              <textarea
                value={step.scenarioDe}
                onChange={(e) => updateStep(index, 'scenarioDe', e.target.value)}
                rows={2}
              />
            </label>
            <label className="admin-field">
              <span>{t('admin.onboarding.scenarioEn')}</span>
              <textarea
                value={step.scenarioEn}
                onChange={(e) => updateStep(index, 'scenarioEn', e.target.value)}
                rows={2}
              />
            </label>
            <div className="admin-form-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <label className="admin-field" style={{ flex: 1, minWidth: 200 }}>
                <span>{t('admin.onboarding.poleLowDe')}</span>
                <input
                  type="text"
                  value={step.poleLowDe}
                  onChange={(e) => updateStep(index, 'poleLowDe', e.target.value)}
                />
              </label>
              <label className="admin-field" style={{ flex: 1, minWidth: 200 }}>
                <span>{t('admin.onboarding.poleLowEn')}</span>
                <input
                  type="text"
                  value={step.poleLowEn}
                  onChange={(e) => updateStep(index, 'poleLowEn', e.target.value)}
                />
              </label>
            </div>
            <div className="admin-form-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <label className="admin-field" style={{ flex: 1, minWidth: 200 }}>
                <span>{t('admin.onboarding.poleHighDe')}</span>
                <input
                  type="text"
                  value={step.poleHighDe}
                  onChange={(e) => updateStep(index, 'poleHighDe', e.target.value)}
                />
              </label>
              <label className="admin-field" style={{ flex: 1, minWidth: 200 }}>
                <span>{t('admin.onboarding.poleHighEn')}</span>
                <input
                  type="text"
                  value={step.poleHighEn}
                  onChange={(e) => updateStep(index, 'poleHighEn', e.target.value)}
                />
              </label>
            </div>
          </div>
        );
      })}

      {error && <p className="admin-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '1.5rem' }}>
        <button type="button" className="admin-button-primary" disabled={saving} onClick={() => void save()}>
          {saving ? t('admin.onboarding.saving') : t('admin.onboarding.save')}
        </button>
      </div>
    </div>
  );
}
