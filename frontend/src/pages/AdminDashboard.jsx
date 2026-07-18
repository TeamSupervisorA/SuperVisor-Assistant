import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeProjects: 0,
    assignmentsSubmitted: 0,
    plagiarismAlerts: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiFetch('/api/dashboard/admin').catch(() => ({
           // Mock data if API fails to ensure UI renders
           data: { totalStudents: 1250, totalTeachers: 45, activeProjects: 112, assignmentsSubmitted: 342, plagiarismAlerts: 3 }
        }));
        if (data && data.data) {
          setMetrics(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin metrics", err);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background relative overflow-hidden flex flex-col">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-tertiary-container/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <motion.div 
        initial="hidden" animate="show" variants={containerVariants}
        className="relative z-10 pt-6 px-6 md:px-10 pb-12 w-full max-w-[1600px] mx-auto flex flex-col gap-8"
      >
        
        {/* Header Section (Section 4.12 & 4.13) */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-error/10 text-error font-label-md text-[12px] font-bold mb-3 border border-error/20 uppercase tracking-wide">Administrator Privileges</span>
            <h1 className="font-display text-[32px] md:text-[42px] font-black text-on-surface tracking-tight leading-none mb-2">Platform Overview</h1>
            <p className="font-title-md text-[16px] text-on-surface-variant font-medium max-w-xl">Monitor system health, manage user accounts, and generate comprehensive analytical reports.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 rounded-xl border border-outline-variant/50 bg-surface/50 backdrop-blur-md text-on-surface font-label-md text-[13px] font-bold hover:bg-surface-container hover:border-primary/50 transition-all shadow-sm flex items-center gap-2 group">
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">manage_accounts</span> Manage Users
            </button>
            <button className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 group">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform">analytics</span> Generate Report
            </button>
          </div>
        </motion.div>

        {/* High-Level Metrics Grid (Bento Style) */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { title: 'Total Students', value: metrics.totalStudents, icon: 'groups', color: 'bg-primary' },
            { title: 'Total Supervisors', value: metrics.totalTeachers, icon: 'badge', color: 'bg-tertiary' },
            { title: 'Active Projects', value: metrics.activeProjects, icon: 'folder_open', color: 'bg-[#10B981]' },
            { title: 'Pending Submissions', value: metrics.assignmentsSubmitted, icon: 'task', color: 'bg-[#0EA5E9]' },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants} className={`bg-surface/80 backdrop-blur-xl rounded-[24px] p-6 shadow-sm border border-outline-variant/30 hover:border-${stat.color.replace('bg-','')}/40 hover:shadow-md transition-all group overflow-hidden relative`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[24px] opacity-20 ${stat.color} group-hover:opacity-40 transition-opacity`}></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-surface shadow-sm ${stat.color.replace('bg-', 'bg-')}/10 ${stat.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
                </div>
              </div>
              <div className="relative z-10">
                <p className="font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="font-display text-[32px] font-black text-on-surface leading-none">{stat.value.toLocaleString()}</h3>
              </div>
            </motion.div>
          ))}

          {/* Critical Plagiarism Alert Widget */}
          <motion.div variants={itemVariants} className="bg-error/5 backdrop-blur-xl rounded-[24px] p-6 shadow-sm border border-error/30 hover:border-error/50 hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-error/10 rounded-full blur-[30px] group-hover:bg-error/20 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-error text-on-error flex items-center justify-center shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="font-label-md text-[12px] font-bold text-error uppercase tracking-wider mb-1">Plagiarism Alerts</p>
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-[32px] font-black text-on-surface leading-none">{metrics.plagiarismAlerts}</h3>
                <span className="font-label-sm text-[10px] font-bold text-error bg-error/20 px-2 py-0.5 rounded uppercase tracking-wider">High Priority</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Charts & Visualizations */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Submission Status Donut Chart */}
          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:shadow-md transition-shadow">
            <h3 className="font-title-lg text-[20px] font-bold text-on-surface mb-8">System-wide Submission Status</h3>
            <div className="h-64 flex items-center justify-center relative">
              <motion.div 
                initial={{ rotate: -90, scale: 0.8, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-56 h-56 rounded-full border-[18px] border-surface-container relative hover:scale-105 transition-transform cursor-pointer"
              >
                {/* Visual Hacks for a CSS Donut Chart */}
                <div className="absolute inset-0 rounded-full border-[18px] border-primary transition-all duration-500 hover:border-[22px]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)", margin: "-18px" }}></div>
                <div className="absolute inset-0 rounded-full border-[18px] border-tertiary transition-all duration-500 hover:border-[22px]" style={{ clipPath: "polygon(100% 100%, 0 100%, 0 50%)", margin: "-18px" }}></div>
              </motion.div>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="font-display text-[42px] font-black text-on-surface leading-none">312</span>
                <span className="font-label-md text-[13px] font-bold text-secondary uppercase tracking-widest mt-1">Total Logs</span>
              </div>
            </div>
            <div className="flex justify-center gap-8 mt-10">
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-primary shadow-sm"></div><span className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">Graded (65%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-tertiary shadow-sm"></div><span className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">Pending (25%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-surface-container shadow-sm border border-outline-variant/50"></div><span className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">Overdue (10%)</span></div>
            </div>
          </motion.div>

          {/* Monthly Activity Bar Chart */}
          <motion.div variants={itemVariants} className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-outline-variant/30 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <h3 className="font-title-lg text-[20px] font-bold text-on-surface mb-2">Platform Engagement</h3>
              <p className="font-body-sm text-secondary">System logins and API calls over the last 6 months.</p>
            </div>
            
            <div className="h-56 mt-8 flex items-end justify-between px-2 gap-4 border-b border-surface-container pb-2">
              {[40, 50, 80, 60, 95, 75].map((h1, i) => (
                <motion.div 
                  key={i} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1, delay: i * 0.1 }}
                  className="w-full flex flex-col justify-end gap-1.5 group cursor-pointer"
                >
                  <div className="w-full bg-primary/90 rounded-t-lg transition-all duration-300 group-hover:bg-primary" style={{ height: `${h1}%` }}></div>
                  <div className="w-full bg-surface-variant rounded-t-md transition-all duration-300 group-hover:bg-outline-variant" style={{ height: `${h1 * 0.5}%` }}></div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between px-2 mt-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                <span key={i} className="font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest w-full text-center">{month}</span>
              ))}
            </div>
          </motion.div>

        </motion.div>

        {/* Activity Log Table */}
        <motion.div variants={itemVariants} className="bg-surface/90 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 md:p-8 border-b border-surface-container flex justify-between items-center bg-surface/50">
            <h3 className="font-title-lg text-[22px] font-bold text-on-surface">System Audit Log</h3>
            <button className="font-label-md text-[13px] font-bold text-primary hover:text-primary-fixed-variant transition-colors flex items-center gap-1 uppercase tracking-wider">
              View Complete Log <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-8 uppercase tracking-widest">User / Entity</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Action Executed</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Target Resource</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-6 uppercase tracking-widest">Timestamp</th>
                  <th className="font-label-sm text-[11px] font-bold text-secondary py-5 px-8 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50 bg-surface/30">
                {[
                  { name: 'Dr. Alan James', role: 'Supervisor', initials: 'AJ', action: 'Approved Proposal', target: 'Proj_9921', time: '10 mins ago', status: 'Success', statusColor: 'bg-[#10B981]/10 text-[#10B981]', iconBg: 'bg-tertiary/10 text-tertiary' },
                  { name: 'Maria Rossi', role: 'Student', initials: 'MR', action: 'Submitted Weekly Log', target: 'Supervision Portal', time: '45 mins ago', status: 'Success', statusColor: 'bg-[#10B981]/10 text-[#10B981]', iconBg: 'bg-primary/10 text-primary' },
                  { name: 'AI Watchdog', role: 'System', initials: 'SYS', action: 'Plagiarism Detected (89%)', target: 'Submission_ID_8829', time: '2 hours ago', status: 'Flagged', statusColor: 'bg-error/10 text-error', iconBg: 'bg-error/10 text-error', warning: true },
                  { name: 'Prof. Sarah Klein', role: 'Supervisor', initials: 'SK', action: 'Modified Rubric Settings', target: 'AI Eval Engine', time: '5 hours ago', status: 'Pending Sync', statusColor: 'bg-[#F59E0B]/10 text-[#F59E0B]', iconBg: 'bg-tertiary/10 text-tertiary' }
                ].map((row, idx) => (
                  <motion.tr 
                    key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.1 }}
                    className="hover:bg-surface-container-lowest transition-colors group cursor-pointer"
                  >
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${row.iconBg} flex items-center justify-center font-title-md font-bold text-[16px] shadow-sm group-hover:scale-110 transition-transform`}>
                          {row.initials}
                        </div>
                        <div>
                           <span className="block font-title-sm text-[15px] font-bold text-on-surface leading-tight">{row.name}</span>
                           <span className="font-label-sm text-[10px] font-bold text-secondary uppercase tracking-widest">{row.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 font-body-md text-[14px] text-on-surface flex items-center gap-2 mt-2">
                      {row.warning && <span className="material-symbols-outlined text-error text-[18px] animate-pulse">warning</span>}
                      {row.action}
                    </td>
                    <td className="py-5 px-6 font-body-md text-[14px] text-secondary group-hover:text-primary transition-colors">{row.target}</td>
                    <td className="py-5 px-6 font-label-md text-[12px] font-bold text-secondary uppercase tracking-wider">{row.time}</td>
                    <td className="py-5 px-8">
                      <span className={`${row.statusColor} font-label-sm text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-current`}>{row.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminDashboard;
