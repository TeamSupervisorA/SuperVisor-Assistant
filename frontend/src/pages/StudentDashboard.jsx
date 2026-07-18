import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        if (data.data) {
          setMetrics(data.data);
        }
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
          
          if (res.data) {
            setAiInsight(res.data);
          }
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
    : Math.round((5 / 12) * 100); // Default mock

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Background Mesh for Premium SaaS Vibe */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" 
        animate="show" 
        variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-display text-[28px] md:text-[36px] font-black text-on-surface tracking-tight leading-none mb-2">My Workspace</h1>
            <p className="font-body-md text-[16px] text-on-surface-variant font-light">Welcome back, {user?.name || 'Student'}. Track your progress and deadlines.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-surface-container/50 p-1.5 rounded-full border border-outline-variant/20 backdrop-blur-md">
             <button className="px-4 py-2 rounded-full font-label-sm font-bold bg-surface shadow-sm text-on-surface">Dashboard</button>
             <button onClick={() => navigate('/tasks-milestones')} className="px-4 py-2 rounded-full font-label-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">My Tasks</button>
          </div>
        </motion.div>

        {/* 4 Metric Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6 lg:mb-8">
          
          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:border-primary/30 transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-[13px] font-bold text-on-surface uppercase tracking-wider">Active Works</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit_document</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-display text-[42px] font-bold text-on-surface leading-none">
                {loading ? '—' : metrics.activeProjects}
              </span>
              <span className="font-body-sm text-[14px] text-secondary mb-1">in progress</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:border-tertiary/30 transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-[13px] font-bold text-on-surface uppercase tracking-wider">Completed</span>
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-display text-[42px] font-bold text-on-surface leading-none">
                {loading ? '—' : metrics.completedTasks}
              </span>
              <span className="font-body-sm text-[14px] text-secondary mb-1">tasks done</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:border-error/30 transition-all hover:-translate-y-1 group relative overflow-hidden">
             {metrics.pendingFeedback > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-error"></div>}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-label-md text-[13px] font-bold text-on-surface uppercase tracking-wider">Feedback</span>
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors">
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
              </div>
            </div>
            <div className="flex items-end gap-3 relative z-10">
              <span className="font-display text-[42px] font-bold text-on-surface leading-none">
                {loading ? '—' : metrics.pendingFeedback}
              </span>
              <span className="font-body-sm text-[14px] text-secondary mb-1">awaiting review</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:border-secondary/50 transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-md text-[13px] font-bold text-on-surface uppercase tracking-wider">Deadline</span>
              <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-on-surface-variant group-hover:text-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">event</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="font-display text-[42px] font-bold text-on-surface leading-none">
                {loading ? '—' : (metrics.daysUntilDeadline !== null ? metrics.daysUntilDeadline : '∞')}
              </span>
              <span className="font-body-sm text-[14px] text-secondary mb-1">days left</span>
            </div>
          </motion.div>

        </motion.div>

        {/* Bottom Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0">
          
          {/* Main Project Details Panel (8 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-8 bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] flex flex-col p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Current Project</span>
                <h3 className="font-title-lg text-[24px] font-black text-on-surface tracking-tight">
                  {metrics.nextMilestone ? `SDP: ${metrics.nextMilestone}` : 'Project Workspace'}
                </h3>
              </div>
              <button onClick={() => navigate('/tasks-milestones')} className="shrink-0 bg-surface text-secondary hover:text-primary px-4 py-2 rounded-full font-label-md text-[13px] font-bold border border-outline-variant/30 hover:border-primary/50 transition-all flex items-center gap-2">
                Open Workspace <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-10 bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
              <div className="flex justify-between items-end mb-3">
                <span className="font-label-md text-[13px] font-bold text-secondary uppercase tracking-wider">Overall Progress</span>
                <span className="font-display text-[28px] text-primary font-bold leading-none">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-secondary-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                </motion.div>
              </div>
            </div>
            
            {/* Quick Actions & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
              <div className="bg-surface/50 p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-center">
                <span className="block font-label-sm text-[11px] font-bold text-secondary mb-1 uppercase tracking-wider">Next Milestone Deadline</span>
                <span className="font-title-lg text-[18px] font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">timer</span>
                  {metrics.daysUntilDeadline !== null ? `${metrics.daysUntilDeadline} Days Remaining` : 'No upcoming deadlines'}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                 <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                    Submit Weekly Log
                 </button>
                 <button onClick={() => navigate('/tasks-milestones')} className="w-full bg-surface-container-lowest text-on-surface py-3 rounded-xl font-label-md text-[14px] font-bold hover:bg-surface-container transition-colors border border-outline-variant/30 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">rule</span>
                    Update Task Status
                 </button>
              </div>
            </div>
          </motion.div>

          {/* AI Insight Panel (4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface-container-lowest/80 backdrop-blur-xl border-l-4 border-l-primary border-y border-r border-y-outline-variant/30 border-r-outline-variant/30 rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px] animate-pulse">auto_awesome</span>
              </div>
              <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface">AI Task Suggestion</h3>
            </div>
            
            <div className="flex-1 relative z-10 flex flex-col justify-center mb-6">
              <AnimatePresence mode="wait">
                {loadingInsight ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-primary gap-4 py-8"
                  >
                    <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
                    <span className="font-label-md font-bold uppercase tracking-wider">Analyzing Project State...</span>
                  </motion.div>
                ) : aiInsight ? (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col h-full"
                  >
                    <p className="font-title-md text-[18px] font-bold text-on-surface mb-4 leading-tight">
                      {aiInsight.taskTitle}
                    </p>
                    <div className="p-4 rounded-2xl bg-surface/60 border border-outline-variant/20 backdrop-blur-sm">
                      <p className="font-body-sm text-[14px] text-on-surface-variant leading-relaxed">
                        <strong className="text-secondary mr-1">Why?</strong>
                        {aiInsight.explanation}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center text-secondary opacity-60 flex flex-col items-center gap-2 py-8"
                  >
                     <span className="material-symbols-outlined text-[32px]">lightbulb</span>
                     <p className="font-body-sm text-[14px]">Add tasks to your project to receive intelligent next-step recommendations.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              className="w-full py-3.5 rounded-xl border-2 border-primary/20 text-primary bg-primary/5 font-label-md text-[14px] font-bold hover:bg-primary hover:text-on-primary hover:border-primary transition-all flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:hover:bg-primary/5 disabled:hover:text-primary" 
              disabled={loadingInsight}
            >
              {aiInsight ? 'Apply Suggestion' : 'View AI Features'}
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
