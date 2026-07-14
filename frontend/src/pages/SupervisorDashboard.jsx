import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';

const SupervisorDashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#F8FAFC] text-on-surface font-body-md min-h-screen flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/20 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Controlled by state on mobile */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-50 md:flex`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        <TopNavbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto p-margin_mobile md:p-margin_desktop w-full max-w-[1440px] mx-auto">
          
          <div className="mb-gutter">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface mb-2">Teacher Dashboard</h1>
            <p className="font-body-lg text-[18px] text-secondary">Good morning, Dr. Sarah. Here's an overview of your supervised works.</p>
          </div>

          <div className="mb-gutter bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border-l-2 border-primary flex items-start gap-4"
               style={{ boxShadow: "inset 1px 1px 0px 0px rgba(99, 102, 241, 0.2)" }}>
            <div className="text-primary mt-1">
              <span className="material-symbols-outlined icon-fill">auto_awesome</span>
            </div>
            <div className="flex-1">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">AI Insight: Plagiarism Alert</h3>
              <p className="font-body-md text-[16px] text-on-surface-variant">Team Delta's Thesis Draft shows 42% similarity. Review suggested to ensure academic integrity.</p>
            </div>
            <button className="shrink-0 bg-primary/10 text-primary px-4 py-2 rounded-lg font-label-md text-[12px] font-semibold hover:bg-primary/20 transition-colors">
              Review Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="material-symbols-outlined text-tertiary">group</span>
                </div>
              </div>
              <div>
                <h4 className="font-body-sm text-[14px] text-secondary mb-1">Assigned Teams</h4>
                <p className="font-display text-[48px] font-bold text-on-surface leading-none">12</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="material-symbols-outlined text-tertiary">pending_actions</span>
                </div>
              </div>
              <div>
                <h4 className="font-body-sm text-[14px] text-secondary mb-1">Pending Reviews</h4>
                <p className="font-display text-[48px] font-bold text-on-surface leading-none">8</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-error-container">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
              </div>
              <div>
                <h4 className="font-body-sm text-[14px] text-secondary mb-1">Plagiarism Alerts</h4>
                <p className="font-display text-[48px] font-bold text-error leading-none">3</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-surface-container">
                  <span className="material-symbols-outlined text-tertiary">event</span>
                </div>
              </div>
              <div>
                <h4 className="font-body-sm text-[14px] text-secondary mb-1">Upcoming Meetings</h4>
                <p className="font-display text-[48px] font-bold text-on-surface leading-none">2</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-[24px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Recent Submissions</h3>
              <button className="text-primary font-label-md text-[12px] font-semibold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary">Student/Team</th>
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary">Work Type</th>
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary">Submission Date</th>
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary">Plagiarism Score</th>
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary">Status</th>
                    <th className="p-4 font-label-md text-[12px] font-semibold text-secondary text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-[16px] text-on-surface">
                  <tr className="border-b border-outline-variant/20 hover:bg-[#F1F5F9] transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">TD</div>
                      Team Delta
                    </td>
                    <td className="p-4 text-secondary">Thesis Draft</td>
                    <td className="p-4 text-secondary">Oct 24, 2023</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-error bg-error/10 px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">
                        <span className="material-symbols-outlined text-[14px]">warning</span> 42%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">In Review</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-primary hover:text-primary-fixed-variant p-2"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant/20 hover:bg-[#F1F5F9] transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">AS</div>
                      Alice Smith
                    </td>
                    <td className="p-4 text-secondary">SDP Proposal</td>
                    <td className="p-4 text-secondary">Oct 23, 2023</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[#059669] bg-[#059669]/10 px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> 5%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#FEE2E2] text-[#991B1B] px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">Delayed</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-primary hover:text-primary-fixed-variant p-2"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">BJ</div>
                      Bob Jones
                    </td>
                    <td className="p-4 text-secondary">Literature Review</td>
                    <td className="p-4 text-secondary">Oct 20, 2023</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[#059669] bg-[#059669]/10 px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> 12%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#D1FAE5] text-[#065F46] px-2 py-1 rounded-full font-label-md text-[12px] font-semibold">Approved</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-primary hover:text-primary-fixed-variant p-2"><span className="material-symbols-outlined">more_vert</span></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
