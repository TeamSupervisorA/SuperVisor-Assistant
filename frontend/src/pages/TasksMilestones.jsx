import React from 'react';

const TasksMilestones = () => {
  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex flex-col gap-gutter">
      {/* Page Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface">Tasks & Milestones</h2>
          <p className="font-title-lg text-[20px] font-semibold text-on-surface-variant mt-1">SDP Project: <span className="text-primary font-bold">AI Health Monitor</span></p>
        </div>
        <button className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-body-md text-[16px] font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Task
        </button>
      </div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Overall Progress */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Overall Progress</h3>
            <span className="material-symbols-outlined text-outline">trending_up</span>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-headline-md text-[24px] font-semibold text-primary">65%</span>
              <span className="font-body-sm text-[14px] text-on-surface-variant">On Track</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1">
              <div className="bg-primary h-1 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col justify-center">
          <h3 className="font-title-lg text-[20px] font-semibold text-on-surface mb-4">Milestones</h3>
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -translate-y-1/2 z-0"></div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface-container-lowest shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-primary mt-1">Proposal</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface-container-lowest shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-primary mt-1">Methodology</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-on-surface mt-1">Implement</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-surface-container-highest border-2 border-outline-variant shadow-sm"></div>
              <span className="font-label-md text-[12px] font-semibold text-on-surface-variant mt-1">Defense</span>
            </div>
          </div>
        </div>

        {/* AI Next-Task Suggestion */}
        <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border-l-[3px] border-l-primary relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">AI Suggestion</h3>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">
            Based on your timeline, you should finalize the <strong className="text-on-surface font-semibold">Data Privacy documentation</strong> by Friday to remain on schedule for the Implementation phase.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full items-start min-w-[1024px]">
          {/* Column: Pending */}
          <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Pending</h3>
              <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">3</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {/* Task Card 1 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-error-container text-on-error-container font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">High</span>
                  <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">Setup Database Schema & Models</h4>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="font-label-md text-[12px] font-semibold">Oct 12</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3lS_wR-Xnw0HOneeJ7i0ajxN_B8AFDCNpNfBdY2YUNRqYPJroDlZXHvEXWnYRK9K8eFTE_2dzpfOAZUzIWC75EKCkPhEnjiDMVFYtjIHkH5kU_nicjZ5AlTOxrT6NZv3ImVEAhm4jJ6cg9MPYMLHUEUN-aQglK11CqciYd6H0SG__UySlBn8sb8xhBxkZYWa0cnh6FhCw01DRqmQKg_sQPQwPTRTeBi2Y9P2JLJjokOJ_HEyqVNmRWow3gN26Qss-fJcC6crhl18" />
                  </div>
                </div>
              </div>

              {/* Task Card 2 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-surface-variant text-on-surface-variant font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">Medium</span>
                  <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">Integrate Wearable Health API endpoints</h4>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="font-label-md text-[12px] font-semibold">Oct 15</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPmFVG3E6qY6CU1igKudc2DVM91sorPlR7cbMoQqiyBcBJz1qfz3fYy0CZk9HfeKVMBplLYfpi0LsfgbtBJiYLoaNi8MnV-Q9mlhzsNTbR93wWSvPZzWba83uqWrvwuklcxzFmANswgUxpSuxpf7D2YD5RTic2tGSouvcdwKseIoHan67W03Kxs76bLH26W8AdIAxLOllQdTqBhecY7faLuactniu4QfL6wOEMDnOqsyPM9W2YU9xabRjEhwKW7fUhZNaBbcUSlwI" />
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRSv0iZXDZ1STFywF9gxWPKZ4HH2Fl0mnNx017jAB0z3EqLFNmq-RVpbNam--UQitmU2fmdYs1wt-DhzvlYfQvEMJOn6FrBdWT4QOQ0H9LJqnfXR2R3UXZP14F8abQbzzMC-DCDeSN5fyM4rLLjRNtIST_xeVwj--LhVf5RFcJJTUgCo9gEuf7QnveN9zY-mvlKY0J8LjbZAmsJHxOFLMr08txY_V2ni3EgF44kfnlT-CQMBhG4t12-YUYtkPLz5ocqqWEuDJKRPE" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">In Progress</h3>
              </div>
              <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">2</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {/* Task Card 3 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group border-t-[3px] border-t-primary">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-error-container text-on-error-container font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">High</span>
                  <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">ML Model Training for Anomaly Detection</h4>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="font-label-md text-[12px] font-semibold">Oct 10</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqHAK567nagTQEqf-Qid5l2O2am0soyVQUo8BsC0dR4HWQP-KK9PbjMhdtDPW6Jg-qgEUyIMvFkl3EXcEd2528NhuTOPjF5Ii6CNlIZTEdPg7i-zm0QHQLCe5pgVBz3rIQmtfcI--noS-99r69mFd_fNz4bFhRoWZ1f58Vj3lEjC-h2iK4el9KYPJwEwiNab0n6bqB4EhCkP9-6qm4pEx8LZ79Ti6Ieq-2Hxow1t0YdVnNh34xkgJpwRy2EAD54_cyL_YSAY02UWQ" />
                  </div>
                </div>
              </div>

              {/* Task Card 4 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-surface-variant text-on-surface-variant font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">Medium</span>
                  <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">Draft Data Privacy Documentation</h4>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="font-label-md text-[12px] font-semibold">Oct 08</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtEomR66FpjB1xKMMqUo2MzVxceQYpgsUuV2Y2gztTKrmRo5vPMqWHyAbZWlKgSfMjdSxzWMXMgirg1Xf7ojmOpODx5T7IAclyD2t-NfEGE94YRyj4ihF4dSyt4pBWN46S0HCDeXEOHcteduLgzwToQTyiZ1xuFk7ziFDS7TsySikQHM9w6P2RUK8qENpgJr0RtO62hpTKaUEZDIexuAXN0ADbHUszevgiR3eTmnT1_mWB7XDObg0Qp91XZT579MdTLGL02pY2rLs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column: Completed */}
          <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Completed</h3>
              <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">1</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {/* Task Card 5 */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/40 opacity-70 group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-surface-variant text-on-surface-variant font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">Low</span>
                  <span className="material-symbols-outlined text-[18px] text-tertiary-container">check_circle</span>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-through line-clamp-2">Initial Literature Review on Wearable Tech</h4>
                <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span className="font-label-md text-[12px] font-semibold">Sep 30</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqGh3zbyz6dIdkfJu7_lm-JPxUx_hSxnZxkd4u_d4h640DxrJQVvrrgqN1RQcST_H65-P2UkEoLWjrbMxKVC6zrMn7GAuJeIw6FDegGiFlEMEHMjAgXl2wV5HVdhiX72Ln5BWWq-us3HL3b0Agp5P5EFsXAnkL3U5ue5zuKaYcCGu7XTQAwqeSBbu2J830-Pl9apGaa6qLuA2cwhHyHAcAmPp4-078uIv9dtepHQOzESvu8rpokQCdkDS9aAZG_cQF_4pOk-Tfl7w" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column: Delayed */}
          <div className="flex-1 w-80 bg-surface-container-low rounded-[16px] p-4 flex flex-col max-h-[calc(100vh-340px)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Delayed</h3>
              </div>
              <span className="bg-outline-variant/20 text-on-surface font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">1</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {/* Task Card 6 */}
              <div className="bg-error-container/20 p-4 rounded-xl shadow-sm border border-error/30 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-error-container text-on-error-container font-label-md text-[12px] font-semibold py-1 px-2.5 rounded-full">High</span>
                  <button className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
                <h4 className="font-body-md text-[16px] font-semibold text-on-surface mb-3 line-clamp-2">Ethics Board Approval Submission</h4>
                <div className="flex items-center justify-between border-t border-error/20 pt-3">
                  <div className="flex items-center gap-1.5 text-error">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span className="font-label-md text-[12px] font-semibold">Oct 05 (Overdue)</span>
                  </div>
                  <div className="flex -space-x-2">
                    <img alt="Assignee" className="w-7 h-7 rounded-full border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArC-w_wsPrVghdDLUwtkkArKd1QmSWgOUG8EznuHCt18gz_gikP617d-Um7qLICKxapB-eAwhMa6iWVaa-sDdKWxX6FYLrNYtHMJPjwjwCGSI4FhTdarL_0_98c9Q0r6FMUKnHeT1Srk41OdFdLBePrEbDu7KsMGe-lKGuOnWPbzFVQAGkmnnIiURgX9Lu2G8rEmoRMKN1Jrcobdw9qe7l3EXQUekhP9UWj_6o_w2uNWQEcSpAEWhllk_tBMjsYQPU_5Joyn02jQc" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksMilestones;
