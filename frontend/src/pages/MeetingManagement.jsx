import React from 'react';

const MeetingManagement = () => {
  return (
    <div className="max-w-[1440px] mx-auto p-margin_mobile md:p-margin_desktop">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <section className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex flex-col h-[800px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-headline-md text-[24px] font-semibold text-on-surface">Schedule</h2>
              <p className="font-body-sm text-[14px] text-on-surface-variant">October 2023</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="px-4 py-2 font-body-sm text-[14px] rounded hover:bg-surface-container-low text-on-surface-variant border border-outline-variant">Today</button>
              <button className="p-2 rounded hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 gap-1 bg-surface-variant border border-surface-variant rounded-t-lg text-center py-2 font-label-md text-[12px] font-semibold text-on-surface-variant">
              <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
            </div>
            <div className="grid grid-cols-7 gap-[1px] bg-surface-variant border-x border-b border-surface-variant rounded-b-lg flex-1 overflow-y-auto">
              {/* Simulated Days */}
              <div className="bg-surface-container-lowest min-h-[100px] p-2"></div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2"></div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2"></div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">1</span>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">2</span>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">3</span>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">4</span>
              </div>

              {/* Row 2 */}
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">5</span>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">6</span>
                <div className="mt-1 bg-primary-container/20 text-primary px-2 py-1 rounded text-[10px] truncate">10:00 AM - Viva Prep</div>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2 bg-primary/5 border border-primary/20">
                <span className="font-label-md text-[12px] font-semibold text-primary">7</span>
                <div className="mt-1 bg-tertiary-container/20 text-tertiary-container px-2 py-1 rounded text-[10px] truncate">2:00 PM - Consultation</div>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2">
                <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">8</span>
              </div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2"><span className="font-label-md text-[12px] font-semibold text-on-surface-variant">9</span></div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2"><span className="font-label-md text-[12px] font-semibold text-on-surface-variant">10</span></div>
              <div className="bg-surface-container-lowest min-h-[100px] p-2"><span className="font-label-md text-[12px] font-semibold text-on-surface-variant">11</span></div>
              
              {/* Add more cells to fill up some space to make it look like a calendar */}
              {Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest min-h-[100px] p-2">
                  <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">{i + 12}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar / Upcoming & Form */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          {/* Action Button */}
          <button className="w-full bg-primary text-on-primary py-3 px-6 rounded-lg font-title-lg text-[20px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-opacity">
            <span className="material-symbols-outlined">add</span>
            Schedule Meeting
          </button>

          {/* Upcoming Meetings */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-6 flex-1">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Upcoming</h3>
            <div className="space-y-4">
              {/* Meeting Card */}
              <div className="p-4 rounded-lg border border-surface-variant bg-surface hover:bg-surface-container-low transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-body-md text-[16px] font-semibold text-on-surface">Chapter 3 Review</h4>
                  <span className="bg-tertiary-container/10 text-tertiary-container px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Online</span>
                </div>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Sarah Jenkins
                </p>
                <p className="font-body-sm text-[14px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Today, 2:00 PM
                </p>
              </div>

              {/* Meeting Card */}
              <div className="p-4 rounded-lg border border-surface-variant bg-surface hover:bg-surface-container-low transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-body-md text-[16px] font-semibold text-on-surface">Pre-Viva Consultation</h4>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Offline</span>
                </div>
                <p className="font-body-sm text-[14px] text-on-surface-variant mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  Team Alpha
                </p>
                <p className="font-body-sm text-[14px] text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Tomorrow, 10:00 AM
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MeetingManagement;
