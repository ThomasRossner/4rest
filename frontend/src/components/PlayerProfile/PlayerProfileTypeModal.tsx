import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlayerProfilePayload } from '../../stores/authStore';
import { getPlayerProfileTypeText } from '../../data/playerProfileTypeTexts';
import './PlayerProfileTypeModal.css';

type Props = {
  profile: PlayerProfilePayload;
  onClose: () => void;
};

export default function PlayerProfileTypeModal({ profile, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'de';
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (profile.status === 'skipped') {
    return (
      <div className="pp-type-modal" role="dialog" aria-modal="true" aria-labelledby="pp-type-title">
        <div className="pp-type-modal__backdrop" onClick={onClose} aria-hidden />
        <div className="pp-type-modal__panel" ref={panelRef}>
          <div className="pp-type-modal__header">
            <h2 id="pp-type-title" className="pp-type-modal__title">
              {t('playerProfile.moreAbout.title')}
            </h2>
            <button
              type="button"
              className="pp-type-modal__close-x"
              onClick={onClose}
              aria-label={t('common.actions.close')}
            >
              ×
            </button>
          </div>
          <div className="pp-type-modal__scroll">
            <p className="pp-type-modal__body">{t('playerProfile.moreAbout.skippedBody')}</p>
          </div>
          <div className="pp-type-modal__footer">
            <button type="button" className="pp-type-modal__btn" onClick={onClose}>
              {t('common.actions.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scales = profile.dyadScales;
  if (!scales || scales.length < 1) {
    return (
      <div className="pp-type-modal" role="dialog" aria-modal="true" aria-labelledby="pp-type-title">
        <div className="pp-type-modal__backdrop" onClick={onClose} aria-hidden />
        <div className="pp-type-modal__panel" ref={panelRef}>
          <h2 id="pp-type-title" className="pp-type-modal__title">
            {t('playerProfile.moreAbout.title')}
          </h2>
          <p className="pp-type-modal__empty">{t('playerProfile.moreAbout.noScales')}</p>
          <button type="button" className="pp-type-modal__btn" onClick={onClose}>
            {t('common.actions.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-type-modal" role="dialog" aria-modal="true" aria-labelledby="pp-type-title">
      <div className="pp-type-modal__backdrop" onClick={onClose} aria-hidden />
      <div className="pp-type-modal__panel" ref={panelRef}>
        <div className="pp-type-modal__header">
          <h2 id="pp-type-title" className="pp-type-modal__title">
            {t('playerProfile.moreAbout.title')}
          </h2>
          <button
            type="button"
            className="pp-type-modal__close-x"
            onClick={onClose}
            aria-label={t('common.actions.close')}
          >
            ×
          </button>
        </div>
        <div className="pp-type-modal__scroll">
          {scales.map((raw, idx) => {
            const dyad = idx + 1;
            const scale = Math.min(4, Math.max(0, raw)) as 0 | 1 | 2 | 3 | 4;
            const row = getPlayerProfileTypeText(lang, dyad, scale);
            return (
              <section key={dyad} className="pp-type-modal__section">
                <h3 className="pp-type-modal__dyad-title">
                  {t(`playerProfile.moreAbout.dyadHeading`, { n: dyad })}
                </h3>
                <p className="pp-type-modal__label">{row.label}</p>
                <p className="pp-type-modal__body">{row.body}</p>
              </section>
            );
          })}
        </div>
        <div className="pp-type-modal__footer">
          <button type="button" className="pp-type-modal__btn" onClick={onClose}>
            {t('common.actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
