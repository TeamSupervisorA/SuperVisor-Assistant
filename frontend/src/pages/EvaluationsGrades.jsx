import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

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
      if (res.data) setEvaluations(res.data);
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
        loadEvaluations();
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
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">grading</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project to view or add evaluations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Evaluations & Grades</h1>
          <p className="font-body-lg text-secondary mt-2">Project assessment based on standard rubric criteria.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <span className="material-symbols-outlined">add_task</span>
          New Evaluation
        </button>
      </div>

      {loading ? (
        <p className="text-secondary">Loading evaluations...</p>
      ) : evaluations.length === 0 ? (
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <p className="font-body-md text-secondary">No evaluations found for this project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map(ev => (
            <div key={ev._id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-lg font-bold text-on-surface">Total Score</h3>
                <span className={`text-[20px] font-bold px-3 py-1 rounded-full ${ev.totalScore >= 80 ? 'bg-primary-container text-primary' : ev.totalScore >= 50 ? 'bg-tertiary-container text-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                  {ev.totalScore} / 100
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-[13px]">
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-secondary">Problem Understanding (10)</span>
                  <span className="font-semibold">{ev.scores.problemUnderstanding}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-secondary">Methodology (20)</span>
                  <span className="font-semibold">{ev.scores.methodology}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-secondary">Implementation (30)</span>
                  <span className="font-semibold">{ev.scores.implementation}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                  <span className="text-secondary">Documentation (40)</span>
                  <span className="font-semibold">{ev.scores.documentation}</span>
                </div>
              </div>

              <div className="bg-surface-container p-3 rounded-lg mt-auto">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Feedback</span>
                <p className="text-[13px] text-on-surface leading-snug">{ev.feedback || "No feedback provided."}</p>
              </div>
              <div className="mt-3 text-right">
                <span className="text-[11px] text-outline">Evaluated on {new Date(ev.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Evaluation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-on-surface mb-4">Add Evaluation</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-secondary">Problem Understanding (0-10)</label>
                    <input type="number" min="0" max="10" required value={newEval.scores.problemUnderstanding} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, problemUnderstanding: e.target.value}})} className="w-full px-3 py-2 rounded border border-outline-variant" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-secondary">Methodology (0-20)</label>
                    <input type="number" min="0" max="20" required value={newEval.scores.methodology} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, methodology: e.target.value}})} className="w-full px-3 py-2 rounded border border-outline-variant" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-secondary">Implementation (0-30)</label>
                    <input type="number" min="0" max="30" required value={newEval.scores.implementation} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, implementation: e.target.value}})} className="w-full px-3 py-2 rounded border border-outline-variant" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-secondary">Documentation (0-40)</label>
                    <input type="number" min="0" max="40" required value={newEval.scores.documentation} onChange={e => setNewEval({...newEval, scores: {...newEval.scores, documentation: e.target.value}})} className="w-full px-3 py-2 rounded border border-outline-variant" />
                  </div>
                </div>
                
                <div className="bg-surface-container-low p-3 rounded text-center">
                  <span className="text-sm font-bold">Total Score: {totalScore(newEval.scores)} / 100</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-secondary">Feedback</label>
                  <textarea rows="3" required value={newEval.feedback} onChange={e => setNewEval({...newEval, feedback: e.target.value})} className="w-full px-3 py-2 rounded border border-outline-variant"></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary">Save Evaluation</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvaluationsGrades;
