import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const StudentSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSub, setNewSub] = useState({ title: '', fileUrl: '' });

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
    try {
      const res = await apiFetch('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ ...newSub, project: '60d0fe4f5311236168a109ca' })
      });
      if (res.success) {
        setNewSub({ title: '', fileUrl: '' });
        loadSubmissions();
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-container_max mx-auto p-margin_desktop">
      <h1 className="font-headline-lg text-[32px] font-bold mb-6">My Submissions</h1>
      
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm mb-8 border border-outline-variant/30">
        <h2 className="text-xl font-semibold mb-4">Submit New Work</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input required value={newSub.title} onChange={e => setNewSub({...newSub, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">File URL</label>
            <input required value={newSub.fileUrl} onChange={e => setNewSub({...newSub, fileUrl: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="https://..." />
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">Submit</button>
        </form>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <h2 className="text-xl font-semibold mb-4">Past Submissions</h2>
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub._id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-surface-container-low transition-colors">
                <div>
                  <h3 className="font-semibold text-lg">{sub.title}</h3>
                  <p className="text-sm text-secondary">Status: <span className="font-bold">{sub.status}</span></p>
                  <p className="text-sm text-secondary">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">View File</a>
                  {sub.status === 'Graded' && (
                    <a href={`/detailed-feedback?id=${sub._id}`} className="text-tertiary hover:underline">View Feedback</a>
                  )}
                </div>
              </div>
            ))}
            {submissions.length === 0 && <p className="text-secondary">No submissions yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubmissions;
