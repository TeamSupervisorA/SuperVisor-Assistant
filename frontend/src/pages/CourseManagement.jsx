import React from 'react';

const CourseManagement = () => {
  return (
    <div className="max-w-container_max mx-auto space-y-10 p-margin_desktop">
      {/* Page Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline-lg text-[32px] md:text-[48px] font-bold text-on-surface mb-2">Course Management</h2>
          <p className="font-body-lg text-[18px] text-secondary">Organize university departments, courses, and sections.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-lg border-2 border-primary text-primary font-body-md text-[16px] font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Add Section
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-body-md text-[16px] font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">library_add</span>
            Add Course
          </button>
        </div>
      </div>

      {/* Department Overview Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CS Card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">terminal</span>
            </div>
            <span className="font-label-md text-[12px] font-semibold bg-surface-container text-primary px-2.5 py-1 rounded-full">Science</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Computer Science</h3>
          <p className="font-body-sm text-[14px] text-secondary mb-4">School of Engineering</p>
          <div className="mt-auto flex items-center gap-4 border-t border-outline-variant/20 pt-4">
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">42</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Active Courses</div>
            </div>
            <div className="h-8 w-px bg-outline-variant/40"></div>
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">128</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Sections</div>
            </div>
          </div>
        </div>

        {/* EEE Card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[28px]">bolt</span>
            </div>
            <span className="font-label-md text-[12px] font-semibold bg-surface-container text-tertiary px-2.5 py-1 rounded-full">Engineering</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Electrical Engineering</h3>
          <p className="font-body-sm text-[14px] text-secondary mb-4">School of Engineering</p>
          <div className="mt-auto flex items-center gap-4 border-t border-outline-variant/20 pt-4">
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">28</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Active Courses</div>
            </div>
            <div className="h-8 w-px bg-outline-variant/40"></div>
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">84</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Sections</div>
            </div>
          </div>
        </div>

        {/* Business Card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-on-secondary-fixed-variant">
              <span className="material-symbols-outlined text-[28px]">trending_up</span>
            </div>
            <span className="font-label-md text-[12px] font-semibold bg-surface-container text-on-secondary-fixed-variant px-2.5 py-1 rounded-full">Management</span>
          </div>
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-1">Business Admin</h3>
          <p className="font-body-sm text-[14px] text-secondary mb-4">School of Business</p>
          <div className="mt-auto flex items-center gap-4 border-t border-outline-variant/20 pt-4">
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">35</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Active Courses</div>
            </div>
            <div className="h-8 w-px bg-outline-variant/40"></div>
            <div>
              <div className="font-headline-md text-[24px] font-semibold text-on-surface">110</div>
              <div className="font-label-md text-[12px] font-semibold text-secondary uppercase tracking-wider">Sections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Directory Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 overflow-hidden">
        {/* Table Toolbar / Filters */}
        <div className="p-6 border-b border-outline-variant/30 bg-surface-bright flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Course Directory</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">filter_list</span>
              <select className="w-full pl-10 pr-8 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                <option value="">All Departments</option>
                <option value="cs">Computer Science</option>
                <option value="eee">Electrical Engineering</option>
                <option value="ba">Business Admin</option>
              </select>
            </div>
            <div className="relative w-full sm:w-48">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">calendar_month</span>
              <select defaultValue="f24" className="w-full pl-10 pr-8 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none">
                <option value="f23">Fall 2023</option>
                <option value="s24">Spring 2024</option>
                <option value="f24">Fall 2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low font-label-md text-[12px] font-semibold text-secondary border-b border-outline-variant/40">
              <tr>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider">Course Code</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider">Course Name</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider">Department</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-center">Sections</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider">Lead Instructor</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-[14px] text-on-surface divide-y divide-outline-variant/20">
              <tr className="hover:bg-[#F1F5F9] transition-colors group">
                <td className="py-4 px-6 font-semibold">CS-101</td>
                <td className="py-4 px-6">Introduction to Computer Science</td>
                <td className="py-4 px-6 text-secondary">Computer Science</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-primary font-semibold text-xs">8</span>
                </td>
                <td className="py-4 px-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-xs text-tertiary font-bold">AT</div>
                  Dr. Alan Turing
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">settings</span></button>
                  <button className="text-secondary hover:text-error p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </td>
              </tr>
              <tr className="hover:bg-[#F1F5F9] transition-colors group">
                <td className="py-4 px-6 font-semibold">CS-350</td>
                <td className="py-4 px-6 flex items-center gap-2">
                  Machine Learning
                  <span className="material-symbols-outlined text-primary text-[16px]" title="AI Assisted Curriculum">auto_awesome</span>
                </td>
                <td className="py-4 px-6 text-secondary">Computer Science</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-primary font-semibold text-xs">4</span>
                </td>
                <td className="py-4 px-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-xs text-tertiary font-bold">AL</div>
                  Prof. Ada Lovelace
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">settings</span></button>
                  <button className="text-secondary hover:text-error p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </td>
              </tr>
              <tr className="hover:bg-[#F1F5F9] transition-colors group">
                <td className="py-4 px-6 font-semibold">EEE-205</td>
                <td className="py-4 px-6">Signals and Systems</td>
                <td className="py-4 px-6 text-secondary">Electrical Engineering</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-primary font-semibold text-xs">6</span>
                </td>
                <td className="py-4 px-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-xs text-tertiary font-bold">NT</div>
                  Dr. Nikola Tesla
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">settings</span></button>
                  <button className="text-secondary hover:text-error p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </td>
              </tr>
              <tr className="hover:bg-[#F1F5F9] transition-colors group">
                <td className="py-4 px-6 font-semibold">MGT-410</td>
                <td className="py-4 px-6">Strategic Management</td>
                <td className="py-4 px-6 text-secondary">Business Admin</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-high text-primary font-semibold text-xs">5</span>
                </td>
                <td className="py-4 px-6 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-tertiary/20 flex items-center justify-center text-xs text-tertiary font-bold">PD</div>
                  Prof. Peter Drucker
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button className="text-secondary hover:text-primary p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">settings</span></button>
                  <button className="text-secondary hover:text-error p-1 rounded transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination (Static for Demo) */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <span className="font-body-sm text-[14px] text-secondary">Showing 1 to 4 of 105 courses</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-secondary hover:bg-surface-container-low disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-body-sm text-[14px] font-semibold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-secondary hover:bg-surface-container-low font-body-sm text-[14px]">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-secondary hover:bg-surface-container-low font-body-sm text-[14px]">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-secondary">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 text-secondary hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseManagement;
