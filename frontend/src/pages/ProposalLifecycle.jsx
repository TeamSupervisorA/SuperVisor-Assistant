import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const ProposalLifecycle = () => {
  const { activeProject, user } = useAuth();
  const [versions, setVersions] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isSupervisor = ['supervisor', 'admin'].includes(user?.role);

  const loadVersions = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}/proposals`);
      setVersions(response.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVersions(); }, [activeProject?._id]);

  const createDraft = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}/proposals`, {
        method: 'POST', body: JSON.stringify({ title, content })
      });
      setVersions((current) => [response.data, ...current]);
      setTitle('');
      setContent('');
      setMessage(`Draft version ${response.data.versionNo} created.`);
    } catch (error) { setMessage(error.message); }
  };

  const submit = async (versionId) => {
    try {
      await apiFetch(`/api/proposals/${versionId}/submit`, { method: 'POST' });
      setMessage('Proposal submitted to the assigned supervisor.');
      loadVersions();
    } catch (error) { setMessage(error.message); }
  };

  const decide = async (versionId, decision) => {
    const comment = window.prompt('Optional decision comment:') || '';
    try {
      await apiFetch(`/api/proposals/${versionId}/decision`, { method: 'POST', body: JSON.stringify({ decision, comment }) });
      setMessage(`Proposal ${decision.replace('_', ' ')}.`);
      loadVersions();
    } catch (error) { setMessage(error.message); }
  };

  if (!activeProject) return <EmptyState text="Select a project to manage its proposal versions." />;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header>
        <p className="text-primary font-semibold text-sm uppercase tracking-wider">Academic workflow</p>
        <h1 className="text-3xl font-bold text-on-surface mt-1">Proposal versions</h1>
        <p className="text-secondary mt-2">{activeProject.title} · Submitted versions remain immutable and every decision is tied to one version.</p>
      </header>
      {message && <div role="status" className="rounded-xl border border-primary/30 bg-primary/10 text-on-surface px-4 py-3">{message}</div>}
      {!isSupervisor && (
        <form onSubmit={createDraft} className="bg-surface border border-outline-variant/30 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Create a new draft version</h2>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Proposal title" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3" />
          <textarea required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Describe the problem, objectives, method and expected outcome." rows="8" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3" />
          <button className="rounded-xl bg-primary text-on-primary px-5 py-3 font-semibold">Save draft</button>
        </form>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Version history</h2>
        {loading ? <p className="text-secondary">Loading versions…</p> : versions.length === 0 ? <p className="text-secondary">No proposal versions have been created yet.</p> : versions.map((version) => (
          <article key={version._id} className="bg-surface border border-outline-variant/30 rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-bold text-lg">Version {version.versionNo}: {version.title}</h3><p className="text-sm text-secondary">Created by {version.createdBy?.name || 'team member'} · {new Date(version.createdAt).toLocaleString()}</p></div>
              <span className="rounded-full bg-surface-container px-3 py-1 text-sm font-semibold capitalize">{version.state.replace('_', ' ')}</span>
            </div>
            <p className="whitespace-pre-wrap text-on-surface-variant">{version.content}</p>
            {version.decision?.comment && <p className="rounded-lg bg-surface-container-low p-3"><strong>Supervisor decision:</strong> {version.decision.comment}</p>}
            <div className="flex flex-wrap gap-3">
              {!isSupervisor && version.state === 'draft' && <button onClick={() => submit(version._id)} className="rounded-lg bg-primary text-on-primary px-4 py-2 font-semibold">Submit for review</button>}
              {isSupervisor && ['submitted', 'resubmitted', 'under_review'].includes(version.state) && <>
                <button onClick={() => decide(version._id, 'approved')} className="rounded-lg bg-primary text-on-primary px-4 py-2 font-semibold">Approve</button>
                <button onClick={() => decide(version._id, 'revision_requested')} className="rounded-lg border border-tertiary text-tertiary px-4 py-2 font-semibold">Request revision</button>
                <button onClick={() => decide(version._id, 'rejected')} className="rounded-lg border border-error text-error px-4 py-2 font-semibold">Reject</button>
              </>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

const EmptyState = ({ text }) => <div className="min-h-[60vh] grid place-items-center p-6 text-center text-secondary">{text}</div>;
export default ProposalLifecycle;
