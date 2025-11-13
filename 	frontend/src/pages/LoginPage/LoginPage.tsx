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
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    const isVerifyEmailPath = pathname === '/verify-email';
    const isResetPasswordMode = searchParams.get('mode') === 'reset-password';

    if (urlError) {
      if (urlError === 'oauth_failed') {
        setError('GitHub authentication failed. Please try again.');
      } else if (urlError === 'token_generation_failed') {
        setError('Authentication succeeded but token generation failed. Please try again.');
      } else if (urlError === 'oauth_not_configured') {
        setError('GitHub OAuth is not configured. Please use email/password login.');
      } else {
        setError('An error occurred during authentication.');
      }
    } else if ((isResetPasswordPath || isResetPasswordMode) && resetTokenParam) {
      // Password reset token in URL
      setResetToken(resetTokenParam);
      setMode('reset-password');
    } else if (isVerifyEmailPath && verifyToken) {
      // Email verification token in URL
      handleEmailVerification(verifyToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
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
        setSuccess('Password reset successfully! You can now sign in with your new password.');
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
      } else {
        setError(serverMsg || err?.message || (mode === 'login' ? 'Invalid email or password' : 'Operation failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = `${apiBaseUrl}/auth/github`;
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to continue';
      case 'register':
        return 'Create your account';
      case 'forgot-password':
        return 'Reset your password';
      case 'reset-password':
        return 'Set new password';
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
          
          {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              <button type="button" className="social-login-button github-button" onClick={handleGitHubLogin}>
                <svg className="github-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
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
