import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to login with error
      navigate(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Set token and fetch user data
      setToken(token);
      // Refresh user data from server
      api.refreshMe()
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch user data:', err);
          navigate('/login?error=failed_to_load_user');
        });
    } else {
      // No token, redirect to login
      navigate('/login?error=no_token');
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div>{t('login.messages.authenticating')}</div>
    </div>
  );
}

export default AuthCallbackPage;

