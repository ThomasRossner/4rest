import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import type {
  OnboardingConfig,
  OnboardingIntroSlideConfig,
  OnboardingStepConfig,
  OnboardingTypeTextRow,
} from '../../types/onboarding';
import { resolveOnboardingBackgroundUrl } from '../../utils/onboardingBackgroundUrl';
import { getPlayerProfileTypeText } from '../../data/playerProfileTypeTexts';
import { getDefaultPlayerCharacterIcons } from '../../constants/playerCharacter';

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

function emptyIntroSlide(): OnboardingIntroSlideConfig {
  return {
    titleDe: '',
    titleEn: '',
    bodyDe: '',
    bodyEn: '',
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
  const [introSlides, setIntroSlides] = useState<OnboardingIntroSlideConfig[]>([]);
  const [steps, setSteps] = useState<OnboardingStepConfig[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingIntroIndex, setUploadingIntroIndex] = useState<number | null>(null);
  const [characterIcons, setCharacterIcons] = useState<Record<string, string | null>>({});
  const [uploadingCharacterKey, setUploadingCharacterKey] = useState<string | null>(null);
  const [defaultDyadBackgrounds, setDefaultDyadBackgrounds] = useState<(string | null)[]>([]);
  const [typeTexts, setTypeTexts] = useState<Record<string, OnboardingTypeTextRow[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = (await api.getOnboardingConfig()) as OnboardingConfig;
      setDyadCount(c.dyadCount);
      setQuestionsPerDyad(c.questionsPerDyad);
      if (Array.isArray(c.introSlides) && c.introSlides.length > 0) {
        setIntroSlides([...c.introSlides]);
      } else {
        setIntroSlides([
          {
            titleDe: c.introTitleDe,
            titleEn: c.introTitleEn,
            bodyDe: c.introBodyDe,
            bodyEn: c.introBodyEn,
            backgroundImageUrl: null,
          },
        ]);
      }
      const defaultIcons = getDefaultPlayerCharacterIcons(c.dyadCount);
      setCharacterIcons({
        ...defaultIcons,
        ...(c.characterIcons ?? {}),
      });
      setSteps(c.steps.length ? [...c.steps] : resizeSteps([], c.dyadCount * c.questionsPerDyad));
      const defaults = Array.from({ length: c.dyadCount }, (_, dyadIndex) => {
        const stepIndex = dyadIndex * c.questionsPerDyad;
        return c.steps[stepIndex]?.backgroundImageUrl ?? null;
      });
      setDefaultDyadBackgrounds(defaults);
      const fallbackTypeTexts: Record<string, OnboardingTypeTextRow[]> = {};
      for (let dyad = 1; dyad <= c.dyadCount; dyad++) {
        fallbackTypeTexts[`dyad_${dyad}`] = [0, 1, 2, 3, 4].map((scale) => {
          const de = getPlayerProfileTypeText('de', dyad, scale as 0 | 1 | 2 | 3 | 4);
          const en = getPlayerProfileTypeText('en', dyad, scale as 0 | 1 | 2 | 3 | 4);
          return {
            labelDe: de.label,
            labelEn: en.label,
            bodyDe: de.body,
            bodyEn: en.body,
          };
        });
      }
      const configuredTypeTexts = c.typeTexts ?? {};
      const mergedTypeTexts: Record<string, OnboardingTypeTextRow[]> = {};
      for (let dyad = 1; dyad <= c.dyadCount; dyad++) {
        const key = `dyad_${dyad}`;
        const configuredRows = Array.isArray(configuredTypeTexts[key]) ? configuredTypeTexts[key] : [];
        mergedTypeTexts[key] = [0, 1, 2, 3, 4].map((idx) => {
          const fallback = fallbackTypeTexts[key]![idx]!;
          const current = configuredRows[idx];
          return {
            labelDe: current?.labelDe ?? fallback.labelDe,
            labelEn: current?.labelEn ?? fallback.labelEn,
            bodyDe: current?.bodyDe ?? fallback.bodyDe,
            bodyEn: current?.bodyEn ?? fallback.bodyEn,
          };
        });
      }
      setTypeTexts(mergedTypeTexts);
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
        introSlides,
        introTitleDe: introSlides[0]?.titleDe ?? '',
        introTitleEn: introSlides[0]?.titleEn ?? '',
        introBodyDe: introSlides[0]?.bodyDe ?? '',
        introBodyEn: introSlides[0]?.bodyEn ?? '',
        typeTexts,
        characterIcons,
        steps,
      };
      const saved = (await api.putAdminOnboardingConfig(payload)) as OnboardingConfig;
      setDyadCount(saved.dyadCount);
      setQuestionsPerDyad(saved.questionsPerDyad);
      const defaultIcons = getDefaultPlayerCharacterIcons(saved.dyadCount);
      setCharacterIcons({
        ...defaultIcons,
        ...(saved.characterIcons ?? {}),
      });
      setSteps([...saved.steps]);
      setTypeTexts(saved.typeTexts ?? {});
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

  const uploadIntroBg = async (index: number, file: File | null) => {
    if (!file) return;
    setUploadingIntroIndex(index);
    setError(null);
    try {
      const { url } = await api.uploadOnboardingBackground(file);
      setIntroSlides((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index]!, backgroundImageUrl: url };
        }
        return next;
      });
    } catch {
      setError(t('admin.onboarding.uploadError'));
    } finally {
      setUploadingIntroIndex(null);
    }
  };

  const uploadCharacterIcon = async (key: string, file: File | null) => {
    if (!file) return;
    setUploadingCharacterKey(key);
    setError(null);
    try {
      const { url } = await api.uploadOnboardingCharacterIcon(file);
      setCharacterIcons((prev) => ({ ...prev, [key]: url }));
    } catch {
      setError(t('admin.onboarding.uploadError'));
    } finally {
      setUploadingCharacterKey(null);
    }
  };

  const characterKeys = Array.from({ length: dyadCount }, (_, idx) => ({
    key: `dyad_${idx + 1}`,
    label: t('admin.onboarding.characterIconDyad', { dyad: idx + 1 }),
  }));
  characterKeys.push(
    { key: 'pending', label: t('admin.onboarding.characterIconPending') },
    { key: 'skipped', label: t('admin.onboarding.characterIconSkipped') },
    { key: 'fallback', label: t('admin.onboarding.characterIconFallback') }
  );

  useEffect(() => {
    const defaults = getDefaultPlayerCharacterIcons(dyadCount);
    setCharacterIcons((prev) => ({ ...defaults, ...prev }));
  }, [dyadCount]);

  const updateStep = (index: number, field: keyof OnboardingStepConfig, value: string | null) => {
    setSteps((prev) => {
      const next = [...prev];
      const cur = next[index] ?? emptyStep();
      next[index] = { ...cur, [field]: value };
      return next;
    });
  };

  const updateIntroSlide = (
    index: number,
    field: keyof OnboardingIntroSlideConfig,
    value: string | null
  ) => {
    setIntroSlides((prev) => {
      const next = [...prev];
      const cur = next[index] ?? emptyIntroSlide();
      next[index] = { ...cur, [field]: value };
      return next;
    });
  };

  const updateTypeText = (
    dyadIndex: number,
    scaleIndex: number,
    field: keyof OnboardingTypeTextRow,
    value: string
  ) => {
    const key = `dyad_${dyadIndex + 1}`;
    setTypeTexts((prev) => {
      const next = { ...prev };
      const rows = Array.isArray(next[key]) ? [...next[key]!] : [];
      while (rows.length < 5) {
        rows.push({ labelDe: '', labelEn: '', bodyDe: '', bodyEn: '' });
      }
      rows[scaleIndex] = {
        ...rows[scaleIndex]!,
        [field]: value,
      };
      next[key] = rows;
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
        <div>
          <h3>{t('admin.onboarding.introSlidesTitle')}</h3>
          <p className="admin-field-note">{t('admin.onboarding.introSlidesHint')}</p>
        </div>
      </div>
      <button
        type="button"
        className="admin-button-secondary"
        onClick={() => setIntroSlides((prev) => [...prev, emptyIntroSlide()])}
      >
        {t('admin.onboarding.addIntroSlide')}
      </button>
      {introSlides.map((slide, index) => {
        const preview = resolveOnboardingBackgroundUrl(slide.backgroundImageUrl);
        return (
          <div
            key={`intro-${index}`}
            className="admin-form-card"
            style={{ marginTop: '1rem', border: '1px solid var(--color-border, #e2e8f0)' }}
          >
            <div className="admin-form-section-header">
              <h4>
                {t('admin.onboarding.introSlideHeading', { index: index + 1 })}
              </h4>
              <button
                type="button"
                className="admin-button-secondary"
                disabled={introSlides.length <= 1}
                onClick={() =>
                  setIntroSlides((prev) => prev.filter((_, i) => i !== index))
                }
              >
                {t('admin.parameterManage.delete')}
              </button>
            </div>
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
                    disabled={uploadingIntroIndex === index}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      void uploadIntroBg(index, f ?? null);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            <label className="admin-field">
              <span>{t('admin.onboarding.introTitleDe')}</span>
              <input
                type="text"
                value={slide.titleDe}
                onChange={(e) => updateIntroSlide(index, 'titleDe', e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>{t('admin.onboarding.introTitleEn')}</span>
              <input
                type="text"
                value={slide.titleEn}
                onChange={(e) => updateIntroSlide(index, 'titleEn', e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>{t('admin.onboarding.introBodyDe')}</span>
              <textarea
                value={slide.bodyDe}
                onChange={(e) => updateIntroSlide(index, 'bodyDe', e.target.value)}
                rows={3}
              />
            </label>
            <label className="admin-field">
              <span>{t('admin.onboarding.introBodyEn')}</span>
              <textarea
                value={slide.bodyEn}
                onChange={(e) => updateIntroSlide(index, 'bodyEn', e.target.value)}
                rows={3}
              />
            </label>
          </div>
        );
      })}

      <div className="admin-form-section-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h3>{t('admin.onboarding.characterIconsTitle')}</h3>
          <p className="admin-field-note">{t('admin.onboarding.characterIconsHint')}</p>
        </div>
      </div>
      <div className="admin-form-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        {characterKeys.map(({ key, label }) => {
          const preview = resolveOnboardingBackgroundUrl(characterIcons[key] ?? null);
          return (
            <div
              key={key}
              className="admin-form-card"
              style={{ width: 220, border: '1px solid var(--color-border, #e2e8f0)' }}
            >
              <p style={{ marginTop: 0, marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 999,
                  border: '1px solid var(--color-border, #e2e8f0)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  marginBottom: '0.5rem',
                }}
              >
                {preview ? (
                  <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#64748b', fontSize: 12 }}>{t('admin.onboarding.noImage')}</span>
                )}
              </div>
              <label className="admin-field" style={{ marginBottom: '0.5rem' }}>
                <span>{t('admin.onboarding.uploadCharacterIcon')}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingCharacterKey === key}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    void uploadCharacterIcon(key, f ?? null);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                className="admin-button-secondary"
                onClick={() => setCharacterIcons((prev) => ({ ...prev, [key]: null }))}
              >
                {t('admin.onboarding.clearCharacterIcon')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="admin-form-section-header" style={{ marginTop: '1.5rem' }}>
        <h3>{t('admin.onboarding.stepsTitle')}</h3>
        <p className="admin-field-note">{t('admin.onboarding.stepsHint')}</p>
      </div>

      {steps.map((step, index) => {
        const dyadNum = Math.floor(index / questionsPerDyad) + 1;
        const qInDyad = (index % questionsPerDyad) + 1;
        const preview = resolveOnboardingBackgroundUrl(step.backgroundImageUrl);
        const resolvedDefaults = defaultDyadBackgrounds
          .map((url, dyadIndex) => ({
            dyadIndex,
            rawUrl: url,
            url: resolveOnboardingBackgroundUrl(url),
          }))
          .filter((item): item is { dyadIndex: number; rawUrl: string; url: string } =>
            Boolean(item.rawUrl && item.url)
          );
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
            {resolvedDefaults.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p className="admin-field-note" style={{ marginBottom: '0.5rem' }}>
                  {t('admin.onboarding.defaultDyadImagesLabel')}
                </p>
                <div className="admin-form-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                  {resolvedDefaults.map((item) => (
                    <button
                      key={`default-dyad-bg-${item.dyadIndex}`}
                      type="button"
                      className="admin-button-secondary"
                      onClick={() => updateStep(index, 'backgroundImageUrl', item.rawUrl)}
                      title={t('admin.onboarding.useDefaultDyadImage', { dyad: item.dyadIndex + 1 })}
                      style={{
                        padding: '0.35rem',
                        border:
                          step.backgroundImageUrl === item.rawUrl
                            ? '2px solid var(--color-primary, #16a34a)'
                            : undefined,
                      }}
                    >
                      <img
                        src={item.url}
                        alt={t('admin.onboarding.defaultDyadImageAlt', { dyad: item.dyadIndex + 1 })}
                        style={{
                          width: 74,
                          height: 52,
                          objectFit: 'cover',
                          borderRadius: 6,
                          display: 'block',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
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

      <div className="admin-form-section-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h3>{t('admin.onboarding.typeTextsTitle')}</h3>
          <p className="admin-field-note">{t('admin.onboarding.typeTextsHint')}</p>
        </div>
      </div>
      {Array.from({ length: dyadCount }, (_, dyadIdx) => {
        const key = `dyad_${dyadIdx + 1}`;
        const rows = typeTexts[key] ?? [];
        return (
          <div
            key={key}
            className="admin-form-card"
            style={{ marginTop: '1rem', border: '1px solid var(--color-border, #e2e8f0)' }}
          >
            <h4 className="admin-form-section-header">
              {t('admin.onboarding.typeTextDyadHeading', { dyad: dyadIdx + 1 })}
            </h4>
            {[0, 1, 2, 3, 4].map((scaleIdx) => {
              const row = rows[scaleIdx] ?? { labelDe: '', labelEn: '', bodyDe: '', bodyEn: '' };
              return (
                <div
                  key={`dyad-${dyadIdx + 1}-scale-${scaleIdx}`}
                  className="admin-form-card"
                  style={{ marginTop: '0.75rem', border: '1px solid #e2e8f0' }}
                >
                  <h5 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                    {t('admin.onboarding.typeTextScaleHeading', { scale: scaleIdx })}
                  </h5>
                  <div className="admin-form-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                    <label className="admin-field" style={{ flex: 1, minWidth: 220 }}>
                      <span>{t('admin.onboarding.typeTextLabelDe')}</span>
                      <input
                        type="text"
                        value={row.labelDe}
                        onChange={(e) => updateTypeText(dyadIdx, scaleIdx, 'labelDe', e.target.value)}
                      />
                    </label>
                    <label className="admin-field" style={{ flex: 1, minWidth: 220 }}>
                      <span>{t('admin.onboarding.typeTextLabelEn')}</span>
                      <input
                        type="text"
                        value={row.labelEn}
                        onChange={(e) => updateTypeText(dyadIdx, scaleIdx, 'labelEn', e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="admin-field">
                    <span>{t('admin.onboarding.typeTextBodyDe')}</span>
                    <textarea
                      value={row.bodyDe}
                      onChange={(e) => updateTypeText(dyadIdx, scaleIdx, 'bodyDe', e.target.value)}
                      rows={3}
                    />
                  </label>
                  <label className="admin-field">
                    <span>{t('admin.onboarding.typeTextBodyEn')}</span>
                    <textarea
                      value={row.bodyEn}
                      onChange={(e) => updateTypeText(dyadIdx, scaleIdx, 'bodyEn', e.target.value)}
                      rows={3}
                    />
                  </label>
                </div>
              );
            })}
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
