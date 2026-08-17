import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/BrandLogo';

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
    institutionSlug: '',
    departmentId: '',
    studentId: '',
    department: '',
    batch: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const selectedInstitution = institutions.find((item) => item.slug === form.institutionSlug) || (institutions.length === 1 ? institutions[0] : null);
  const registrationUnavailable = Boolean(selectedInstitution && !selectedInstitution.departments?.length);

  useEffect(() => {
    apiFetch('/api/auth/registration-options').then((response) => {
      const options = response.data || [];
      setInstitutions(options);
      if (options.length === 1) setForm((current) => ({ ...current, institutionSlug: options[0].slug }));
    }).catch(() => setInstitutions([]));
  }, []);

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
          institutionSlug: form.institutionSlug || undefined,
          departmentId: form.departmentId || undefined,
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
        <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/30 bg-white p-2 shadow-md shadow-primary/10 dark:border-white/10 dark:bg-[#11131a] dark:shadow-primary/15">
          <BrandLogo compact className="h-full w-full" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-on-surface">Complete your profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">Google has verified your email. Add the academic details your workspace needs.</p>

        {onboarding?.email && <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm text-secondary"><span className="material-symbols-outlined text-base">verified</span><span className="truncate">{onboarding.email}</span></p>}
        {error && <p role="alert" className="mt-5 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm leading-relaxed text-error">{error}</p>}

        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          {institutions.length > 0 && (
            <label className="block text-sm font-bold text-on-surface sm:col-span-2">
              Institution
              <select required name="institutionSlug" value={form.institutionSlug} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary">
                <option value="">Choose your institution</option>
                {institutions.map((institution) => <option key={institution._id} value={institution.slug}>{institution.name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm font-bold text-on-surface sm:col-span-2">
            Full name
            <input required name="name" autoComplete="name" value={form.name} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="Your name" />
          </label>
          <label className="block text-sm font-bold text-on-surface">
            Student ID <span className="font-normal text-secondary">(optional)</span>
            <input name="studentId" value={form.studentId} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. 19-39123-1" />
          </label>
          <label className="block text-sm font-bold text-on-surface">
            Department {institutions.length === 0 && <span className="font-normal text-secondary">(optional)</span>}
            {selectedInstitution?.departments?.length ? (
              <select required name="departmentId" value={form.departmentId} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary">
                <option value="">Choose department</option>
                {selectedInstitution.departments.map((department) => <option key={department._id} value={department._id}>{department.name} ({department.code})</option>)}
              </select>
            ) : selectedInstitution ? (
              <span role="status" className="mt-2 block rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-3 font-normal">Registration opens after the institution adds its departments.</span>
            ) : (
              <input name="department" value={form.department} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. Computer Science" />
            )}
          </label>
          <label className="block text-sm font-bold text-on-surface sm:col-span-2">
            Batch / academic year <span className="font-normal text-secondary">(optional)</span>
            <input name="batch" value={form.batch} onChange={update} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none transition focus:border-primary" placeholder="e.g. Spring 2026" />
          </label>
          <button disabled={loading || !onboarding?.token || registrationUnavailable} className="sm:col-span-2 mt-2 w-full rounded-xl bg-primary px-4 py-3 font-bold text-on-primary transition hover:bg-primary-fixed-variant disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Creating your workspace…' : 'Finish account setup'}
          </button>
        </form>
        {!onboarding?.token && <p className="mt-5 text-center text-sm text-secondary">Start with <Link to="/register" className="font-bold text-primary hover:underline">Continue with Google</Link> to create a new secure setup session.</p>}
      </section>
    </main>
  );
};

export default CompleteGoogleProfile;
