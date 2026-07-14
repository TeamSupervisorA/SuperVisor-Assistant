import React from 'react';

const SystemReports = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop w-full flex flex-col gap-8 pb-12">
      {/* Page Header & Global Actions */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface mb-2">System Reports</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant max-w-2xl">Generate, view, and export institutional compliance and academic performance data.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-primary font-label-md text-[12px] font-semibold hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[18px]">table</span>
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-[12px] font-semibold hover:bg-primary/90 shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          <span className="font-label-md text-[12px] font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <div className="w-px h-6 bg-outline-variant hidden sm:block"></div>
        <div className="flex-1 w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <select className="w-full appearance-none bg-surface border border-outline-variant rounded-lg py-2 pl-3 pr-10 font-body-sm text-[14px] text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
              <option>Current Academic Year</option>
              <option>Previous Year (2022-2023)</option>
              <option>Last 6 Months</option>
              <option>Custom Range...</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">calendar_today</span>
          </div>
          <div className="relative">
            <select className="w-full appearance-none bg-surface border border-outline-variant rounded-lg py-2 pl-3 pr-10 font-body-sm text-[14px] text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-colors">
              <option>All Departments</option>
              <option>Computer Science</option>
              <option>Life Sciences</option>
              <option>Humanities</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">domain</span>
          </div>
        </div>
      </section>

      {/* Report Templates Grid (Bento Style) */}
      <section>
        <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 border border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">assessment</span>
            </div>
            <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2">Annual Academic Integrity Audit</h4>
            <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 flex-1">Comprehensive overview of plagiarism flags, AI-detection rates, and resolution statuses across all submitted works.</p>
            <button className="w-full py-2.5 rounded-lg border border-primary text-primary font-label-md text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Generate Report
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 border border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[28px]">groups</span>
            </div>
            <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2">Faculty Workload Analysis</h4>
            <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 flex-1">Breakdown of supervisory hours, grading bottlenecks, and student allocation per faculty member.</p>
            <button className="w-full py-2.5 rounded-lg border border-primary text-primary font-label-md text-[12px] font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Generate Report
            </button>
          </div>

          {/* Card 3: AI Augmented */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 border-l-2 border-l-primary border-y border-r border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow group flex flex-col relative overflow-hidden">
            {/* AI Subtle Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">trending_up</span>
              </div>
              <span className="material-symbols-outlined text-primary/60 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} title="AI Generated Insights">auto_awesome</span>
            </div>
            <h4 className="font-title-lg text-[20px] font-semibold text-on-surface mb-2 relative z-10">Student Success Trends</h4>
            <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 flex-1 relative z-10">Predictive analytics report identifying at-risk cohorts based on engagement metrics and assignment scores.</p>
            <button className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-[12px] font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-[18px]">magic_button</span>
              AI Generate
            </button>
          </div>
        </div>
      </section>

      {/* Recent Reports Table */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Recent Reports</h3>
          <a className="font-label-md text-[12px] font-semibold text-primary hover:underline" href="#">View All</a>
        </div>
        <div className="bg-surface-container-lowest rounded-[24px] border border-outline-variant shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="py-4 px-6 font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider w-2/5">Report Name</th>
                  <th className="py-4 px-6 font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider w-1/5">Department</th>
                  <th className="py-4 px-6 font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider w-1/5">Generated On</th>
                  <th className="py-4 px-6 font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider w-32">Status</th>
                  <th className="py-4 px-6 font-label-md text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-[14px] text-on-surface">
                <tr className="border-b border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group">
                  <td className="py-4 px-6 font-medium">Q3 Faculty Workload Analysis</td>
                  <td className="py-4 px-6 text-on-surface-variant">Computer Science</td>
                  <td className="py-4 px-6 text-on-surface-variant">Oct 24, 2023</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Generated
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group">
                  <td className="py-4 px-6 font-medium">Annual Academic Integrity Audit</td>
                  <td className="py-4 px-6 text-on-surface-variant">All Departments</td>
                  <td className="py-4 px-6 text-on-surface-variant">Oct 22, 2023</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Generated
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-outline-variant/50 hover:bg-[#F1F5F9] transition-colors group">
                  <td className="py-4 px-6 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary/60 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Student Success Trends - Risk Cohorts
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant">Life Sciences</td>
                  <td className="py-4 px-6 text-on-surface-variant">Just now</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] font-label-md text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                      Pending AI
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-outline-variant cursor-not-allowed p-1" disabled title="Processing...">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#F1F5F9] transition-colors group">
                  <td className="py-4 px-6 font-medium">Departmental Budget Review</td>
                  <td className="py-4 px-6 text-on-surface-variant">Humanities</td>
                  <td className="py-4 px-6 text-on-surface-variant">Sep 15, 2023</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Generated
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Download PDF">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemReports;
