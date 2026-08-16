import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../lib/api';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
};

const TeamManagement = () => {
  const { activeProject, setActiveProject, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [teams, setTeams] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorInvitations, setSupervisorInvitations] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const projectId = activeProject?._id;

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projRes, taskRes, subRes, teamRes, supervisorRes] = await Promise.all([
        apiFetch(`/api/projects/${projectId}`),
        apiFetch(`/api/tasks?project=${projectId}`).catch(() => ({ data: [] })),
        apiFetch(`/api/submissions?project=${projectId}`).catch(() => ({ data: [] })),
        apiFetch(`/api/teams?project=${projectId}`).catch(() => ({ data: [] })),
        apiFetch('/api/teams/directory/supervisors').catch(() => ({ data: [] }))
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data || []);
      setTeams(teamRes.data || []);
      setSupervisors(supervisorRes.data || []);

      // Merge tasks + submissions into one recent-activity timeline
      const events = [
        ...(taskRes.data || []).map(t => ({
          who: t.assignedTo?.name || 'Team',
          action: ['done', 'completed'].includes(t.status) ? 'completed task' : t.status === 'blocked' ? 'has a blocked task' : 'is working on',
          target: t.title,
          date: t.createdAt,
          color: ['done', 'completed'].includes(t.status) ? 'border-primary' : t.status === 'blocked' ? 'border-error' : 'border-outline-variant'
        })),
        ...(subRes.data || []).map(s => ({
          who: s.student?.name || 'A student',
          action: 'uploaded',
          target: s.title,
          date: s.submittedAt,
          isFile: true,
          color: 'border-tertiary'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
      setActivity(events);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadData();
    else { setProject(null); setTasks([]); setActivity([]); setLoading(false); }
  }, [projectId, loadData]);

  useEffect(() => {
    if (user?.role !== 'supervisor') {
      setSupervisorInvitations([]);
      return;
    }
    let cancelled = false;
    apiFetch('/api/teams/invitations/mine')
      .then((response) => { if (!cancelled) setSupervisorInvitations(response.data || []); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); });
    return () => { cancelled = true; };
  }, [user?.role]);

  const currentUserId = String(user?._id || user?.id || '');
  const assignedSupervisorId = String(project?.supervisor?._id || project?.supervisor || '');
  // A supervisor may manage only the roster for their own project.  Keeping
  // this check in the UI avoids presenting controls that the API must reject.
  const canManage = user?.role === 'admin' || (user?.role === 'supervisor' && currentUserId === assignedSupervisorId);
  const myLedTeam = teams.find((team) => String(team.activeLeader?._id || team.activeLeader || '') === currentUserId
    || team.members?.some((member) => String(member.user?._id || member.user || '') === currentUserId && member.role === 'Leader' && member.state !== 'removed'));

  const createProjectTeam = async (event) => {
    event.preventDefault();
    if (!teamName.trim()) return;
    setWorkflowBusy(true); setError(''); setNotice('');
    try {
      const response = await apiFetch('/api/teams', { method: 'POST', body: JSON.stringify({ name: teamName.trim(), project: projectId, members: [] }) });
      setTeams((current) => [...current, response.data]);
      setTeamName('');
      setNotice('Team created. Membership and supervision now remain linked to this project.');
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkflowBusy(false); }
  };

  const inviteProjectSupervisor = async (event) => {
    event.preventDefault();
    if (!myLedTeam || !selectedSupervisor) return;
    setWorkflowBusy(true); setError(''); setNotice('');
    try {
      const response = await apiFetch(`/api/teams/${myLedTeam._id}/supervisor-invitations`, { method: 'POST', body: JSON.stringify({ supervisorId: selectedSupervisor, message: invitationMessage }) });
      setTeams((current) => current.map((team) => team._id === response.data._id ? response.data : team));
      setSelectedSupervisor(''); setInvitationMessage('');
      setNotice('Invitation sent. The supervisor must accept before gaining project access.');
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkflowBusy(false); }
  };

  const respondToInvitation = async (teamId, invitationId, decision) => {
    setWorkflowBusy(true); setError(''); setNotice('');
    try {
      await apiFetch(`/api/teams/${teamId}/supervisor-invitations/${invitationId}/respond`, { method: 'POST', body: JSON.stringify({ decision }) });
      setSupervisorInvitations((current) => current.filter((team) => team._id !== teamId));
      if (decision === 'accept') window.dispatchEvent(new Event('projects-changed'));
      setNotice(decision === 'accept' ? 'Invitation accepted. The project is now available in your supervised projects.' : 'Invitation declined. The team has been notified.');
    } catch (requestError) { setError(requestError.message); }
    finally { setWorkflowBusy(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setInviting(true);
    try {
      const res = await apiFetch(`/api/projects/${activeProject._id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail })
      });
      setProject(res.data);
      setActiveProject(res.data);
      setNotice(`${inviteEmail} has been added to the team.`);
      setInviteEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this team?`)) return;
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`/api/projects/${activeProject._id}/members/${memberId}`, { method: 'DELETE' });
      setProject(res.data);
      setActiveProject(res.data);
      setNotice(`${memberName} was removed from the team.`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-8 rounded-[32px] shadow-lg max-w-3xl w-full">
          {error && <p role="alert" className="mb-4 rounded-xl border border-error/30 bg-error/10 p-3 text-error">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary">{notice}</p>}
          {supervisorInvitations.length > 0 ? <div><div className="mb-6 text-center"><span className="material-symbols-outlined text-5xl text-tertiary">mark_email_unread</span><h2 className="mt-2 text-2xl font-black text-on-surface">Supervision invitations</h2><p className="text-on-surface-variant">Review the project and team context before accepting responsibility.</p></div><div className="space-y-4">{supervisorInvitations.map((team) => {
            const invitation = team.supervisorInvitations?.find((item) => String(item.supervisor?._id || item.supervisor) === currentUserId && item.status === 'pending');
            return <article key={team._id} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-tertiary">{team.project?.department || 'Department not set'}{team.project?.section ? ` · ${team.project.section}` : ''}</p><h3 className="mt-1 text-lg font-black">{team.name}</h3><p className="text-sm text-on-surface-variant">Project: {team.project?.title}</p>{invitation?.message && <p className="mt-3 rounded-lg bg-surface p-3 text-sm">“{invitation.message}”</p>}<p className="mt-2 text-xs text-secondary">Invited by {invitation?.invitedBy?.name || 'team leader'} · {team.members?.length || 0} team member(s)</p></div><div className="flex gap-2"><button disabled={workflowBusy} onClick={() => respondToInvitation(team._id, invitation?._id, 'decline')} className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-bold">Decline</button><button disabled={workflowBusy} onClick={() => respondToInvitation(team._id, invitation?._id, 'accept')} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary">Accept</button></div></div></article>;
          })}</div></div> : <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">group_off</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Please select an active project from the top navigation to view and manage its team.</p>
          </div>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const roster = [];
  if (project?.supervisor) {
    roster.push({ id: project.supervisor._id, role: 'Supervisor', user: project.supervisor, removable: false });
  }
  (project?.students || []).forEach((student) => {
    roster.push({
      id: student._id,
      // Project membership does not expose a confirmed Team record here, so do
      // not invent a leader designation based on array position.
      role: 'Student member',
      user: student,
      removable: canManage || String(student._id) === currentUserId
    });
  });

  // Real per-member task stats instead of a made-up "contribution" number
  const memberStats = (memberId) => {
    const assigned = tasks.filter(t => (t.assignedTo?._id || t.assignedTo) === memberId);
    const completed = assigned.filter(t => ['done', 'completed'].includes(t.status)).length;
    return { assigned: assigned.length, completed, pct: assigned.length ? Math.round((completed / assigned.length) * 100) : 0 };
  };

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Workspace</span>
            <h1 className="font-display text-[28px] md:text-[36px] font-black text-on-surface tracking-tight leading-none mb-2">Team Management</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Project: <strong className="text-primary">{activeProject.title}</strong></p>
          </div>
        </motion.div>

        {/* Inline feedback banners */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-error/10 border border-error/20 text-error px-5 py-3.5 rounded-2xl font-body-md text-[14px]">
            <span className="material-symbols-outlined text-[20px]">error</span>{error}
            <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-[18px]">close</span></button>
          </motion.div>
        )}
        {notice && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-primary/10 border border-primary/20 text-primary px-5 py-3.5 rounded-2xl font-body-md text-[14px]">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>{notice}
            <button onClick={() => setNotice('')} className="ml-auto"><span className="material-symbols-outlined text-[18px]">close</span></button>
          </motion.div>
        )}

        <motion.section variants={itemVariants} className="rounded-[28px] border border-outline-variant/30 bg-surface/80 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-wider text-primary">Connected supervision workflow</p>
              <h2 className="mt-1 text-xl font-black text-on-surface">Project teams and supervisor ownership</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Teams share the project’s assigned supervisor, project chat, tasks, reviews, and progress record. Accepting an invitation grants the supervisor access to that same project.</p>
            </div>
            <form onSubmit={createProjectTeam} className="flex w-full max-w-xl gap-2">
              <input required maxLength={100} value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder={user?.role === 'supervisor' ? 'Add a working team to this project' : 'Create your project team'} className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm" />
              <button disabled={workflowBusy} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary disabled:opacity-60">Create team</button>
            </form>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teams.length ? teams.map((team) => <article key={team._id} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-on-surface">{team.name}</h3><p className="mt-1 text-xs text-secondary">{team.members?.length || 0} member(s) · {String(team.status || 'forming').replace('_', ' ')}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${team.supervisor ? 'bg-primary/10 text-primary' : 'bg-tertiary-container text-tertiary'}`}>{team.supervisor ? 'Supervised' : 'Needs supervisor'}</span></div>{team.activeLeader?.name && <p className="mt-3 text-xs text-on-surface-variant">Leader: <strong>{team.activeLeader.name}</strong></p>}</article>) : <p className="rounded-2xl border border-dashed border-outline-variant p-4 text-sm text-secondary md:col-span-2 xl:col-span-3">No working team exists yet. Create one to establish leadership and invite a supervisor.</p>}
          </div>

          {user?.role === 'student' && !project?.supervisor && <div className="mt-6 border-t border-outline-variant/30 pt-5">
            {myLedTeam ? <form onSubmit={inviteProjectSupervisor} className="grid gap-3 lg:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1.5fr)_auto] lg:items-end"><label className="text-xs font-bold uppercase tracking-wider text-secondary">Available supervisor<select required value={selectedSupervisor} onChange={(event) => setSelectedSupervisor(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm font-normal normal-case text-on-surface"><option value="">Choose by expertise and workload</option>{supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id} disabled={!supervisor.available}>{supervisor.name} · {supervisor.department || 'Department not set'} · {supervisor.activeProjects}/{supervisor.maxActiveTeams || 6} projects{!supervisor.available ? ' (at capacity)' : ''}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-wider text-secondary">Invitation context<input maxLength={500} value={invitationMessage} onChange={(event) => setInvitationMessage(event.target.value)} placeholder="Briefly explain the topic, method, and support needed" className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 text-sm font-normal normal-case text-on-surface" /></label><button disabled={workflowBusy || !selectedSupervisor} className="rounded-xl bg-tertiary px-5 py-3 text-sm font-bold text-on-tertiary disabled:opacity-50">Invite supervisor</button></form> : <p className="rounded-xl bg-tertiary-container/40 p-4 text-sm text-on-surface-variant">Create a team first. Its student creator becomes the accountable leader and can invite a supervisor.</p>}
          </div>}
        </motion.section>

        {/* Bento Grid Layout */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column (Main Content - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">

            {/* Project supervisors and administrators manage roster membership. */}
            {canManage ? <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface">Add Team Member</h3>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end relative z-10">
                <div className="flex-1 w-full">
                  <label className="block font-label-sm text-[11px] font-bold text-secondary mb-2 uppercase tracking-wider">Student Email</label>
                  <input
                    required
                    type="email"
                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary"
                    placeholder="e.g. s1234567@uni.edu"
                  />
                </div>
                <button type="submit" disabled={inviting} className={`w-full sm:w-auto px-8 py-3.5 bg-primary text-on-primary rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2 ${inviting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {inviting ? 'Adding...' : 'Add to Team'} <span className="material-symbols-outlined text-[18px]">{inviting ? 'hourglass_top' : 'send'}</span>
                </button>
              </form>
              <p className="font-body-sm text-[12px] text-secondary mt-4 relative z-10">The student must already have an account registered with this email.</p>
            </motion.div> : <motion.div variants={itemVariants} className="rounded-[24px] border border-primary/20 bg-primary/5 p-5 text-sm text-on-surface-variant"><strong className="text-on-surface">Project roster</strong><p className="mt-1">Your supervisor manages student membership. You can leave this project from your own member row if needed.</p></motion.div>}

            {/* Team Roster List */}
            <motion.div variants={itemVariants} className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h3 className="font-title-lg text-[22px] font-black text-on-surface tracking-tight">Active Roster</h3>
                <span className="bg-secondary-container/50 text-secondary border border-outline-variant/30 px-4 py-1.5 rounded-full font-label-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  {roster.length} {roster.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {roster.length === 0 ? (
                <div className="text-center py-16 opacity-60">
                  <span className="material-symbols-outlined text-[56px] text-outline mb-3">group_off</span>
                  <p className="font-title-md text-secondary">No members yet. Add a student by email above.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {roster.map((member, i) => {
                    const stats = member.role === 'Supervisor' ? null : memberStats(member.id);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                        key={member.id || i}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-outline-variant/40 bg-surface/50 hover:bg-surface hover:shadow-md transition-all group cursor-default ${member.role === 'Supervisor' ? 'border-l-[4px] border-l-tertiary' : 'border-l-[4px] border-l-primary'}`}
                      >
                        <div className="flex items-center gap-4 w-full sm:w-1/2 mb-4 sm:mb-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-title-md font-bold text-[18px] uppercase shadow-sm ${member.role === 'Supervisor' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-highest text-primary'}`}>
                            {member.user?.name?.substring(0, 2) || '??'}
                          </div>
                          <div>
                            <h4 className="font-title-sm text-[16px] font-bold text-on-surface group-hover:text-primary transition-colors">{member.user?.name || 'Unknown User'}</h4>
                            <p className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider mt-1">{member.role}{member.user?.email ? ` · ${member.user.email}` : ''}</p>
                          </div>
                        </div>

                        <div className="w-full sm:w-1/2 flex items-center gap-6">
                          {stats ? (
                            <div className="flex-1">
                              <div className="flex justify-between mb-2">
                                <span className="font-label-sm text-[10px] font-bold text-secondary uppercase tracking-wider">Tasks Completed</span>
                                <span className="font-label-sm text-[10px] font-bold text-on-surface">{stats.completed}/{stats.assigned}</span>
                              </div>
                              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }} animate={{ width: `${stats.pct}%` }} transition={{ duration: 1, delay: 0.2 }}
                                  className="h-full rounded-full bg-primary"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <span className="font-label-sm text-[11px] font-bold text-tertiary uppercase tracking-wider">Oversees this project</span>
                            </div>
                          )}
                          {member.removable && member.role !== 'Supervisor' && (
                            <button
                              onClick={() => handleRemove(member.id, member.user?.name || 'this member')}
                              title="Remove from team"
                              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-error hover:bg-error/10 transition-colors shrink-0"
                            >
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column (Activity Log - 4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-tertiary border-y border-r border-y-outline-variant/30 border-r-outline-variant/30 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-4">
              <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">history</span>
                Recent Activity
              </h3>
            </div>

            {activity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <span className="material-symbols-outlined text-[48px] text-outline mb-3">timeline</span>
                <p className="font-body-md text-secondary">No activity yet.</p>
                <p className="font-body-sm text-outline mt-1">Tasks and submissions will appear here.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-surface-container-high ml-4 space-y-8 pb-4 flex-1">
                {activity.map((log, idx) => (
                  <div key={idx} className="relative pl-6 group">
                    <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 ${log.color}`}></span>
                    <p className="font-body-sm text-[14px] text-on-surface-variant leading-snug">
                      <strong className="font-semibold text-on-surface">{log.who}</strong> {log.action}{' '}
                      {log.isFile ? (
                        <span className="inline-block bg-surface-container-high px-2 py-0.5 rounded font-mono text-[11px] text-on-surface border border-outline-variant/30 mt-1">{log.target}</span>
                      ) : (
                        <span className="text-primary font-medium">{log.target}</span>
                      )}
                    </p>
                    <span className="font-label-sm text-[10px] font-bold text-secondary uppercase tracking-wider mt-2 block">{timeAgo(log.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default TeamManagement;
