import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const readOnboarding = () => {
  try {
    return JSON.parse(sessionStorage.getItem('googleOnboarding') || 'null');
  } catch {
    sessionStorage.removeItem('googleOnboarding');
    return null;
  }
};

const CompleteGoogleProfile = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const onboarding = useMemo(readOnboarding, []);
  const [form, setForm] = useState({
    name: onboarding?.name || '',
    studentId: '',
    department: '',
    batch: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!onboarding?.token) {
      setError('Your secure Google sign-up session has expired. Please start again.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch('/api/auth/google/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          registrationToken: onboarding.token,
          name: form.name.trim(),
          studentId: form.studentId.trim() || undefined,
          department: form.department.trim() || undefined,
          batch: form.batch.trim() || undefined
        })
      });
      if (!result?.token || !result?.user) throw new Error('The server did not return a valid account session.');
      sessionStorage.removeItem('googleOnboarding');
      login(result.token, result.user);
      navigate(roleHome[result.user.role] || '/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'Unable to finish your Google sign-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background p-5">
      <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-tertiary-container/20 blur-3xl" />
      <section className="relative w-full max-w-2xl rounded-[2rem] border border-outline-variant/30 bg-surface/90 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
        <Link to="/register" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">← Back to sign up</Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[28px]">school</span>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-on-surface">Complete your profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Google has verified your email. Add the academic details your workspace needs.</p>

        {onboarding?.email && <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm text-secondary"><span className="material-symbols-outlined text-base">verified</span><span className="truncate">{onboarding.email}</span></p>}
        {error && <p role="alert" className="mt-5 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm leading-relaxed text-error">{error}</p>}

        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <label className="block text-sm font-bold text-on-surface sm:col-span-2">
            Full name
            <input required name="name" autoComplete="name" value={form.name} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="Your name" />
          </label>
          <label className="block text-sm font-bold text-on-surface">
            Student ID <span className="font-normal text-secondary">(optional)</span>
            <input name="studentId" value={form.studentId} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. 19-39123-1" />
          </label>
          <label className="block text-sm font-bold text-on-surface">
            Department <span className="font-normal text-secondary">(optional)</span>
            <input name="department" value={form.department} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. Computer Science" />
          </label>
          <label className="block text-sm font-bold text-on-surface sm:col-span-2">
            Batch / academic year <span className="font-normal text-secondary">(optional)</span>
            <input name="batch" value={form.batch} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. Spring 2026" />
          </label>
          <button disabled={loading || !onboarding?.token} className="sm:col-span-2 mt-2 w-full rounded-xl bg-primary px-4 py-3 font-bold text-on-primary transition hover:bg-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Creating your workspace…' : 'Finish account setup'}
          </button>
        </form>
        {!onboarding?.token && <p className="mt-5 text-center text-sm text-secondary">Start with <Link to="/register" className="font-bold text-primary hover:underline">Continue with Google</Link> to create a new secure setup session.</p>}
      </section>
    </main>
  );
};

export default CompleteGoogleProfile;
