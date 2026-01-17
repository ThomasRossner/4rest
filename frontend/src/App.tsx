import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout/Layout';
import { ToastContainer } from './components/Feedback/ToastContainer';
import HomePage from './pages/HomePage/HomePage';
import TasksPage from './pages/TasksPage/TasksPage';
import ForestPage from './pages/ForestPage/ForestPage';
import RewardsPage from './pages/RewardsPage/RewardsPage';
import StatisticsPage from './pages/StatisticsPage/StatisticsPage';
import AdminPage from './pages/Admin/AdminPage';
import LoginPage from './pages/LoginPage/LoginPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage/AuthCallbackPage';
import PointsBonusPage from './pages/Employee/PointsBonusPage';
import ContestRankingPage from './pages/ContestRankingPage/ContestRankingPage';
import EmployeeContestsPage from './pages/EmployeeContestsPage/EmployeeContestsPage';
import RezeptionPage from './pages/Rezeption/RezeptionPage';
import RedaktionPage from './pages/Redaktion/RedaktionPage';

function ProtectedApp() {
  const { isAuthenticated, user, token } = useAuthStore();

  // Ensure we redirect to login if not authenticated
  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'administrator') {
    return (
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user.role === 'rezeption') {
    return (
      <Routes>
        <Route path="/" element={<RezeptionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user.role === 'redaktion') {
    return (
      <Routes>
        <Route path="/" element={<RedaktionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="forest" element={<ForestPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="contests/:contestId" element={<ContestRankingPage />} />
        {(user.role === 'rezeption' || user.role === 'administrator') && (
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

function App() {
  // Clear invalid auth state on mount if needed
  React.useEffect(() => {
    const { user, token, isAuthenticated } = useAuthStore.getState();
    // If isAuthenticated is true but user or token is missing, clear the state
    if (isAuthenticated && (!user || !token)) {
      console.log('[App] Clearing invalid auth state');
      useAuthStore.getState().logout();
    }
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<LoginPage />} />
        <Route path="/setup-password" element={<LoginPage />} />
        <Route path="/verify-email" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Router>
  );
}

export default App;
