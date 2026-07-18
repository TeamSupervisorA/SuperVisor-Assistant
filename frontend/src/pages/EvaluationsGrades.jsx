import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const EvaluationsGrades = () => {
  const { activeProject } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEval, setNewEval] = useState({ 
    scores: { problemUnderstanding: 0, methodology: 0, implementation: 0, documentation: 0 },
    feedback: '' 
  });

  useEffect(() => {
    if (activeProject) {
      loadEvaluations();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/evaluations?project=${activeProject._id}`);
      if (res && res.data) {
        setEvaluations(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const res = await apiFetch('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify({ ...newEval, project: activeProject._id })
      });
      
      if (res.success) {
        setShowModal(false);
        setNewEval({ scores: { problemUnderstanding: 0, methodology: 0, implementation: 0, documentation: 0 }, feedback: '' });
        if (res.data) {
          setEvaluations([...evaluations, res.data]);
        } else {
          loadEvaluations();
        }
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const totalScore = (scores) => {
    return Number(scores.problemUnderstanding) + Number(scores.methodology) + Number(scores.implementation) + Number(scores.documentation);
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner">
             <span className="material-symbols-outlined text-[40px] text-primary">grading</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to view or add evaluations.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Assessment</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Evaluations & Grades</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Project assessment based on standard rubric criteria.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-3.5 rounded-[16px] font-title-sm text-[15px] font-bold flex items-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
            <span className="material-symbols-outlined text-[20px]">add_task</span>
            New Evaluation
          </button>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : evaluations.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-16 rounded-[32px] shadow-sm">
            <div className="w-16 h-16 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-secondary">inbox</span>
            </div>
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-2">No evaluations yet</h3>
            <p className="font-body-md text-[15px] text-secondary max-w-md mx-auto">This project hasn't received any formal grades or evaluations yet. Click 'New Evaluation' to create one.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {evaluations.map((ev, idx) => {
              const score = ev.totalScore || totalScore(ev.scores);
              const isExcellent = score >= 80;
              const isAverage = score >= 50 && score < 80;
              const isPoor = score < 50;

              return (
                <motion.div key={ev._id || idx} variants={itemVariants} className="bg-surface/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${isExcellent ? 'bg-primary' : isAverage ? 'bg-tertiary' : 'bg-error'}`}></div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <h3 className="font-title-lg text-[20px] font-bold text-on-surface mb-1">Total Score</h3>
                      <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest">Final Grade</span>
                    </div>
                    <div className={`flex flex-col items-end`}>
                      <span className={`text-[32px] font-display font-black leading-none ${isExcellent ? 'text-primary' : isAverage ? 'text-tertiary' : 'text-error'}`}>
                        {score}
                      </span>
                      <span className="text-[14px] font-bold text-secondary">/ 100</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8 relative z-10">
                    <div className="flex justify-between items-center p-3 rounded-[12px] bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                      <span className="font-body-sm text-[13px] text-secondary">Problem Understanding (10)</span>
                      <span className="font-title-sm text-[15px] font-bold text-on-surface">{ev.scores.problemUnderstanding}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-[12px] bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                      <span className="font-body-sm text-[13px] text-secondary">Methodology (20)</span>
                      <span className="font-title-sm text-[15px] font-bold text-on-surface">{ev.scores.methodology}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-[12px] bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                      <span className="font-body-sm text-[13px] text-secondary">Implementation (30)</span>
                      <span className="font-title-sm text-[15px] font-bold text-on-surface">{ev.scores.implementation}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-[12px] bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
                      <span className="font-body-sm text-[13px] text-secondary">Documentation (40)</span>
                      <span className="font-title-sm text-[15px] font-bold text-on-surface">{ev.scores.documentation}</span>
                    </div>
                  </div>

                  <div className="bg-surface-container/30 backdrop-blur-md p-5 rounded-[20px] mt-auto border border-outline-variant/20 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="material-symbols-outlined text-[16px] text-primary">chat</span>
                       <span className="font-label-sm text-[12px] font-bold text-primary uppercase tracking-widest">Feedback</span>
                    </div>
                    <p className="font-body-sm text-[14px] text-on-surface leading-relaxed">{ev.feedback || "No feedback provided."}</p>
                  </div>
                  
                  <div className="mt-6 text-right relative z-10">
                    <span className="font-label-md text-[11px] font-semibold text-secondary uppercase tracking-wider">Evaluated on {new Date(ev.createdAt).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Add Evaluation Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
              
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                className="bg-surface rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden border border-outline-variant/30"
              >
                <div className="p-8 pb-6 border-b border-surface-container relative z-10">
                  <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-secondary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                     <span className="material-symbols-outlined text-[24px]">grading</span>
                  </div>
                  <h3 className="font-display text-[28px] font-black text-on-surface">Add Evaluation</h3>
                  <p className="font-body-sm text-[14px] text-secondary mt-1">Grade the project based on the standard rubric.</p>
                </div>

                <form onSubmit={handleCreate} className="p-8 space-y-8 overflow-y-auto flex-1 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Problem Understanding (0-10)</label>
                      <input type="number" min="0" max="10" required value={newEval.scores.problemUnderstanding} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, problemUnderstanding: e.target.value}})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Methodology (0-20)</label>
                      <input type="number" min="0" max="20" required value={newEval.scores.methodology} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, methodology: e.target.value}})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Implementation (0-30)</label>
                      <input type="number" min="0" max="30" required value={newEval.scores.implementation} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, implementation: e.target.value}})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Documentation (0-40)</label>
                      <input type="number" min="0" max="40" required value={newEval.scores.documentation} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, documentation: e.target.value}})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 p-5 rounded-[20px] flex items-center justify-between">
                    <span className="font-title-md text-[16px] font-bold text-on-surface">Total Calculated Score</span>
                    <span className="font-display text-[28px] font-black text-primary">{totalScore(newEval.scores)} <span className="text-[18px] text-secondary font-bold">/ 100</span></span>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Feedback Comments</label>
                    <textarea rows="4" required value={newEval.feedback} onChange={e => setNewEval({...newEval, feedback: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y" placeholder="Provide constructive feedback for the students..."></textarea>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-outline-variant/30">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold text-on-surface border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2">
                       <span className="material-symbols-outlined text-[18px]">save</span> Save Evaluation
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EvaluationsGrades;
