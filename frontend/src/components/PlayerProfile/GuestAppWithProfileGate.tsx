import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import Layout from '../Layout/Layout';
import HomePage from '../../pages/HomePage/HomePage';
import TasksPage from '../../pages/TasksPage/TasksPage';
import ForestPage from '../../pages/ForestPage/ForestPage';
import ForestLabPage from '../../pages/ForestLabPage/ForestLabPage';
import RewardsPage from '../../pages/RewardsPage/RewardsPage';
import StatisticsPage from '../../pages/StatisticsPage/StatisticsPage';
import ProfilePage from '../../pages/ProfilePage/ProfilePage';
import PointsBonusPage from '../../pages/Employee/PointsBonusPage';
import ContestRankingPage from '../../pages/ContestRankingPage/ContestRankingPage';
import EmployeeContestsPage from '../../pages/EmployeeContestsPage/EmployeeContestsPage';
import PlayerProfileOnboarding from './PlayerProfileOnboarding';
import type { User } from '../../stores/authStore';


type Props = {
  user: User;
};

/**
 * Lädt /users/me (inkl. playerProfile), zeigt bei pending die Spielerprofilierung Vollbild.
 */
export default function GuestAppWithProfileGate({ user }: Props) {
  const { t } = useTranslation();
  const [bootReady, setBootReady] = useState(false);
  const [bootFailed, setBootFailed] = useState(false);
  const liveUser = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.refreshMe();
      } catch {
        if (!cancelled) setBootFailed(true);
      } finally {
        if (!cancelled) setBootReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bootReady) {
    return (
      <div className="player-profile-boot">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (bootFailed) {
    return (
      <div className="player-profile-boot">
        <p>{t('playerProfile.error.loadProfile')}</p>
        <button
          type="button"
          className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
          style={{ marginTop: 12 }}
          onClick={() => window.location.reload()}
        >
          {t('common.actions.refresh')}
        </button>
      </div>
    );
  }

  const u = liveUser ?? user;
  const needsPlayerProfile =
    u.role === 'guest' && u.playerProfile?.status === 'pending';

  if (needsPlayerProfile) {
    return <PlayerProfileOnboarding />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/c/:categoryKey" element={<TasksPage />} />
        <Route path="forest" element={<ForestPage />} />
        <Route path="forest-lab" element={<ForestLabPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="contests/:contestId" element={<ContestRankingPage />} />
        {(u.role === 'rezeption' || u.role === 'administrator') && (
          <>
            <Route path="points-bonus" element={<PointsBonusPage />} />
            <Route path="employee-contests" element={<EmployeeContestsPage />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
