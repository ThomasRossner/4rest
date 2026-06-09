import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import Layout from '../Layout/Layout';
import HomePage from '../../pages/HomePage/HomePage';
import TasksPage from '../../pages/TasksPage/TasksPage';
import ForestPage from '../../pages/ForestPage/ForestPage';
import ForestLabPage from '../../pages/ForestLabPage/ForestLabPage';
import TreeSystemAppDemoPage from '../../pages/TreeSystemAppDemoPage/TreeSystemAppDemoPage';
import RewardsPage from '../../pages/RewardsPage/RewardsPage';
import StatisticsPage from '../../pages/StatisticsPage/StatisticsPage';
import GroupsPage from '../../pages/GroupsPage/GroupsPage';
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
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [bootReady, setBootReady] = useState(false);
  const [bootFailed, setBootFailed] = useState(false);
  const [bootAuthFailed, setBootAuthFailed] = useState(false);
  const liveUser = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.refreshMe({ strict: true });
      } catch (error) {
        if (!cancelled) {
          const authFailed = axios.isAxiosError(error) && error.response?.status === 401;
          if (authFailed) {
            logout();
            setBootAuthFailed(true);
          }
          setBootFailed(true);
        }
      } finally {
        if (!cancelled) setBootReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

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
        {bootAuthFailed ? (
          <button
            type="button"
            className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/login?session=expired', { replace: true })}
          >
            {t('navigation.logout')}
          </button>
        ) : (
          <button
            type="button"
            className="player-profile-onboarding__btn player-profile-onboarding__btn--primary"
            style={{ marginTop: 12 }}
            onClick={() => window.location.reload()}
          >
            {t('common.actions.refresh')}
          </button>
        )}
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
        <Route path="tree-system-app" element={<TreeSystemAppDemoPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="groups" element={<GroupsPage />} />
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
