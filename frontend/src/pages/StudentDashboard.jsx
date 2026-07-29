import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';

const ActionCard = ({ icon, label, value, detail, tone = 'primary', onClick }) => (
  <button onClick={onClick} className="group min-h-40 rounded-2xl border border-outline-variant/30 bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><div className={`grid size-10 place-items-center rounded-xl ${tone === 'error' ? 'bg-error/10 text-error' : tone === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}><span className="material-symbols-outlined">{icon}</span></div><span className="material-symbols-outlined text-secondary transition group-hover:translate-x-0.5 group-hover:text-primary">arrow_forward</span></div>
    <p className="mt-5 text-xs font-bold uppercase tracking-wider text-secondary">{label}</p><p className="mt-1 text-3xl font-black text-on-surface">{value}</p><p className="mt-1 text-sm text-secondary">{detail}</p>
  </button>
);

const StudentDashboard = () => {
  const { user, activeProject, setActiveProject } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [metricResult, projectResult] = await Promise.all([
          apiFetch('/api/dashboard/student'),
          apiFetch('/api/projects')
        ]);
        const nextProjects = projectResult.data || [];
        setMetrics(metricResult.data);
        setProjects(nextProjects);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load your workspace right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentProject = useMemo(() => projects.find((project) => project._id === activeProject?._id) || projects[0] || null, [activeProject?._id, projects]);
  const totalTasks = metrics?.totalTasks || 0;
  const completedTasks = metrics?.completedTasks || 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const chooseProject = (project, destination = '/tasks-milestones') => { setActiveProject(project); navigate(destination); };
  const needsProject = (destination) => currentProject ? chooseProject(currentProject, destination) : navigate('/create-new-work');

  return <main className="min-h-[calc(100vh-80px)] bg-background p-5 md:p-8 lg:p-10">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-primary">Student workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight text-on-surface md:text-4xl">Welcome back, {user?.name || 'Student'}</h1><p className="mt-2 text-secondary">Your next actions, project progress, and supervision work in one place.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => navigate('/create-new-work')} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary">New project</button><button onClick={() => needsProject('/paper-editor')} className="rounded-xl border border-outline-variant/50 bg-surface px-4 py-2.5 text-sm font-bold text-on-surface">Open paper editor</button></div></header>
      {error && <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Next action</p><h2 className="mt-1 text-xl font-extrabold text-on-surface">{loading ? 'Loading your work…' : metrics?.nextTask ? metrics.nextTask.title : currentProject ? 'Set your first task or milestone' : 'Create your first project'}</h2><p className="mt-1 text-sm text-secondary">{metrics?.nextTask?.dueDate ? `Due ${new Date(metrics.nextTask.dueDate).toLocaleDateString()}${metrics.nextTask.projectTitle ? ` · ${metrics.nextTask.projectTitle}` : ''}` : currentProject ? 'Keep the project moving by planning the next concrete task.' : 'Start with a project proposal, then add your team and milestones.'}</p></div><button onClick={() => metrics?.nextTask ? needsProject('/tasks-milestones') : currentProject ? needsProject('/tasks-milestones') : navigate('/create-new-work')} className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary">{metrics?.nextTask ? 'Open task' : currentProject ? 'Plan tasks' : 'Create project'}</button></div></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ActionCard icon="folder_open" label="Active projects" value={loading ? '—' : metrics?.activeProjects || 0} detail="Choose a project workspace" onClick={() => navigate('/explore')} /><ActionCard icon="task_alt" label="Task progress" value={loading ? '—' : `${progress}%`} detail={`${completedTasks} of ${totalTasks} tasks complete`} tone="success" onClick={() => needsProject('/tasks-milestones')} /><ActionCard icon="rate_review" label="Awaiting review" value={loading ? '—' : metrics?.pendingFeedback || 0} detail="Open submissions and feedback" tone={(metrics?.pendingFeedback || 0) ? 'error' : 'primary'} onClick={() => needsProject('/student-submissions')} /><ActionCard icon="event" label="Next deadline" value={loading ? '—' : metrics?.daysUntilDeadline ?? '—'} detail={metrics?.daysUntilDeadline === null ? 'No dated task yet' : 'days remaining'} onClick={() => needsProject('/tasks-milestones')} /></section>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-on-surface">My projects</h2><p className="mt-1 text-sm text-secondary">Select a project before opening its tasks, papers, meetings, or team.</p></div><button onClick={() => navigate('/create-new-work')} className="text-sm font-bold text-primary">New project</button></div><div className="mt-4 grid gap-3">{!loading && projects.length === 0 && <div className="rounded-xl bg-surface-container-low p-5 text-sm text-secondary">No project yet. Create one to unlock the rest of your workspace.</div>}{projects.map((project) => <div key={project._id} className={`flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${currentProject?._id === project._id ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest'}`}><div className="min-w-0"><p className="truncate font-bold text-on-surface">{project.title}</p><p className="mt-1 text-sm capitalize text-secondary">{project.status?.replace('_', ' ') || 'active'} · {project.supervisor?.name || 'Supervisor not assigned'}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => setActiveProject(project)} className="rounded-lg border border-outline-variant/50 px-3 py-2 text-xs font-bold text-on-surface">Select</button><button onClick={() => chooseProject(project)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary">Open tasks</button></div></div>)}</div></div><aside className="rounded-2xl border border-outline-variant/30 bg-surface p-5 shadow-sm"><h2 className="text-lg font-extrabold text-on-surface">Quick actions</h2><div className="mt-4 grid gap-2">{[{ label: 'Record weekly progress', icon: 'timeline', path: '/progress-logs' }, { label: 'Submit deliverable', icon: 'upload_file', path: '/student-submissions' }, { label: 'Schedule a meeting', icon: 'event', path: '/meeting-management' }, { label: 'Open team space', icon: 'groups', path: '/team-management' }].map((action) => <button key={action.path} onClick={() => needsProject(action.path)} className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 text-left text-sm font-bold text-on-surface hover:bg-primary/10 hover:text-primary"><span className="inline-flex items-center gap-3"><span className="material-symbols-outlined text-[19px]">{action.icon}</span>{action.label}</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>)}</div></aside></section>
    </div>
  </main>;
};

export default StudentDashboard;
