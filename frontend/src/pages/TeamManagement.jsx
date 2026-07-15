import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';

const TeamManagement = () => {
  const { activeProject } = useAuth();
  const [newMember, setNewMember] = useState({ email: '', role: 'Frontend Developer' });

  const handleInvite = async (e) => {
    e.preventDefault();
    alert(`Invite sent to ${newMember.email} as ${newMember.role}! (To be implemented)`);
    setNewMember({ email: '', role: 'Frontend Developer' });
  };

  if (!activeProject) {
    return (
      <div className="flex-1 p-margin_mobile md:p-margin_desktop w-full max-w-container_max mx-auto flex items-center justify-center">
        <div className="text-center bg-surface-container-lowest border border-outline-variant/30 p-10 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">group_off</span>
          <h2 className="font-headline-md text-on-surface">No Project Selected</h2>
          <p className="font-body-md text-secondary mt-2">Please select an active project from the top navigation to view the team.</p>
        </div>
      </div>
    );
  }

  // Construct roster from active project
  let displayMembers = [];
  if (activeProject.supervisor) {
    displayMembers.push({ _id: activeProject.supervisor._id, role: 'Supervisor', user: activeProject.supervisor });
  }
  if (activeProject.students && activeProject.students.length > 0) {
    activeProject.students.forEach((student, idx) => {
      displayMembers.push({ _id: student._id, role: `Student Member ${idx + 1}`, user: student });
    });
  }

  return (
    <div className="flex-1 p-margin_mobile md:p-margin_desktop max-w-container_max mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-[32px] font-bold text-on-surface mb-1">Team Management</h1>
          <p className="font-body-lg text-[18px] text-secondary">Project: <span className="font-semibold text-primary">{activeProject.title}</span></p>
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
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block font-label-md text-[12px] font-semibold text-secondary mb-1">STUDENT ID / EMAIL</label>
                <input required value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. s1234567@uni.edu" type="text" />
              </div>
              <div className="flex-1 w-full">
                <label className="block font-label-md text-[12px] font-semibold text-secondary mb-1">ROLE</label>
                <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-[16px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none">
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>AI Integration Lead</option>
                  <option>Documentation</option>
                </select>
              </div>
              <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-surface-container-highest text-primary border border-primary/20 rounded-lg font-body-md text-[16px] font-semibold hover:bg-primary/10 transition-colors whitespace-nowrap">
                Send Invite
              </button>
            </form>
          </div>

          {/* Team Members & Contributions */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Active Roster & Contributions</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-[12px] font-semibold">{displayMembers.length} MEMBERS</span>
            </div>
            {displayMembers.length === 0 ? (
              <p className="text-secondary p-4 text-center">No team members assigned yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {displayMembers.map((member, i) => (
                  <div key={member._id || i} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-outline-variant/50 hover:bg-surface-container-lowest transition-colors group ${i === 1 ? 'border-l-2 border-l-primary bg-gradient-to-r from-primary/5 to-transparent' : ''}`}>
                    <div className="flex items-center gap-4 w-full sm:w-1/3 mb-4 sm:mb-0">
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-headline-md font-bold uppercase">
                        {member.user?.name?.substring(0, 2) || 'XX'}
                      </div>
                      <div>
                        <h4 className="font-body-lg text-[18px] font-semibold text-on-surface">{member.user?.name || 'Unknown User'}</h4>
                        <p className="font-label-md text-[12px] font-semibold text-primary bg-primary/5 inline-block px-2 py-0.5 rounded mt-1 uppercase">{member.role}</p>
                      </div>
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-label-md text-[12px] font-semibold text-secondary">CONTRIBUTION</span>
                          <span className="font-label-md text-[12px] font-semibold text-on-surface font-bold">{Math.floor(100 / displayMembers.length)}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${i===0 ? 'bg-[#10B981]' : i===1 ? 'bg-[#0EA5E9]' : 'bg-primary'}`} style={{ width: `${Math.floor(100 / displayMembers.length)}%` }}></div>
                        </div>
                      </div>
                      <button className="text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
