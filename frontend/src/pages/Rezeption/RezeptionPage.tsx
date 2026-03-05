import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import './RezeptionPage.css';
import { TeamManagement } from '../../components/Admin/TeamManagement';
import { ContestManagement } from '../../components/Admin/ContestManagement';
import { PhotoValidation } from '../../components/Admin/PhotoValidation';
import QrScannerPage from '../Admin/QrScannerPage';
import PointsBonusPage from '../Employee/PointsBonusPage';
import { ManagementHeader } from '../../components/Management/ManagementHeader';
import { ManagementCard } from '../../components/Management/ManagementCard';

type RezeptionMode =
  | 'teamManage'
  | 'contestManage'
  | 'pointsBonus'
  | 'redeemRewards'
  | 'verifyTasks'
  | null;

function RezeptionPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mode, setMode] = useState<RezeptionMode>(null);

  return (
    <div className="rezeption-page">
      <header className="rezeption-header">
        <nav className="rezeption-navbar">
          <div className="rezeption-navbar-space" />
          <button className="rezeption-logout-button" onClick={logout} type="button">
            {t('navigation.logout')}
          </button>
        </nav>
        <div className="rezeption-hero">
          <h1 className="rezeption-hero-title">{t('rezeption.title')}</h1>
          <p className="rezeption-hero-subtitle">{t('rezeption.subtitle')}</p>
        </div>
      </header>

      {mode === null && (
        <>
          {/* 1. Reihe: Bonuspunkte geben, Belohnungen einlösen, Aufgaben verifizieren */}
          <div className="rezeption-choice-grid">
            <button className="rezeption-choice-card" onClick={() => setMode('pointsBonus')}>
              <span className="rezeption-choice-icon">🎁</span>
              <h2>{t('rezeption.actions.pointsBonus.title')}</h2>
              <p>{t('rezeption.actions.pointsBonus.description')}</p>
            </button>
            <button className="rezeption-choice-card" onClick={() => setMode('redeemRewards')}>
              <span className="rezeption-choice-icon">📷</span>
              <h2>{t('rezeption.actions.redeemRewards.title')}</h2>
              <p>{t('rezeption.actions.redeemRewards.description')}</p>
            </button>
            <button className="rezeption-choice-card" onClick={() => setMode('verifyTasks')}>
              <span className="rezeption-choice-icon">✅</span>
              <h2>{t('rezeption.actions.verifyTasks.title')}</h2>
              <p>{t('rezeption.actions.verifyTasks.description')}</p>
            </button>
          </div>
          {/* 2. Reihe: Teams und Wettbewerbe verwalten */}
          <div className="rezeption-choice-grid">
            <button className="rezeption-choice-card" onClick={() => setMode('teamManage')}>
              <span className="rezeption-choice-icon">👨‍👩‍👧‍👦</span>
              <h2>{t('rezeption.actions.manageTeams.title')}</h2>
              <p>{t('rezeption.actions.manageTeams.description')}</p>
            </button>
            <button className="rezeption-choice-card" onClick={() => setMode('contestManage')}>
              <span className="rezeption-choice-icon">🏆</span>
              <h2>{t('rezeption.actions.manageContests.title')}</h2>
              <p>{t('rezeption.actions.manageContests.description')}</p>
            </button>
          </div>
        </>
      )}

      {mode === 'teamManage' && (
        <TeamManagement
          cssPrefix="rezeption"
          onBack={() => setMode(null)}
          enabled={mode === 'teamManage'}
        />
      )}

      {mode === 'contestManage' && (
        <ContestManagement
          cssPrefix="rezeption"
          onBack={() => setMode(null)}
          enabled={mode === 'contestManage'}
        />
      )}

      {mode === 'pointsBonus' && (
        <section className="rezeption-section">
          <ManagementHeader
            title={t('rezeption.pointsBonus.title')}
            subtitle={t('rezeption.actions.pointsBonus.description')}
            cssPrefix="rezeption"
            onBack={() => setMode(null)}
            showBack={true}
            showRefresh={false}
          />
          <PointsBonusPage />
        </section>
      )}

      {mode === 'redeemRewards' && (
        <section className="rezeption-section">
          <ManagementHeader
            title={t('rezeption.redeemRewards.title')}
            subtitle={t('rezeption.actions.redeemRewards.description')}
            cssPrefix="rezeption"
            onBack={() => setMode(null)}
            showBack={true}
            showRefresh={false}
          />
          <QrScannerPage onBack={() => setMode(null)} />
        </section>
      )}

      {mode === 'verifyTasks' && (
        <PhotoValidation
          cssPrefix="rezeption"
          onBack={() => setMode(null)}
        />
      )}
    </div>
  );
}

export default RezeptionPage;
