import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    pendingFeedback: 0,
    daysUntilDeadline: null,
    nextMilestone: null
  });
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch('/api/dashboard/student');
        if (data.data) setMetrics(data.data);
      } catch (err) {
        console.error('Failed to fetch student metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (metrics.activeProjects > 0) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        try {
          const res = await apiFetch('/api/ai/recommend-task', {
            method: 'POST',
            body: JSON.stringify({
              currentStatus: metrics.nextMilestone || 'In Progress',
              pastTasks: ['Initial Setup', 'Literature Review Draft']
            })
          });
          if (res.data) setAiInsight(res.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingInsight(false);
        }
      };
      fetchInsight();
    }
  }, [metrics.activeProjects, metrics.nextMilestone]);

  const progress = metrics.totalTasks > 0
    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
    : 0;

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop pb-24"
    >
      <motion.div variants={itemVariants} className="mb-8 md:mb-10">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Student Workspace</h2>
        <p className="font-body-lg text-[18px] text-secondary">Welcome back, {user?.name || 'Student'}. Track your progress and deadlines.</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[18px] lg:text-[20px] font-semibold text-on-surface">Active Works</span>
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">edit_document</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[42px] lg:text-[48px] font-bold text-primary leading-none">
              {loading ? '—' : metrics.activeProjects}
            </span>
            <span className="font-body-sm text-[14px] text-secondary mb-1 lg:mb-2">in progress</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[18px] lg:text-[20px] font-semibold text-on-surface">Completed</span>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[42px] lg:text-[48px] font-bold text-on-surface leading-none">
              {loading ? '—' : metrics.completedTasks}
            </span>
            <span className="font-body-sm text-[14px] text-secondary mb-1 lg:mb-2">tasks done</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[18px] lg:text-[20px] font-semibold text-on-surface">Feedback</span>
            <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">rate_review</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[42px] lg:text-[48px] font-bold text-on-surface leading-none">
              {loading ? '—' : metrics.pendingFeedback}
            </span>
            <span className="font-body-sm text-[14px] text-secondary mb-1 lg:mb-2">awaiting review</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors hover:-translate-y-1 hover:shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-title-lg text-[18px] lg:text-[20px] font-semibold text-on-surface">Deadline</span>
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">event</span>
            </div>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <span className="font-display text-[42px] lg:text-[48px] font-bold text-on-surface leading-none">
              {loading ? '—' : (metrics.daysUntilDeadline !== null ? metrics.daysUntilDeadline : '∞')}
            </span>
            <span className="font-body-sm text-[14px] text-secondary mb-1 lg:mb-2">days left</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-card border border-outline-variant/20 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-primary font-label-md text-[12px] font-semibold mb-3">CURRENT PROJECT</span>
              <h3 className="font-headline-md text-[24px] font-semibold text-on-surface line-clamp-1">
                {metrics.nextMilestone ? `Next: ${metrics.nextMilestone}` : 'SDP Project Workspace'}
              </h3>
            </div>
            <button className="p-2 text-secondary hover:bg-surface-container rounded-full transition-colors shrink-0">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-body-md text-[16px] font-semibold text-on-surface">Overall Progress</span>
              <span className="font-body-md text-[16px] text-primary font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface-bright rounded-xl p-5 border border-outline-variant/30">
            <div>
              <span className="block font-label-md text-[12px] font-semibold text-secondary mb-1 uppercase tracking-wider">Next Milestone</span>
              <span className="font-title-lg text-[18px] md:text-[20px] font-semibold text-on-surface flex items-center gap-2 line-clamp-1">
                <span className="material-symbols-outlined text-tertiary shrink-0">flag</span>
                {metrics.nextMilestone || 'No pending milestones'}
              </span>
            </div>
            <div>
              <span className="block font-label-md text-[12px] font-semibold text-secondary mb-1 uppercase tracking-wider">Deadline Countdown</span>
              <span className="font-title-lg text-[18px] md:text-[20px] font-semibold text-on-surface flex items-center gap-2 line-clamp-1">
                <span className="material-symbols-outlined text-error shrink-0">timer</span>
                {metrics.daysUntilDeadline !== null ? `${metrics.daysUntilDeadline} Days Remaining` : 'No upcoming deadlines'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-[14px] font-semibold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
              Continue Working
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-card border-l-[3px] border-primary ai-sparkle-card flex flex-col relative overflow-hidden hover:shadow-lg transition-shadow"
             style={{ boxShadow: "inset 0 0 0 1px rgba(53, 37, 205, 0.15)", background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-container-low) 100%)" }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">AI Insight</h3>
            </div>
          </div>
          
          <div className="flex-1 relative z-10 mb-6">
            {loadingInsight ? (
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span className="font-body-md font-semibold">Generating AI insight...</span>
              </div>
            ) : aiInsight ? (
              <>
                <p className="font-body-md text-[15px] md:text-[16px] text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Next Step:</strong> {aiInsight.taskTitle}
                </p>
                <div className="mt-5 p-4 rounded-xl border border-outline-variant/40 bg-surface/50 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontSize: '20px', marginTop: '2px' }}>lightbulb</span>
                    <div>
                      <p className="font-body-sm text-[14px] text-secondary leading-relaxed">{aiInsight.explanation}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="font-body-md text-[15px] md:text-[16px] text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface font-semibold">Ready to begin!</strong> Start creating tasks and setting milestones for your project to receive AI guidance.
              </p>
            )}
          </div>
          
          <button className="w-full py-3 rounded-lg border-2 border-primary/20 text-primary bg-primary/5 font-label-md text-[14px] font-semibold hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-center gap-2 relative z-10 disabled:opacity-50" disabled={loadingInsight}>
            {aiInsight ? 'Apply Suggestion' : 'View AI Suggestions'}
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lightbulb</span>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
