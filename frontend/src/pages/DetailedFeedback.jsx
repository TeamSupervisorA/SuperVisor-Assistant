import React from 'react';
import { useAuth } from '../components/AuthContext';

const DetailedFeedback = () => {
  const { activeProject } = useAuth();
  
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

  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop max-w-container_max mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface">Evaluation Feedback</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant mt-2 max-w-2xl">
            Detailed review for "{activeProject.title}" latest submission.
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
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface-variant mb-2">Overall Score</h3>
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            {/* Circular Progress SVG (Visual Only) */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="45" stroke="#e7eeff" strokeWidth="8"></circle>
              <circle cx="50" cy="50" fill="none" r="45" stroke="#3525cd" strokeDasharray="283" strokeDashoffset="51" strokeLinecap="round" strokeWidth="8"></circle> {/* 82% of 283 */}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-[48px] font-bold text-primary leading-[56px] tracking-[-0.02em]">82</span>
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-md text-[12px] font-semibold">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Distinction
          </div>
          <p className="font-body-sm text-[14px] text-on-surface-variant mt-4">Top 15% of cohort</p>
        </div>

        {/* AI Recommendations (Col 8) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] relative border-l-2 border-primary" style={{boxShadow: "inset 1px 0 0 0 #c3c0ff, inset 0 1px 0 0 #c3c0ff", ...{boxShadow: "0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -2px rgba(0, 0, 0, 0.05)"}}}>
          <div className="absolute top-6 right-6 text-primary">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">AI Assessor Insights</h3>
          <p className="font-body-sm text-[14px] text-on-surface-variant mb-6">Generated based on rubric analysis and historical performance data.</p>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface">Strengthen Methodology Justification</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mt-1">While the implementation is robust, the paper lacks a comparative analysis explaining why this specific neural network architecture was chosen over alternatives.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined">library_books</span>
              </div>
              <div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface">Expand Literature Review</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant mt-1">Consider incorporating more recent papers from 2022-2023 concerning attention mechanisms to demonstrate cutting-edge awareness.</p>
              </div>
            </div>
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
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">22</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 25</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-surface-container-high rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '88%' }}></div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-container-high">
                <p className="font-body-sm text-[14px] text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Teacher Comment:</strong> Excellent grasp of the core issues. You clearly articulated the limitations of current models in high-noise environments. The problem statement was concise and highly relevant to ongoing research.
                </p>
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
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">18</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 25</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-surface-container-high rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-tertiary-container rounded-full" style={{ width: '72%' }}></div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-container-high">
                <p className="font-body-sm text-[14px] text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Teacher Comment:</strong> The approach is valid, but the documentation lacks detail on hyperparameter tuning. As noted by the AI analysis, a more rigorous justification for choosing the CNN over a Transformer model for this specific dataset would strengthen this section significantly.
                </p>
              </div>
            </div>

            {/* Criterion 3 */}
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-transparent hover:border-surface-container-high transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <h4 className="font-title-lg text-[20px] font-semibold text-on-surface">Implementation & Results</h4>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-[24px] font-bold text-on-surface">24</span>
                  <span className="font-body-sm text-[14px] text-on-surface-variant">/ 30</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1 bg-surface-container-high rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-surface-container-high">
                <p className="font-body-sm text-[14px] text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Teacher Comment:</strong> Code quality is exceptional. Clean, well-commented, and the results are presented beautifully in the supplementary charts. The confusion matrix breakdown was particularly insightful. Great work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedFeedback;
