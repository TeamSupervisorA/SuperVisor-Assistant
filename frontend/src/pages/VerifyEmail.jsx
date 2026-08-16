import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const initialEmail = useMemo(() => params.get('email') || sessionStorage.getItem('pendingVerificationEmail') || '', [params]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(initialEmail
    ? 'We sent a six-digit verification code to your email address.'
    : 'Enter the email address you used to sign up, then enter the code from your inbox.');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    if (!email) {
      setError('Enter the email address you used to sign up.');
      return;
    }
    if (code.length !== 6) {
      setError('Enter the six-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch('/api/auth/register/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code })
      });
      if (!result?.token || !result?.user) throw new Error('The server did not return a valid account session.');
      sessionStorage.removeItem('pendingVerificationEmail');
      login(result.token, result.user);
      navigate(roleHome[result.user.role] || '/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'Unable to verify this code.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    if (!email) {
      setError('Enter the email address you used to sign up.');
      return;
    }
    setResending(true);
    try {
      const result = await apiFetch('/api/auth/register/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      setMessage(result.message || 'If the registration is pending, a new verification code has been sent.');
      setCooldown(30);
    } catch (requestError) {
      setError(requestError.message || 'Unable to resend the verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-5">
      <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-tertiary-container/20 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-outline-variant/30 bg-surface/90 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
        <Link to="/register" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">← Back to registration</Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-on-surface">Verify your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Enter the code sent to your inbox to activate your account.</p>

        {message && <p role="status" className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm leading-relaxed text-on-surface">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm leading-relaxed text-error">{error}</p>}

        <form className="mt-6 space-y-5" onSubmit={handleVerify}>
          <label className="block text-sm font-bold text-on-surface">
            Email address
            <input
              required
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary"
              placeholder="name@university.edu"
            />
          </label>
          <label className="block text-sm font-bold text-on-surface">
            Six-digit code
            <input
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              value={code}
              onChange={handleCodeChange}
              className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 text-center font-mono text-xl font-bold tracking-[0.45em] outline-none transition focus:border-primary"
              placeholder="123456"
              aria-describedby="verification-help"
            />
          </label>
          <p id="verification-help" className="text-xs leading-relaxed text-secondary">The code expires shortly. Keep this page open while you check your inbox and spam folder.</p>
          <button disabled={loading || code.length !== 6} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-on-primary transition hover:bg-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Verifying…' : 'Verify email and activate account'}
          </button>
        </form>

        <div className="mt-6 border-t border-outline-variant/30 pt-5 text-center text-sm text-secondary">
          Didn’t receive a code?{' '}
          <button type="button" disabled={resending || cooldown > 0} onClick={resendCode} className="font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60">
            {resending ? 'Sending…' : cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </section>
    </main>
  );
};

export default VerifyEmail;
