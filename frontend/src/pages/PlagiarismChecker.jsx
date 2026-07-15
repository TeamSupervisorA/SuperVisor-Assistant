import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const PlagiarismChecker = () => {
  const { activeProject } = useAuth();
  const [reports, setReports] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (activeProject) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, subRes] = await Promise.all([
        apiFetch(`/api/plagiarism?project=${activeProject._id}`),
        apiFetch(`/api/submissions?project=${activeProject._id}`)
      ]);
      if (repRes.data) setReports(repRes.data);
      if (subRes.data) setSubmissions(subRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    if (!selectedSub) return alert("Select a submission first");
    setRunning(true);
    try {
      const res = await apiFetch('/api/plagiarism', {
        method: 'POST',
        body: JSON.stringify({ project: activeProject._id, submission: selectedSub })
      });
      if (res.success) {
        loadData();
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">policy</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project to run plagiarism checks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container_max mx-auto p-margin_mobile md:p-margin_desktop w-full flex-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Plagiarism Checker</h2>
          <p className="text-secondary mt-1">Scan student submissions for originality against external sources.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
          <select 
            className="bg-transparent text-[14px] outline-none min-w-[200px]"
            value={selectedSub}
            onChange={(e) => setSelectedSub(e.target.value)}
          >
            <option value="">-- Select Submission --</option>
            {submissions.map(sub => (
              <option key={sub._id} value={sub._id}>{sub.title}</option>
            ))}
          </select>
          <button 
            onClick={handleRunCheck}
            disabled={running || !selectedSub}
            className="bg-primary text-on-primary px-4 py-2 rounded-md font-semibold text-[13px] disabled:opacity-50 flex items-center gap-2 transition-all hover:bg-primary/90"
          >
            {running ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">search</span>}
            Run Check
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : reports.length === 0 ? (
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl mt-10">
          <p className="font-body-md text-secondary">No plagiarism reports generated yet. Select a submission and run a check.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map(report => (
            <div key={report._id} className="bg-surface-container-lowest rounded-[24px] p-6 shadow-sm border border-outline-variant/20 flex flex-col md:flex-row gap-8 items-start">
              
              {/* Score section */}
              <div className="flex flex-col items-center justify-center w-full md:w-1/4 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-6 md:pb-0 md:pr-6">
                <h3 className="font-title-md font-semibold mb-4 text-center">{report.submission?.title || 'Unknown Submission'}</h3>
                
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" className="text-surface-variant" strokeWidth="10"></circle>
                    <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" className={report.overallSimilarity > 30 ? 'text-error' : report.overallSimilarity > 15 ? 'text-tertiary' : 'text-primary'} strokeDasharray="283" strokeDashoffset={283 - (283 * report.overallSimilarity) / 100} strokeWidth="10"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-display text-[32px] font-bold ${report.overallSimilarity > 30 ? 'text-error' : report.overallSimilarity > 15 ? 'text-tertiary' : 'text-primary'}`}>
                      {report.overallSimilarity}%
                    </span>
                  </div>
                </div>
                
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${report.overallSimilarity > 30 ? 'bg-error-container text-on-error-container' : report.overallSimilarity > 15 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary-container text-primary'}`}>
                  {report.overallSimilarity > 30 ? 'High Risk' : report.overallSimilarity > 15 ? 'Moderate' : 'Low Risk'}
                </div>
                <span className="text-[12px] text-secondary mt-3">Checked: {new Date(report.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Sources Section */}
              <div className="flex-1 w-full">
                <h4 className="font-title-md font-semibold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">source</span>
                  Matched Sources
                </h4>
                {report.matchedSources && report.matchedSources.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {report.matchedSources.map((source, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`font-label-md text-[12px] font-semibold ${source.matchPercentage > 20 ? 'text-error' : 'text-tertiary'}`}>
                            {source.matchPercentage}% Match
                          </span>
                        </div>
                        <h5 className="font-body-md font-semibold truncate">{source.sourceName}</h5>
                        <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[12px] text-primary hover:underline truncate inline-flex items-center gap-1 mt-1">
                          {source.sourceUrl}
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-[14px]">No significant matches found. Content appears original.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlagiarismChecker;
