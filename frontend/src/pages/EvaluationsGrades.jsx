import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';

const statusConfig = {
  Pending: { icon: 'schedule', color: 'bg-yellow-500/10 text-yellow-700', dot: 'bg-yellow-500', label: 'Pending Review' },
  'In Review': { icon: 'visibility', color: 'bg-tertiary/10 text-tertiary', dot: 'bg-tertiary', label: 'In Review' },
  Graded: { icon: 'check_circle', color: 'bg-[#10B981]/10 text-[#10B981]', dot: 'bg-[#10B981]', label: 'Graded' },
  Rejected: { icon: 'cancel', color: 'bg-error/10 text-error', dot: 'bg-error', label: 'Needs Revision' },
};

const EvaluationsGrades = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const res = await apiFetch('/api/submissions');
      if (res.data) setSubmissions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/submissions/${evaluating._id}`, {
        method: 'PUT',
        body: JSON.stringify({ grade, feedback, status: 'Graded' })
      });
      if (res.success) {
        setEvaluating(null);
        setGrade('');
        setFeedback('');
        loadSubmissions();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.Pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[12px] font-semibold ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
        {cfg.label || status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-headline-lg text-[32px] font-bold text-on-surface tracking-tight">Evaluations & Grades</h1>
        <p className="font-body-md text-[15px] text-secondary mt-1">Review student submissions and provide structured feedback</p>
      </motion.div>

      {/* Stats Overview */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Submissions', value: submissions.length, icon: 'inbox', color: 'text-primary', bg: 'bg-primary/8' },
            { label: 'Pending Review', value: submissions.filter(s => s.status === 'Pending' || s.status === 'In Review').length, icon: 'pending_actions', color: 'text-yellow-600', bg: 'bg-yellow-500/8' },
            { label: 'Graded', value: submissions.filter(s => s.status === 'Graded').length, icon: 'task_alt', color: 'text-[#10B981]', bg: 'bg-[#10B981]/8' },
            { label: 'Avg. Grade', value: (() => { const graded = submissions.filter(s => s.grade); if (!graded.length) return '—'; const avg = graded.reduce((a, s) => a + parseFloat(s.grade) || 0, 0) / graded.length; return isNaN(avg) ? '—' : avg.toFixed(0); })(), icon: 'analytics', color: 'text-tertiary', bg: 'bg-tertiary/8' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 group hover:shadow-md hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${stat.color} text-[22px]`}>{stat.icon}</span>
                </div>
              </div>
              <p className="font-headline-md text-[28px] font-bold text-on-surface">{stat.value}</p>
              <p className="font-label-md text-[12px] text-secondary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', icon: 'list' },
          { key: 'Pending', label: 'Pending', icon: 'schedule' },
          { key: 'In Review', label: 'In Review', icon: 'visibility' },
          { key: 'Graded', label: 'Graded', icon: 'check_circle' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-label-md text-[13px] font-semibold transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="material-symbols-outlined text-primary text-[40px]"
            >progress_activity</motion.span>
            <p className="font-body-md text-secondary">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[40px]">grading</span>
            </motion.div>
            <h3 className="font-title-lg text-[20px] font-bold text-on-surface">No submissions found</h3>
            <p className="font-body-md text-[15px] text-secondary">
              {filter === 'all' ? 'No submissions to evaluate yet.' : `No ${filter.toLowerCase()} submissions.`}
            </p>
          </motion.div>
        ) : (
          filteredSubmissions.map((sub, idx) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 hover:shadow-md hover:border-primary/15 transition-all group"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <span className="material-symbols-outlined text-primary text-[22px]">article</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-title-lg text-[16px] font-bold text-on-surface truncate">{sub.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="font-body-sm text-[13px] text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        {sub.student?.name || 'Unknown Student'}
                      </span>
                      <span className="font-body-sm text-[13px] text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {sub.grade && (
                        <span className="font-label-md text-[13px] font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">star</span>
                          Grade: {sub.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={sub.status} />
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                    title="View submitted file"
                  >
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </a>
                  {sub.status !== 'Graded' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setEvaluating(sub); setGrade(''); setFeedback(''); }}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-semibold hover:bg-surface-tint transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">rate_review</span>
                      Evaluate
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Evaluation Modal */}
      <AnimatePresence>
        {evaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4"
            onClick={() => setEvaluating(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/20 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[24px]">grading</span>
                    </div>
                    <div>
                      <h3 className="font-title-lg text-[20px] font-bold text-on-surface">Evaluate Submission</h3>
                      <p className="font-body-sm text-[13px] text-secondary mt-0.5 truncate max-w-[280px]">{evaluating.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEvaluating(null)}
                    className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEvaluate} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="eval-grade">Grade</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">star</span>
                    <input
                      id="eval-grade"
                      required
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline"
                      placeholder="e.g. 85/100 or A+"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="eval-feedback">Detailed Feedback</label>
                  <div className="relative">
                    <textarea
                      id="eval-feedback"
                      required
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline resize-none h-36"
                      placeholder="Provide constructive feedback on methodology, analysis quality, writing clarity..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEvaluating(null)}
                    className="px-5 py-2.5 rounded-xl font-label-md text-[14px] font-semibold text-secondary hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[14px] font-semibold hover:bg-surface-tint transition-all flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="material-symbols-outlined text-[18px]">progress_activity</motion.span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        Submit Evaluation
                      </>
                    )}
                  </motion.button>
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
