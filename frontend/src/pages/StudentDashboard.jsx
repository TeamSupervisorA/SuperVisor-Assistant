import React from 'react';

const StudentDashboard = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop pb-24">
      
      <div className="mb-8 md:mb-10">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Student Workspace</h2>
        <p className="font-body-lg text-[18px] text-secondary">Welcome back, James. Track your progress and deadlines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-gutter">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[20px] font-semibold text-on-surface">Active Works</span>
            <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">edit_document</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[48px] font-bold text-primary leading-none">2</span>
            <span className="font-body-sm text-[14px] text-secondary mb-2">in progress</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[20px] font-semibold text-on-surface">Completed Tasks</span>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[48px] font-bold text-on-surface leading-none">14</span>
            <span className="font-body-sm text-[14px] text-secondary mb-2">this month</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-title-lg text-[20px] font-semibold text-on-surface">Pending Feedback</span>
            <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">rate_review</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-display text-[48px] font-bold text-on-surface leading-none">1</span>
            <span className="font-body-sm text-[14px] text-secondary mb-2">awaiting review</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card flex flex-col justify-between border border-outline-variant/20 hover:border-outline-variant/40 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="font-title-lg text-[20px] font-semibold text-on-surface">Days to Deadline</span>
            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">event</span>
            </div>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            <span className="font-display text-[48px] font-bold text-on-surface leading-none">5</span>
            <span className="font-body-sm text-[14px] text-secondary mb-2">Oct 24, 2023</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-card border border-outline-variant/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-primary font-label-md text-[12px] font-semibold mb-3">CURRENT PROJECT</span>
              <h3 className="font-headline-md text-[24px] font-semibold text-on-surface">SDP Project: AI Health Monitor</h3>
            </div>
            <button className="p-2 text-secondary hover:bg-surface-container rounded-full transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-body-md text-[16px] font-semibold text-on-surface">Overall Progress</span>
              <span className="font-body-md text-[16px] text-primary font-bold">65%</span>
            </div>
            <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-[65%]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-bright rounded-lg p-5 border border-outline-variant/30">
            <div>
              <span className="block font-label-md text-[12px] font-semibold text-secondary mb-1 uppercase tracking-wider">Next Milestone</span>
              <span className="font-title-lg text-[20px] font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">flag</span>
                Methodology Update
              </span>
            </div>
            <div>
              <span className="block font-label-md text-[12px] font-semibold text-secondary mb-1 uppercase tracking-wider">Deadline Countdown</span>
              <span className="font-title-lg text-[20px] font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">timer</span>
                5 Days Remaining
              </span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
              Continue Working
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card border-l-[2px] border-primary ai-sparkle-card flex flex-col relative overflow-hidden"
             style={{ boxShadow: "inset 0 0 0 1px rgba(53, 37, 205, 0.15)", background: "linear-gradient(135deg, #ffffff 0%, #f0f3ff 100%)" }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">AI Supervisor Insight</h3>
            </div>
          </div>
          
          <div className="flex-1 relative z-10 mb-6">
            <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface font-semibold">Next Step:</strong> Your <span className="bg-surface-container px-1.5 py-0.5 rounded text-primary">Literature Review</span> section appears to be missing 3 key foundational references regarding federated learning architectures.
            </p>
            <div className="mt-4 p-4 rounded-lg border border-outline-variant/40 bg-surface/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px', marginTop: '2px' }}>find_in_page</span>
                <div>
                  <p className="font-body-sm text-[14px] text-secondary">Identified gaps in: <br/>• Privacy-preserving techniques<br/>• Edge node synchronization</p>
                </div>
              </div>
            </div>
          </div>
          
          <button className="w-full py-2.5 rounded-lg border border-primary text-primary font-label-md text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 relative z-10">
            View AI Suggestions
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lightbulb</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
