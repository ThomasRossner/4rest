import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import './LoginPage.css';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'passwordless-login'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const verificationInProgressRef = useRef(false);
  const processedTokensRef = useRef<Set<string>>(new Set());

  const handleEmailVerification = async (token: string) => {
    // Prevent duplicate calls - check both ref and processed tokens
    if (verificationInProgressRef.current || processedTokensRef.current.has(token)) {
      return;
    }
    
    verificationInProgressRef.current = true;
    processedTokensRef.current.add(token);
    setLoading(true);
    setError('');
    try {
      await api.verifyEmail(token);
      setSuccess(t('login.messages.verificationSuccess'));
      setMode('login');
      // Clear token from URL
      navigate('/login', { replace: true });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setError(serverMsg || t('login.messages.verificationFailed'));
      // Remove from processed set on error so user can retry
      processedTokensRef.current.delete(token);
    } finally {
      setLoading(false);
      verificationInProgressRef.current = false;
    }
  };

  // Check for OAuth errors, verification tokens, or reset tokens in URL
  useEffect(() => {
    const urlError = searchParams.get('error');
    const verifyToken = searchParams.get('token');
    const resetTokenParam = searchParams.get('resetToken') || searchParams.get('token');
    const pathname = location.pathname;
    const isResetPasswordPath = pathname === '/reset-password';
    const isSetupPasswordPath = pathname === '/setup-password';
    const isVerifyEmailPath = pathname === '/verify-email';
    const isResetPasswordMode = searchParams.get('mode') === 'reset-password';

    if (urlError) {
      if (urlError === 'oauth_failed') {
        setError(t('login.messages.oauthFailed'));
      } else if (urlError === 'token_generation_failed') {
        setError(t('login.messages.oauthTokenFailed'));
      } else if (urlError === 'oauth_not_configured') {
        setError(t('login.messages.oauthNotConfigured'));
      } else {
        setError(t('login.messages.defaultError'));
      }
    } else if ((isResetPasswordPath || isResetPasswordMode) && resetTokenParam) {
      // Password reset token in URL
      setResetToken(resetTokenParam);
      setMode('reset-password');
    } else if (isSetupPasswordPath && resetTokenParam) {
      // Password setup token in URL
      setResetToken(resetTokenParam);
      setMode('reset-password');
    } else if (isVerifyEmailPath && verifyToken) {
      // Email verification token in URL
      handleEmailVerification(verifyToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.pathname, t]);

  const handleRequestCode = async () => {
    if (!email) {
      setError(t('login.messages.loginCodeRequested'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.requestLoginCode(email);
      setSuccess(t('login.messages.codeSent'));
      setCodeSent(true);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setError(serverMsg || t('login.messages.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else if (mode === 'passwordless-login') {
        if (!codeSent) {
          await handleRequestCode();
          return;
        }
        if (!loginCode) {
          setError(t('login.messages.loginCodeRequired'));
          setLoading(false);
          return;
        }
        const data = await api.loginWithCode(email, loginCode);
        if (data && data.token && data.user) {
          const store = useAuthStore.getState();
          store.setToken(data.token, data.user);
          navigate('/dashboard');
        }
      } else if (mode === 'register') {
        if (!name.trim()) {
          throw new Error(t('login.messages.nameRequired'));
        }
        await register(email, password, name);
        setSuccess(t('login.messages.accountCreated'));
        setMode('login');
        setEmail('');
        setPassword('');
        setName('');
      } else if (mode === 'forgot-password') {
        await api.forgotPassword(email);
        setSuccess(t('login.messages.resetLinkSent'));
        setEmail('');
      } else if (mode === 'reset-password') {
        if (!resetToken) {
          throw new Error(t('login.messages.missingResetToken'));
        }
        if (newPassword.length < 6) {
          throw new Error(t('login.messages.passwordTooShort'));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t('login.messages.passwordMismatch'));
        }
        await api.resetPassword(resetToken, newPassword);
        const isSetupPassword = location.pathname === '/setup-password';
        setSuccess(
          isSetupPassword ? t('login.messages.passwordSetup') : t('login.messages.passwordReset')
        );
        setMode('login');
        setResetToken(null);
        setNewPassword('');
        setConfirmPassword('');
        navigate('/login', { replace: true });
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      
      // Handle email verification error
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        const userEmail = err?.response?.data?.email || email;
        setError(t('login.messages.emailVerificationRequired', { email: userEmail }));
        // Still allow login but show the error
        // The backend will return 403, so login won't succeed
      } else if (errorCode === 'PASSWORD_SETUP_REQUIRED') {
        const userEmail = err?.response?.data?.email || email;
        setError(t('login.messages.passwordSetupRequired', { email: userEmail }));
        setSuccess(t('login.messages.passwordlessSetup'));
      } else {
        setError(
          serverMsg ||
            err?.message ||
            (mode === 'login'
              ? t('login.messages.loginFailed')
              : t('login.messages.requestFailed'))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `${apiBaseUrl}/auth/${provider}`;
  };

  const getModeTitle = () => {
    if (mode === 'reset-password' && location.pathname === '/setup-password') {
      return t('login.modes.reset-password.title');
    }
    if (mode === 'passwordless-login' && !codeSent) {
      return t('login.modes.passwordless-login.title');
    }
    return t(`login.modes.${mode}.title`);
  };

  const getSubmitButtonText = () => {
    if (loading) {
      return t('common.loading');
    }
    if (mode === 'login') return t('login.actions.signIn');
    if (mode === 'register') return t('login.actions.register');
    if (mode === 'forgot-password') return t('login.actions.sendReset');
    if (mode === 'reset-password') return t('login.actions.resetPassword');
    if (mode === 'passwordless-login') {
      return codeSent ? t('login.actions.signIn') : t('login.actions.getCode');
    }
    return t('login.actions.signIn');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-header-info">
            <span className="login-logo">🌳</span>
            <h1 style={{ whiteSpace: 'nowrap' }}>
              {t('common.appName', { defaultValue: 'Roots of Impact' })}
            </h1>
            <p>{getModeTitle()}</p>
          </div>
          <LanguageSwitcher compact className="login-language-switcher" />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}
          
          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="name">{t('login.fields.name')}</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t('login.placeholders.name')}
              />
            </div>
          )}
          
          {(mode === 'login' || mode === 'register' || mode === 'forgot-password' || mode === 'passwordless-login') && (
            <div className="login-field">
              <label htmlFor="email">{t('login.fields.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (mode === 'passwordless-login') {
                    setCodeSent(false);
                    setLoginCode('');
                  }
                }}
                required
                disabled={codeSent && mode === 'passwordless-login'}
                placeholder={t('login.placeholders.email')}
              />
            </div>
          )}
          
          {(mode === 'login' || mode === 'register') && (
            <div className="login-field">
              <label htmlFor="password">{t('login.fields.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('login.placeholders.password')}
              />
            </div>
          )}

          {mode === 'passwordless-login' && codeSent && (
            <div className="login-field">
              <label htmlFor="login-code">{t('login.fields.loginCode')}</label>
              <input
                id="login-code"
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder={t('login.placeholders.loginCode')}
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {t('login.passwordlessHint')}
              </p>
            </div>
          )}
          
          {mode === 'reset-password' && (
            <>
              <div className="login-field">
                <label htmlFor="new-password">{t('login.fields.newPassword')}</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('login.placeholders.password')}
                />
              </div>
              <div className="login-field">
                <label htmlFor="confirm-password">{t('login.fields.confirmPassword')}</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('login.placeholders.password')}
                />
              </div>
            </>
          )}
          
          <button type="submit" className="login-button" disabled={loading}>
            {getSubmitButtonText()}
          </button>
        </form>
        {mode === 'login' && (
          <>
            <div className="login-divider">
              <span>{t('login.divider')}</span>
            </div>
            <div className="social-login">
              <button
                type="button"
                className="social-login-button google-button"
                onClick={() => handleOAuthLogin('google')}
                title={t('login.social.google')}
                aria-label={t('login.social.google')}
              >
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button
                type="button"
                className="social-login-button facebook-button"
                onClick={() => handleOAuthLogin('facebook')}
                title={t('login.social.facebook')}
                aria-label={t('login.social.facebook')}
              >
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                type="button"
                className="social-login-button apple-button"
                onClick={() => handleOAuthLogin('apple')}
                title={t('login.social.apple')}
                aria-label={t('login.social.apple')}
              >
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button
                type="button"
                className="social-login-button github-button"
                onClick={() => handleOAuthLogin('github')}
                title={t('login.social.github')}
                aria-label={t('login.social.github')}
              >
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </div>
          </>
        )}
        
        <div className="login-footer">
          {mode === 'login' && (
            <>
              <p>
                {t('login.links.noAccount')}{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccess('');
                  }}
                >
                  {t('login.actions.register')}
                </button>
              </p>
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('forgot-password');
                    setError('');
                    setSuccess('');
                  }}
                >
                  {t('login.links.forgotPassword')}
                </button>
              </p>
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('passwordless-login');
                    setError('');
                    setSuccess('');
                    setCodeSent(false);
                    setLoginCode('');
                  }}
                >
                  {t('login.links.passwordless')}
                </button>
              </p>
            </>
          )}
          {mode === 'passwordless-login' && (
            <>
              {codeSent && (
                <p style={{ marginTop: 'var(--spacing-sm)' }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setCodeSent(false);
                      setLoginCode('');
                      setError('');
                      setSuccess('');
                    }}
                  >
                    {t('login.links.requestNewCode')}
                  </button>
                </p>
              )}
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                    setCodeSent(false);
                    setLoginCode('');
                  }}
                >
                  {t('login.links.backToPassword')}
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p>
              {t('login.links.alreadyHaveAccount')}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                {t('login.actions.signIn')}
              </button>
            </p>
          )}
          {mode === 'forgot-password' && (
            <p>
              {t('login.links.rememberPassword')}{' '}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                {t('login.actions.signIn')}
              </button>
            </p>
          )}
          {mode === 'reset-password' && (
            <p>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                  navigate('/login', { replace: true });
                }}
              >
                {t('login.links.backToLogin')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
