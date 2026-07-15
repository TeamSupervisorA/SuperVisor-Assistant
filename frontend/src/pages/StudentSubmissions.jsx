import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const StudentSubmissions = () => {
  const { activeProject } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState({ title: '', fileUrl: '' });

  useEffect(() => {
    if (activeProject) {
      loadSubmissions();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/submissions?project=${activeProject._id}`);
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      const res = await apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ ...newSub, project: activeProject._id })
      });
      if (res.success) {
        setShowModal(false);
        setNewSub({ title: '', fileUrl: '' });
        loadSubmissions();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">upload_file</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project to view submissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Submissions</h1>
          <p className="font-body-lg text-secondary mt-2">Upload your deliverables for review.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <span className="material-symbols-outlined">upload</span>
          New Submission
        </button>
      </div>

      {loading ? (
        <p className="text-secondary">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <p className="font-body-md text-secondary">No submissions yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map(sub => (
            <div key={sub._id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col relative group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${sub.status === 'Submitted' ? 'bg-secondary/10 text-secondary' : sub.status === 'Graded' ? 'bg-primary-container text-primary' : 'bg-tertiary-container text-tertiary-container'}`}>
                  {sub.status}
                </span>
                <span className="text-[12px] text-secondary">{new Date(sub.submittedAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-title-lg text-[18px] font-semibold text-on-surface mb-2">{sub.title}</h3>
              <p className="font-body-sm text-secondary truncate">{sub.fileUrl}</p>
              
              <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-[14px] font-semibold text-primary">{sub.grade ? `Grade: ${sub.grade}` : 'No grade yet'}</span>
                <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[13px] font-semibold flex items-center gap-1">
                  View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-on-surface mb-4">Submit Work</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input required value={newSub.title} onChange={e => setNewSub({...newSub, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">File URL</label>
                  <input required type="url" value={newSub.fileUrl} onChange={e => setNewSub({...newSub, fileUrl: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest" placeholder="https://" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentSubmissions;
