import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
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
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  useEffect(() => {
    if (activeProject) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [activeProject?._id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, subRes] = await Promise.all([
        apiFetch(`/api/projects/${activeProject._id}`),
        apiFetch(`/api/tasks?project=${activeProject._id}`).catch(() => ({ data: [] })),
        apiFetch(`/api/submissions?project=${activeProject._id}`).catch(() => ({ data: [] }))
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data || []);

      // Merge tasks + submissions into one recent-activity timeline
      const events = [
        ...(taskRes.data || []).map(t => ({
          who: t.assignedTo?.name || 'Team',
          action: t.status === 'completed' ? 'completed task' : t.status === 'delayed' ? 'has a delayed task' : 'is working on',
          target: t.title,
          date: t.createdAt,
          color: t.status === 'completed' ? 'border-primary' : t.status === 'delayed' ? 'border-error' : 'border-outline-variant'
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
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">group_off</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Please select an active project from the top navigation to view and manage its team.</p>
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
  (project?.students || []).forEach((student, idx) => {
    roster.push({
      id: student._id,
      role: idx === 0 ? 'Team Leader' : 'Member',
      user: student,
      removable: canManage || student._id === user?.id
    });
  });

  // Real per-member task stats instead of a made-up "contribution" number
  const memberStats = (memberId) => {
    const assigned = tasks.filter(t => (t.assignedTo?._id || t.assignedTo) === memberId);
    const completed = assigned.filter(t => t.status === 'completed').length;
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

        {/* Bento Grid Layout */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column (Main Content - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">

            {/* Add Member Card */}
            <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 relative overflow-hidden group hover:border-primary/30 transition-colors">
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
            </motion.div>

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
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-outline-variant/40 bg-surface/50 hover:bg-surface hover:shadow-md transition-all group cursor-default ${member.role === 'Supervisor' ? 'border-l-[4px] border-l-tertiary' : member.role === 'Team Leader' ? 'border-l-[4px] border-l-primary' : ''}`}
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
                                  className={`h-full rounded-full ${member.role === 'Team Leader' ? 'bg-primary' : 'bg-secondary'}`}
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
