import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';

const AdminDashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background text-on-surface font-sans antialiased min-h-screen flex overflow-hidden">
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

        <main className="flex-1 overflow-y-auto pt-6 px-margin_mobile md:px-margin_desktop pb-12 w-full max-w-[1440px] mx-auto">
          
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h2 className="font-headline-lg text-[32px] font-bold text-on-surface">Platform Overview</h2>
              <p className="font-body-lg text-[18px] text-secondary mt-1">Real-time metrics and system health monitoring.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-primary text-primary font-title-lg text-[14px] font-semibold hover:bg-primary/5 transition-colors">
                Export Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-surface-container rounded-xl text-primary">
                  <span className="material-symbols-outlined">groups</span>
                </div>
              </div>
              <div>
                <p className="font-body-md text-[16px] text-secondary">Total Students</p>
                <h3 className="font-headline-lg text-[32px] font-bold text-on-surface mt-1">1,240</h3>
              </div>
            </div>

            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary-container text-on-tertiary-container rounded-xl">
                  <span className="material-symbols-outlined">badge</span>
                </div>
              </div>
              <div>
                <p className="font-body-md text-[16px] text-secondary">Total Teachers</p>
                <h3 className="font-headline-lg text-[32px] font-bold text-on-surface mt-1">85</h3>
              </div>
            </div>

            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[inset_1px_0px_0px_0px_#4f46e5,_0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-surface-container-high rounded-xl text-primary">
                  <span className="material-symbols-outlined">folder_open</span>
                </div>
              </div>
              <div>
                <p className="font-body-md text-[16px] text-secondary">Active SDP Projects</p>
                <h3 className="font-headline-lg text-[32px] font-bold text-on-surface mt-1">42</h3>
              </div>
            </div>

            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl">
                  <span className="material-symbols-outlined">task</span>
                </div>
              </div>
              <div>
                <p className="font-body-md text-[16px] text-secondary">Assignments Submitted</p>
                <h3 className="font-headline-lg text-[32px] font-bold text-on-surface mt-1">312</h3>
              </div>
            </div>

            <div className="bg-error-container rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-between border border-error/20">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-error text-on-error rounded-xl">
                  <span className="material-symbols-outlined">warning</span>
                </div>
              </div>
              <div>
                <p className="font-body-md text-[16px] text-on-error-container">Plagiarism Alerts</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="font-headline-lg text-[32px] font-bold text-on-error-container">5</h3>
                  <span className="font-label-md text-[12px] font-semibold text-error bg-error/10 px-2 py-1 rounded-full uppercase">High Priority</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Submission Status</h3>
              <div className="h-64 flex items-center justify-center relative">
                <div className="w-48 h-48 rounded-full border-[16px] border-surface-container relative">
                  <div className="absolute inset-0 rounded-full border-[16px] border-primary" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)", margin: "-16px" }}></div>
                  <div className="absolute inset-0 rounded-full border-[16px] border-tertiary-container" style={{ clipPath: "polygon(100% 100%, 0 100%, 0 50%)", margin: "-16px" }}></div>
                </div>
                <div className="absolute flex flex-col items-center">
                  <span className="font-headline-md text-[24px] font-semibold text-on-surface">312</span>
                  <span className="font-label-md text-[12px] font-semibold text-secondary">Total</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="font-body-sm text-[14px] text-secondary">Graded (65%)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-tertiary-container"></div><span className="font-body-sm text-[14px] text-secondary">Pending (25%)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-surface-container"></div><span className="font-body-sm text-[14px] text-secondary">Overdue (10%)</span></div>
              </div>
            </div>

            <div className="bg-surface-bright rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-6">Monthly Activity (AI Scans vs Manual)</h3>
              <div className="h-64 flex items-end justify-between px-4 gap-2 border-b border-surface-container pb-2">
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[40%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[20%]"></div></div>
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[50%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[30%]"></div></div>
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[80%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[40%]"></div></div>
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[60%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[35%]"></div></div>
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[90%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[50%]"></div></div>
                <div className="w-full flex flex-col justify-end gap-1"><div className="w-full bg-primary rounded-t-sm h-[75%]"></div><div className="w-full bg-surface-variant rounded-t-sm h-[45%]"></div></div>
              </div>
              <div className="flex justify-between px-4 mt-2">
                <span className="font-label-md text-[12px] font-semibold text-secondary">Jan</span>
                <span className="font-label-md text-[12px] font-semibold text-secondary">Feb</span>
                <span className="font-label-md text-[12px] font-semibold text-secondary">Mar</span>
                <span className="font-label-md text-[12px] font-semibold text-secondary">Apr</span>
                <span className="font-label-md text-[12px] font-semibold text-secondary">May</span>
                <span className="font-label-md text-[12px] font-semibold text-secondary">Jun</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-bright rounded-[24px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-6 border-b border-surface-container flex justify-between items-center">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Recent System Activity</h3>
              <button className="font-body-md text-[16px] text-primary hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container">
                    <th className="font-label-md text-[12px] font-semibold text-secondary py-4 px-6 uppercase tracking-wider">User</th>
                    <th className="font-label-md text-[12px] font-semibold text-secondary py-4 px-6 uppercase tracking-wider">Action</th>
                    <th className="font-label-md text-[12px] font-semibold text-secondary py-4 px-6 uppercase tracking-wider">Target Resource</th>
                    <th className="font-label-md text-[12px] font-semibold text-secondary py-4 px-6 uppercase tracking-wider">Timestamp</th>
                    <th className="font-label-md text-[12px] font-semibold text-secondary py-4 px-6 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container bg-surface-bright">
                  <tr className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-xs">AJ</div>
                        <span className="font-body-md text-[16px] text-on-surface">Dr. Alan James</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-on-surface">Document Upload</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">Thesis_Draft_v2.pdf</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">10 mins ago</td>
                    <td className="py-4 px-6">
                      <span className="bg-[#10B981]/10 text-[#10B981] font-label-md text-[12px] px-3 py-1 rounded-full">Success</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">MR</div>
                        <span className="font-body-md text-[16px] text-on-surface">Maria Rossi</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-on-surface">System Login</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">Supervision Portal</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">45 mins ago</td>
                    <td className="py-4 px-6">
                      <span className="bg-[#10B981]/10 text-[#10B981] font-label-md text-[12px] px-3 py-1 rounded-full">Success</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold text-xs">SYS</div>
                        <span className="font-body-md text-[16px] text-on-surface">AI Monitor</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-sm">warning</span> Plagiarism Alert
                    </td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">Submission_ID_8829</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">2 hours ago</td>
                    <td className="py-4 px-6">
                      <span className="bg-error/10 text-error font-label-md text-[12px] px-3 py-1 rounded-full">Flagged</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F1F5F9] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">SK</div>
                        <span className="font-body-md text-[16px] text-on-surface">Prof. Sarah Klein</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-on-surface">Settings Modified</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">AI Evaluation Criteria</td>
                    <td className="py-4 px-6 font-body-md text-[16px] text-secondary">5 hours ago</td>
                    <td className="py-4 px-6">
                      <span className="bg-[#F59E0B]/10 text-[#F59E0B] font-label-md text-[12px] px-3 py-1 rounded-full">Pending Sync</span>
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

export default AdminDashboard;
