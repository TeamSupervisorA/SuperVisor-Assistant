import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop w-full">
      <div className="mb-8">
        <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface">AI & Plagiarism Settings</h2>
        <p className="font-body-lg text-[18px] text-secondary mt-2">Configure institutional safeguards and artificial intelligence parameters for the supervision suite.</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: AI Settings & Toggles */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Features Card */}
          <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6 border-l-2 border-primary relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">AI Feature Toggles</h3>
            <div className="space-y-4">
              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                <div>
                  <h4 className="font-body-lg text-[18px] font-medium text-on-surface">AI Supervisor Chatbot</h4>
                  <p className="font-body-sm text-[14px] text-secondary">Enable the 24/7 student query assistant.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-outline appearance-none cursor-pointer z-10 transition-transform duration-200 checked:right-0 checked:border-primary" type="checkbox" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer transition-colors duration-200"></label>
                </div>
              </div>

              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                <div>
                  <h4 className="font-body-lg text-[18px] font-medium text-on-surface">Project Idea Generator</h4>
                  <p className="font-body-sm text-[14px] text-secondary">Allow students to generate research topics.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-outline appearance-none cursor-pointer z-10 transition-transform duration-200 checked:right-0 checked:border-primary" type="checkbox" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer transition-colors duration-200"></label>
                </div>
              </div>

              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                <div>
                  <h4 className="font-body-lg text-[18px] font-medium text-on-surface">Proposal Feedback</h4>
                  <p className="font-body-sm text-[14px] text-secondary">Automated critique on initial draft submissions.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-outline appearance-none cursor-pointer z-10 transition-transform duration-200 checked:right-0 checked:border-primary" type="checkbox" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer transition-colors duration-200"></label>
                </div>
              </div>

              {/* Toggle Item */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                <div>
                  <h4 className="font-body-lg text-[18px] font-medium text-on-surface">Plagiarism Auto-Check</h4>
                  <p className="font-body-sm text-[14px] text-secondary">Run similarity reports on all document uploads automatically.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-outline appearance-none cursor-pointer z-10 transition-transform duration-200 checked:right-0 checked:border-primary" type="checkbox" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer transition-colors duration-200"></label>
                </div>
              </div>
            </div>
          </section>

          {/* Prompt Editor Card */}
          <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6 border-l-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Prompt Template Editor</h3>
              <button className="text-primary font-label-md text-[12px] font-semibold uppercase tracking-wider hover:underline">Reset to Default</button>
            </div>
            <p className="font-body-sm text-[14px] text-secondary mb-4">Define the systemic persona and constraints for the AI Supervisor.</p>
            <textarea className="w-full h-48 p-4 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-[16px] focus:border-primary focus:ring-1 focus:ring-primary resize-y" placeholder="Enter system prompt..." defaultValue="You are a strict but fair academic supervisor. Your primary role is to guide students through their research process without writing the content for them. Always encourage critical thinking and cite relevant methodological frameworks when offering feedback."></textarea>
          </section>
        </div>

        {/* Column 2: Plagiarism Settings */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-6">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2">Plagiarism Tolerances</h3>
            <p className="font-body-sm text-[14px] text-secondary mb-6">Configure acceptable similarity thresholds for student submissions.</p>
            
            <div className="mb-6">
              <label className="block font-body-md text-[16px] font-medium text-on-surface mb-2">Allowed Similarity Percentage</label>
              <div className="flex items-center gap-3">
                <input className="w-24 px-3 py-2 border border-outline-variant rounded-lg text-center font-title-lg text-[20px] focus:border-primary focus:ring-1 focus:ring-primary bg-surface" type="number" defaultValue="20" />
                <span className="font-body-lg text-[18px] text-secondary">%</span>
              </div>
            </div>

            {/* Risk Thresholds */}
            <div className="space-y-3">
              <h4 className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider mb-2">Risk Zones</h4>
              
              {/* Safe */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span className="font-body-sm text-[14px] font-medium">Safe</span>
                </div>
                <span className="font-label-md text-[12px] font-semibold bg-surface px-2 py-1 rounded text-primary">0 - 20%</span>
              </div>

              {/* Warning */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-variant/50 border border-outline-variant">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span className="font-body-sm text-[14px] font-medium">Warning</span>
                </div>
                <span className="font-label-md text-[12px] font-semibold bg-surface px-2 py-1 rounded text-on-surface-variant">21 - 35%</span>
              </div>

              {/* Danger */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-error-container/30 border border-error/20">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span className="font-body-sm text-[14px] font-medium">High Risk</span>
                </div>
                <span className="font-label-md text-[12px] font-semibold bg-surface px-2 py-1 rounded text-error">36%+</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3 max-w-2xl">
          <span className="material-symbols-outlined text-secondary mt-0.5 text-[18px]">info</span>
          <p className="font-body-sm text-[14px] text-secondary">
            <strong>Disclaimer:</strong> Artificial Intelligence features are designed to function as a support tool for academic supervision. They do not replace human judgment, ethical oversight, or formal institutional academic integrity protocols.
          </p>
        </div>
        <button className="px-6 py-3 bg-primary text-on-primary rounded-lg font-title-lg text-[20px] font-semibold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap">
          Save Settings
        </button>
      </div>

      {/* Embedded CSS for Toggle Switch since Tailwind arbitrary variants can get messy for this specific custom style */}
      <style dangerouslySetInnerHTML={{__html: `
        .toggle-checkbox:checked {
          right: 0;
          border-color: #3525cd;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #3525cd;
        }
        .toggle-checkbox:checked + .toggle-label:after {
          transform: translateX(100%);
          border-color: white;
        }
      `}} />
    </div>
  );
};

export default Settings;
