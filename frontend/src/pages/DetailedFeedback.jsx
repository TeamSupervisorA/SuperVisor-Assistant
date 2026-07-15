import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';

const DetailedFeedback = () => {
  const { activeProject } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (activeProject) {
      loadEvaluation();
    } else {
      setLoading(false);
    }
  }, [activeProject]);

  const loadEvaluation = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/evaluations?project=${activeProject._id}`);
      if (res.data && res.data.length > 0) {
        // Take the most recent evaluation
        setEvaluation(res.data[0]);
      } else {
        setEvaluation(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">find_in_page</span>
          <h2 className="font-headline-md text-on-surface">No Active Context</h2>
          <p className="font-body-md text-secondary mt-2">Select a project to view feedback for its submissions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <p className="text-secondary">Loading evaluation data...</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">pending_actions</span>
          <h2 className="font-headline-md text-on-surface">No Evaluations Yet</h2>
          <p className="font-body-md text-secondary mt-2">There is no feedback available for "{activeProject.title}" yet.</p>
        </div>
      </div>
    );
  }

  const { scores, totalScore, feedback } = evaluation;

  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop max-w-container_max mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface">Evaluation Feedback</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant mt-2 max-w-2xl">
            Detailed review for "{activeProject.title}".
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-primary text-primary font-body-sm text-[14px] font-semibold hover:bg-surface-container-low transition-colors">
            Download PDF
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-[14px] font-semibold hover:bg-primary-container hover:shadow-md transition-all">
            Schedule Review
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Score Summary Card (Col 4) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface-variant mb-2">Overall Score</h3>
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="#e7eeff" strokeWidth="8"></circle>
              <circle cx="50" cy="50" fill="none" r="45" stroke={totalScore >= 80 ? '#3525cd' : totalScore >= 50 ? '#ffb4ab' : '#ba1a1a'} strokeDasharray="283" strokeDashoffset={283 - (283 * totalScore) / 100} strokeLinecap="round" strokeWidth="8"></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-[48px] font-bold text-on-surface leading-[56px] tracking-[-0.02em]">{totalScore}</span>
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-[12px] font-semibold ${totalScore >= 80 ? 'bg-primary-container text-primary' : totalScore >= 50 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
            <span className="material-symbols-outlined text-[14px]">{totalScore >= 50 ? 'check_circle' : 'warning'}</span>
            {totalScore >= 80 ? 'Distinction' : totalScore >= 50 ? 'Pass' : 'Needs Improvement'}
          </div>
          <p className="font-body-sm text-[14px] text-on-surface-variant mt-4">Based on comprehensive rubric analysis.</p>
        </div>

        {/* General Feedback & AI Insights (Col 8) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] relative border-l-2 border-primary" style={{boxShadow: "inset 1px 0 0 0 #c3c0ff, inset 0 1px 0 0 #c3c0ff", ...{boxShadow: "0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)"}}}>
          <div className="absolute top-6 right-6 text-primary">
            <span className="material-symbols-outlined">rate_review</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Supervisor Feedback</h3>
          <div className="bg-surface-container-low p-5 rounded-xl text-[15px] text-on-surface leading-relaxed border border-outline-variant/20 whitespace-pre-wrap">
            {feedback || "No additional feedback provided by the supervisor."}
          </div>
        </div>

        {/* Rubric Breakdown List (Full Width) */}
        <div className="lg:col-span-12 mt-4">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Rubric Breakdown</h3>
          <div className="space-y-6">
            
            {/* Criterion 1 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-transparent hover:border-surface-container-high transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <h4 className="font-title-lg text-[20px] font-semibold text-on-surface">Problem Understanding</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">{scores?.problemUnderstanding || 0}</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 10</span>
                </div>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${((scores?.problemUnderstanding || 0) / 10) * 100}%` }}></div>
              </div>
            </div>

            {/* Criterion 2 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-transparent hover:border-surface-container-high transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">account_tree</span>
                  </div>
                  <h4 className="font-title-lg text-[20px] font-semibold text-on-surface">Methodology</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">{scores?.methodology || 0}</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 20</span>
                </div>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${((scores?.methodology || 0) / 20) * 100}%` }}></div>
              </div>
            </div>

            {/* Criterion 3 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-transparent hover:border-surface-container-high transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <h4 className="font-title-lg text-[20px] font-semibold text-on-surface">Implementation</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">{scores?.implementation || 0}</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 30</span>
                </div>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${((scores?.implementation || 0) / 30) * 100}%` }}></div>
              </div>
            </div>
            
            {/* Criterion 4 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-transparent hover:border-surface-container-high transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <h4 className="font-title-lg text-[20px] font-semibold text-on-surface">Documentation</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">{scores?.documentation || 0}</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 40</span>
                </div>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: `${((scores?.documentation || 0) / 40) * 100}%` }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedFeedback;
