import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const ProgressLogs = () => {
  const { activeProject, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState('');
  const [blockers, setBlockers] = useState('');
  const [message, setMessage] = useState('');
  const projectId = activeProject?._id;

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await apiFetch(`/api/projects/${projectId}/progress-logs`);
      setLogs(response.data || []);
    } catch (error) { setMessage(error.message); }
  }, [projectId]);
  useEffect(() => { if (projectId) load(); else setLogs([]); }, [projectId, load]);

  const create = async (event) => {
    event.preventDefault();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    try {
      const response = await apiFetch(`/api/projects/${activeProject._id}/progress-logs`, { method: 'POST', body: JSON.stringify({ weekStart, summary, blockers }) });
      setLogs((current) => [response.data, ...current]);
      setSummary(''); setBlockers(''); setMessage('Weekly progress draft saved. Submit it when ready.');
    } catch (error) { setMessage(error.message); }
  };
  const submit = async (id) => {
    try { await apiFetch(`/api/progress-logs/${id}/submit`, { method: 'POST' }); setMessage('Progress log submitted.'); load(); }
    catch (error) { setMessage(error.message); }
  };

  if (!activeProject) return <div className="min-h-[60vh] grid place-items-center p-6 text-secondary">Select a project to view progress logs.</div>;
  return <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
    <header><p className="text-primary font-semibold text-sm uppercase tracking-wider">Evidence and accountability</p><h1 className="text-3xl font-bold text-on-surface mt-1">Weekly progress logs</h1><p className="text-secondary mt-2">{activeProject.title}</p></header>
    {message && <p role="status" className="rounded-xl bg-primary/10 border border-primary/30 p-3">{message}</p>}
    {user?.role === 'student' && <form onSubmit={create} className="space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-6"><h2 className="font-bold text-lg">Record this week’s progress</h2><textarea required value={summary} onChange={(event) => setSummary(event.target.value)} rows="4" placeholder="Work completed, evidence and next step" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} rows="2" placeholder="Blockers (if any)" className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3" /><button className="rounded-xl bg-primary text-on-primary px-5 py-3 font-semibold">Save draft</button></form>}
    <section className="space-y-4"><h2 className="text-xl font-bold">Submitted and draft logs</h2>{logs.length === 0 ? <p className="text-secondary">No logs yet.</p> : logs.map((log) => { const currentUserId = String(user?._id || user?.id || ''); const authorId = String(log.author?._id || log.author?.id || log.author || ''); return <article key={log._id} className="rounded-2xl border border-outline-variant/30 bg-surface p-5 space-y-2"><div className="flex justify-between gap-4"><strong>{new Date(log.weekStart).toLocaleDateString()} · {log.author?.name || 'You'}</strong><span className="capitalize text-secondary">{log.state}</span></div><p className="whitespace-pre-wrap">{log.summary}</p>{log.blockers && <p className="rounded-lg bg-tertiary-container/20 p-3"><strong>Blockers:</strong> {log.blockers}</p>}{currentUserId && currentUserId === authorId && log.state === 'draft' && <button onClick={() => submit(log._id)} className="rounded-lg border border-primary text-primary px-4 py-2 font-semibold">Submit log</button>}</article>; })}</section>
  </div>;
};

export default ProgressLogs;
