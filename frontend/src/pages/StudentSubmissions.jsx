import React, { useState, useEffect } from 'react';
import { apiFetch, uploadFile, assetUrl } from '../lib/api';
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

const StudentSubmissions = () => {
  const { activeProject } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState({ title: '', file: null });
  const [uploading, setUploading] = useState(false);

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
      const res = await apiFetch(`/api/submissions?project=${activeProject._id}`).catch(() => ({ success: true, data: [] }));
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
    if (!activeProject || !newSub.file) return alert('Please select a file to upload.');
    setUploading(true);
    try {
      // 1. Upload the file from the local device
      const uploaded = await uploadFile(newSub.file);

      // 2. Create the submission record pointing at the stored file
      const res = await apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          title: newSub.title,
          fileUrl: uploaded.fileUrl,
          project: activeProject._id
        })
      });

      if (res.success) {
        setShowModal(false);
        setNewSub({ title: '', file: null });
        setSubmissions([res.data, ...submissions]);
      }
    } catch (e) {
      alert('Submission failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner border border-outline-variant/30">
             <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to view or add submissions.</p>
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
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8 h-full"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Deliverables</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Submissions</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Upload and track your project deliverables for review.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-3.5 rounded-[16px] font-title-sm text-[15px] font-bold flex items-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-[0_8px_20px_rgba(var(--color-primary-rgb),0.2)] hover:shadow-[0_12px_25px_rgba(var(--color-primary-rgb),0.3)] hover:-translate-y-1 active:translate-y-0 group">
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform">upload</span>
            New Submission
          </button>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : submissions.length === 0 ? (
          <motion.div variants={itemVariants} className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-60">
             <span className="material-symbols-outlined text-[64px] text-outline mb-4">task</span>
             <p className="font-title-lg text-secondary">No submissions yet.</p>
             <p className="font-body-md text-outline mt-1">Upload your first deliverable to get started.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {submissions.map((sub, idx) => {
              const statusColor = sub.status === 'Submitted' ? 'bg-secondary' : sub.status === 'Graded' ? 'bg-primary' : 'bg-tertiary';
              const statusIcon = sub.status === 'Submitted' ? 'pending_actions' : sub.status === 'Graded' ? 'verified' : 'rate_review';
              
              return (
                <motion.div key={sub._id || idx} variants={itemVariants} className="bg-surface/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 ${statusColor}`}></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${statusColor}/10 ${statusColor.replace('bg-','text-')} border-current/20`}>
                      <span className="material-symbols-outlined text-[14px]">{statusIcon}</span>
                      {sub.status || 'Submitted'}
                    </div>
                    <span className="font-label-sm text-[11px] font-semibold text-secondary uppercase tracking-widest bg-surface-container-low px-2 py-1 rounded-md">{new Date(sub.submittedAt || new Date()).toLocaleDateString()}</span>
                  </div>
                  
                  <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors relative z-10">{sub.title}</h3>
                  <div className="flex items-center gap-2 mb-8 bg-surface-container-lowest/50 p-3 rounded-xl border border-outline-variant/30 relative z-10">
                     <span className="material-symbols-outlined text-secondary text-[18px]">link</span>
                     <p className="font-body-sm text-[13px] text-secondary truncate">{sub.fileUrl}</p>
                  </div>
                  
                  <div className="mt-auto pt-5 border-t border-outline-variant/30 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-widest mb-1">Status</span>
                      <span className={`font-title-sm text-[15px] font-bold ${sub.grade ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {sub.grade ? `Grade: ${sub.grade}` : 'Under Review'}
                      </span>
                    </div>
                    <a href={assetUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Upload Modal */}
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
                className="bg-surface rounded-[32px] p-8 w-full max-w-md shadow-2xl relative z-10 border border-outline-variant/30"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-variant text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                   <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <h3 className="font-display text-[26px] font-black text-on-surface mb-1">Submit Work</h3>
                <p className="font-body-sm text-[14px] text-secondary mb-8">Upload your deliverables for supervisor review.</p>
                
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Title</label>
                    <input required value={newSub.title} onChange={e => setNewSub({...newSub, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50" placeholder="e.g. Chapter 1 Draft" />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-sm text-[12px] font-bold text-secondary uppercase tracking-widest">Select File</label>
                    <input required type="file" onChange={e => setNewSub({...newSub, file: e.target.files[0]})} className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  </div>
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-outline-variant/30">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold text-on-surface border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
                    <button type="submit" disabled={uploading} className={`px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold bg-primary text-on-primary hover:bg-primary-fixed-variant transition-colors shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[18px]">sync</motion.span> Uploading...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">send</span> Submit</>
                      )}
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

export default StudentSubmissions;
