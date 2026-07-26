import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const ReviewWorkspace = () => {
  const { activeProject, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [proposalVersion, setProposalVersion] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [finding, setFinding] = useState({ section: 'General', severity: 'medium', explanation: '', recommendation: '' });
  const [message, setMessage] = useState('');
  const supervisor = ['supervisor', 'admin'].includes(user?.role);

  const load = async () => {
    if (!activeProject) return;
    try {
      const [reviewResponse, proposalResponse] = await Promise.all([
        apiFetch(`/api/projects/${activeProject._id}/reviews`),
        apiFetch(`/api/projects/${activeProject._id}/proposals`)
      ]);
      setReviews(reviewResponse.data || []);
      setProposals(proposalResponse.data || []);
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { load(); }, [activeProject?._id]);

  const createReview = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ proposalVersion, overallComment, findings: finding.explanation ? [finding] : [] }) });
      await apiFetch(`/api/reviews/${response.data._id}/submit`, { method: 'POST' });
      setMessage('Supervisor review submitted and attributed to the selected version.');
      setOverallComment(''); setFinding({ section: 'General', severity: 'medium', explanation: '', recommendation: '' });
      load();
    } catch (error) { setMessage(error.message); }
  };

  if (!activeProject) return <div className="min-h-[60vh] grid place-items-center p-6 text-secondary">Select a project to access version-linked reviews.</div>;
  return <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
    <header><p className="text-primary font-semibold text-sm uppercase tracking-wider">Academic feedback</p><h1 className="text-3xl font-bold text-on-surface mt-1">Proposal reviews</h1><p className="text-secondary mt-2">Findings are linked to the exact proposal version reviewed.</p></header>
    {message && <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-3">{message}</p>}
    {supervisor && <form onSubmit={createReview} className="rounded-2xl border border-outline-variant/30 bg-surface p-6 grid gap-4"><h2 className="text-lg font-bold">Create supervisor review</h2><select required value={proposalVersion} onChange={(event) => setProposalVersion(event.target.value)} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"><option value="">Select submitted proposal version</option>{proposals.filter((proposal) => ['submitted', 'resubmitted', 'under_review'].includes(proposal.state)).map((proposal) => <option value={proposal._id} key={proposal._id}>Version {proposal.versionNo}: {proposal.title}</option>)}</select><textarea value={overallComment} onChange={(event) => setOverallComment(event.target.value)} required rows="3" placeholder="Overall academic feedback" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><div className="grid md:grid-cols-2 gap-3"><input value={finding.section} onChange={(event) => setFinding({ ...finding, section: event.target.value })} placeholder="Section" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><select value={finding.severity} onChange={(event) => setFinding({ ...finding, severity: event.target.value })} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><textarea value={finding.explanation} onChange={(event) => setFinding({ ...finding, explanation: event.target.value })} rows="2" placeholder="Finding explanation (optional)" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><input value={finding.recommendation} onChange={(event) => setFinding({ ...finding, recommendation: event.target.value })} placeholder="Recommended action (optional)" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><button className="w-fit rounded-xl bg-primary text-on-primary px-5 py-3 font-semibold">Submit review</button></form>}
    <section className="space-y-4"><h2 className="text-xl font-bold">Review history</h2>{reviews.length === 0 ? <p className="text-secondary">No reviews are available for this project.</p> : reviews.map((review) => <article key={review._id} className="rounded-2xl border border-outline-variant/30 bg-surface p-5 space-y-3"><div className="flex justify-between gap-4"><div><strong>{review.proposalVersion?.title || 'Proposal version'}</strong><p className="text-sm text-secondary">Version {review.proposalVersion?.versionNo} · {review.reviewer?.name || 'Supervisor'}</p></div><span className="capitalize text-secondary">{review.state}</span></div><p>{review.overallComment}</p>{review.findings?.map((item) => <div key={item._id} className="rounded-xl bg-surface-container-low p-3"><p><strong>{item.section}</strong> · {item.severity}</p><p>{item.explanation}</p>{item.recommendation && <p className="text-secondary">Recommendation: {item.recommendation}</p>}</div>)}</article>)}</section>
  </div>;
};
export default ReviewWorkspace;
