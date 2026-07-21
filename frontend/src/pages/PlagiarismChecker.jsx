import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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
        apiFetch(`/api/plagiarism?project=${activeProject._id}`).catch(() => ({ data: [] })),
        apiFetch(`/api/submissions?project=${activeProject._id}`).catch(() => ({ data: [] }))
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
      // No client-side mock fallback here: fabricating a similarity score for an
      // academic-integrity report would be misleading — surface the real error instead
      const res = await apiFetch('/api/plagiarism', {
        method: 'POST',
        body: JSON.stringify({ project: activeProject._id, submission: selectedSub })
      });

      if (res.success && res.data) {
        // The POST response isn't populated — attach the known submission for display
        const submissionDoc = submissions.find(s => s._id === selectedSub);
        setReports([{ ...res.data, submission: res.data.submission?.title ? res.data.submission : submissionDoc }, ...reports]);
      }
    } catch (e) {
      alert('Plagiarism check failed: ' + e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner">
             <span className="material-symbols-outlined text-[40px] text-tertiary">policy</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to run plagiarism checks.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1440px] mx-auto flex flex-col gap-8 h-full"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-tertiary/10 text-tertiary font-label-md text-[12px] font-bold mb-3 border border-tertiary/20 uppercase tracking-wide">Integrity</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Plagiarism Checker</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Scan student submissions for originality against external sources.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface/80 backdrop-blur-xl p-2 rounded-[20px] border border-outline-variant/50 shadow-sm w-full md:w-auto">
            <select 
              className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/50 font-body-md text-[14px] text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary min-w-[240px] appearance-none cursor-pointer transition-all flex-1"
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
              className={`px-6 py-3 rounded-xl font-title-sm text-[14px] font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0
                ${running || !selectedSub ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70' : 'bg-tertiary text-on-tertiary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-sm'}`}
            >
              {running ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[18px]">sync</motion.span> Scanning...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">search</span> Run Check</>
              )}
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center py-20">
             <div className="w-10 h-10 border-4 border-tertiary/20 border-t-tertiary rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-16 rounded-[32px] shadow-sm max-w-2xl mx-auto mt-8">
            <div className="w-20 h-20 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-6 border border-outline-variant/20">
              <span className="material-symbols-outlined text-[40px] text-secondary">plagiarism</span>
            </div>
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-2">No Reports Generated</h3>
            <p className="font-body-md text-[15px] text-secondary">Select a submission from the dropdown above and run a check to generate an originality report.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6 lg:gap-8 flex-1 overflow-y-auto pb-8 custom-scrollbar">
            {reports.map((report, idx) => {
              const simScore = report.overallSimilarity;
              const isDanger = simScore >= 30;
              const isWarning = simScore >= 15 && simScore < 30;
              const isSafe = simScore < 15;
              const statusColorClass = isDanger ? 'text-error' : isWarning ? 'text-tertiary' : 'text-primary';
              const bgGlowClass = isDanger ? 'bg-error' : isWarning ? 'bg-tertiary' : 'bg-primary';

              return (
                <motion.div key={report._id || idx} variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col md:flex-row relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 ${bgGlowClass}`}></div>
                  
                  {/* Score section */}
                  <div className="flex flex-col items-center justify-center w-full md:w-[320px] p-8 border-b md:border-b-0 md:border-r border-outline-variant/30 relative z-10 bg-surface/50">
                    <h3 className="font-title-md text-[18px] font-bold text-on-surface mb-6 text-center leading-snug">{report.submission?.title || 'Unknown Submission'}</h3>
                    
                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="none" r="42" stroke="currentColor" className="text-outline-variant/30" strokeWidth="8"></circle>
                        <motion.circle 
                          initial={{ strokeDashoffset: 264 }} 
                          animate={{ strokeDashoffset: 264 - (264 * simScore) / 100 }} 
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="50" cy="50" fill="none" r="42" stroke="currentColor" 
                          className={statusColorClass} strokeDasharray="264" strokeLinecap="round" strokeWidth="8"
                        ></motion.circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`font-display text-[42px] font-black leading-none ${statusColorClass}`}>
                          {simScore}<span className="text-[20px]">%</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider ${isDanger ? 'bg-error/10 text-error border border-error/20' : isWarning ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-primary/10 text-primary border border-primary/20'} shadow-sm`}>
                      <span className="material-symbols-outlined text-[16px]">{isDanger ? 'error' : isWarning ? 'warning' : 'check_circle'}</span>
                      {isDanger ? 'High Risk' : isWarning ? 'Moderate' : 'Low Risk'}
                    </div>
                    <span className="font-label-sm text-[11px] font-semibold text-secondary uppercase tracking-widest mt-6">Checked: {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Sources Section */}
                  <div className="flex-1 w-full p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">source</span>
                      </div>
                      <h4 className="font-title-lg text-[22px] font-bold text-on-surface">Matched Sources</h4>
                    </div>
                    
                    {report.matchedSources && report.matchedSources.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {report.matchedSources.map((source, idx) => (
                          <motion.div key={idx} whileHover={{ scale: 1.02 }} className="p-5 rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest/50 hover:bg-surface hover:shadow-sm hover:border-outline-variant/80 transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`font-label-md text-[13px] font-bold px-2 py-1 rounded-md ${source.matchPercentage > 20 ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
                                {source.matchPercentage}% Match
                              </span>
                            </div>
                            <h5 className="font-title-sm text-[15px] font-bold text-on-surface line-clamp-2 mb-2 leading-tight">{source.sourceName}</h5>
                            <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-primary hover:text-primary-fixed-variant hover:underline truncate inline-flex items-center gap-1 mt-auto mt-2">
                              {source.sourceUrl}
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <span className="material-symbols-outlined text-[48px] text-outline mb-4">task_alt</span>
                        <p className="font-body-lg text-secondary">No significant matches found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PlagiarismChecker;
