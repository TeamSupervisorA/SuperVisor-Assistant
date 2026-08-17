import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

const supervisorIdOf = (project) => String(project?.supervisor?._id || project?.supervisor || '');

const ExploreProjects = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setActiveProject } = useAuth();
  const [projects, setProjects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState('');
  const [assigningId, setAssigningId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const searchQuery = new URLSearchParams(location.search).get('search') || '';
  const [searchText, setSearchText] = useState(searchQuery);
  const isStudent = user?.role === 'student';
  const isSupervisor = user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => { setSearchText(searchQuery); }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const search = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
        const response = await apiFetch(`/api/projects/explore${search}`);
        if (!cancelled) setProjects(response.data || []);
      } catch (requestError) {
        if (!cancelled) {
          setProjects([]);
          setError(requestError.message || 'Unable to load accessible projects.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProjects();
    return () => { cancelled = true; };
  }, [searchQuery]);

  useEffect(() => {
    if (!isAdmin) {
      setSupervisors([]);
      return undefined;
    }

    let cancelled = false;
    apiFetch('/api/admin/users')
      .then((response) => {
        if (!cancelled) {
          setSupervisors((response.data || []).filter((account) => account.role === 'supervisor' && account.status === 'active'));
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Unable to load active supervisor accounts.');
      });

    return () => { cancelled = true; };
  }, [isAdmin]);

  const submitSearch = (event) => {
    event.preventDefault();
    const nextSearch = searchText.trim();
    navigate(nextSearch ? `/explore?search=${encodeURIComponent(nextSearch)}` : '/explore');
  };

  const openProject = (project) => {
    setActiveProject(project);
    const pathByRole = { student: '/dashboard', supervisor: '/supervisor-dashboard', admin: '/admin-dashboard' };
    navigate(pathByRole[user?.role] || '/dashboard');
  };

  const replaceProject = (updatedProject) => {
    setProjects((current) => current.map((item) => item._id === updatedProject._id ? updatedProject : item));
  };

  const claimProject = async (project) => {
    if (!isSupervisor || claimingId) return;
    setClaimingId(project._id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`/api/projects/${project._id}/claim`, { method: 'POST', body: JSON.stringify({}) });
      replaceProject(response.data);
      setActiveProject(response.data);
      setNotice(`You are now supervising “${response.data.title}”. Open its workspace to add tasks and review work.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to claim this proposal.');
    } finally {
      setClaimingId('');
    }
  };

  const assignSupervisor = async (project) => {
    const supervisorId = assignments[project._id] ?? supervisorIdOf(project);
    if (!isAdmin || !supervisorId || assigningId) return;
    setAssigningId(project._id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`/api/projects/${project._id}/claim`, {
        method: 'POST',
        body: JSON.stringify({ supervisorId })
      });
      replaceProject(response.data);
      setAssignments((current) => ({ ...current, [project._id]: supervisorIdOf(response.data) || supervisorId }));
      const selected = supervisors.find((account) => account._id === supervisorId);
      setNotice(`${selected?.name || 'The selected supervisor'} is now assigned to “${response.data.title}”.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to assign this project.');
    } finally {
      setAssigningId('');
    }
  };

  const statusStyle = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return 'bg-primary/10 text-primary border-primary/20';
    if (normalized === 'completed') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300';
    return 'bg-tertiary/10 text-tertiary border-tertiary/20';
  };

  const pageIntro = isStudent
    ? 'Your projects and proposals. A proposal without a supervisor remains visible here while it awaits assignment.'
    : isSupervisor
      ? 'Your supervised projects. New projects appear after you accept an invitation or an administrator assigns them.'
      : 'Assign active supervisors to proposals, then open a project to review its institutional record.';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-5 py-7 md:px-10 md:py-10">
      <motion.div initial="hidden" animate="show" variants={containerVariants} className="mx-auto flex max-w-[1440px] flex-col gap-8">
        <motion.header variants={itemVariants} className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-primary">Project directory</span>
            <h1 className="mt-3 font-display text-[32px] font-black leading-none tracking-tight text-on-surface md:text-[42px]">{isStudent ? 'My projects' : isSupervisor ? 'Supervised projects' : 'All projects'}</h1>
            <p className="mt-2 max-w-2xl text-[16px] font-medium text-on-surface-variant">{searchQuery ? <>Search results for <span className="font-bold text-primary">“{searchQuery}”</span></> : pageIntro}</p>
          </div>
          <form onSubmit={submitSearch} className="relative w-full md:w-80">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-secondary">search</span>
            <input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search accessible projects" className="w-full rounded-xl border border-outline-variant/50 bg-surface px-4 py-3 pl-12 text-sm text-on-surface shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary" />
          </form>
        </motion.header>

        {error && <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 px-5 py-3 text-sm font-medium text-error">{error}</div>}
        {notice && <div role="status" className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-on-surface">{notice}</div>}

        {loading ? <div className="grid min-h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div> : projects.length === 0 ? <motion.div variants={itemVariants} className="mx-auto mt-8 max-w-2xl rounded-[32px] border border-outline-variant/30 bg-surface p-16 text-center shadow-sm"><span className="material-symbols-outlined text-[52px] text-outline">search_off</span><h2 className="mt-5 text-xl font-bold text-on-surface">No projects found</h2><p className="mt-2 text-sm text-secondary">Try a different search or create a proposal when you are ready to begin.</p></motion.div> : <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => {
          const unassigned = !project.supervisor;
          const canClaim = isSupervisor && unassigned;
          const selectedSupervisorId = assignments[project._id] ?? supervisorIdOf(project);
          const canApplyAssignment = Boolean(selectedSupervisorId) && selectedSupervisorId !== supervisorIdOf(project);
          return <motion.article key={project._id} variants={itemVariants} className="flex min-h-80 flex-col rounded-[30px] border border-outline-variant/30 bg-surface p-7 shadow-sm transition hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${statusStyle(project.status)}`}>{String(project.status || 'proposed').replace('_', ' ')}</span><span className="text-right text-[11px] font-semibold uppercase tracking-widest text-secondary">{project.createdAt ? new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span></div><h2 className="mt-6 text-xl font-bold leading-tight text-on-surface">{project.title}</h2><p className="mt-3 line-clamp-4 text-sm leading-relaxed text-secondary">{project.description || 'No problem statement has been provided yet.'}</p><div className="mt-6 rounded-xl bg-surface-container-low p-4 text-sm"><p className="font-semibold text-on-surface">{unassigned ? 'Awaiting supervisor assignment' : `Supervisor: ${project.supervisor?.name || 'Assigned'}`}</p><p className="mt-1 text-secondary">{isStudent && unassigned ? 'Your proposal is visible to supervisors for assignment. You can continue preparing its proposal draft.' : `${project.students?.length || 0} student member${(project.students?.length || 0) === 1 ? '' : 's'}`}</p></div>{isAdmin && <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3"><label className="block text-[11px] font-bold uppercase tracking-wider text-secondary" htmlFor={`supervisor-${project._id}`}>{unassigned ? 'Assign supervisor' : 'Reassign supervisor'}</label><div className="mt-2 flex gap-2"><select id={`supervisor-${project._id}`} value={selectedSupervisorId} onChange={(event) => setAssignments((current) => ({ ...current, [project._id]: event.target.value }))} className="min-w-0 flex-1 rounded-lg border border-outline-variant/50 bg-surface px-2 py-2 text-sm text-on-surface"><option value="">{supervisors.length ? 'Choose active supervisor' : 'No active supervisors available'}</option>{supervisors.map((account) => <option key={account._id} value={account._id}>{account.name}{account.department ? ` · ${account.department}` : ''}</option>)}</select><button type="button" onClick={() => assignSupervisor(project)} disabled={!canApplyAssignment || assigningId === project._id} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">{assigningId === project._id ? 'Saving…' : unassigned ? 'Assign' : 'Update'}</button></div></div>}<div className="mt-auto flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 pt-5">{canClaim && <button onClick={() => claimProject(project)} disabled={claimingId === project._id} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{claimingId === project._id ? 'Claiming…' : 'Claim proposal'}</button>}<button onClick={() => openProject(project)} className="inline-flex items-center gap-1 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10">Open workspace <span className="material-symbols-outlined text-[18px]">arrow_forward</span></button></div></motion.article>;
        })}</motion.div>}
      </motion.div>
    </div>
  );
};

export default ExploreProjects;
