import React from 'react';

const TeamManagement = () => {
  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop max-w-container_max mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-[32px] font-bold text-on-surface mb-1">Team Management</h1>
          <p className="font-body-lg text-[18px] text-secondary">SDP Project: <span className="font-semibold text-primary">AI Health Monitor</span></p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-body-md text-[16px] hover:bg-primary/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">add</span>
            Create Team
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          {/* Add Member Card */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-surface-container-high">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              Add Member
            </h3>
            <form className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block font-label-md text-[12px] font-semibold text-secondary mb-1">STUDENT ID / EMAIL</label>
                <input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. s1234567@uni.edu" type="text" />
              </div>
              <div className="flex-1 w-full">
                <label className="block font-label-md text-[12px] font-semibold text-secondary mb-1">ROLE</label>
                <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>AI Integration Lead</option>
                  <option>Documentation</option>
                </select>
              </div>
              <button className="w-full sm:w-auto px-6 py-2.5 bg-surface-container-highest text-primary border border-primary/20 rounded-lg font-body-md text-[16px] font-semibold hover:bg-primary/10 transition-colors whitespace-nowrap" type="button">
                Send Invite
              </button>
            </form>
          </div>

          {/* Team Members & Contributions */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Active Roster & Contributions</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-[12px] font-semibold">5 MEMBERS</span>
            </div>
            <div className="flex flex-col gap-4">
              {/* Member 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group">
                <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
                  <img alt="Sarah Jenkins" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA1V_-s7JkuUrFh4fudgDb9fBnpbPM2meYQhWMXNihb27-oSnZnNV1U3VcKa6jdUhbgD9w9gzu0yeS1bzK3qPAU7iX_93BXKpVkHkZuyNExL5twQ8GpJLqxmsm4dSJDtS6JqUmP-wEIDfe34hQh0C1zlxaD4tfregBrl36Abhwp98xpfzNoykvi2QMHNJLYu6jG6rcufmMLG1Ho_IFMhw8JDo_l632oDDPmqMob9TK5RRtXrbsmg6Z_umQ-KEZ5WhkxjfynK3-V2w" />
                  <div>
                    <h4 className="font-body-lg text-[18px] font-semibold text-on-surface">Sarah Jenkins</h4>
                    <p className="font-label-md text-[12px] font-semibold text-primary bg-primary/5 inline-block px-2 py-0.5 rounded mt-1">TEAM LEADER</p>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-label-md text-[12px] font-semibold text-secondary">CONTRIBUTION</span>
                      <span className="font-label-md text-[12px] font-semibold text-on-surface font-bold">28%</span>
                    </div>
                    <div className="w-full bg-secondary-fixed h-1 rounded-full overflow-hidden">
                      <div className="bg-[#10B981] h-full rounded-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>
                  <button className="text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Member 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group border-l-2 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
                  <img alt="James Chen" className="w-12 h-12 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCncrGQsW4hXpnTwMgWjXdP3CXpM-OFMqPW1De4ZMoj6Xrp2HSkwztEij1X2h-rWb9VE_SaxBBLEEd-ACe3ASS3PNvoTFrmaenqhlB1W0rTHJfrm42nGBShQpZtB3l44xgUeL-l33CLE-vg4P8XEjoGij34cA064ojRGcidxosorl647Kiw-uiAFcibMbTwb9pKzGsqIVfuf5yhGbO85VxVZBOYZVLPvs1XExjaOlhGx_FaOIR2py9bzTMMb1O2Hynof4DufKgQRtE" />
                  <div>
                    <h4 className="font-body-lg text-[18px] font-semibold text-on-surface">James Chen</h4>
                    <p className="font-label-md text-[12px] font-semibold text-secondary mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
                      AI INTEGRATION
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-label-md text-[12px] font-semibold text-secondary">CONTRIBUTION</span>
                      <span className="font-label-md text-[12px] font-semibold text-on-surface font-bold">24%</span>
                    </div>
                    <div className="w-full bg-secondary-fixed h-1 rounded-full overflow-hidden">
                      <div className="bg-[#0EA5E9] h-full rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <button className="text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Member 3 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group">
                <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-headline-md font-bold">
                    MR
                  </div>
                  <div>
                    <h4 className="font-body-lg text-[18px] font-semibold text-on-surface">Maria Rodriguez</h4>
                    <p className="font-label-md text-[12px] font-semibold text-secondary mt-1">FRONTEND</p>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-label-md text-[12px] font-semibold text-secondary">CONTRIBUTION</span>
                      <span className="font-label-md text-[12px] font-semibold text-on-surface font-bold">20%</span>
                    </div>
                    <div className="w-full bg-secondary-fixed h-1 rounded-full overflow-hidden">
                      <div className="bg-[#0EA5E9] h-full rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  <button className="text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Activity Log) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] shadow-[inset_0_0_0_1px_rgba(79,70,229,0.15)] h-full">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant/50 pb-4">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-container">history</span>
                Activity Log
              </h3>
              <button className="text-primary font-label-md text-[12px] font-semibold hover:underline">VIEW ALL</button>
            </div>
            <div className="relative border-l-2 border-surface-container-high ml-3 space-y-6 pb-4">
              {/* Log Item 1 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-[#10B981]"></span>
                <p className="font-body-sm text-[14px] text-on-surface">
                  <span className="font-semibold">Sarah</span> updated <span className="text-primary cursor-pointer hover:underline">Task: Methodology</span>
                </p>
                <span className="font-label-md text-[12px] font-semibold text-secondary mt-1 block">2 hours ago</span>
              </div>
              {/* Log Item 2 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-[#0EA5E9]"></span>
                <p className="font-body-sm text-[14px] text-on-surface">
                  <span className="font-semibold">James</span> uploaded <span className="bg-surface-container-high px-1.5 py-0.5 rounded font-mono text-[12px] text-tertiary-container border border-outline-variant/30">Thesis_Draft_v2.pdf</span>
                </p>
                <span className="font-label-md text-[12px] font-semibold text-secondary mt-1 block">5 hours ago</span>
              </div>
              {/* Log Item 3 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-outline-variant"></span>
                <p className="font-body-sm text-[14px] text-on-surface">
                  <span className="font-semibold">Maria</span> pushed code to <span className="text-primary cursor-pointer hover:underline">repo: health-mon-ui</span>
                </p>
                <span className="font-label-md text-[12px] font-semibold text-secondary mt-1 block">Yesterday at 14:30</span>
              </div>
              {/* Log Item 4 */}
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </span>
                <p className="font-body-sm text-[14px] text-on-surface">
                  <span className="font-semibold text-primary">AI Co-pilot</span> flagged potential overlap in <span className="text-primary cursor-pointer hover:underline">Lit Review</span> section.
                </p>
                <span className="font-label-md text-[12px] font-semibold text-secondary mt-1 block">Yesterday at 09:15</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
