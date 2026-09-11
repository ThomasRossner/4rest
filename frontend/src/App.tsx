import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './stores/authStore';
import { api } from './services/api';
import i18n from './i18n';
import { ToastContainer } from './components/Feedback/ToastContainer';
import AdminPage from './pages/Admin/AdminPage';
import LoginPage from './pages/LoginPage/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage/AuthCallbackPage';
import RezeptionPage from './pages/Rezeption/RezeptionPage';
import RedaktionPage from './pages/Redaktion/RedaktionPage';
import GuestAppWithProfileGate from './components/PlayerProfile/GuestAppWithProfileGate';
import PrivacyPage from './pages/PrivacyPage/PrivacyPage';
import PublicTaskPage from './pages/PublicTaskPage/PublicTaskPage';
import PublicGuestLandingPage from './pages/PublicGuestLandingPage/PublicGuestLandingPage';

/** Synchronisiert `<html lang>` mit i18n (Ticket 042: Sprache vs. Dokument). */
function DocumentLangSync() {
  useEffect(() => {
    const apply = () => {
      const primary = (i18n.language || 'de').split('-')[0];
      document.documentElement.lang = primary === 'en' ? 'en' : 'de';
    };
    apply();
    i18n.on('languageChanged', apply);
    return () => {
      i18n.off('languageChanged', apply);
    };
  }, []);
  return null;
}

function ProtectedApp() {
  const { isAuthenticated, user, token } = useAuthStore();

  // Sync UI language to user's preferred language
  useEffect(() => {
    if (user?.preferredLanguage && user.preferredLanguage !== i18n.language) {
      i18n.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage]);

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

  return <GuestAppWithProfileGate user={user} />;
}

function App() {
  // Clear invalid auth state on mount if needed
  React.useEffect(() => {
    const { user, token, isAuthenticated, logout } = useAuthStore.getState();
    if (isAuthenticated && (!user || !token)) {
      console.log('[App] Clearing invalid auth state');
      logout();
      return;
    }
    if (!isAuthenticated || !token || !user) return;

    void api.refreshMe({ strict: true }).catch((error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.warn('[App] Session expired');
        logout();
      }
    });
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <DocumentLangSync />
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/reset-password" element={<LoginPage />} />
        <Route path="/setup-password" element={<LoginPage />} />
        <Route path="/verify-email" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/public/guest" element={<PublicGuestLandingPage />} />
        <Route path="/public/task/:taskId" element={<PublicTaskPage />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Router>
  );
}

export default App;
