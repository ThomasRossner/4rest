import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { DashboardCard } from '../../components/DashboardCard/DashboardCard';
import { SurveyAnalytics } from '../Admin/SurveyAnalytics';
import { LocationMap } from '../../components/LocationMap/LocationMap';
import { useQuery } from 'react-query';
import { api } from '../../services/api';
import './RedaktionPage.css';

type RedaktionMode = 'taskManage' | 'rewardManage' | 'locationManage' | 'surveyAnalytics' | null;

// Icon component helper
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    back: '←',
    refresh: '↻',
    close: '×',
  };
  return <span>{icons[name] || name}</span>;
};

function RedaktionPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mode, setMode] = useState<RedaktionMode>(null);
  const [includeInactiveLocations, setIncludeInactiveLocations] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [locationFilterStatus, setLocationFilterStatus] = useState<'active' | 'inactive' | null>(null);
  const [locationFilterName, setLocationFilterName] = useState('');

  // Fetch locations for location management
  const {
    data: locations,
    isLoading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useQuery(
    ['adminLocations', includeInactiveLocations],
    () => api.getLocations({ includeInactive: includeInactiveLocations }),
    {
      enabled: mode === 'locationManage',
    }
  );

  // Filter locations
  const filteredLocations = locations?.filter((loc: any) => {
    if (locationFilterStatus && loc.active !== (locationFilterStatus === 'active')) return false;
    if (locationFilterName && !loc.name?.toLowerCase().includes(locationFilterName.toLowerCase())) return false;
    return true;
  }) || [];

  // Task and Reward management will reuse AdminPage components
  // For now, we'll create simplified views or redirect to admin functionality
  // In a full implementation, these would be separate components

  return (
    <div className="redaktion-page">
      <header className="redaktion-header">
        <nav className="redaktion-navbar">
          <div className="redaktion-navbar-space" />
          <div className="redaktion-navbar-language">
            <LanguageSwitcher />
          </div>
          <button className="redaktion-logout-button" onClick={logout} type="button">
            {t('navigation.logout')}
          </button>
        </nav>
        <div className="redaktion-hero">
          <h1 className="redaktion-hero-title">{t('redaktion.title', 'Redaktion')}</h1>
          <p className="redaktion-hero-subtitle">{t('redaktion.subtitle', 'Verwaltung von Aufgaben, Belohnungen, Standorten und Umfragen')}</p>
        </div>
      </header>

      {mode === null && (
        <>
          {/* 1. Reihe: Aufgaben verwalten, Belohnungen verwalten */}
          <div className="redaktion-dashboard-grid">
            <DashboardCard
              icon="🗂️"
              title={t('redaktion.actions.manageTasks.title', 'Aufgaben verwalten')}
              description={t('redaktion.actions.manageTasks.description', 'Aufgaben durchsuchen, bearbeiten, aktivieren oder deaktivieren')}
              onClick={() => setMode('taskManage')}
            />
            <DashboardCard
              icon="🧾"
              title={t('redaktion.actions.manageRewards.title', 'Belohnungen verwalten')}
              description={t('redaktion.actions.manageRewards.description', 'Belohnungen durchsuchen, bearbeiten und verwalten')}
              onClick={() => setMode('rewardManage')}
            />
          </div>
          {/* 2. Reihe: Standorte verwalten, Umfrage-Analysen */}
          <div className="redaktion-dashboard-grid">
            <DashboardCard
              icon="🗺️"
              title={t('redaktion.actions.manageLocations.title', 'Standorte verwalten')}
              description={t('redaktion.actions.manageLocations.description', 'Standorte durchsuchen, bearbeiten oder entfernen')}
              onClick={() => setMode('locationManage')}
            />
            <DashboardCard
              icon="📊"
              title={t('redaktion.actions.surveyAnalytics.title', 'Umfrage-Analysen')}
              description={t('redaktion.actions.surveyAnalytics.description', 'Aggregierte Umfrageantworten mit visuellen Diagrammen und Statistiken anzeigen')}
              onClick={() => setMode('surveyAnalytics')}
            />
          </div>
        </>
      )}

      {mode === 'surveyAnalytics' && (
        <section className="redaktion-section">
          <header className="redaktion-section-header">
            <div>
              <h2>{t('redaktion.surveyAnalytics.title', 'Umfrage-Analysen')}</h2>
            </div>
            <div className="redaktion-actions">
              <button
                className="redaktion-icon-button"
                onClick={() => setMode(null)}
                title={t('common.actions.back', 'Zurück')}
                type="button"
              >
                <Icon name="back" />
                <span className="sr-only">{t('common.actions.back', 'Zurück')}</span>
              </button>
            </div>
          </header>
          <SurveyAnalytics />
        </section>
      )}

      {mode === 'locationManage' && (
        <section className="redaktion-section">
          <header className="redaktion-section-header">
            <div>
              <h2>{t('redaktion.locationManage.title', 'Standorte verwalten')}</h2>
              <p>{t('redaktion.locationManage.subtitle', 'Bestehende Standorte durchsuchen, bearbeiten oder entfernen')}</p>
            </div>
            <div className="redaktion-actions">
              <button
                className="redaktion-icon-button"
                onClick={() => refetchLocations()}
                title={t('common.actions.refresh', 'Aktualisieren')}
                type="button"
              >
                <Icon name="refresh" />
                <span className="sr-only">{t('common.actions.refresh', 'Aktualisieren')}</span>
              </button>
              <button
                className="redaktion-icon-button"
                onClick={() => setMode(null)}
                title={t('common.actions.back', 'Zurück')}
                type="button"
              >
                <Icon name="back" />
                <span className="sr-only">{t('common.actions.back', 'Zurück')}</span>
              </button>
            </div>
          </header>

          {locationsLoading && <p>{t('redaktion.locationManage.loading', 'Lade Standorte...')}</p>}
          {Boolean(locationsError) && (
            <p className="redaktion-error">{t('redaktion.locationManage.loadError', 'Fehler beim Laden der Standorte')}</p>
          )}

          <div className="redaktion-management-card">
            <div className="redaktion-management-top">
              <div>
                <h3>{t('redaktion.locationManage.existing.title', 'Bestehende Standorte')}</h3>
                <p>{t('redaktion.locationManage.existing.subtitle', 'Jede Aufgabe und Belohnung verweist auf einen dieser Standorte')}</p>
              </div>
              <div className="redaktion-management-controls">
                <label className="redaktion-toggle">
                  <input
                    type="checkbox"
                    className="redaktion-checkbox"
                    checked={includeInactiveLocations}
                    onChange={(event) => {
                      setIncludeInactiveLocations(event.target.checked);
                      setSelectedLocationIds([]);
                    }}
                  />
                  <span>{t('redaktion.locationManage.showInactive', 'Inaktive anzeigen')}</span>
                </label>
              </div>
            </div>

            <div className="redaktion-filters">
              <input
                type="text"
                placeholder={t('redaktion.locationManage.filterByName', 'Nach Name filtern...')}
                value={locationFilterName}
                onChange={(e) => setLocationFilterName(e.target.value)}
                className="redaktion-filter-input"
              />
              <select
                value={locationFilterStatus || ''}
                onChange={(e) => setLocationFilterStatus(e.target.value as 'active' | 'inactive' | null || null)}
                className="redaktion-filter-select"
              >
                <option value="">{t('redaktion.locationManage.filterAll', 'Alle Status')}</option>
                <option value="active">{t('redaktion.locationManage.filterActive', 'Aktiv')}</option>
                <option value="inactive">{t('redaktion.locationManage.filterInactive', 'Inaktiv')}</option>
              </select>
            </div>

            {filteredLocations.length === 0 ? (
              <p>{t('redaktion.locationManage.noLocations', 'Keine Standorte gefunden')}</p>
            ) : (
              <div className="redaktion-location-list">
                {filteredLocations.map((location: any) => (
                  <div key={location.id} className="redaktion-location-item">
                    <div className="redaktion-location-info">
                      <h4>{location.name || t('redaktion.locationManage.untitled', 'Unbenannter Standort')}</h4>
                      <p>{location.description || ''}</p>
                      <div className="redaktion-location-meta">
                        <span className={`redaktion-status-badge ${location.active ? 'active' : 'inactive'}`}>
                          {location.active ? t('redaktion.locationManage.active', 'Aktiv') : t('redaktion.locationManage.inactive', 'Inaktiv')}
                        </span>
                        {location.type === 'online' && (
                          <span className="redaktion-type-badge">{t('redaktion.locationManage.online', 'Online')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(mode === 'taskManage' || mode === 'rewardManage') && (
        <section className="redaktion-section">
          <header className="redaktion-section-header">
            <div>
              <h2>
                {mode === 'taskManage'
                  ? t('redaktion.actions.manageTasks.title', 'Aufgaben verwalten')
                  : t('redaktion.actions.manageRewards.title', 'Belohnungen verwalten')}
              </h2>
              <p>
                {mode === 'taskManage'
                  ? t('redaktion.taskManage.subtitle', 'Aufgaben durchsuchen, bearbeiten, aktivieren oder deaktivieren')
                  : t('redaktion.rewardManage.subtitle', 'Belohnungen durchsuchen, bearbeiten und verwalten')}
              </p>
            </div>
            <div className="redaktion-actions">
              <button
                className="redaktion-icon-button"
                onClick={() => setMode(null)}
                title={t('common.actions.back', 'Zurück')}
                type="button"
              >
                <Icon name="back" />
                <span className="sr-only">{t('common.actions.back', 'Zurück')}</span>
              </button>
            </div>
          </header>
          <div className="redaktion-info">
            <p>{t('redaktion.useAdminPage', 'Bitte verwenden Sie die Administrator-Seite für diese Funktion.')}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default RedaktionPage;
