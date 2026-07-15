import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';

const statusConfig = {
  Pending: { icon: 'schedule', color: 'bg-yellow-500/10 text-yellow-700', dot: 'bg-yellow-500' },
  'In Review': { icon: 'visibility', color: 'bg-tertiary/10 text-tertiary', dot: 'bg-tertiary' },
  Graded: { icon: 'check_circle', color: 'bg-[#10B981]/10 text-[#10B981]', dot: 'bg-[#10B981]' },
  Rejected: { icon: 'cancel', color: 'bg-error/10 text-error', dot: 'bg-error' },
};

const StudentSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSub, setNewSub] = useState({ title: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ ...newSub, project: '60d0fe4f5311236168a109ca' })
      });
      if (res.success) {
        setNewSub({ title: '', fileUrl: '' });
        setShowForm(false);
        loadSubmissions();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || statusConfig.Pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[12px] font-semibold ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-headline-lg text-[32px] font-bold text-on-surface tracking-tight">My Submissions</h1>
          <p className="font-body-md text-[15px] text-secondary mt-1">Track and manage your project deliverables</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-md text-[14px] font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancel' : 'New Submission'}
        </motion.button>
      </motion.div>

      {/* New Submission Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">upload_file</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-[18px] font-bold text-on-surface">Submit New Work</h2>
                  <p className="font-body-sm text-[13px] text-secondary">Upload your deliverable for supervisor review</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="sub-title">Title</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">title</span>
                      <input
                        id="sub-title"
                        required
                        value={newSub.title}
                        onChange={e => setNewSub({...newSub, title: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline"
                        placeholder="e.g. Chapter 3 Draft"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="sub-url">File URL</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">link</span>
                      <input
                        id="sub-url"
                        required
                        value={newSub.fileUrl}
                        onChange={e => setNewSub({...newSub, fileUrl: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-md text-[14px] font-semibold flex items-center gap-2 shadow-sm hover:bg-surface-tint transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="material-symbols-outlined text-[18px]">progress_activity</motion.span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Submit Work
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      {!loading && submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total', value: submissions.length, icon: 'folder', color: 'text-primary' },
            { label: 'Pending', value: submissions.filter(s => s.status === 'Pending').length, icon: 'schedule', color: 'text-yellow-600' },
            { label: 'In Review', value: submissions.filter(s => s.status === 'In Review').length, icon: 'visibility', color: 'text-tertiary' },
            { label: 'Graded', value: submissions.filter(s => s.status === 'Graded').length, icon: 'check_circle', color: 'text-[#10B981]' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex items-center gap-3">
              <span className={`material-symbols-outlined ${stat.color} text-[24px]`}>{stat.icon}</span>
              <div>
                <p className="font-headline-md text-[22px] font-bold text-on-surface">{stat.value}</p>
                <p className="font-label-md text-[12px] text-secondary">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="material-symbols-outlined text-primary text-[40px]"
            >progress_activity</motion.span>
            <p className="font-body-md text-secondary">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
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
              <span className="material-symbols-outlined text-on-surface-variant text-[40px]">cloud_upload</span>
            </motion.div>
            <h3 className="font-title-lg text-[20px] font-bold text-on-surface">No submissions yet</h3>
            <p className="font-body-md text-[15px] text-secondary max-w-sm text-center">Start by submitting your first deliverable — your supervisor will be notified automatically.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label-md text-[14px] font-semibold flex items-center gap-2 hover:bg-surface-tint transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create First Submission
            </button>
          </motion.div>
        ) : (
          submissions.map((sub, idx) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[22px]">description</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-title-lg text-[16px] font-bold text-on-surface truncate">{sub.title}</h3>
                  <p className="font-body-sm text-[13px] text-secondary mt-0.5">
                    Submitted {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {sub.grade && (
                    <p className="font-label-md text-[13px] font-bold text-primary mt-1">Grade: {sub.grade}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={sub.status} />
                <a
                  href={sub.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                  title="View file"
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </a>
                {sub.status === 'Graded' && (
                  <a
                    href={`/detailed-feedback?id=${sub._id}`}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-label-md text-[12px] font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">rate_review</span>
                    Feedback
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSubmissions;
