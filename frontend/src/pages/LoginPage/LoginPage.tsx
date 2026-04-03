import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import './LoginPage.css';
import { resolveApiBaseUrl } from '../../utils/resolveApiBaseUrl';

const apiBaseUrl = resolveApiBaseUrl();

const REGISTER_DRAFT_STORAGE_KEY = '4rest_register_draft';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'passwordless-login'>(() => {
    if (typeof window === 'undefined') return 'login';
    const p = new URLSearchParams(window.location.search);
    if (p.get('mode') === 'register') return 'register';
    if (p.get('team') || p.get('contest')) return 'register';
    return 'login';
  });
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
  const [teamRegistrationToken, setTeamRegistrationToken] = useState<string | null>(null);
  const [contestRegistrationToken, setContestRegistrationToken] = useState<string | null>(null);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const saveRegisterDraft = useCallback(() => {
    if (mode !== 'register') return;
    try {
      sessionStorage.setItem(
        REGISTER_DRAFT_STORAGE_KEY,
        JSON.stringify({
          email,
          password,
          name,
          acceptPrivacy,
          teamRegistrationToken,
          contestRegistrationToken,
        })
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [mode, email, password, name, acceptPrivacy, teamRegistrationToken, contestRegistrationToken]);

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
    
    // Check for team/contest registration tokens
    const teamToken = searchParams.get('team');
    const contestToken = searchParams.get('contest');
    if (teamToken) {
      setTeamRegistrationToken(teamToken);
      setMode('register'); // Automatically switch to register mode
    }
    if (contestToken) {
      setContestRegistrationToken(contestToken);
      setMode('register'); // Automatically switch to register mode
    }

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

  /** Entwurf nach Klick auf „Datenschutzhinweise“ und Rückkehr über /login?mode=register wiederherstellen. */
  useEffect(() => {
    if (searchParams.get('mode') !== 'register') return;
    setMode('register');
    const raw = sessionStorage.getItem(REGISTER_DRAFT_STORAGE_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw) as Record<string, unknown>;
        if (typeof d.email === 'string') setEmail(d.email);
        if (typeof d.password === 'string') setPassword(d.password);
        if (typeof d.name === 'string') setName(d.name);
        if (typeof d.acceptPrivacy === 'boolean') setAcceptPrivacy(d.acceptPrivacy);
        const team =
          searchParams.get('team') ??
          (typeof d.teamRegistrationToken === 'string' ? d.teamRegistrationToken : null);
        const contest =
          searchParams.get('contest') ??
          (typeof d.contestRegistrationToken === 'string' ? d.contestRegistrationToken : null);
        if (team) setTeamRegistrationToken(team);
        if (contest) setContestRegistrationToken(contest);
      } catch {
        /* ignore */
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete('mode');
    const qs = next.toString();
    navigate(`/login${qs ? `?${qs}` : ''}`, { replace: true });
  }, [searchParams, navigate]);

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
        try {
          await login(email, password);
          navigate('/dashboard');
        } catch (loginError: any) {
          const serverMsg = loginError?.response?.data?.error || loginError?.response?.data?.message;
          setError(serverMsg || loginError?.message || t('login.messages.loginFailed'));
          setLoading(false);
          return;
        }
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
        if (password.length < 6) {
          throw new Error(t('login.messages.passwordTooShort'));
        }
        if (!acceptPrivacy) {
          setError(t('login.messages.privacyRequired'));
          setLoading(false);
          return;
        }
        try {
          await register(
            email,
            password,
            name,
            'guest',
            'explorer',
            teamRegistrationToken || undefined,
            contestRegistrationToken || undefined,
            i18n.language === 'en' ? 'en' : 'de',
            true
          );
          try {
            sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          await api.refreshMe();
          setTeamRegistrationToken(null);
          setContestRegistrationToken(null);
          navigate('/dashboard', { replace: true });
        } catch (registerError: any) {
          // Handle validation errors from backend
          if (registerError?.response?.data?.details) {
            const validationErrors = registerError.response.data.details;
            const errorMessages = validationErrors.map((err: any) => {
              const field = err.path?.join('.') || 'field';
              return `${field}: ${err.message}`;
            }).join(', ');
            throw new Error(errorMessages || registerError?.response?.data?.error || t('login.messages.registrationFailed'));
          }
          throw registerError;
        }
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
      
      // Handle validation errors with details
      if (err?.response?.data?.details && Array.isArray(err.response.data.details)) {
        const validationErrors = err.response.data.details;
        const errorMessages = validationErrors.map((validationErr: any) => {
          const field = validationErr.path?.join('.') || 'field';
          const message = validationErr.message || 'Invalid value';
          // Translate common field names
          const fieldName = field === 'email' ? t('login.fields.email') : 
                           field === 'password' ? t('login.fields.password') :
                           field === 'name' ? t('login.fields.name') : field;
          return `${fieldName}: ${message}`;
        }).join('\n');
        setError(errorMessages || serverMsg || t('login.messages.validationError'));
      }
      // Handle email verification error
      else if (errorCode === 'EMAIL_NOT_VERIFIED') {
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
              : mode === 'register'
              ? t('login.messages.registrationFailed')
              : t('login.messages.requestFailed'))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // OAuth login disabled - only email/password login is available
  // const handleOAuthLogin = (provider: string) => {
  //   window.location.href = `${apiBaseUrl}/auth/${provider}`;
  // };

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
      return 'loading..';
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
            <div className="login-logo-row">
              <h1
                className="login-brand-title"
                aria-label={t('common.appName', { defaultValue: '4rest' })}
              >
                <img
                  src="/app-icon-128.png"
                  alt=""
                  className="login-logo"
                  aria-hidden
                />
                <span className="login-brand-title__rest">
                  {t('common.appNameRest', { defaultValue: 'rest' })}
                </span>
              </h1>
            </div>
          </div>
          <div className="login-header-eu">
            <img
              src="/eu-logo.png"
              alt="Co-funded by the European Union"
              className="eu-funding-logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.eu-logo-svg')) {
                  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svg.setAttribute('class', 'eu-logo-svg');
                  svg.setAttribute('viewBox', '0 0 200 100');
                  svg.setAttribute('width', '140');
                  svg.setAttribute('height', '70');

                  const flag = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                  flag.setAttribute('x', '0');
                  flag.setAttribute('y', '0');
                  flag.setAttribute('width', '200');
                  flag.setAttribute('height', '60');
                  flag.setAttribute('fill', '#003399');
                  svg.appendChild(flag);

                  const centerX = 100;
                  const centerY = 30;
                  const radius = 20;
                  for (let i = 0; i < 12; i++) {
                    const angle = ((i * 30 - 90) * Math.PI) / 180;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    star.setAttribute('points', `${x},${y} ${x - 2},${y - 6} ${x + 2},${y - 6}`);
                    star.setAttribute('fill', '#FFCC00');
                    star.setAttribute('transform', `rotate(${i * 30} ${x} ${y})`);
                    svg.appendChild(star);
                  }

                  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  text.setAttribute('x', '100');
                  text.setAttribute('y', '85');
                  text.setAttribute('text-anchor', 'middle');
                  text.setAttribute('fill', '#003399');
                  text.setAttribute('font-family', 'Arial, sans-serif');
                  text.setAttribute('font-size', '12');
                  text.textContent = 'Co-funded by the European Union';
                  svg.appendChild(text);

                  parent.appendChild(svg);
                }
              }}
            />
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

          {mode === 'register' && (
            <div className="login-field login-field--privacy">
              <label className="login-privacy-label">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                />
                <span>
                  <Trans
                    i18nKey="login.privacyCheckbox"
                    components={{
                      1: (
                        <Link to="/privacy" onClick={saveRegisterDraft} className="login-inline-link" />
                      ),
                    }}
                  />
                </span>
              </label>
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
          {mode === 'login' && (
            <Link to="/public/guest" className="login-button login-button--secondary">
              {t('login.guestTasksButton')}
            </Link>
          )}
        </form>
        
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
                  setAcceptPrivacy(false);
                  try {
                    sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
                  } catch {
                    /* ignore */
                  }
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
