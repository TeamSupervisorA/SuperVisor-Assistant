import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch, uploadFile, assetUrl } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

const statusMeta = {
  Submitted: { icon: 'pending_actions', tone: 'bg-secondary text-on-secondary' },
  'Under Review': { icon: 'rate_review', tone: 'bg-tertiary text-on-tertiary' },
  'Needs Revision': { icon: 'edit_note', tone: 'bg-error text-on-error' },
  Graded: { icon: 'verified', tone: 'bg-primary text-on-primary' }
};

const StudentSubmissions = () => {
  const { activeProject, user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [newSub, setNewSub] = useState({ title: '', file: null, content: '' });
  const [reviewDraft, setReviewDraft] = useState({ status: 'Graded', grade: '', feedback: '' });
  const [uploading, setUploading] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isStudent = user?.role === 'student';
  const canReview = ['supervisor', 'admin'].includes(user?.role);
  const projectId = activeProject?._id;

  const loadSubmissions = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/submissions?project=${projectId}`);
      setSubmissions(response.data || []);
      setError('');
    } catch (requestError) {
      setSubmissions([]);
      setError(requestError.message || 'Unable to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadSubmissions();
    else { setSubmissions([]); setLoading(false); }
  }, [projectId, loadSubmissions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeProject || uploading) return;
    const title = newSub.title.trim();
    const content = newSub.content.trim();
    if (!title) { setError('Give this deliverable a clear title.'); return; }
    if (!newSub.file && !content) {
      setError('Attach a file or paste the submitted text before sending this deliverable.');
      return;
    }

    setError('');
    setNotice('');
    setUploading(true);
    try {
      let fileUrl;
      if (newSub.file) {
        const uploaded = await uploadFile(newSub.file);
        fileUrl = uploaded.fileUrl;
      }
      const payload = { title, content, project: activeProject._id };
      if (fileUrl) payload.fileUrl = fileUrl;
      const response = await apiFetch('/api/submissions', { method: 'POST', body: JSON.stringify(payload) });
      setSubmissions((current) => [response.data, ...current]);
      setShowSubmitModal(false);
      setNewSub({ title: '', file: null, content: '' });
      setNotice('Deliverable submitted for supervisor review.');
    } catch (requestError) {
      setError(requestError.message || 'Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const openReview = (submission) => {
    setError('');
    setNotice('');
    setReviewingSubmission(submission);
    setReviewDraft({
      status: submission.status === 'Submitted' ? 'Under Review' : (submission.status || 'Under Review'),
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
  };

  const saveReview = async (event) => {
    event.preventDefault();
    if (!reviewingSubmission || savingReview) return;
    const grade = reviewDraft.grade.trim();
    const feedback = reviewDraft.feedback.trim();
    if (reviewDraft.status === 'Graded' && !grade) { setError('A graded submission needs a recorded grade.'); return; }
    if (reviewDraft.status === 'Needs Revision' && !feedback) { setError('Explain the requested revision so the student can act on it.'); return; }

    setError('');
    setNotice('');
    setSavingReview(true);
    try {
      const response = await apiFetch(`/api/submissions/${reviewingSubmission._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: reviewDraft.status, grade, feedback })
      });
      setSubmissions((current) => current.map((submission) => submission._id === response.data._id ? response.data : submission));
      setReviewingSubmission(null);
      setNotice('Submission review saved. The student can now see the outcome and feedback.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to save the review.');
    } finally {
      setSavingReview(false);
    }
  };

  if (!activeProject) {
    return <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center bg-background p-6"><div className="max-w-lg rounded-[32px] border border-outline-variant/30 bg-surface p-12 text-center shadow-xl"><span className="material-symbols-outlined text-[40px] text-primary">upload_file</span><h2 className="mt-5 font-display text-[28px] font-black text-on-surface">No Project Selected</h2><p className="mt-2 text-secondary">Select a project from the top navigation to view its deliverables.</p></div></div>;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-5 py-7 md:px-10 md:py-10">
      <motion.div initial="hidden" animate="show" variants={containerVariants} className="mx-auto flex max-w-[1440px] flex-col gap-7">
        <motion.header variants={itemVariants} className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-primary">Deliverables</span><h1 className="mt-3 font-display text-[32px] font-black leading-none tracking-tight text-on-surface md:text-[42px]">{isStudent ? 'My submissions' : 'Deliverable review'}</h1><p className="mt-2 text-[16px] font-medium text-on-surface-variant">{isStudent ? 'Submit work and follow feedback from your assigned supervisor.' : `Review deliverables for ${activeProject.title}, record feedback, and return work for revision when needed.`}</p></div>{isStudent && <button onClick={() => { setError(''); setNotice(''); setShowSubmitModal(true); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-[15px] font-bold text-on-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="material-symbols-outlined text-[20px]">upload</span>New submission</button>}</motion.header>

        {error && <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 px-5 py-3 text-sm font-medium text-error">{error}</div>}
        {notice && <div role="status" className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-medium text-on-surface">{notice}</div>}
        {canReview && <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-on-surface-variant">Use <strong className="text-on-surface">Review submission</strong> to set its outcome and leave actionable feedback. Students receive a notification when you save.</div>}

        {loading ? <div className="grid min-h-64 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div> : submissions.length === 0 ? <motion.div variants={itemVariants} className="rounded-[32px] border border-outline-variant/30 bg-surface p-16 text-center shadow-sm"><span className="material-symbols-outlined text-[56px] text-outline">task</span><p className="mt-4 text-lg font-bold text-secondary">No submissions yet.</p><p className="mt-1 text-sm text-outline">{isStudent ? 'Submit the first deliverable when it is ready for review.' : 'Student deliverables will appear here for review.'}</p></motion.div> : <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{submissions.map((submission) => {
          const meta = statusMeta[submission.status] || statusMeta.Submitted;
          return <motion.article key={submission._id} variants={itemVariants} className="flex min-h-80 flex-col rounded-[28px] border border-outline-variant/30 bg-surface p-6 shadow-sm"><div className="flex items-start justify-between gap-3"><span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${meta.tone}`}><span className="material-symbols-outlined text-[14px]">{meta.icon}</span>{submission.status || 'Submitted'}</span><span className="text-right text-[11px] font-semibold uppercase tracking-widest text-secondary">{new Date(submission.submittedAt || Date.now()).toLocaleDateString()}</span></div><h2 className="mt-6 text-xl font-bold leading-tight text-on-surface">{submission.title}</h2>{canReview && <p className="mt-2 text-sm text-secondary">Submitted by {submission.student?.name || 'Student'}</p>}<div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-3 text-sm text-secondary">{submission.fileUrl ? <a href={assetUrl(submission.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 truncate text-primary hover:underline"><span className="material-symbols-outlined text-[18px]">attach_file</span><span className="truncate">Open attached file</span></a> : <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">article</span>Text-only submission</span>}</div>{submission.feedback && <div className="mt-4 rounded-xl border-l-4 border-l-tertiary bg-tertiary-container/10 p-4 text-sm text-on-surface"><p className="font-bold text-tertiary">Supervisor feedback</p><p className="mt-1 whitespace-pre-wrap">{submission.feedback}</p></div>}<div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-5"><div><p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Outcome</p><p className={`mt-1 text-sm font-bold ${submission.grade ? 'text-primary' : 'text-on-surface-variant'}`}>{submission.grade ? `Grade: ${submission.grade}` : submission.status === 'Needs Revision' ? 'Revision requested' : 'Awaiting review'}</p></div>{canReview && <button onClick={() => openReview(submission)} className="rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10">Review submission</button>}</div></motion.article>;
        })}</motion.div>}
      </motion.div>

      <AnimatePresence>{showSubmitModal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[30px] border border-outline-variant/30 bg-surface p-7 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-on-surface">Submit deliverable</h2><p className="mt-1 text-sm text-secondary">Attach a file, paste the submitted text, or provide both.</p></div><button type="button" onClick={() => setShowSubmitModal(false)} className="rounded-lg p-2 text-secondary hover:bg-surface-container" aria-label="Close submission form"><span className="material-symbols-outlined">close</span></button></div><form onSubmit={handleSubmit} className="mt-6 space-y-5"><label className="block text-sm font-bold text-on-surface">Title<input required value={newSub.title} onChange={(event) => setNewSub({ ...newSub, title: event.target.value })} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 font-normal outline-none focus:border-primary" placeholder="e.g. Chapter 1 draft" /></label><label className="block text-sm font-bold text-on-surface">Attachment <span className="font-normal text-secondary">(optional when text is provided)</span><input type="file" onChange={(event) => setNewSub({ ...newSub, file: event.target.files?.[0] || null })} className="mt-2 block w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm font-normal file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary" /></label><p className="rounded-xl border border-tertiary/25 bg-tertiary/10 p-3 text-xs leading-relaxed text-on-surface-variant">On a serverless deployment, uploaded files need configured object storage. If file upload is unavailable, paste the submitted text below so your supervisor can still receive and review it.</p><label className="block text-sm font-bold text-on-surface">Submitted text <span className="font-normal text-secondary">(optional when a file is attached)</span><textarea value={newSub.content} onChange={(event) => setNewSub({ ...newSub, content: event.target.value })} maxLength="60000" rows="7" className="mt-2 w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 font-normal outline-none focus:border-primary" placeholder="Paste the content to submit it as text and enable the integrity screen when applicable." /></label><p className="text-xs text-secondary">Integrity screening needs at least 200 characters and is an aid for human review, not a plagiarism verdict.</p><div className="flex justify-end gap-3 border-t border-outline-variant/30 pt-5"><button type="button" onClick={() => setShowSubmitModal(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container">Cancel</button><button disabled={uploading} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{uploading ? 'Submitting…' : 'Submit for review'}</button></div></form></motion.div></div>}</AnimatePresence>

      <AnimatePresence>{reviewingSubmission && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="w-full max-w-xl rounded-[30px] border border-outline-variant/30 bg-surface p-7 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Supervisor review</p><h2 className="mt-1 text-2xl font-black text-on-surface">{reviewingSubmission.title}</h2><p className="mt-1 text-sm text-secondary">{reviewingSubmission.student?.name || 'Student'}</p></div><button type="button" onClick={() => setReviewingSubmission(null)} className="rounded-lg p-2 text-secondary hover:bg-surface-container" aria-label="Close review form"><span className="material-symbols-outlined">close</span></button></div><form onSubmit={saveReview} className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-on-surface">Outcome<select value={reviewDraft.status} onChange={(event) => setReviewDraft({ ...reviewDraft, status: event.target.value })} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none focus:border-primary"><option>Under Review</option><option>Needs Revision</option><option>Graded</option></select></label><label className="text-sm font-bold text-on-surface">Grade <span className="font-normal text-secondary">{reviewDraft.status === 'Graded' ? '(required)' : '(optional)'}</span><input value={reviewDraft.grade} onChange={(event) => setReviewDraft({ ...reviewDraft, grade: event.target.value })} className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none focus:border-primary" placeholder="e.g. 85/100 or A-" /></label></div><label className="block text-sm font-bold text-on-surface">Feedback <span className="font-normal text-secondary">{reviewDraft.status === 'Needs Revision' ? '(required)' : '(recommended)'}</span><textarea value={reviewDraft.feedback} onChange={(event) => setReviewDraft({ ...reviewDraft, feedback: event.target.value })} rows="6" className="mt-2 w-full resize-y rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-3 font-normal outline-none focus:border-primary" placeholder="State what is strong, what needs revision, and the next action." /></label><div className="flex justify-end gap-3 border-t border-outline-variant/30 pt-5"><button type="button" onClick={() => setReviewingSubmission(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container">Cancel</button><button disabled={savingReview} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-60">{savingReview ? 'Saving…' : 'Save review'}</button></div></form></motion.div></div>}</AnimatePresence>
    </div>
  );
};

export default StudentSubmissions;
