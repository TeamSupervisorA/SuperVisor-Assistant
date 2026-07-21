import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TASK_STATUS_STYLES = {
  completed: 'bg-primary/10 text-primary border-primary/20',
  delayed: 'bg-error/10 text-error border-error/20',
  in_progress: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  review: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  todo: 'bg-surface-variant/50 text-on-surface-variant border-outline-variant/40'
};

const ProjectReport = () => {
  const { activeProject } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeProject) {
      loadReport();
    } else {
      setLoading(false);
    }
  }, [activeProject?._id]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/projects/${activeProject._id}/report`);
      setReport(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">summarize</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Select a project from the top navigation to generate its progress report.</p>
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

  if (error || !report) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
        <div className="text-center bg-surface/80 border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-error mb-4 opacity-60">report_off</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2">Report Unavailable</h2>
          <p className="font-body-md text-on-surface-variant mb-6">{error || 'Could not generate the report.'}</p>
          <button onClick={loadReport} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  const { taskSummary } = report;
  const healthStyle = report.health === 'On Track'
    ? 'bg-primary/10 text-primary border-primary/20'
    : report.health === 'Needs Attention'
      ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
      : 'bg-error/10 text-error border-error/20';

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0 no-print"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0 no-print"></div>

      <motion.div
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1200px] mx-auto flex flex-col gap-8 pb-20"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Progress Report</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">{report.projectTitle}</h1>
            <p className="font-title-md text-[15px] text-on-surface-variant font-medium">
              Generated {new Date(report.generatedAt).toLocaleString()} · Supervisor: <strong className="text-on-surface">{report.supervisor?.name || 'Not assigned yet'}</strong>
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <button onClick={loadReport} className="px-5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface/50 backdrop-blur-md text-on-surface font-label-md text-[13px] font-bold hover:bg-surface-container transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
            </button>
            <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Download / Print
            </button>
          </div>
        </motion.div>

        {/* Executive Summary */}
        <motion.section variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-primary border-y border-r border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">summarize</span> Executive Summary
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-label-md text-[12px] font-bold uppercase tracking-wider border ${healthStyle}`}>
              <span className="material-symbols-outlined text-[16px]">{report.health === 'On Track' ? 'check_circle' : report.health === 'Needs Attention' ? 'warning' : 'error'}</span>
              {report.health}
            </span>
          </div>
          <p className="font-body-lg text-[16px] text-on-surface leading-relaxed">{report.summary}</p>

          {/* Progress bar */}
          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest">Overall Progress</span>
              <span className="font-title-sm text-[15px] font-black text-primary">{report.progressPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${report.progressPercentage}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
        </motion.section>

        {/* Stat tiles */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: 'Total Tasks', value: taskSummary.total, icon: 'checklist', style: 'text-on-surface' },
            { label: 'Completed', value: taskSummary.completed, icon: 'task_alt', style: 'text-primary' },
            { label: 'In Progress', value: taskSummary.pending, icon: 'timelapse', style: 'text-tertiary' },
            { label: 'Delayed', value: taskSummary.delayed, icon: 'schedule', style: taskSummary.delayed > 0 ? 'text-error' : 'text-on-surface' }
          ].map((stat) => (
            <div key={stat.label} className="bg-surface/80 backdrop-blur-xl rounded-[24px] p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest">{stat.label}</span>
                <span className={`material-symbols-outlined text-[20px] ${stat.style}`}>{stat.icon}</span>
              </div>
              <span className={`font-display text-[36px] font-black leading-none ${stat.style}`}>{stat.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Team + Meetings */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-sm">
            <h3 className="font-title-md text-[18px] font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">groups</span> Team Members
            </h3>
            {report.teamMembers?.length ? (
              <div className="flex flex-wrap gap-3">
                {report.teamMembers.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 bg-surface-container-lowest/60 border border-outline-variant/40 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[12px] uppercase">{m.name?.substring(0, 2)}</div>
                    <div>
                      <p className="font-title-sm text-[14px] font-bold text-on-surface leading-tight">{m.name}</p>
                      <p className="font-body-sm text-[11px] text-secondary">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-secondary">No students assigned yet.</p>
            )}
          </div>
          <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-sm">
            <h3 className="font-title-md text-[18px] font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">event</span> Meetings
            </h3>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="font-display text-[32px] font-black text-on-surface leading-none">{report.meetingsHeld}</p>
                <p className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest mt-2">Held</p>
              </div>
              <div className="h-10 w-px bg-outline-variant/40"></div>
              <div className="text-center">
                <p className="font-display text-[32px] font-black text-tertiary leading-none">{report.meetingsUpcoming}</p>
                <p className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest mt-2">Upcoming</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Task breakdown */}
        <motion.section variants={itemVariants} className="bg-surface/90 backdrop-blur-xl rounded-[32px] border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-surface-container">
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface">Task Breakdown</h3>
          </div>
          {report.tasks?.length ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                    <th className="font-label-sm text-[11px] font-bold text-secondary py-4 px-8 uppercase tracking-widest">Task</th>
                    <th className="font-label-sm text-[11px] font-bold text-secondary py-4 px-6 uppercase tracking-widest">Assigned To</th>
                    <th className="font-label-sm text-[11px] font-bold text-secondary py-4 px-6 uppercase tracking-widest">Due</th>
                    <th className="font-label-sm text-[11px] font-bold text-secondary py-4 px-8 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container/50">
                  {report.tasks.map((t, i) => (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-4 px-8 font-title-sm text-[14px] font-bold text-on-surface">{t.title}</td>
                      <td className="py-4 px-6 font-body-md text-[13px] text-secondary">{t.assignedTo}</td>
                      <td className="py-4 px-6 font-body-md text-[13px] text-secondary">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="py-4 px-8 text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg font-label-sm text-[11px] font-bold uppercase tracking-wider border ${TASK_STATUS_STYLES[t.status] || TASK_STATUS_STYLES.todo}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 font-body-md text-secondary">No tasks created yet.</p>
          )}
        </motion.section>

        {/* Submissions & Feedback */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-sm">
            <h3 className="font-title-md text-[18px] font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span> Submissions
            </h3>
            {report.submissions?.length ? (
              <div className="space-y-3">
                {report.submissions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/40">
                    <div className="min-w-0">
                      <p className="font-title-sm text-[14px] font-bold text-on-surface truncate">{s.title}</p>
                      <p className="font-body-sm text-[12px] text-secondary">{s.student} · {new Date(s.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded-md shrink-0 ml-3">{s.grade ? `Grade: ${s.grade}` : s.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-secondary">No deliverables submitted yet.</p>
            )}
          </div>
          <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 border border-outline-variant/30 shadow-sm">
            <h3 className="font-title-md text-[18px] font-bold text-on-surface mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">rate_review</span> Supervisor Feedback
            </h3>
            {report.recentFeedback?.length ? (
              <div className="space-y-4">
                {report.recentFeedback.map((f, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-container-lowest/60 border-l-4 border-l-tertiary border-y border-r border-outline-variant/40">
                    <p className="font-title-sm text-[13px] font-bold text-on-surface mb-1">{f.submissionTitle}{f.grade ? ` — ${f.grade}` : ''}</p>
                    <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">{f.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-secondary">No feedback recorded yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProjectReport;
