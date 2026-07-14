import React from 'react';

const RubricMarking = () => {
  return (
    <div className="p-margin_mobile md:p-margin_desktop max-w-[1440px] w-full mx-auto flex-1">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded font-label-md text-[12px] font-semibold">SDP Final Report</span>
            <span className="px-2 py-1 bg-tertiary-container/10 text-tertiary rounded font-label-md text-[12px] font-semibold">In Progress</span>
          </div>
          <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">Team Alpha - Project Nova</h2>
          <p className="font-body-md text-[16px] text-on-surface-variant mt-1">Submitted: Oct 12, 2023 • Lead: Sarah Jenkins</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-outline text-on-surface-variant rounded-lg font-label-md text-[12px] font-semibold hover:bg-surface-container-low transition-colors">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary-container transition-colors">
            Submit Evaluation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rubric Cards Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Criterion 1 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">1. Problem Understanding</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Clarity of the problem statement and context.</p>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-16 text-center border border-outline rounded-md p-1 font-body-lg text-[18px] text-primary font-semibold focus:ring-primary focus:border-primary" max="10" min="0" type="number" defaultValue="8" />
                <span className="text-on-surface-variant font-body-sm text-[14px]">/ 10</span>
              </div>
            </div>
            <textarea className="w-full border border-outline-variant rounded-lg p-3 font-body-md text-[16px] placeholder:text-outline focus:ring-primary focus:border-primary" placeholder="Enter specific feedback for problem understanding..." rows="3"></textarea>
          </div>

          {/* Criterion 2 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">2. Methodology</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Appropriateness and rigorousness of the chosen approach.</p>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-16 text-center border border-outline rounded-md p-1 font-body-lg text-[18px] text-primary font-semibold focus:ring-primary focus:border-primary" max="20" min="0" placeholder="-" type="number" />
                <span className="text-on-surface-variant font-body-sm text-[14px]">/ 20</span>
              </div>
            </div>
            <textarea className="w-full border border-outline-variant rounded-lg p-3 font-body-md text-[16px] placeholder:text-outline focus:ring-primary focus:border-primary" placeholder="Enter specific feedback for methodology..." rows="3"></textarea>
          </div>

          {/* Criterion 3 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border-l-2 border-primary">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">3. Implementation</h3>
                  <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Quality, robustness, and efficiency of the technical solution. <span className="italic text-primary/70">AI suggests strong code structure detected.</span></p>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-16 text-center border border-outline rounded-md p-1 font-body-lg text-[18px] text-primary font-semibold focus:ring-primary focus:border-primary" max="30" min="0" type="number" defaultValue="25" />
                <span className="text-on-surface-variant font-body-sm text-[14px]">/ 30</span>
              </div>
            </div>
            <textarea className="w-full border border-outline-variant rounded-lg p-3 font-body-md text-[16px] placeholder:text-outline focus:ring-primary focus:border-primary" placeholder="Enter specific feedback for implementation..." rows="3" defaultValue="Solid architecture, but error handling in module B needs refinement."></textarea>
          </div>
        </div>

        {/* Sticky Summary Column */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] sticky top-24">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6 border-b border-surface-variant pb-4">Evaluation Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-[14px] text-on-surface-variant">1. Problem Und.</span>
                <span className="font-body-md text-[16px] text-on-surface font-semibold">8 / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-[14px] text-on-surface-variant">2. Methodology</span>
                <span className="font-body-md text-[16px] text-outline italic">Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-[14px] text-on-surface-variant">3. Implementation</span>
                <span className="font-body-md text-[16px] text-on-surface font-semibold">25 / 30</span>
              </div>
              {/* Placeholders for other criteria */}
              <div className="flex justify-between items-center">
                <span className="font-body-sm text-[14px] text-on-surface-variant">4. Documentation</span>
                <span className="font-body-md text-[16px] text-outline italic">Pending</span>
              </div>
            </div>

            <div className="bg-surface-container pt-4 px-4 pb-6 rounded-xl text-center">
              <p className="font-label-md text-[12px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Total Score</p>
              <div className="font-display text-[48px] font-bold text-primary">
                33<span className="text-[24px] text-on-surface-variant font-normal">/100</span>
              </div>
              <div className="w-full bg-secondary-container h-1 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full w-[33%]"></div>
              </div>
            </div>

            <div className="mt-6">
              <label className="font-label-md text-[12px] font-semibold text-on-surface mb-2 block">General Coordinator Comments</label>
              <textarea className="w-full border border-outline-variant rounded-lg p-3 font-body-sm text-[14px] placeholder:text-outline bg-surface focus:ring-primary focus:border-primary" placeholder="Overall impressions and concluding remarks..." rows="4"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubricMarking;
