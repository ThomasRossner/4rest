import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import './LoginPage.css';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
      setSuccess('Email verified successfully! You can now sign in.');
      setMode('login');
      // Clear token from URL
      navigate('/login', { replace: true });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setError(serverMsg || 'Email verification failed. The link may have expired.');
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
        setError('Social authentication failed. Please try again.');
      } else if (urlError === 'token_generation_failed') {
        setError('Authentication succeeded but token generation failed. Please try again.');
      } else if (urlError === 'oauth_not_configured') {
        setError('Social login is not configured. Please use email/password login.');
      } else {
        setError('An error occurred during authentication.');
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
  }, [searchParams, location.pathname]);

  const handleRequestCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.requestLoginCode(email);
      setSuccess('If an account exists with this email, a login code has been sent.');
      setCodeSent(true);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setError(serverMsg || 'Failed to send login code');
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
          setError('Please enter the login code');
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
          throw new Error('Please enter your name');
        }
        await register(email, password, name);
        setSuccess('Account created successfully! Please check your email to verify your account.');
        setMode('login');
        setEmail('');
        setPassword('');
        setName('');
      } else if (mode === 'forgot-password') {
        await api.forgotPassword(email);
        setSuccess('If an account exists with this email, a password reset link has been sent.');
        setEmail('');
      } else if (mode === 'reset-password') {
        if (!resetToken) {
          throw new Error('Reset token is missing');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await api.resetPassword(resetToken, newPassword);
        const isSetupPassword = location.pathname === '/setup-password';
        setSuccess(isSetupPassword 
          ? 'Password set successfully! You can now sign in with your email and password.'
          : 'Password reset successfully! You can now sign in with your new password.');
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
        setError(
          `Email verification required. Please check your inbox (${userEmail}) for the verification link. ` +
          `If you didn't receive it, you can request a new one after signing in.`
        );
        // Still allow login but show the error
        // The backend will return 403, so login won't succeed
      } else if (errorCode === 'PASSWORD_SETUP_REQUIRED') {
        const userEmail = err?.response?.data?.email || email;
        setError(
          `This account uses passwordless login. A password setup link has been sent to ${userEmail}. ` +
          `Please check your inbox and click the link to set a password.`
        );
        setSuccess('Password setup email sent! Please check your inbox.');
      } else {
        setError(serverMsg || err?.message || (mode === 'login' ? 'Invalid email or password' : 'Operation failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `${apiBaseUrl}/auth/${provider}`;
  };

  const getModeTitle = () => {
    const isSetupPassword = location.pathname === '/setup-password';
    switch (mode) {
      case 'login':
        return 'Sign in to continue';
      case 'register':
        return 'Create your account';
      case 'forgot-password':
        return 'Reset your password';
      case 'reset-password':
        return isSetupPassword ? 'Set your password' : 'Set new password';
      case 'passwordless-login':
        return codeSent ? 'Enter your login code' : 'Sign in with email code';
      default:
        return 'Sign in to continue';
    }
  };

  const getSubmitButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'login':
          return 'Signing in...';
        case 'register':
          return 'Creating account...';
        case 'forgot-password':
          return 'Sending...';
        case 'reset-password':
          return 'Resetting...';
        case 'passwordless-login':
          return codeSent ? 'Signing in...' : 'Sending code...';
        default:
          return 'Loading...';
      }
    }
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'forgot-password':
        return 'Send Reset Link';
      case 'reset-password':
        return 'Reset Password';
      case 'passwordless-login':
        return codeSent ? 'Sign In' : 'Get Code';
      default:
        return 'Submit';
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-logo">🌳</span>
          <h1>Roots of Impact</h1>
          <p>{getModeTitle()}</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}
          
          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your Name"
              />
            </div>
          )}
          
          {(mode === 'login' || mode === 'register' || mode === 'forgot-password' || mode === 'passwordless-login') && (
            <div className="login-field">
              <label htmlFor="email">Email</label>
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
                placeholder="your@email.com"
              />
            </div>
          )}
          
          {(mode === 'login' || mode === 'register') && (
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          )}

          {mode === 'passwordless-login' && codeSent && (
            <div className="login-field">
              <label htmlFor="login-code">Login Code</label>
              <input
                id="login-code"
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Enter the 6-digit code sent to your email
              </p>
            </div>
          )}
          
          {mode === 'reset-password' && (
            <>
              <div className="login-field">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <div className="login-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
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
              <span>or</span>
            </div>
            <div className="social-login">
              <button type="button" className="social-login-button google-button" onClick={() => handleOAuthLogin('google')}>
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button type="button" className="social-login-button facebook-button" onClick={() => handleOAuthLogin('facebook')}>
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
              <button type="button" className="social-login-button apple-button" onClick={() => handleOAuthLogin('apple')}>
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
              <button type="button" className="social-login-button github-button" onClick={() => handleOAuthLogin('github')}>
                <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>
          </>
        )}
        
        <div className="login-footer">
          {mode === 'login' && (
            <>
              <p>
                Don't have an account?{' '}
                <button type="button" className="link-button" onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>
                  Register
                </button>
              </p>
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button type="button" className="link-button" onClick={() => { setMode('forgot-password'); setError(''); setSuccess(''); }}>
                  Forgot your password?
                </button>
              </p>
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button type="button" className="link-button" onClick={() => { 
                  setMode('passwordless-login'); 
                  setError(''); 
                  setSuccess(''); 
                  setCodeSent(false);
                  setLoginCode('');
                }}>
                  Sign in with email code
                </button>
              </p>
            </>
          )}
          {mode === 'passwordless-login' && (
            <>
              {codeSent && (
                <p style={{ marginTop: 'var(--spacing-sm)' }}>
                  <button type="button" className="link-button" onClick={() => { 
                    setCodeSent(false);
                    setLoginCode('');
                    setError('');
                    setSuccess('');
                  }}>
                    Request a new code
                  </button>
                </p>
              )}
              <p style={{ marginTop: 'var(--spacing-sm)' }}>
                <button type="button" className="link-button" onClick={() => { 
                  setMode('login'); 
                  setError(''); 
                  setSuccess(''); 
                  setCodeSent(false);
                  setLoginCode('');
                }}>
                  Back to password login
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <button type="button" className="link-button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot-password' && (
            <p>
              Remember your password?{' '}
              <button type="button" className="link-button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Sign in
              </button>
            </p>
          )}
          {mode === 'reset-password' && (
            <p>
              <button type="button" className="link-button" onClick={() => { setMode('login'); setError(''); setSuccess(''); navigate('/login', { replace: true }); }}>
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
