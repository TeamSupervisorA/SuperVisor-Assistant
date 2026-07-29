import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try {
      const result = await apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setMessage(result.message);
    } catch (requestError) { setError(requestError.message || 'Unable to request a password reset.'); }
    finally { setLoading(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-background p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-outline-variant/30 bg-surface p-8 shadow-xl"><Link to="/login" className="text-sm font-bold text-primary">← Back to sign in</Link><h1 className="mt-6 text-3xl font-extrabold text-on-surface">Reset password</h1><p className="mt-2 text-sm leading-relaxed text-secondary">Enter the email linked to your account. We will send a one-time reset link.</p>{message && <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-error/10 p-3 text-sm text-error">{error}</p>}<label className="mt-6 block text-sm font-bold text-on-surface">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 outline-none focus:border-primary" placeholder="name@university.edu" /></label><button disabled={loading} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-bold text-on-primary disabled:opacity-60">{loading ? 'Sending…' : 'Send reset link'}</button></form></main>;
};

export default ForgotPassword;
