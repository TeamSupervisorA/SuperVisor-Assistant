import React, { useState } from 'react';

const CreateNewWork = () => {
  const [selectedType, setSelectedType] = useState('sdp');

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-margin_desktop">
      {/* Header Section */}
      <div className="mb-8 md:mb-12 flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-[32px] md:font-display md:text-[48px] font-bold text-on-surface mb-2">Create New Work</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant">Initiate a new academic project, assignment, or thesis tracking.</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-12 max-w-3xl mx-auto">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-1 bg-primary rounded-full z-0 transition-all duration-500"></div>
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-[12px] font-semibold shadow-sm">
              1
            </div>
            <span className="font-label-md text-[12px] font-semibold text-primary">Work Type</span>
          </div>
          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface text-on-surface-variant border-2 border-surface-container-high flex items-center justify-center font-label-md text-[12px] font-semibold">
              2
            </div>
            <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">Supervision</span>
          </div>
          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface text-on-surface-variant border-2 border-surface-container-high flex items-center justify-center font-label-md text-[12px] font-semibold">
              3
            </div>
            <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">Details</span>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-surface rounded-[24px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6 md:p-10 max-w-3xl mx-auto border border-surface-container-lowest">
        <div className="mb-8">
          <h3 className="font-headline-md text-[24px] font-semibold text-on-surface mb-2">Step 1: Select Work Type</h3>
          <p className="font-body-md text-[16px] text-on-surface-variant">Choose the category that best describes the academic work you are initiating.</p>
        </div>

        {/* Bento Grid for Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Option 1 */}
          <label className="cursor-pointer group relative block h-full">
            <input 
              className="peer sr-only" 
              name="work_type" 
              type="radio" 
              value="sdp" 
              checked={selectedType === 'sdp'}
              onChange={() => setSelectedType('sdp')}
            />
            <div className="h-full bg-surface-container-lowest border-2 border-surface-container-high rounded-xl p-6 transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">laptop_mac</span>
              </div>
              <div>
                <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">SDP Project</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Software Development Project for final year CS students.</p>
              </div>
              <div className="absolute top-4 right-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </label>

          {/* Option 2 */}
          <label className="cursor-pointer group relative block h-full">
            <input 
              className="peer sr-only" 
              name="work_type" 
              type="radio" 
              value="assignment"
              checked={selectedType === 'assignment'}
              onChange={() => setSelectedType('assignment')}
            />
            <div className="h-full bg-surface-container-lowest border-2 border-surface-container-high rounded-xl p-6 transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">assignment</span>
              </div>
              <div>
                <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Course Assignment</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Standard coursework or project for a specific module.</p>
              </div>
              <div className="absolute top-4 right-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </label>

          {/* Option 3 */}
          <label className="cursor-pointer group relative block h-full">
            <input 
              className="peer sr-only" 
              name="work_type" 
              type="radio" 
              value="research"
              checked={selectedType === 'research'}
              onChange={() => setSelectedType('research')}
            />
            <div className="h-full bg-surface-container-lowest border-2 border-surface-container-high rounded-xl p-6 transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">science</span>
              </div>
              <div>
                <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Research Paper</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Independent academic research intended for publication.</p>
              </div>
              <div className="absolute top-4 right-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </label>

          {/* Option 4 */}
          <label className="cursor-pointer group relative block h-full">
            <input 
              className="peer sr-only" 
              name="work_type" 
              type="radio" 
              value="thesis"
              checked={selectedType === 'thesis'}
              onChange={() => setSelectedType('thesis')}
            />
            <div className="h-full bg-surface-container-lowest border-2 border-surface-container-high rounded-xl p-6 transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">school</span>
              </div>
              <div>
                <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Thesis / Dissertation</h4>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Major culminating project for Masters or PhD candidates.</p>
              </div>
              <div className="absolute top-4 right-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-surface-container-high">
          <button className="px-6 py-2.5 rounded-lg border border-primary text-primary font-label-md text-[12px] font-semibold hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/50 outline-none">
            Save Draft
          </button>
          <button className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-[12px] font-semibold hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary outline-none flex items-center gap-2">
            Next Step
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewWork;
