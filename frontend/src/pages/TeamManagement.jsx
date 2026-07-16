import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
      <div className="w-full min-h-screen bg-background relative flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="relative z-10 text-center bg-surface/80 backdrop-blur-xl border border-outline-variant/30 p-12 rounded-[32px] shadow-lg max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4 opacity-50">group_off</span>
          <h2 className="font-display text-[24px] font-bold text-on-surface mb-2 tracking-tight">No Project Selected</h2>
          <p className="font-body-md text-on-surface-variant">Please select an active project from the top navigation to view and manage its team.</p>
        </div>
      </div>
    );
  }

  // Construct roster from active project (Logic mapped from Section 4.2)
  let displayMembers = [];
  if (activeProject.supervisor) {
    displayMembers.push({ _id: activeProject.supervisor._id, role: 'Supervisor', user: activeProject.supervisor });
  }
  if (activeProject.students && activeProject.students.length > 0) {
    activeProject.students.forEach((student, idx) => {
      displayMembers.push({ _id: student._id, role: `Student Member ${idx + 1}`, user: student });
    });
  }
  
  // If no students exist, mock some for visual demonstration
  if (displayMembers.length <= 1) {
    displayMembers.push({ _id: 'mock1', role: 'Team Leader', user: { name: 'Sarah Connor' } });
    displayMembers.push({ _id: 'mock2', role: 'Frontend Developer', user: { name: 'James Holden' } });
    displayMembers.push({ _id: 'mock3', role: 'Backend Developer', user: { name: 'Amos Burton' } });
  }

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Subtle Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 p-6 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-[12px] font-bold mb-3 border border-primary/20 uppercase tracking-wide">Workspace</span>
            <h1 className="font-display text-[28px] md:text-[36px] font-black text-on-surface tracking-tight leading-none mb-2">Team Management</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium">Project: <strong className="text-primary">{activeProject.title}</strong></p>
          </div>
          <button className="bg-surface text-on-surface border border-outline-variant/30 px-6 py-3 rounded-xl font-label-md text-[14px] font-bold hover:bg-surface-container hover:border-primary/50 transition-colors shadow-sm flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0">
            <span className="material-symbols-outlined text-[20px]">group_add</span>
            Create New Team
          </button>
        </motion.div>

        {/* Bento Grid Layout */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column (Main Content - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            
            {/* Add Member Card */}
            <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface">Invite Member</h3>
              </div>
              
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-end relative z-10">
                <div className="flex-1 w-full">
                  <label className="block font-label-sm text-[11px] font-bold text-secondary mb-2 uppercase tracking-wider">Student ID / Email</label>
                  <input 
                    required 
                    type="text"
                    value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} 
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary" 
                    placeholder="e.g. s1234567@uni.edu" 
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block font-label-sm text-[11px] font-bold text-secondary mb-2 uppercase tracking-wider">Assign Role</label>
                  <div className="relative">
                    <select 
                      value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} 
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3.5 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option>Team Leader</option>
                      <option>Frontend Developer</option>
                      <option>Backend Developer</option>
                      <option>AI Integration Lead</option>
                      <option>Documentation</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                  </div>
                </div>
                <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-on-primary rounded-xl font-label-md text-[14px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2">
                  Send Invite <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </motion.div>

            {/* Team Roster List */}
            <motion.div variants={itemVariants} className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h3 className="font-title-lg text-[22px] font-black text-on-surface tracking-tight">Active Roster & Contributions</h3>
                <span className="bg-secondary-container/50 text-secondary border border-outline-variant/30 px-4 py-1.5 rounded-full font-label-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  {displayMembers.length} Members
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {displayMembers.map((member, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                    key={member._id || i} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-outline-variant/40 bg-surface/50 hover:bg-surface hover:shadow-md transition-all group cursor-default ${member.role === 'Supervisor' ? 'border-l-[4px] border-l-tertiary' : member.role === 'Team Leader' ? 'border-l-[4px] border-l-primary' : ''}`}
                  >
                    <div className="flex items-center gap-4 w-full sm:w-1/2 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-title-md font-bold text-[18px] uppercase shadow-sm ${member.role === 'Supervisor' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-highest text-primary'}`}>
                        {member.user?.name?.substring(0, 2) || 'XX'}
                      </div>
                      <div>
                        <h4 className="font-title-sm text-[16px] font-bold text-on-surface group-hover:text-primary transition-colors">{member.user?.name || 'Unknown User'}</h4>
                        <p className="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider mt-1">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-1/2 flex items-center gap-6">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="font-label-sm text-[10px] font-bold text-secondary uppercase tracking-wider">Contribution</span>
                          <span className="font-label-sm text-[10px] font-bold text-on-surface">{Math.floor(100 / displayMembers.length)}%</span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${Math.floor(100 / displayMembers.length)}%` }} transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full rounded-full ${member.role === 'Supervisor' ? 'bg-tertiary' : member.role === 'Team Leader' ? 'bg-primary' : 'bg-secondary'}`} 
                          />
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column (Activity Log - 4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-surface/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-l-4 border-l-tertiary border-y border-r border-y-outline-variant/30 border-r-outline-variant/30 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-4">
              <h3 className="font-label-md text-[14px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">history</span>
                Activity Log
              </h3>
              <button className="text-primary font-label-sm text-[11px] font-bold hover:underline uppercase tracking-wider">View All</button>
            </div>
            
            <div className="relative border-l-2 border-surface-container-high ml-4 space-y-8 pb-4 flex-1">
              {[
                { name: 'Sarah', action: 'updated', target: 'Task: Methodology', time: '2 hours ago', color: 'bg-[#10B981]' },
                { name: 'James', action: 'uploaded', target: 'Thesis_Draft_v2.pdf', time: '5 hours ago', color: 'bg-[#0EA5E9]', isFile: true },
                { name: 'Maria', action: 'pushed code to', target: 'repo: health-mon-ui', time: 'Yesterday at 14:30', color: 'bg-outline-variant' },
                { name: 'AI Co-pilot', action: 'flagged overlap in', target: 'Lit Review', time: 'Yesterday at 09:15', color: 'bg-primary', isAi: true }
              ].map((log, idx) => (
                <div key={idx} className="relative pl-6 group">
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-surface-container-lowest border-2 ${log.color} ${log.isAi ? 'flex items-center justify-center' : ''}`}>
                    {log.isAi && <span className="material-symbols-outlined text-[10px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>}
                  </span>
                  
                  <p className="font-body-sm text-[14px] text-on-surface-variant leading-snug">
                    <strong className={`font-semibold ${log.isAi ? 'text-primary' : 'text-on-surface'}`}>{log.name}</strong> {log.action}{' '}
                    {log.isFile ? (
                      <span className="inline-block bg-surface-container-high px-2 py-0.5 rounded font-mono text-[11px] text-on-surface border border-outline-variant/30 mt-1">{log.target}</span>
                    ) : (
                      <span className="text-primary cursor-pointer hover:underline font-medium">{log.target}</span>
                    )}
                  </p>
                  <span className="font-label-sm text-[10px] font-bold text-secondary uppercase tracking-wider mt-2 block">{log.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default TeamManagement;
