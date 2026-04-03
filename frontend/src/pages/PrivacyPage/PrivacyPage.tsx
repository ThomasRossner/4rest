import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/** Öffentliche Datenschutzhinweise (Link aus der Registrierungs-Checkbox). */
export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
      <h1 style={{ marginBottom: '1rem' }}>{t('privacyNotice.title')}</h1>
      <p style={{ marginBottom: '1.25rem' }}>{t('privacyNotice.intro')}</p>

      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('privacyNotice.purposesTitle')}</h2>
        <p>{t('privacyNotice.purposesBody')}</p>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('privacyNotice.dataTitle')}</h2>
        <p>{t('privacyNotice.dataBody')}</p>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('privacyNotice.legalTitle')}</h2>
        <p>{t('privacyNotice.legalBody')}</p>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('privacyNotice.rightsTitle')}</h2>
        <p>{t('privacyNotice.rightsBody')}</p>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('privacyNotice.contactTitle')}</h2>
        <p>{t('privacyNotice.contactBody')}</p>
      </section>

      <p>
        <Link to="/login?mode=register">{t('login.links.backToRegistration')}</Link>
      </p>
    </div>
  );
}
