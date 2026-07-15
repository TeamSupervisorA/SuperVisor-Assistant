import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const EvaluationsGrades = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

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
    }
  };

  return (
    <div className="max-w-container_max mx-auto p-margin_desktop">
      <h1 className="font-headline-lg text-[32px] font-bold mb-6">Evaluations & Grades</h1>

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <h2 className="text-xl font-semibold mb-4">Pending Submissions</h2>
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub._id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-surface-container-low transition-colors">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-semibold text-lg">{sub.title}</h3>
                  <p className="text-sm text-secondary">Student: {sub.student?.name || 'Unknown'}</p>
                  <p className="text-sm text-secondary">Status: <span className="font-bold">{sub.status}</span></p>
                  {sub.status === 'Graded' && (
                    <p className="text-sm text-primary font-bold">Grade: {sub.grade}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="bg-surface-variant text-on-surface px-4 py-2 rounded-lg font-semibold hover:bg-outline-variant transition-colors">View File</a>
                  {sub.status !== 'Graded' && (
                    <button onClick={() => setEvaluating(sub)} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold hover:bg-primary/90">Evaluate</button>
                  )}
                </div>
              </div>
            ))}
            {submissions.length === 0 && <p className="text-secondary">No submissions to evaluate.</p>}
          </div>
        )}
      </div>

      {evaluating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Evaluate: {evaluating.title}</h3>
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <input required value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. 85/100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Feedback</label>
                <textarea required value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full px-4 py-2 border rounded-lg h-32" placeholder="Write detailed feedback..."></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEvaluating(null)} className="px-4 py-2 rounded-lg font-medium text-secondary hover:bg-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary-container">Submit Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationsGrades;
