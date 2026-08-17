import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';

const idOf = (value) => String(value?._id || value || '');

export default function TeamManagement() {
  const { activeProject, setActiveProject, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [email, setEmail] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const invitationResponse = await apiFetch('/api/projects/invitations/mine').catch(() => ({ data: [] }));
    setInvitations(invitationResponse.data || []);
    if (!activeProject?._id) { setProject(null); return; }
    const [projectResponse, taskResponse, directoryResponse] = await Promise.all([
      apiFetch(`/api/projects/${activeProject._id}`),
      apiFetch(`/api/tasks?project=${activeProject._id}`).catch(() => ({ data: [] })),
      apiFetch('/api/teams/directory/supervisors').catch(() => ({ data: [] }))
    ]);
    setProject(projectResponse.data);
    setTasks(taskResponse.data || []);
    setSupervisors(directoryResponse.data || []);
  }, [activeProject?._id]);

  useEffect(() => { load().catch((requestError) => setError(requestError.message)); }, [load]);

  const currentUserId = idOf(user);
  const leaderId = idOf(project?.leaderUserId || project?.students?.[0]);
  const supervisorUserId = idOf(project?.supervisor);
  const canInviteStudents = user?.role === 'admin' || currentUserId === leaderId || currentUserId === supervisorUserId;
  const canManageRoster = canInviteStudents || currentUserId === supervisorUserId;
  const canInviteSupervisor = !supervisorUserId && canInviteStudents;

  const roster = useMemo(() => {
    const members = (project?.students || []).map((student) => ({ ...student, membershipRole: idOf(student) === leaderId ? 'Project leader' : 'Student member' }));
    if (project?.supervisor) members.unshift({ ...project.supervisor, membershipRole: 'Primary supervisor' });
    return members;
  }, [project, leaderId]);

  const statsFor = (memberId) => {
    const assigned = tasks.filter((task) => idOf(task.assignedTo) === memberId && task.status !== 'cancelled');
    const completed = assigned.filter((task) => ['done', 'completed'].includes(task.status)).length;
    return `${completed}/${assigned.length} tasks complete`;
  };

  const run = async (action, successMessage) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await action();
      if (response?.data?._id === activeProject?._id) {
        setProject(response.data);
        setActiveProject(response.data);
      }
      setNotice(successMessage);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const inviteStudent = (event) => {
    event.preventDefault();
    run(() => apiFetch(`/api/projects/${project._id}/members`, { method: 'POST', body: JSON.stringify({ email }) }), 'Invitation sent. The student must accept before joining the project.');
    setEmail('');
  };

  const inviteSupervisor = (event) => {
    event.preventDefault();
    run(() => apiFetch(`/api/projects/${project._id}/supervisor-invitations`, { method: 'POST', body: JSON.stringify({ supervisorId, message }) }), 'Supervision invitation sent. Access is granted only after acceptance.');
    setSupervisorId(''); setMessage('');
  };

  const respond = (invitationProject, invitationId, decision, type) => run(
    () => apiFetch(`/api/projects/${invitationProject._id}/${type === 'supervisor' ? 'supervisor-invitations' : 'members'}/${invitationId}/respond`, { method: 'POST', body: JSON.stringify({ decision }) }),
    decision === 'accept' ? 'Invitation accepted. The shared project is now available.' : 'Invitation declined.'
  );

  const remove = (member) => {
    if (!window.confirm(`Remove ${member.name} from this project?`)) return;
    run(() => apiFetch(`/api/projects/${project._id}/members/${member._id}`, { method: 'DELETE' }), `${member.name} was removed.`);
  };

  const transferLeadership = (member) => {
    if (!window.confirm(`Transfer project leadership to ${member.name}?`)) return;
    run(
      () => apiFetch(`/api/projects/${project._id}/leader`, { method: 'PUT', body: JSON.stringify({ userId: member._id }) }),
      `${member.name} is now the accountable project leader.`
    );
  };

  const pendingCards = invitations.flatMap((item) => {
    if (user?.role === 'supervisor') {
      const invitation = item.supervisorInvitations?.find((entry) => idOf(entry.supervisor) === currentUserId && entry.state === 'pending');
      return invitation ? [{ project: item, invitation, type: 'supervisor' }] : [];
    }
    const invitation = item.memberInvitations?.find((entry) => (idOf(entry.user) === currentUserId || entry.email === user?.email) && entry.state === 'pending');
    return invitation ? [{ project: item, invitation, type: 'member' }] : [];
  });

  return <main className="mx-auto w-full max-w-[1500px] space-y-6 p-5 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">People & supervision</p><h1 className="mt-1 text-3xl font-black text-on-surface">Project members</h1><p className="mt-2 max-w-3xl text-on-surface-variant">One project has one shared roster, one accountable leader, and one primary supervisor. Tasks, deliverables, reviews, meetings, and messages all use this roster.</p></div>
      {project && <span className="rounded-full bg-surface-container px-4 py-2 text-sm font-bold text-on-surface">{project.title}</span>}
    </header>

    {error && <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 p-4 text-error">{error}</div>}
    {notice && <div role="status" className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-primary">{notice}</div>}

    {pendingCards.length > 0 && <section className="rounded-3xl border border-tertiary/25 bg-tertiary-container/20 p-6"><h2 className="text-lg font-black">Pending invitations</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{pendingCards.map(({ project: item, invitation, type }) => <article key={invitation._id} className="rounded-2xl border border-outline-variant/40 bg-surface p-5"><p className="text-xs font-bold uppercase text-tertiary">{type === 'supervisor' ? 'Supervision request' : 'Project membership'}</p><h3 className="mt-1 text-lg font-black">{item.title}</h3><p className="mt-1 text-sm text-secondary">{item.department || 'Department not set'}{item.section ? ` · ${item.section}` : ''}</p>{invitation.message && <p className="mt-3 rounded-xl bg-surface-container-low p-3 text-sm">{invitation.message}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => respond(item, invitation._id, 'decline', type)} className="rounded-xl border border-outline-variant px-4 py-2 font-bold">Decline</button><button disabled={busy} onClick={() => respond(item, invitation._id, 'accept', type)} className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary">Accept</button></div></article>)}</div></section>}

    {!project ? <section className="grid min-h-[360px] place-items-center rounded-3xl border border-dashed border-outline-variant bg-surface-container-low"><div className="text-center"><span className="material-symbols-outlined text-5xl text-secondary">folder_open</span><h2 className="mt-3 text-xl font-black">Select a project</h2><p className="mt-1 text-secondary">Choose the active project in the header to open its roster.</p></div></section> : <>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-outline-variant/35 bg-surface p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Shared roster</h2><p className="text-sm text-secondary">{roster.length} active people</p></div><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${project.supervisor ? 'bg-primary/10 text-primary' : 'bg-tertiary-container text-tertiary'}`}>{project.supervisor ? 'Supervisor connected' : 'Supervisor needed'}</span></div><div className="mt-5 space-y-3">{roster.map((member) => <article key={`${member.membershipRole}-${member._id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 font-black text-primary">{member.name?.slice(0, 2).toUpperCase()}</div><div><h3 className="font-bold">{member.name}</h3><p className="text-xs text-secondary">{member.membershipRole} · {member.email}</p></div></div><div className="flex items-center gap-3"><span className="text-xs font-semibold text-secondary">{member.membershipRole === 'Primary supervisor' ? 'Reviews project work' : statsFor(member._id)}</span>{canManageRoster && member.membershipRole === 'Student member' && <><button onClick={() => transferLeadership(member)} className="rounded-lg p-2 text-secondary hover:bg-primary/10 hover:text-primary" aria-label={`Transfer leadership to ${member.name}`} title="Transfer leadership"><span className="material-symbols-outlined">manage_accounts</span></button><button onClick={() => remove(member)} className="rounded-lg p-2 text-secondary hover:bg-error/10 hover:text-error" aria-label={`Remove ${member.name}`} title="Remove member"><span className="material-symbols-outlined">person_remove</span></button></>}</div></article>)}</div></div>
        <aside className="space-y-5">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface p-6"><h2 className="font-black">Workflow ownership</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-secondary">Project leader</dt><dd className="font-bold">{project.leaderUserId?.name || project.students?.[0]?.name || 'Not assigned'}</dd></div><div><dt className="text-secondary">Primary supervisor</dt><dd className="font-bold">{project.supervisor?.name || 'Awaiting connection'}</dd></div><div><dt className="text-secondary">Project stage</dt><dd className="font-bold capitalize">{String(project.status).replaceAll('_', ' ')}</dd></div><div><dt className="text-secondary">Proposal stage</dt><dd className="font-bold capitalize">{String(project.proposalState).replaceAll('_', ' ')}</dd></div></dl></div>
          {canInviteStudents && <form onSubmit={inviteStudent} className="rounded-3xl border border-outline-variant/35 bg-surface p-6"><h2 className="font-black">Invite a student</h2><p className="mt-1 text-sm text-secondary">The student joins only after accepting.</p><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@university.edu" className="mt-4 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"/><button disabled={busy} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-bold text-on-primary">Send invitation</button></form>}
        </aside>
      </section>
      {canInviteSupervisor && <form onSubmit={inviteSupervisor} className="grid gap-4 rounded-3xl border border-outline-variant/35 bg-surface p-6 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end"><label className="text-xs font-bold uppercase text-secondary">Supervisor<select required value={supervisorId} onChange={(event) => setSupervisorId(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm font-normal normal-case text-on-surface"><option value="">Choose by department and capacity</option>{supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id} disabled={!supervisor.available}>{supervisor.name} · {supervisor.department || 'No department'} · {supervisor.activeProjects}/{supervisor.maxActiveTeams || 6}{!supervisor.available ? ' (at capacity)' : ''}</option>)}</select></label><label className="text-xs font-bold uppercase text-secondary">Project context<input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Topic, method, and supervision support needed" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm font-normal normal-case text-on-surface"/></label><button disabled={busy || !supervisorId} className="rounded-xl bg-tertiary px-5 py-3 font-bold text-on-tertiary">Invite supervisor</button></form>}
    </>}
  </main>;
}
