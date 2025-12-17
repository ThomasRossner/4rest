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

function ProtectedApp() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
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
