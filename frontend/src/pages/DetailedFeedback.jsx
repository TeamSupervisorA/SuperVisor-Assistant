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

const DetailedFeedback = () => {
  const { activeProject, user } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (activeProject) {
      loadEvaluation();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/evaluations?project=${activeProject._id}`);
      if (res.data && res.data.length > 0) {
        setEvaluation(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">find_in_page</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Active Context</h2>
          <p className="font-body-md text-on-surface-variant">Select a project to view feedback for its submissions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">pending_actions</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Evaluations Yet</h2>
          <p className="font-body-md text-on-surface-variant">There is no feedback available for "{activeProject.title}" yet.</p>
        </div>
      </div>
    );
  }

  const { scores, totalScore, feedback, status } = evaluation;
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1400px] mx-auto flex flex-col gap-8 pb-20"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Evaluation Board</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Detailed Feedback</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Project: <strong className="text-primary">{activeProject.title}</strong></p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl border border-outline-variant/50 bg-surface/50 backdrop-blur-md text-on-surface font-label-md text-[13px] font-bold hover:bg-surface-container transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Download Report
            </button>
            {isSupervisor ? (
              <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit</span> Update Feedback
              </button>
            ) : (
              <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">event</span> Schedule Review
              </button>
            )}
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Total Score Summary Card (Col 4) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[40px] transition-colors ${totalScore >= 80 ? 'bg-primary/10' : totalScore >= 50 ? 'bg-tertiary/10' : 'bg-error/10'}`}></div>
            
            <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface mb-6 relative z-10">Overall Score</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-6 z-10">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="var(--color-surface-container-high)" strokeWidth="6"></circle>
                <motion.circle 
                  initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (283 * totalScore) / 100 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  cx="50" cy="50" fill="none" r="45" 
                  stroke={totalScore >= 80 ? 'var(--color-primary)' : totalScore >= 50 ? 'var(--color-tertiary)' : 'var(--color-error)'} 
                  strokeDasharray="283" strokeLinecap="round" strokeWidth="6"
                ></motion.circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display text-[52px] font-black text-on-surface leading-none tracking-tight">{totalScore}</span>
                <span className="font-label-md text-[13px] font-bold text-secondary uppercase mt-1">out of 100</span>
              </div>
            </div>
            
            <div className={`relative z-10 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-label-md text-[13px] font-bold uppercase tracking-wider shadow-sm border ${totalScore >= 80 ? 'bg-primary-container/50 border-primary/20 text-primary' : totalScore >= 50 ? 'bg-tertiary-container/50 border-tertiary/20 text-tertiary' : 'bg-error/10 border-error/20 text-error'}`}>
              <span className="material-symbols-outlined text-[16px]">{totalScore >= 50 ? 'check_circle' : 'warning'}</span>
              {totalScore >= 80 ? 'Distinction' : totalScore >= 50 ? 'Pass' : 'Needs Improvement'}
            </div>
          </motion.div>

          {/* General Feedback & Status (Col 8) */}
          <motion.div variants={itemVariants} className="lg:col-span-8 bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-primary border-y border-r border-y-outline-variant/30 border-r-outline-variant/30 flex flex-col relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-title-lg text-[22px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[24px]">rate_review</span>
                Supervisor Comments
              </h3>
              
              {status === 'revision_requested' ? (
                 <span className="bg-error/10 text-error border border-error/20 px-3 py-1.5 rounded-lg font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                   <span className="material-symbols-outlined text-[14px]">edit_note</span> Revision Requested
                 </span>
              ) : status === 'approved' ? (
                 <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-label-sm text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                   <span className="material-symbols-outlined text-[14px]">verified</span> Approved
                 </span>
              ) : null}
            </div>
            
            <div className="relative z-10 flex-1 bg-surface-container-lowest/50 p-6 rounded-[20px] border border-outline-variant/40 custom-scrollbar overflow-y-auto">
              <p className="font-body-lg text-[16px] text-on-surface leading-relaxed whitespace-pre-wrap">
                {feedback || "No additional feedback provided."}
              </p>
            </div>

            {isSupervisor && (
              <div className="mt-6 flex justify-end gap-3 relative z-10">
                <button className="px-5 py-2.5 rounded-xl border border-error/30 text-error font-label-md text-[13px] font-bold hover:bg-error/5 transition-colors">Request Revision</button>
                <button className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary/90 transition-colors">Approve Submission</button>
              </div>
            )}
          </motion.div>

          {/* Rubric Breakdown List (Full Width) */}
          <motion.div variants={itemVariants} className="lg:col-span-12 mt-2">
            <div className="flex items-center gap-3 mb-6">
               <h3 className="font-label-md text-[15px] font-bold uppercase tracking-widest text-on-surface-variant">Rubric Breakdown</h3>
               <div className="flex-1 h-px bg-outline-variant/30"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'problemUnderstanding', label: 'Problem Understanding', max: 10, icon: 'psychology', color: 'bg-primary' },
                { id: 'methodology', label: 'Methodology', max: 20, icon: 'account_tree', color: 'bg-tertiary' },
                { id: 'implementation', label: 'Implementation', max: 30, icon: 'code', color: 'bg-[#10B981]' },
                { id: 'documentation', label: 'Documentation', max: 40, icon: 'menu_book', color: 'bg-[#0EA5E9]' }
              ].map((crit, idx) => {
                const score = scores?.[crit.id] || 0;
                const percentage = (score / crit.max) * 100;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + (idx * 0.1) }}
                    key={crit.id} 
                    className="bg-surface/60 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-surface shadow-sm ${crit.color.replace('bg-', 'bg-')}/10 ${crit.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                          <span className="material-symbols-outlined text-[24px]">{crit.icon}</span>
                        </div>
                        <h4 className="font-title-md text-[18px] font-bold text-on-surface">{crit.label}</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-[28px] font-black text-on-surface leading-none tracking-tight">{score}</span>
                          <span className="font-label-md text-[13px] font-bold text-secondary">/ {crit.max}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                        className={`h-full rounded-full ${crit.color}`} 
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default DetailedFeedback;
