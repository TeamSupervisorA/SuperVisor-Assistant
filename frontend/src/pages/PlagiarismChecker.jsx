import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const PlagiarismChecker = () => {
  const { activeProject, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchParams] = useSearchParams();
  const canRunChecks = ['supervisor', 'admin'].includes(user?.role);
  const projectId = activeProject?._id;
  const requestedSubmission = searchParams.get('submission');
  
  // New States for Custom Text
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'custom'
  const [customText, setCustomText] = useState('');
  const [humanizing, setHumanizing] = useState(false);
  const [humanizedText, setHumanizedText] = useState('');
  const fileInputRef = useRef(null);

  const screenableSubmissions = useMemo(
    () => submissions.filter((submission) => String(submission.content || '').trim().length >= 200),
    [submissions]
  );

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [repRes, subRes] = await Promise.all([
        apiFetch(`/api/plagiarism?project=${projectId}`),
        apiFetch(`/api/submissions?project=${projectId}`)
      ]);
      if (repRes.data) setReports(repRes.data);
      if (subRes.data) setSubmissions(subRes.data);
      setError('');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Unable to load integrity data.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) loadData();
    else { setReports([]); setSubmissions([]); setLoading(false); }
  }, [projectId, loadData]);

  useEffect(() => {
    if (!selectedSub && requestedSubmission && screenableSubmissions.some((submission) => submission._id === requestedSubmission)) {
      setSelectedSub(requestedSubmission);
    }
  }, [requestedSubmission, screenableSubmissions, selectedSub]);

  const handleRunCheck = async () => {
    if (activeTab === 'submissions') {
      if (!canRunChecks) { setError('Only the assigned supervisor or an administrator can run an integrity screen. Students can view shared reports.'); return; }
      if (!selectedSub) { setError('Select a submission first.'); return; }
    } else {
      if (customText.trim().length < 200) { setError('Please provide at least 200 characters of text.'); return; }
    }
    
    setError('');
    setNotice('');
    setHumanizedText('');
    setRunning(true);
    try {
      let res;
      if (activeTab === 'submissions') {
        res = await apiFetch('/api/plagiarism', {
          method: 'POST',
          body: JSON.stringify({ project: activeProject._id, submission: selectedSub })
        });
      } else {
        res = await apiFetch('/api/plagiarism/quick', {
          method: 'POST',
          body: JSON.stringify({ text: customText })
        });
      }

      if (res.success && res.data) {
        if (activeTab === 'submissions') {
          const submissionDoc = submissions.find((submission) => submission._id === selectedSub);
          const report = { ...res.data, submission: res.data.submission?.title ? res.data.submission : submissionDoc };
          setReports((current) => [report, ...current.filter((item) => item._id !== report._id)]);
          setNotice(res.reused ? 'The current submission text was already screened recently, so its existing report was reused.' : 'The integrity screen is complete. Review every cited source before making an academic decision.');
        } else {
          const customReport = { ...res.data, isCustom: true, submission: { title: 'Custom Text Screen' } };
          setReports([customReport]);
          setNotice('The integrity screen is complete.');
        }
      }
    } catch (e) {
      setError(e.message || 'Integrity screening failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomText(ev.target.result);
        setError('');
      };
      reader.onerror = () => setError('Failed to read text file.');
      reader.readAsText(file);
    } else {
      setError('Currently only .txt files are supported for instant upload. For other files, please copy and paste the text directly.');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleHumanize = async () => {
    if (!customText || customText.trim().length === 0) return;
    setHumanizing(true);
    setError('');
    try {
      const res = await apiFetch('/api/ai/humanize', {
        method: 'POST',
        body: JSON.stringify({ text: customText })
      });
      if (res.success && res.data) {
        setHumanizedText(res.data);
      }
    } catch (e) {
      setError(e.message || 'Failed to humanize text.');
    } finally {
      setHumanizing(false);
    }
  };

  if (!activeProject && activeTab === 'submissions') {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-2xl relative z-10 max-w-lg mx-4">
          <div className="w-20 h-20 mx-auto bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-inner">
             <span className="material-symbols-outlined text-[40px] text-tertiary">policy</span>
          </div>
          <h2 className="font-display text-[28px] font-black text-on-surface mb-2">No Project Selected</h2>
          <p className="font-body-md text-[16px] text-secondary">Please select an active project from your dashboard to run project submissions plagiarism checks.</p>
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
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Integrity Screen</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Screen stored submission text or custom text against grounded public-web evidence.</p>
            {activeTab === 'submissions' && (
              <Link to="/student-submissions" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><span className="material-symbols-outlined text-[17px]">upload_file</span>Open project submissions</Link>
            )}
          </div>
          
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 flex-shrink-0">
             <button
               onClick={() => { setActiveTab('submissions'); setError(''); setNotice(''); }}
               className={`px-4 sm:px-6 py-2 rounded-lg font-title-sm text-[13px] sm:text-[14px] font-bold transition-all ${activeTab === 'submissions' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               Project Submissions
             </button>
             <button
               onClick={() => { setActiveTab('custom'); setError(''); setNotice(''); setReports([]); }}
               className={`px-4 sm:px-6 py-2 rounded-lg font-title-sm text-[13px] sm:text-[14px] font-bold transition-all ${activeTab === 'custom' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
             >
               Custom Text
             </button>
          </div>
        </motion.div>

        {activeTab === 'submissions' && !canRunChecks && <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-3 text-sm text-on-surface-variant">Students can view integrity reports shared for this project. The assigned supervisor or an administrator runs the screen after reviewing a submission.</div>}
        
        {activeTab === 'submissions' && canRunChecks && submissions.length > 0 && screenableSubmissions.length === 0 && <div className="rounded-2xl border border-tertiary/25 bg-tertiary/10 px-5 py-3 text-sm text-on-surface-variant">None of this project’s submissions contains the minimum 200 characters of stored text. Open <Link to="/student-submissions" className="font-bold text-primary hover:underline">project submissions</Link> and ask the student to paste the text; attachments are not fetched or read automatically.</div>}

        {error && <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 px-5 py-3 text-sm font-medium text-error">{error}</div>}
        {notice && <div role="status" className="rounded-2xl border border-primary/25 bg-primary/10 px-5 py-3 text-sm font-medium text-on-surface">{notice}</div>}

        {activeTab === 'submissions' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface/80 backdrop-blur-xl p-4 rounded-[24px] border border-outline-variant/50 shadow-sm w-full">
            <select 
              className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/50 font-body-md text-[14px] text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary appearance-none cursor-pointer transition-all flex-1"
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
            >
              <option value="">Select a text submission</option>
              {submissions.map(sub => (
                <option key={sub._id} value={sub._id} disabled={String(sub.content || '').trim().length < 200}>{sub.title}{String(sub.content || '').trim().length < 200 ? ' — add at least 200 characters of text' : ` — ${String(sub.content || '').trim().length.toLocaleString()} characters`}</option>
              ))}
            </select>
            <button 
              onClick={handleRunCheck}
              disabled={running || !selectedSub || !canRunChecks}
              className={`px-8 py-3 rounded-xl font-title-sm text-[14px] font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0
                ${running || !selectedSub || !canRunChecks ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70' : 'bg-tertiary text-on-tertiary hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-sm'}`}
            >
              {running ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[18px]">sync</motion.span> Scanning...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">search</span> Run screen</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 bg-surface/80 backdrop-blur-xl p-6 rounded-[24px] border border-outline-variant/50 shadow-sm w-full">
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
               <h3 className="font-title-md font-bold text-on-surface">Custom Text Check</h3>
               <div className="flex flex-wrap gap-2">
                 <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                 <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl font-label-md font-bold flex items-center gap-2 transition-colors">
                   <span className="material-symbols-outlined text-[18px]">upload_file</span>
                   Upload .txt
                 </button>
                 <button onClick={handleHumanize} disabled={humanizing || !customText || customText.length < 50} className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-label-md font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                   {humanizing ? <span className="material-symbols-outlined text-[18px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
                   Humanize
                 </button>
               </div>
             </div>
             
             <textarea 
               value={customText}
               onChange={(e) => setCustomText(e.target.value)}
               placeholder="Paste your text here (minimum 200 characters) to check for plagiarism or humanize it..."
               className="w-full h-[200px] p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
               maxLength={60000}
             ></textarea>
             
             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-xs text-secondary font-medium">
               <span>{customText.length.toLocaleString()} / 60,000 characters</span>
               <button 
                onClick={handleRunCheck}
                disabled={running || customText.trim().length < 200}
                className={`px-8 py-3 rounded-xl font-title-sm text-[14px] font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0
                  ${running || customText.trim().length < 200 ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-70' : 'bg-tertiary text-on-tertiary hover:shadow-md hover:-translate-y-0.5 shadow-sm'}`}
               >
                 {running ? (
                  <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[18px]">sync</motion.span> Scanning...</>
                 ) : (
                  <><span className="material-symbols-outlined text-[18px]">search</span> Run screen</>
                 )}
               </button>
             </div>
             
             <AnimatePresence>
               {humanizedText && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                   <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                     <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                       <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                       <h4>Humanized Text Suggestion</h4>
                     </div>
                     <div className="text-on-surface text-sm whitespace-pre-wrap">{humanizedText}</div>
                     <button onClick={() => { setCustomText(humanizedText); setHumanizedText(''); }} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm hover:shadow-md transition-shadow">
                       Apply to Editor
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        )}

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
            <p className="font-body-md text-[15px] text-secondary">
              {activeTab === 'submissions' 
                ? 'Select a submission from the dropdown above and run a check to generate an originality report.' 
                : 'Paste text or upload a .txt file and run a check to view grounded overlap.'}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6 lg:gap-8 flex-1 overflow-y-auto pb-8 custom-scrollbar">
            {reports.map((report, idx) => {
              const rawScore = Number(report.overallSimilarity);
              const simScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
              const isDanger = simScore >= 30;
              const isWarning = simScore >= 15 && simScore < 30;
              const statusColorClass = isDanger ? 'text-error' : isWarning ? 'text-tertiary' : 'text-primary';
              const bgGlowClass = isDanger ? 'bg-error' : isWarning ? 'bg-tertiary' : 'bg-primary';

              return (
                <motion.div key={report._id || idx} variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col md:flex-row relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 ${bgGlowClass}`}></div>
                  
                  {/* Score section */}
                  <div className="flex flex-col items-center justify-center w-full md:w-[320px] p-8 border-b md:border-b-0 md:border-r border-outline-variant/30 relative z-10 bg-surface/50">
                    <div className="mb-6 flex flex-col items-center gap-2 text-center">
                      <h3 className="font-title-md text-[18px] font-bold text-on-surface leading-snug">{report.submission?.title || 'Unknown Submission'}</h3>
                      {!report.isCustom && (
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${report.isCurrent === false ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>{report.isCurrent === false ? 'Earlier version' : 'Current submission'}</span>
                      )}
                    </div>
                    
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
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-secondary">web indicator</span>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider ${isDanger ? 'bg-error/10 text-error border border-error/20' : isWarning ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-primary/10 text-primary border border-primary/20'} shadow-sm`}>
                      <span className="material-symbols-outlined text-[16px]">{isDanger ? 'error' : isWarning ? 'warning' : 'check_circle'}</span>
                      {isDanger ? 'Higher overlap to review' : isWarning ? 'Some overlap to review' : 'Limited grounded overlap'}
                    </div>
                    {!report.isCustom && <span className="font-label-sm text-[11px] font-semibold text-secondary uppercase tracking-widest mt-6">Checked: {new Date(report.createdAt).toLocaleDateString()}</span>}
                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-secondary">
                      <span>{Number(report.checkedCharacterCount || 0).toLocaleString()} characters</span>
                      <span>{Number(report.searchQueryCount || 0).toLocaleString()} search queries</span>
                    </div>
                    <p className="mt-4 text-center text-xs leading-relaxed text-secondary">{report.disclaimer || 'Review the underlying sources and follow your institution’s policy before making a decision.'}</p>
                  </div>

                  {/* Sources Section */}
                  <div className="flex-1 w-full p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">source</span>
                      </div>
                      <div>
                        <h4 className="font-title-lg text-[22px] font-bold text-on-surface">Grounded sources to review</h4>
                        <p className="mt-1 text-xs text-secondary">Open each source and compare wording, attribution, and context.</p>
                      </div>
                    </div>
                    
                    {report.matchedSources && report.matchedSources.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {report.matchedSources.map((source, idx) => (
                          <motion.div key={idx} whileHover={{ scale: 1.02 }} className="p-5 rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest/50 hover:bg-surface hover:shadow-sm hover:border-outline-variant/80 transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`font-label-md text-[13px] font-bold px-2 py-1 rounded-md ${source.matchPercentage > 20 ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
                                {Math.max(0, Math.min(100, Math.round(Number(source.matchPercentage) || 0)))}% source indicator
                              </span>
                              <span className="rounded-full bg-surface-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">{source.sourceType === 'project-corpus' ? 'Project corpus' : 'Public web'}</span>
                            </div>
                            <h5 className="font-title-sm text-[15px] font-bold text-on-surface line-clamp-2 mb-2 leading-tight">{source.sourceName}</h5>
                            {source.reason && <p className="mb-2 text-xs leading-relaxed text-secondary">{source.reason}</p>}
                            {source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-primary hover:text-primary-fixed-variant hover:underline truncate inline-flex items-center gap-1 mt-auto mt-2">
                              {source.sourceUrl}<span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a> : canRunChecks ? <Link to="/student-submissions" className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-bold text-primary hover:underline">Open project submissions<span className="material-symbols-outlined text-[14px]">arrow_forward</span></Link> : <p className="mt-auto pt-2 text-[12px] text-secondary">The assigned reviewer can compare the stored source while protecting another student’s draft.</p>}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                        <span className="material-symbols-outlined text-[48px] text-outline mb-4">task_alt</span>
                        <p className="font-body-lg text-secondary">No grounded public-web overlap was substantiated in this screen.</p>
                        <p className="mt-2 max-w-xl text-xs leading-relaxed text-secondary">This does not prove originality and does not cover private journals, institutional databases, unpublished work, or every page on the web.</p>
                      </div>
                    )}
                    {report.summary && <div className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant"><strong className="text-on-surface">Screening summary:</strong> {report.summary}</div>}
                    {report.providerNotice && <div className="mt-4 rounded-xl border border-tertiary/30 bg-tertiary/10 p-4 text-sm leading-relaxed text-on-surface-variant"><strong className="text-on-surface">Coverage notice:</strong> {report.providerNotice}</div>}
                    {Array.isArray(report.coverage) && report.coverage.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{report.coverage.map((item) => <span key={item} className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 text-[11px] font-semibold text-secondary">{item}</span>)}</div>}
                    {report.searchSuggestionsHtml && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-secondary">Google Search suggestions</p>
                        <iframe
                          title={`Search suggestions for ${report.submission?.title || 'submission'}`}
                          srcDoc={report.searchSuggestionsHtml}
                          sandbox="allow-popups allow-popups-to-escape-sandbox"
                          referrerPolicy="no-referrer"
                          className="h-14 w-full border-0 bg-transparent"
                        />
                      </div>
                    )}
                    <p className="mt-4 text-[11px] leading-relaxed text-secondary">Method: {report.method || 'Google Search-grounded integrity screen'}{report.providerModel ? ` · Model: ${report.providerModel}` : ''}</p>
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
